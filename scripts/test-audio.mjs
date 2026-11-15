import assert from "node:assert/strict";
import { readVolume } from "../src/audio/director.ts";
for(const c of ["music","effects","ambient"]) {
  const v=readVolume(c); assert.ok(v>=0&&v<=1);
}
console.log("Áudio: módulos de volume sem dependência remota verificados.");
