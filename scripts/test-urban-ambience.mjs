import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
const root=resolve("public/assets/ambient");
const manifest=JSON.parse(readFileSync(resolve(root,"manifest.json"),"utf8"));
assert.equal(manifest.format,"nova-arcadia-environment-v1");
const districts=["baixada","ferrugem","aurea","subsolo","setor-zero","prisma","periferia"];
const states=["street","rain","interior","alert"];
assert.equal(manifest.items.length,28);
assert.equal(new Set(manifest.items.map(x=>x.url)).size,28);
assert.equal(new Set(manifest.items.map(x=>x.sha256)).size,28,
 "No identical copies masquerading as unique ambient regions");
let total=0;
for(const district of districts)for(const mode of states){
 const track=manifest.items.find(t=>t.district===district&&t.mode===mode);
 assert.ok(track,"Missing ambience "+district+"/"+mode);
 assert.equal(track.seconds,360);
 assert.ok(track.bytes>5_550_000,"Missing or truncated environmental recording "+track.url);
 const file=resolve(root,district,mode+".ogg");
 assert.ok(existsSync(file));
 const bytes=readFileSync(file);
 assert.equal(bytes.subarray(0,4).toString("utf8"),"OggS");
 assert.equal(bytes.length,track.bytes);
 assert.equal(createHash("sha256").update(bytes).digest("hex"),track.sha256);
 total+=bytes.length;
}
assert.equal(total,manifest.totalBytes);
assert.ok(total>150_000_000,"The four context variations must be fully generated, not empty files");
const director=readFileSync("src/audio/director.ts","utf8");
for(const needle of ["prepareAmbience","updateAmbience","originalAmbienceFallback(","this.current===","this.ambience?.pause()"])
 assert.ok(director.includes(needle),"Runtime does not use existing environmental sound "+needle);
const fallback=readFileSync("src/audio/expanded-ambience.ts","utf8");
assert.ok(fallback.includes('"/assets/ambient/"'),"Old 28 ambience recordings must remain a real fallback for audio failures");
console.log("Ambiências: 28 originais/7 distritos×4 cenas, Opus sob demanda, 168 minutos de design sonoro exclusivo; "+
 total.toLocaleString("pt-BR")+" bytes.");
