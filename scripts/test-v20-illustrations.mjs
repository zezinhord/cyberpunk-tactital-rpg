import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,statSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
const ROOT=resolve(fileURLToPath(new URL("..",import.meta.url)));
const source=readFileSync(resolve(ROOT,"src/game/districts/expansion-interiors.ts"),"utf8");
const rooms=JSON.parse(source.split("export const EXPANSION_ROOM_DESIGNS=")[1].split(" as const;")[0]);
const manifestPath=resolve(ROOT,"public/assets/v20-illustrations/manifest.json");
assert.ok(existsSync(manifestPath),"Generate visuals with tools/generate_v20_illustrations.py");
const manifest=JSON.parse(readFileSync(manifestPath,"utf8"));
assert.equal(manifest.schema,1);
assert.equal(manifest.room_count,28);
assert.equal(manifest.asset_count,112);
assert.equal(rooms.length,28);
assert.equal(manifest.assets.length,112);
const assetPaths=new Set(),assetHashes=new Set();
let total=0;
for(const asset of manifest.assets){
 assert.equal(typeof asset.path,"string");
 assert.ok(/^assets\/v20-illustrations\/(murals|props)\/[a-z0-9-]+\.png$/.test(asset.path),
  "Pack cannot access external/untrusted path");
 assert.ok(!assetPaths.has(asset.path),"Duplicate visual path");
 assetPaths.add(asset.path);
 const path=resolve(ROOT,"public",asset.path);
 assert.ok(existsSync(path),"Missing playable art: "+asset.path);
 const data=readFileSync(path);
 assert.ok(data.subarray(0,8).equals(Buffer.from("89504e470d0a1a0a","hex")),"PNG required");
 const width=data.readUInt32BE(16),height=data.readUInt32BE(20);
 assert.equal(width,asset.width);assert.equal(height,asset.height);
 assert.ok((width===1184&&height===100)||(width===128&&height===128),
  "Restrict GPU texture budget to one wall mural or a small interactable");
 assert.equal(statSync(path).size,asset.bytes);
 const hash=createHash("sha256").update(data).digest("hex");
 assert.equal(hash,asset.sha256,"Art data integrity changed");
 assert.ok(!assetHashes.has(hash),"An artwork was duplicated to inflate APK");
 assetHashes.add(hash);
 assert.ok(asset.bytes>450,"Artwork must have actual information");
 total+=asset.bytes;
}
for(const r of rooms){
 assert.ok(assetPaths.has("assets/v20-illustrations/murals/"+r.id+".png"),r.id+" needs mural");
 for(const type of ["arquivo","sistema","suprimento"]){
  assert.ok(assetPaths.has("assets/v20-illustrations/props/"+r.id+"-"+type+".png"),
   r.id+" "+type+" must be available in real game");
 }
}
assert.equal(total,manifest.total_bytes);
const scene=readFileSync(resolve(ROOT,"src/game/districts/DistrictInteriorScene.ts"),"utf8");
assert.ok(scene.includes("environmentArtUrl(this.id,prop.id)")&&
 scene.includes("environmentArtKey(this.id,prop.id)")&&
 scene.includes("environmentArtUrl(this.id)")&&
 scene.includes("this.add.image(48,86,environmentArtKey(this.id))"),
 "All generated art must be referenced by the runtime, not just packed and unused");
console.log("V2 art: 28 rooms, 84 props, 112 distinct PNGs,"+total+
 " bytes audited with in-game references and SHA-256. No 3GB claim.");
