import assert from "node:assert/strict";
import {DEFAULT_TACTICAL_VIEWPORT,normalizeTacticalViewport,
 tacticalViewBox,zoomTacticalViewport,panTacticalViewport
} from "../src/game/combat/tactical-viewport.ts";
assert.equal(tacticalViewBox(DEFAULT_TACTICAL_VIEWPORT),"0 0 480 320");
const enlarged=zoomTacticalViewport(DEFAULT_TACTICAL_VIEWPORT,.5);
assert.equal(enlarged.zoom,1.5);
assert.equal(tacticalViewBox(enlarged),"80 53.33 320 213.33");
const shifted=panTacticalViewport(enlarged,90,-60);
assert(shifted.panX<0&&shifted.panY>0);
assert.equal(normalizeTacticalViewport({zoom:8,panX:1000,panY:-1000}).zoom,1.8);
assert.equal(tacticalViewBox({zoom:NaN,panX:Infinity,panY:NaN}),"0 0 480 320");
assert.equal(tacticalViewBox(panTacticalViewport(DEFAULT_TACTICAL_VIEWPORT,200,200)),"0 0 480 320");
const atLimit=normalizeTacticalViewport({zoom:1.8,panX:999,panY:999});
const parts=tacticalViewBox(atLimit).split(" ").map(Number);
assert(parts[0]+parts[2]<=480.01&&parts[1]+parts[3]<=320.01);
console.log("RC18 tactical zoom and pan camera PASS — 8x8 rules and hitboxes unchanged.");
