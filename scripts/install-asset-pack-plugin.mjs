/** Capacitor generates android/ during GitHub Actions, so native asset-pack
 * bridge is injected at build time. Does not replace signing config or saves.
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
  throw new Error("Unexpected Capacitor MainActivity; refusing to patch signing-critical source");
const replacement=`package com.cyberpunk.tacticalrpg;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    registerPlugin(NovaAssetPacks.class);
    super.onCreate(savedInstanceState);
  }
}
`;
writeFileSync(main,replacement,"utf8");
copyFileSync("native/NovaAssetPacks.java",plugin);
const java=readFileSync(plugin,"utf8");
if(!java.includes('@CapacitorPlugin(name = "NovaAssetPacks")')||
   !java.includes('MessageDigest.getInstance("SHA-256")')||
   !java.includes('getContext().getFilesDir()'))
 throw new Error("Native asset pack contract incomplete");
console.log("NovaAssetPacks native plugin registered; no external storage permissions required.");
