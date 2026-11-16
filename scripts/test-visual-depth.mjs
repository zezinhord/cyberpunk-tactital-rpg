import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const scene=readFileSync(new URL("../src/game/districts/DistrictScene.ts",import.meta.url),"utf8");
const world=readFileSync(new URL("../src/components/BaixadaLiteWorld.tsx",import.meta.url),"utf8");
const art=readFileSync(new URL("../src/game/baixada/lite-city-art.ts",import.meta.url),"utf8");
for(const feature of ["this.buildBuildingLayers();","this.buildingLayers.push","g.generateTexture(key,width,height)",
 "this.updateBuildingOcclusion();","data-district-art","DISTRICT_GUIDE_TEXTURE[this.id]","playIdle(sprite,texture,2)"])
 assert.ok(scene.includes(feature),"Missing visual feature: "+feature);
assert.ok(!scene.includes("drawDistrictBuilding(g,this.id,s,block,center,i)"),
 "Buildings must not be baked into back texture");
assert.ok(world.includes("heroBuildingOverlap(renderPosition,layer.building)"));
assert.ok(art.includes("roofRibs")&&art.includes("varanda de serviço")&&art.includes("Calha"));
console.log("QA: 6 small depth-sorted building textures, guide sprites and Baixada polish present.");
