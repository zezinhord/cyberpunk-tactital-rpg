package com.cyberpunk.tacticalrpg;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ConcurrentHashMap;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Nova Arcadia expansion packs.
 *
 * No broad storage permission, no arbitrary URLs, no external JavaScript,
 * no unverified media and no zip entry traversal. Data is kept in app-private
 * filesDir and served through Capacitor.convertFileSrc(file://...).
 *
 * Pack SHA256 is embedded in the app's reviewed content catalog. Interrupted
 * downloads never overwrite the last installed version. Progress is observable.
 */
@CapacitorPlugin(name = "NovaAssetPacks")
public class NovaAssetPacks extends Plugin {
    private static final String ROOT_URL =
            "https://github.com/zezinhord/cyberpunk-tactital-rpg/releases/download/";
    private static final String RELEASE_FINAL = "nova-arcadia-v200-final-3gb-assets";
    private static final String RELEASE_MILESTONE = "nova-arcadia-v200-milestone-1474";
    private static final String RELEASE_SECOND = "nova-arcadia-v200-milestone-1774";
    private static final String RELEASE_THIRD = "nova-arcadia-v200-milestone-2074";
    private static boolean validReleaseTag(String tag) {
        return RELEASE_FINAL.equals(tag) || RELEASE_MILESTONE.equals(tag) || RELEASE_SECOND.equals(tag) || RELEASE_THIRD.equals(tag);
    }
    private static final long MIN_ZIP_SIZE = 1024L;
    private static final long MAX_ZIP_SIZE = 1_900_000_000L;
    private static final long MAX_UNPACKED = 2_200_000_000L;
    private static final long MAX_ENTRY = 300_000_000L;
    private static final int MAX_ENTRIES = 40_000;
    private static final int BUFFER = 128 * 1024;
    private static final String[] DISTRICTS = {
            "baixada","ferrugem","aurea","subsolo","setor-zero","prisma","periferia"
    };
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final ConcurrentHashMap<String, JSObject> progress = new ConcurrentHashMap<>();

    private static boolean validId(String value) {
        if (value == null) return false;
        for (String allowed : DISTRICTS) if (allowed.equals(value)) return true;
        return false;
    }
    private static boolean validSha(String value) {
        return value != null && value.matches("^[a-f0-9]{64}$");
    }
    private File baseDir() {
        File base = new File(getContext().getFilesDir(), "na-expansion-packs");
        if (!base.exists() && !base.mkdirs()) throw new IllegalStateException("Storage inaccessible");
        return base;
    }
    private File installedDir(String id) { return new File(baseDir(), id); }
    private static byte[] hashBytes(byte[] bytes) throws Exception {
        return MessageDigest.getInstance("SHA-256").digest(bytes);
    }
    private static String hex(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) result.append(String.format(Locale.ROOT, "%02x", b & 255));
        return result.toString();
    }
    private static void cleanup(File file) {
        if (!file.exists()) return;
        if (file.isDirectory()) {
            File[] items = file.listFiles();
            if (items != null) for (File child : items) cleanup(child);
        }
        // Best effort cleanup: installation is never reported successful
        // until an authenticated new directory has been committed.
        file.delete();
    }
    private static long sizeOf(File root) {
        if (!root.exists()) return 0L;
        if (root.isFile()) return root.length();
        long total = 0L;
        File[] files = root.listFiles();
        if (files != null) for (File f : files) total += sizeOf(f);
        return total;
    }
    private void signal(String id, String stage, long bytes, long total) {
        JSObject event = new JSObject();
        event.put("id", id);
        event.put("stage", stage);
        event.put("bytes", bytes);
        event.put("total", total);
        progress.put(id, event);
        notifyListeners("progress", event);
    }

    @PluginMethod
    public void status(PluginCall call) {
        String id = call.getString("id");
        if (!validId(id)) { call.reject("Unknown district"); return; }
        File dir = installedDir(id);
        JSObject out = new JSObject();
        out.put("id", id);
        File record = new File(dir, "na-install.json");
        out.put("installed", record.exists());
        if (record.exists()) {
            try (InputStream in = new FileInputStream(record)) {
                byte[] bytes = new byte[(int)Math.min(record.length(), 4096L)];
                int n = in.read(bytes);
                if (n > 0) {
                    JSONObject receipt = new JSONObject(new String(bytes, 0, n, StandardCharsets.UTF_8));
                    out.put("sha256", receipt.optString("sha256", ""));
                }
            } catch (Exception e) {
                out.put("installed", false);
            }
        }
        out.put("storedBytes", sizeOf(dir));
        out.put("freeBytes", baseDir().getUsableSpace());
        JSObject current = progress.get(id);
        if (current != null) {
            out.put("stage", current.optString("stage", "idle"));
            out.put("bytes", current.optLong("bytes", 0L));
            out.put("total", current.optLong("total", 0L));
        }
        call.resolve(out);
    }

    @PluginMethod
    public void install(PluginCall call) {
        final String id = call.getString("id");
        final String releaseTag = call.getString("releaseTag");
        final String sha = call.getString("sha256");
        final Long compressed = call.getLong("compressedBytes");
        final Long uncompressed = call.getLong("uncompressedBytes");
        final Integer expectedCount = call.getInt("artworkCount");
        if (!validId(id) || !validReleaseTag(releaseTag) || !validSha(sha) || compressed == null ||
                uncompressed == null || expectedCount == null ||
                compressed < MIN_ZIP_SIZE || compressed >= MAX_ZIP_SIZE ||
                uncompressed < 1024L || uncompressed > MAX_UNPACKED ||
                expectedCount < 1 || expectedCount > MAX_ENTRIES) {
            call.reject("Invalid or unsigned content pack"); return;
        }
        // Need both ZIP and extracted data until the checksum is verified;
        // no app-owned data is deleted to free space automatically.
        final long requiredSpace = compressed + uncompressed + 80_000_000L;
        if (baseDir().getUsableSpace() < requiredSpace) {
            call.reject("Storage insufficient for verified installation"); return;
        }
        io.execute(() -> {
            File download = new File(baseDir(), id + ".partial");
            File staged = new File(baseDir(), id + ".installing");
            File previous = new File(baseDir(), id + ".previous");
            File destination = installedDir(id);
            HttpURLConnection conn = null;
            try {
                cleanup(download); cleanup(staged); cleanup(previous);
                if (!staged.mkdirs()) throw new IllegalStateException("Failed to stage pack");
                String assetName = "NA20-" + id + ".zip";
                URL url = new URL(ROOT_URL + releaseTag + "/" + assetName);
                conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(25_000);
                conn.setReadTimeout(80_000);
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("User-Agent", "NovaArcadiaAndroid/2.0");
                if (conn.getResponseCode() != 200)
                    throw new IllegalStateException("HTTP " + conn.getResponseCode());
                long advertised = conn.getContentLengthLong();
                if (advertised > 0 && advertised != compressed)
                    throw new IllegalStateException("Download length differs from signed manifest");
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                long received = 0;
                byte[] buf = new byte[BUFFER];
                signal(id, "download", 0L, compressed);
                try (InputStream in = new BufferedInputStream(conn.getInputStream());
                     OutputStream out = new BufferedOutputStream(new FileOutputStream(download))) {
                    int n;
                    while ((n = in.read(buf)) != -1) {
                        received += n;
                        if (received > compressed) throw new IllegalStateException("Oversized download");
                        digest.update(buf, 0, n);
                        out.write(buf, 0, n);
                        if ((received & ((4 * 1024 * 1024) - 1)) < BUFFER)
                            signal(id, "download", received, compressed);
                    }
                }
                if (received != compressed || !hex(digest.digest()).equals(sha))
                    throw new IllegalStateException("SHA-256 verification failed");

                long expanded = 0;
                int artworks = 0;
                signal(id, "unpack", 0L, uncompressed);
                String stagedCanonical = staged.getCanonicalPath() + File.separator;
                try (ZipInputStream archive = new ZipInputStream(
                        new BufferedInputStream(new FileInputStream(download)))) {
                    ZipEntry entry;
                    while ((entry = archive.getNextEntry()) != null) {
                        if (entry.isDirectory()) continue;
                        if (++artworks > expectedCount) throw new IllegalStateException("Too many assets");
                        String path = entry.getName();
                        if (!path.matches("^(murals|props|dossiers|cutscenes|spritesheets|routes)/[a-z0-9/_-]+\\.(png|webp|webm)$") ||
                                path.contains(".."))
                            throw new IllegalStateException("Unsafe image path");
                        File file = new File(staged, path);
                        if (!file.getCanonicalPath().startsWith(stagedCanonical))
                            throw new IllegalStateException("Zip path escape");
                        File parent = file.getParentFile();
                        if (!parent.exists() && !parent.mkdirs())
                            throw new IllegalStateException("Cannot create asset directory");
                        if (file.exists()) throw new IllegalStateException("Duplicate asset in zip");
                        long entryBytes = 0;
                        try (OutputStream out = new BufferedOutputStream(new FileOutputStream(file))) {
                            int n;
                            while ((n = archive.read(buf)) != -1) {
                                entryBytes += n;
                                expanded += n;
                                if (entryBytes > MAX_ENTRY || expanded > uncompressed)
                                    throw new IllegalStateException("Pack exceeds declared size");
                                out.write(buf, 0, n);
                            }
                        }
                        archive.closeEntry();
                        if ((artworks & 15) == 0)
                            signal(id, "unpack", expanded, uncompressed);
                    }
                }
                if (artworks != expectedCount || expanded != uncompressed)
                    throw new IllegalStateException("Missing or extra content assets");
                JSONObject receipt = new JSONObject();
                receipt.put("id", id);
                receipt.put("sha256", sha);
                receipt.put("compressedBytes", compressed);
                receipt.put("uncompressedBytes", uncompressed);
                receipt.put("artworkCount", artworks);
                try (OutputStream out = new FileOutputStream(new File(staged, "na-install.json"))) {
                    out.write(receipt.toString().getBytes(StandardCharsets.UTF_8));
                }
                cleanup(download);
                if (destination.exists() && !destination.renameTo(previous))
                    throw new IllegalStateException("Cannot stage existing pack rollback");
                if (!staged.renameTo(destination)) {
                    if (previous.exists()) previous.renameTo(destination);
                    throw new IllegalStateException("Failed to commit verified content");
                }
                cleanup(previous);
                signal(id, "ready", expanded, uncompressed);
                JSObject result = new JSObject();
                result.put("id", id);
                result.put("installed", true);
                result.put("storedBytes", sizeOf(destination));
                result.put("baseUri", "file://" + destination.getAbsolutePath() + "/");
                call.resolve(result);
            } catch (Exception e) {
                cleanup(download); cleanup(staged);
                signal(id, "error", 0L, uncompressed);
                call.reject("Pack installation failed: " + e.getMessage());
            } finally {
                if (conn != null) conn.disconnect();
            }
        });
    }

    @PluginMethod
    public void asset(PluginCall call) {
        String id = call.getString("id"), path = call.getString("path");
        if (!validId(id) || path == null ||
            !path.matches("^(murals|props|dossiers|cutscenes|spritesheets|routes)/[a-z0-9/_-]+\\.(png|webp|webm)$") ||
            path.contains("..")) { call.reject("Invalid asset location"); return; }
        try {
            File dir = installedDir(id), receipt = new File(dir, "na-install.json");
            if (!receipt.exists()) { call.reject("District asset pack not installed"); return; }
            File file = new File(dir, path);
            if (!file.getCanonicalPath().startsWith(dir.getCanonicalPath() + File.separator) ||
                !file.isFile()) { call.reject("Requested asset missing"); return; }
            JSObject out = new JSObject();
            out.put("uri", "file://" + file.getAbsolutePath());
            out.put("bytes", file.length());
            call.resolve(out);
        } catch (Exception ex) { call.reject("Cannot resolve asset: " + ex.getMessage()); }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String id = call.getString("id");
        if (!validId(id)) { call.reject("Unknown district"); return; }
        io.execute(() -> {
            File installed = installedDir(id);
            long removed = sizeOf(installed);
            cleanup(installed);
            if (installed.exists()) { call.reject("Unable to remove district pack"); return; }
            progress.remove(id);
            JSObject out = new JSObject();
            out.put("removedBytes", removed);
            call.resolve(out);
        });
    }
}
