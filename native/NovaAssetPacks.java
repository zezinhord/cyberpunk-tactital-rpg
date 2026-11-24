package com.cyberpunk.tacticalrpg;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.ActivityCallback;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

import org.json.JSONObject;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

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
    private static final String RELEASE_FOURTH = "nova-arcadia-v200-milestone-2374";
    private static final String RELEASE_FIFTH = "nova-arcadia-v200-milestone-2674";
    private static boolean validReleaseTag(String tag) {
        return RELEASE_FINAL.equals(tag) || RELEASE_MILESTONE.equals(tag) || RELEASE_SECOND.equals(tag) || RELEASE_THIRD.equals(tag) || RELEASE_FOURTH.equals(tag) || RELEASE_FIFTH.equals(tag);
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

    /** Capacitor's PluginCall.getLong accepts ONLY java.lang.Long.
     * Android JSONObject represents 309999082 as Integer and 2.2GB as Long,
     * therefore valid signed metadata could be incorrectly rejected.
     * Accept integral numeric types without rounding, truncation or strings.
     */
    private static Long signedContentByteCount(PluginCall call, String key) {
        Object raw = call.getData().opt(key);
        if (!(raw instanceof Number)) return null;
        double value = ((Number) raw).doubleValue();
        if (!Double.isFinite(value) || value < 0 || value != Math.rint(value) ||
                value > 9_007_199_254_740_991d) return null;
        return ((Number) raw).longValue();
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

    /** Check disk receipts off the Android/WebView UI thread.
     * Every installed district contains 544 individual assets; synchronous
     * recursive sizeOf() for all seven districts caused long cold-start
     * input stalls on low-RAM devices. Keep the full size/SHA checks, but
     * serialize filesystem reads with the native extraction executor.
     */
    @PluginMethod
    public void status(PluginCall call) {
        final String id = call.getString("id");
        if (!validId(id)) { call.reject("Unknown district"); return; }
        io.execute(() -> {
            try {
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
                            JSONObject receipt = new JSONObject(
                                new String(bytes, 0, n, StandardCharsets.UTF_8));
                            out.put("sha256", receipt.optString("sha256", ""));
                        }
                    } catch (Exception e) {
                        out.put("installed", false);
                    }
                }
                // Never restore an unverified or missing private directory.
                if (out.optBoolean("installed", false) && dir.isDirectory())
                    out.put("baseUri", "file://" + dir.getAbsolutePath() + "/");
                // Preserve the real on-disk byte count. Do not replace this
                // with unchecked manifest metadata for speed.
                out.put("storedBytes", sizeOf(dir));
                out.put("freeBytes", baseDir().getUsableSpace());
                JSObject current = progress.get(id);
                if (current != null) {
                    out.put("stage", current.optString("stage", "idle"));
                    out.put("bytes", current.optLong("bytes", 0L));
                    out.put("total", current.optLong("total", 0L));
                }
                call.resolve(out);
            } catch (Exception e) {
                call.reject("Cannot inspect game files for " + id + ": " +
                    e.getMessage());
            }
        });
    }

    @PluginMethod
    public void install(PluginCall call) {
        final String id = call.getString("id");
        final String releaseTag = call.getString("releaseTag");
        final String sha = call.getString("sha256");
        final Long compressed = signedContentByteCount(call, "compressedBytes");
        final Long uncompressed = signedContentByteCount(call, "uncompressedBytes");
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

                unpackVerifiedArchive(id, sha, uncompressed, expectedCount,
                    download, staged, previous, destination, call);
            } catch (Exception e) {
                cleanup(download); cleanup(staged);
                signal(id, "error", 0L, uncompressed);
                call.reject("Pack installation failed: " + e.getMessage());
            } finally {
                if (conn != null) conn.disconnect();
            }
        });
    }

    /** One audited extraction path for both remote and picker-supplied ZIPs.
     * Archive bytes MUST already match the SHA-256 embedded in the game catalog.
     * All contents stay within filesDir and replace the prior version atomically.
     */
    private void unpackVerifiedArchive(String id, String sha, long uncompressed,
            int expectedCount, File download, File staged, File previous,
            File destination, PluginCall call) throws Exception {
        byte[] buf = new byte[BUFFER];
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
            if (!path.matches("^(murals|props|dossiers|cutscenes|spritesheets|routes|evacs|shelters|nexus)/[a-z0-9/_-]+\\.(png|webp|webm)$") ||
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
    receipt.put("compressedBytes", download.length());
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
    }

    /** Android's system document picker is the fallback for GitHub Actions
     * verified downloads when the release endpoint has no write permission.
     * No filesystem paths or URLs are accepted from JavaScript.
     */
    /** A one-download edition contains all seven signed archives IN the APK. */
    @PluginMethod
    public void bundledStatus(PluginCall call) {
        try {
            String[] files = getContext().getAssets().list("na-game");
            int count = 0;
            if (files != null) for (String id : DISTRICTS) {
                String expected = "NA20-" + id + ".zip";
                for (String name : files) if (expected.equals(name)) { count++; break; }
            }
            JSObject state = new JSObject();
            state.put("bundledCount", count);
            state.put("allBundled", count == DISTRICTS.length);
            call.resolve(state);
        } catch (Exception e) {
            call.reject("Cannot inspect game assets: " + e.getMessage());
        }
    }

    /** Extract authenticated art DIRECTLY FROM THE APK, entirely offline.
     * Same private, atomic SHA-256 installation path as network downloads;
     * no DLC selection, URLs or untrusted paths accepted.
     */
    @PluginMethod
    public void installBundled(PluginCall call) {
        final String id = call.getString("id");
        final String sha = call.getString("sha256");
        final Long compressed = signedContentByteCount(call, "compressedBytes");
        final Long uncompressed = signedContentByteCount(call, "uncompressedBytes");
        final Integer count = call.getInt("artworkCount");
        if (!validId(id) || !validSha(sha) || compressed == null ||
                uncompressed == null || count == null ||
                compressed < MIN_ZIP_SIZE || compressed >= MAX_ZIP_SIZE ||
                uncompressed < 1024L || uncompressed > MAX_UNPACKED ||
                count < 1 || count > MAX_ENTRIES) {
            call.reject("Invalid signed embedded art catalog"); return;
        }
        if (baseDir().getUsableSpace() < compressed + uncompressed + 80_000_000L) {
            call.reject("Storage insufficient to extract APK game content"); return;
        }
        io.execute(() -> {
            File download = new File(baseDir(), id + ".partial");
            File staged = new File(baseDir(), id + ".installing");
            File previous = new File(baseDir(), id + ".previous");
            File destination = installedDir(id);
            try {
                cleanup(download); cleanup(staged); cleanup(previous);
                if (!staged.mkdirs()) throw new IllegalStateException("Cannot stage game assets");
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                long received = 0;
                byte[] buf = new byte[BUFFER];
                signal(id, "embedded", 0L, compressed);
                try (InputStream src = new BufferedInputStream(
                        getContext().getAssets().open("na-game/NA20-" + id + ".zip"));
                     OutputStream out = new BufferedOutputStream(new FileOutputStream(download))) {
                    int n;
                    while ((n = src.read(buf)) != -1) {
                        received += n;
                        if (received > compressed)
                            throw new IllegalStateException("Embedded archive exceeds signed size");
                        digest.update(buf, 0, n);
                        out.write(buf, 0, n);
                        if ((received & ((4 * 1024 * 1024) - 1)) < BUFFER)
                            signal(id, "embedded", received, compressed);
                    }
                }
                if (received != compressed || !sha.equals(hex(digest.digest())))
                    throw new IllegalStateException("Original embedded asset SHA-256 mismatch");
                unpackVerifiedArchive(id, sha, uncompressed, count,
                    download, staged, previous, destination, call);
            } catch (Exception e) {
                cleanup(download); cleanup(staged);
                signal(id, "error", 0L, uncompressed);
                call.reject("Embedded game extraction failed: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void importLocal(PluginCall call) {
        String id = call.getString("id");
        String sha = call.getString("sha256");
        Long compressed = signedContentByteCount(call, "compressedBytes");
        Long uncompressed = signedContentByteCount(call, "uncompressedBytes");
        Integer count = call.getInt("artworkCount");
        if (!validId(id) || !validSha(sha) ||
                compressed == null || uncompressed == null || count == null ||
                compressed < MIN_ZIP_SIZE || compressed >= MAX_ZIP_SIZE ||
                uncompressed < 1024L || uncompressed > MAX_UNPACKED ||
                count < 1 || count > MAX_ENTRIES) {
            call.reject("Invalid signed content catalog"); return;
        }
        long necessary = compressed + uncompressed + 80_000_000L;
        if (baseDir().getUsableSpace() < necessary) {
            call.reject("Insufficient storage for verified local content"); return;
        }
        Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        picker.addCategory(Intent.CATEGORY_OPENABLE);
        picker.setType("*/*");
        picker.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
            "application/zip", "application/x-zip-compressed",
            "application/octet-stream"
        });
        startActivityForResult(call, picker, "onLocalZipPicked");
    }

    @ActivityCallback
    private void onLocalZipPicked(PluginCall call, ActivityResult selected) {
        if (call == null) return;
        if (selected.getResultCode() != Activity.RESULT_OK ||
                selected.getData() == null || selected.getData().getData() == null) {
            call.reject("No district ZIP selected"); return;
        }
        final Uri uri = selected.getData().getData();
        if (!"content".equals(uri.getScheme())) {
            call.reject("System document picker required"); return;
        }
        final String id = call.getString("id");
        final String sha = call.getString("sha256");
        final Long compressed = signedContentByteCount(call, "compressedBytes");
        final Long uncompressed = signedContentByteCount(call, "uncompressedBytes");
        final Integer expectedCount = call.getInt("artworkCount");
        if (!validId(id) || !validSha(sha) || compressed == null ||
                uncompressed == null || expectedCount == null ||
                compressed < MIN_ZIP_SIZE || compressed >= MAX_ZIP_SIZE ||
                uncompressed < 1024L || uncompressed > MAX_UNPACKED ||
                expectedCount < 1 || expectedCount > MAX_ENTRIES) {
            call.reject("Invalid signed district data"); return;
        }
        io.execute(() -> {
            File download = new File(baseDir(), id + ".partial");
            File staged = new File(baseDir(), id + ".installing");
            File previous = new File(baseDir(), id + ".previous");
            File destination = installedDir(id);
            try {
                cleanup(download); cleanup(staged); cleanup(previous);
                if (!staged.mkdirs())
                    throw new IllegalStateException("Failed to create private staging directory");
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] buf = new byte[BUFFER];
                long copied = 0;
                signal(id, "import", 0L, compressed);
                try (InputStream source = getContext().getContentResolver().openInputStream(uri);
                     OutputStream destinationStream =
                             new BufferedOutputStream(new FileOutputStream(download))) {
                    if (source == null) throw new IllegalStateException("Selected document unavailable");
                    int n;
                    while ((n = source.read(buf)) != -1) {
                        copied += n;
                        if (copied > compressed)
                            throw new IllegalStateException("Selected ZIP is larger than signed catalog");
                        digest.update(buf, 0, n);
                        destinationStream.write(buf, 0, n);
                        if ((copied & ((4 * 1024 * 1024) - 1)) < BUFFER)
                            signal(id, "import", copied, compressed);
                    }
                }
                if (copied != compressed || !hex(digest.digest()).equals(sha))
                    throw new IllegalStateException("Selected ZIP SHA-256 does not match district catalog");
                unpackVerifiedArchive(id, sha, uncompressed, expectedCount,
                        download, staged, previous, destination, call);
            } catch (Exception err) {
                cleanup(download); cleanup(staged);
                signal(id, "error", 0L, uncompressed);
                call.reject("Local ZIP installation failed: " + err.getMessage());
            }
        });
    }

    @PluginMethod
    public void asset(PluginCall call) {
        String id = call.getString("id"), path = call.getString("path");
        if (!validId(id) || path == null ||
            !path.matches("^(murals|props|dossiers|cutscenes|spritesheets|routes|evacs|shelters|nexus)/[a-z0-9/_-]+\\.(png|webp|webm)$") ||
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

    /**
     * Render a verified on-disk artwork as a bounded, JPEG-compressed preview.
     * District archives contain 2880x1620 images; loading several at native
     * resolution in Phaser consumes >50MB of GPU and crashes low-RAM phones.
     * This API never touches the signed original, runs on the IO executor and
     * never downloads an asset. Android's cache directory may evict previews.
     */
    @PluginMethod
    public void preview(PluginCall call) {
        final String id = call.getString("id"), path = call.getString("path");
        final Integer requested = call.getInt("maxWidth");
        final int maxWidth = requested == null ? 512 : requested;
        if (!validId(id) || path == null ||
            !path.matches("^(murals|props|dossiers|cutscenes|spritesheets|routes|evacs|shelters|nexus)/[a-z0-9/_-]+\\\\.(png|webp)$") ||
            path.contains("..") || maxWidth < 128 || maxWidth > 768) {
            call.reject("Invalid artwork preview request");
            return;
        }
        io.execute(() -> {
            Bitmap bitmap = null, reduced = null;
            try {
                File district = installedDir(id);
                if (!new File(district, "na-install.json").isFile())
                    throw new IllegalStateException("District not installed");
                File source = new File(district, path);
                if (!source.getCanonicalPath().startsWith(district.getCanonicalPath() + File.separator) ||
                    !source.isFile()) throw new IllegalStateException("Artwork missing");

                File cache = new File(getContext().getCacheDir(), "na-art-previews/" + id);
                if (!cache.isDirectory() && !cache.mkdirs())
                    throw new IllegalStateException("Preview cache unavailable");
                String digest = hex(hashBytes(path.getBytes(StandardCharsets.UTF_8)));
                File target = new File(cache, digest + "-" + maxWidth + ".jpg");
                if (!target.isFile() || target.length() == 0L) {
                    BitmapFactory.Options bounds = new BitmapFactory.Options();
                    bounds.inJustDecodeBounds = true;
                    BitmapFactory.decodeFile(source.getAbsolutePath(), bounds);
                    if (bounds.outWidth < 1 || bounds.outHeight < 1 ||
                        bounds.outWidth > 32768 || bounds.outHeight > 32768)
                        throw new IllegalStateException("Unsupported image dimensions");
                    BitmapFactory.Options opts = new BitmapFactory.Options();
                    opts.inPreferredConfig = Bitmap.Config.RGB_565;
                    int sample = 1;
                    while (Math.max(bounds.outWidth, bounds.outHeight) / sample > maxWidth * 2)
                        sample *= 2;
                    opts.inSampleSize = sample;
                    bitmap = BitmapFactory.decodeFile(source.getAbsolutePath(), opts);
                    if (bitmap == null) throw new IllegalStateException("Artwork decode failed");
                    int width = Math.min(maxWidth, bitmap.getWidth());
                    int height = Math.max(1, Math.round(bitmap.getHeight() * (width / (float) bitmap.getWidth())));
                    reduced = Bitmap.createScaledBitmap(bitmap, width, height, true);
                    File partial = new File(cache, target.getName() + ".part");
                    try (FileOutputStream out = new FileOutputStream(partial)) {
                        if (!reduced.compress(Bitmap.CompressFormat.JPEG, 78, out))
                            throw new IllegalStateException("Preview encode failed");
                    }
                    if (!partial.renameTo(target)) {
                        partial.delete();
                        throw new IllegalStateException("Could not publish preview");
                    }
                }
                JSObject result = new JSObject();
                result.put("uri", "file://" + target.getAbsolutePath());
                result.put("bytes", target.length());
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Cannot prepare game artwork: " + e.getMessage());
            } finally {
                if (reduced != null && reduced != bitmap) reduced.recycle();
                if (bitmap != null) bitmap.recycle();
            }
        });
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
