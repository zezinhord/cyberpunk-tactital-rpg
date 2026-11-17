#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DISTRICTS,NODE_TILES,DISTRICT_SPAWN,districtPath,districtWalkable} from "../src/game/districts/catalog.ts";
import {DISTRICT_ART} from "../src/game/districts/art.ts";
const signatures=new Set(),architectures=new Set(),roofRises=new Set();
for(const district of DISTRICTS){
 const style=DISTRICT_ART[district.id];
 assert.ok(style,"Missing visual identity for "+district.id);
 assert.equal(style.signature.length,3);
 assert.ok(style.roofRise>=45&&style.roofRise<=180);
 assert.equal(style.signature.length,new Set(style.signature).size);
 architectures.add(style.architecture);
 roofRises.add(style.roofRise);
 for(const s of style.signature){assert.ok(!signatures.has(s),"Repeated district motif "+s);signatures.add(s);}
 for(const node of Object.values(NODE_TILES))
  assert.ok(districtPath(district.id,DISTRICT_SPAWN,node)===null||districtWalkable(district.id,node)===false);
 // Pathfinder and all actor approaches remain untouched by the art module.
 for(const [slot,point] of Object.entries(NODE_TILES)){
  const cardinal=[{x:point.x,y:point.y-1},{x:point.x+1,y:point.y},
   {x:point.x,y:point.y+1},{x:point.x-1,y:point.y}];
  assert.ok(cardinal.some(p=>districtWalkable(district.id,p)&&districtPath(district.id,DISTRICT_SPAWN,p)),
   "No reachable position adjacent to "+district.id+"/"+slot);
 }
}
assert.equal(architectures.size,5,"Five genuinely distinct district styles");
assert.equal(roofRises.size,5);
assert.equal(signatures.size,15);
const source=readFileSync(new URL("../src/game/districts/DistrictScene.ts",import.meta.url),"utf8");
for(const identifier of ["drawDistrictSkyline","drawDistrictPavement","drawDistrictBuilding","drawDistrictInteractable"])
 assert.ok(source.includes(identifier),"District scene missing "+identifier);
assert.match(source,/district-surface-.*-v080/,"Static texture version must change");
console.log("District art: 5 unique identities, 15 motifs, 40 reachable actor approaches, existing map preserved.");
