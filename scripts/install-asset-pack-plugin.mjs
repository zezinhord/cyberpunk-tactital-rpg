/** Capacitor generates Android sources at CI build time.
 * Register the SHA-verified asset bridge WITHOUT REPLACING MainActivity.
 * Overwriting MainActivity after enable-android-immersive.mjs had silently
 * discarded fullscreen lifecycle callbacks, leaving Android status bars up.
 */
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from "node:fs";
import {resolve,dirname} from "node:path";

const root=resolve("android/app/src/main/java/com/cyberpunk/tacticalrpg");
const main=resolve(root,"MainActivity.java");
const plugin=resolve(root,"NovaAssetPacks.java");
mkdirSync(dirname(main),{recursive:true});
const original=readFileSync(main,"utf8");
if(!original.includes("extends BridgeActivity")||
 !original.includes("class MainActivity")||
 !original.includes("package com.cyberpunk.tacticalrpg;"))
 throw Error("Unexpected Capacitor MainActivity; refusing to modify native application");
if(!original.includes("enterImmersiveMode()")||
 !original.includes("FLAG_FULLSCREEN")||
 !original.includes("WindowInsets.Type.statusBars()"))
 throw Error("Fullscreen Android must be installed BEFORE asset bridge; refusing to remove system bar handling");

const anchor="super.onCreate(savedInstanceState);";
if(original.split(anchor).length!==2)
 throw Error("Expected one MainActivity onCreate lifecycle hook");
if(original.includes("registerPlugin(NovaAssetPacks.class);"))
 throw Error("Asset-pack plugin already registered; refusing duplicate registration");
const patched=original.replace(anchor,
 "registerPlugin(NovaAssetPacks.class);\n        "+anchor);
if(!patched.includes("registerPlugin(NovaAssetPacks.class);")||
 !patched.includes("onWindowFocusChanged(boolean hasFocus)")||
 !patched.includes("onPostResume()"))
 throw Error("Loss of native fullscreen hooks during plugin registration");
writeFileSync(main,patched,"utf8");
copyFileSync("native/NovaAssetPacks.java",plugin);
const java=readFileSync(plugin,"utf8");
if(!java.includes('@CapacitorPlugin(name = "NovaAssetPacks")')||
 !java.includes('MessageDigest.getInstance("SHA-256")')||
 !java.includes('getContext().getFilesDir()'))
 throw Error("Native SHA256 install contract incomplete");
console.log("Asset bridge registered INSIDE immersive Activity, preserving fullscreen on boot/resume.");
