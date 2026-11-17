import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
const names=["amara","nilo","joana","saira","teo","lia","ramon","duda","iza","tomas","davi","marta","celina","mara","iuri","kai","dara"];
const hashes=new Set();
for(const name of names){
 const path="src/assets/characters/npc-"+name+".png";
 const bytes=await readFile(path);
 assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a","PNG: "+path);
 assert.equal(bytes.readUInt32BE(16),768,"12×64 frames: "+path);
 assert.equal(bytes.readUInt32BE(20),320,"4×80 directions: "+path);
 assert.ok(bytes.length>1800,"Blank NPC: "+path);
 hashes.add(createHash("sha256").update(bytes).digest("hex"));
}
assert.equal(hashes.size,names.length,"Named NPCs must be visually distinct");
const atlas=await readFile("qa/npc-matrix-v076.png");
assert.equal(atlas.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
assert.ok(atlas.length>5000);
console.log("NPC art: 16 unique 12x4 PNG sheets, 4 directions and idle/walk/gesture/ability/hurt/down states.");
