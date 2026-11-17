import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
import {RADIO_DISTRICTS} from "../src/audio/soundscapes.ts";
import {CITY_AUDIO_MODES,CITY_AUDIO_PHASES,cityAudioPhase,
 expandedAmbiencePath,originalAmbienceFallback} from "../src/audio/expanded-ambience.ts";
const manifest=JSON.parse(readFileSync("public/assets/ambient-expanded/manifest.json","utf8"));
assert.equal(manifest.format,"nova-arcadia-adaptive-city-audio-v1");
assert.equal(manifest.trackCount,112);
assert.equal(manifest.tracks.length,112);
assert.equal(RADIO_DISTRICTS.length*CITY_AUDIO_MODES.length*CITY_AUDIO_PHASES.length,112);
assert.equal(new Set(manifest.tracks.map(x=>x.sha256)).size,112);
assert.equal(new Set(manifest.tracks.map(x=>x.url)).size,112);
let bytes=0;
for(const district of RADIO_DISTRICTS)for(const mode of CITY_AUDIO_MODES)
 for(const phase of CITY_AUDIO_PHASES){
  const url=expandedAmbiencePath(district.id,mode,phase);
  const track=manifest.tracks.find(t=>t.url===url);
  assert.ok(track,"Faixa não encontrada: "+url);
  assert.equal(track.seconds,360);
  const file=resolve("public",url.slice(1)),size=statSync(file).size;
  assert.ok(size>6_800_000,"Arquivo incompleto "+url);
  assert.equal(size,track.bytes);
  const raw=readFileSync(file);
  assert.equal(raw.subarray(0,4).toString("utf8"),"OggS");
  assert.equal(createHash("sha256").update(raw).digest("hex"),track.sha256);
  bytes+=size;
 }
assert.equal(bytes,manifest.totalBytes);
assert.ok(bytes>780_000_000);
assert.equal(new Set([0,1,2,3].map(x=>cityAudioPhase(x,0))).size,4);
assert.equal(originalAmbienceFallback("baixada","street"),"/assets/ambient/baixada/street.ogg");
const director=readFileSync("src/audio/director.ts","utf8");
assert.ok(director.includes("expandedAmbiencePath("));
assert.ok(director.includes("originalAmbienceFallback("));
assert.ok(director.includes("stream.preload=\"none\""));
console.log("112 gravações originais ligadas ao gameplay: "+bytes+" bytes; 672 minutos.");
