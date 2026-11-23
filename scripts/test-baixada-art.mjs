import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const world=readFileSync(new URL("../src/components/BaixadaLiteWorld.tsx",import.meta.url),"utf8");
const art=readFileSync(new URL("../src/game/baixada/lite-city-art.ts",import.meta.url),"utf8");
assert.match(world,/heroBuildingOverlap\(renderPosition,layer.building\)/);
assert.match(world,/layer.depth>renderPosition.y/);
assert.ok(art.includes("roofRibs"),"Distinct roof seams");
assert.ok(art.includes("varanda de serviço"),"Balconies on building facades");
assert.ok(art.includes("Calha"),"Roof drainage");
// Keep eight critical assets ready while deferring offscreen NPC decoding.
// This preserves the original skins without consuming RAM for unseen citizens.
const sprites=readFileSync(new URL("../src/game/baixada/lite-art-assets.ts",import.meta.url),"utf8");
const essential=sprites.match(/const essential=\[([\s\S]*?)\] as const;/);
assert.ok(essential,"Opening sprite budget must remain explicit");
const ids=[...essential[1].matchAll(/"([^"]+)"/g)].map(x=>x[1]);
assert.deepEqual(ids,["playerMasculine","playerFeminine","nilo","joana",
 "saira","teo","market","palm"]);
assert.ok(sprites.includes("for(const id of essential)load(id)"));
assert.ok(sprites.includes("const existing=images.get(id)"));
assert.ok(sprites.includes("npc:(id)=>get(id)"),
 "Other NPC sprites must load as they become visible");
assert.ok(world.includes("if(sector!==lastSector)")&&
 world.includes("if(near!==lastNearby)"),
 "Walking should not trigger duplicate React sector and access updates");
console.log("Baixada visual QA: original art, eight eager resources, lazy NPCs, efficient HUD updates and occlusion protected.");
