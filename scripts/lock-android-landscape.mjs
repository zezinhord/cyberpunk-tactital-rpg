import { readFile, writeFile } from "node:fs/promises";

const manifestPath = "android/app/src/main/AndroidManifest.xml";
const manifest = await readFile(manifestPath, "utf8");

const activityTags = [...manifest.matchAll(/<activity\b[^>]*>/gs)];
const mainActivity = activityTags.find((match) =>
  /android:name\s*=\s*["'][^"']*MainActivity["']/.test(match[0]),
);

if (!mainActivity) {
  throw new Error(
    "Não foi possível localizar a activity MainActivity no AndroidManifest.xml gerado pelo Capacitor.",
  );
}

const originalTag = mainActivity[0];
const orientationPattern = /android:screenOrientation\s*=\s*["'][^"']*["']/;

const updatedTag = orientationPattern.test(originalTag)
  ? originalTag.replace(
      orientationPattern,
      'android:screenOrientation="landscape"',
    )
  : originalTag.replace(
      />$/,
      ' android:screenOrientation="landscape">',
    );

const updatedManifest =
  manifest.slice(0, mainActivity.index) +
  updatedTag +
  manifest.slice(mainActivity.index + originalTag.length);

await writeFile(manifestPath, updatedManifest, "utf8");
console.log("Android MainActivity travada em orientação landscape.");
