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
assert.ok(world.includes("const v=view;"),"Pointer coordinates must use the last rendered camera");
assert.ok(world.includes('frameIntervalMs=readGraphicsMode()==="balanced"?16.67:33.34'),
 "The Android Canvas renderer must honor economy/balanced FPS");
assert.ok(world.includes("if(next&&!canTraverse(motion.position,next,{occupied}))"),
 "NPCs moving into a route must trigger a safe replan before stepping");
assert.ok(world.includes("if(motion.step)occupied.add(motion.step.to.x"),
 "Roaming citizens must not enter an avatar tile already reserved mid-step");
assert.ok(world.includes("Math.max(4000,(path.length-1)*195+2800)"),
 "NPC interaction lock must use the current route duration");
assert.ok(world.includes("const TILE_PALETTES={"),"Tiles must reuse shared palettes");
for(const key of ["outside","commercialRoad","commercialGround","industrialRoad",
 "industrialGround","localRoad","localGround"]){
 assert.ok(world.includes("TILE_PALETTES."+key),
  "District colors must keep their original visual identity: "+key);
}
assert.ok(!world.includes("const palette=outside\n"),
 "Drawing each tile must not allocate a new array on every frame");
console.log("Baixada QA: graphics, NPC collision reroute, touch accuracy and low-GC palettes verified.");
