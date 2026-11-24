import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {createHash} from "node:crypto";
const root="public/assets/characters-hd";
const files=readdirSync(root).filter(n=>n.endsWith(".png"));
assert.equal(files.length,29,"12 protagonists and 17 NPCs");
const hashes=new Set();
for(const file of files){
 const data=readFileSync(root+"/"+file);
 assert.equal(data.readUInt32BE(16),1536,file);
 assert.equal(data.readUInt32BE(20),640,file);
 assert.ok(data.length>3000,file);
 hashes.add(createHash("sha256").update(data).digest("hex"));
}
assert.equal(hashes.size,29);
const read=p=>readFileSync(p,"utf8");
assert.match(read("src/game/baixada/sprites.ts"),/SPRITE_FRAME_WIDTH = 128/);
assert.match(read("src/components/Battlefield.tsx"),/viewBox="0 160 128 160"/);
assert.match(read("src/components/BaixadaPhaserWorld.tsx"),/getSourceImage\(\)\.width===1536/);
for(const p of ["baixada/BaixadaScene","baixada/InteriorScene","baixada/SewerScene","districts/DistrictInteriorScene","districts/DistrictScene","ferrugem/FerrugemScene"])
 assert.match(read("src/game/"+p+".ts"),/setScale\([^)]*HD_SPRITE_SCALE/);
assert.match(read("native/NovaAssetPacks.java"),/getApplicationInfo\(\)\.sourceDir/);
console.log("HD SPRITES PASS: 29 distinct atlases, 1392 frames, 128x160, live world and combat links, fixed display scale and native APK measurement.");
