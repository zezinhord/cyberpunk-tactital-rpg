import assert from "node:assert/strict";
import {DISTRICTS,districtWalkable,districtCanStep} from "../src/game/districts/catalog.ts";
import {citizensForDistrict,chooseDistrictCitizenStep,districtCitizenSpeech}
 from "../src/game/ai/district-citizens.ts";
import {districtReaction} from "../src/game/ai/faction-reactivity.ts";
import {readFileSync} from "node:fs";
const scene=readFileSync(new URL("../src/game/districts/DistrictScene.ts",import.meta.url),"utf8");
const screen=readFileSync(new URL("../src/screens/ExplorationScreen.tsx",import.meta.url),"utf8");
const interior=readFileSync(new URL("../src/components/InteriorWorld.tsx",import.meta.url),"utf8");
let count=0;
for(const {id} of DISTRICTS){
 const specs=citizensForDistrict(id);
 assert.equal(specs.length,2,id+" must have two actual district citizens");
 for(const spec of specs){
  count++;
  assert(districtWalkable(id,spec.home),id+" has non-walkable NPC spawn "+spec.id);
  assert(spec.texture.startsWith("npc-")&&spec.name.length>2);
  assert.notEqual(districtCitizenSpeech(spec,"friendly"),districtCitizenSpeech(spec,"wary"));
  let current=spec.home;
  const player={x:4,y:10};
  for(let tick=0;tick<35;tick++){
   const occupied=new Set(specs.filter(s=>s.id!==spec.id).map(s=>s.home.x+","+s.home.y));
   const next=chooseDistrictCitizenStep(id,spec,current,player,tick,occupied);
   assert(districtWalkable(id,next),id+" illegal citizen step");
   assert(Math.abs(next.x-spec.home.x)+Math.abs(next.y-spec.home.y)<=3,
    id+" citizen left home neighborhood");
   if(current.x!==next.x||current.y!==next.y)
    assert(districtCanStep(id,current,next),id+" moved through wall");
   current=next;
  }
  assert.deepEqual(chooseDistrictCitizenStep(id,spec,current,player,-1,new Set()),current);
 }
}
assert.match(scene,/buildCitizens\(\)/);
assert.match(scene,/tickCitizens\(\)/);
assert.match(scene,/citizensForDistrict\(this\.id\)/);
assert.match(scene,/setReaction\(attitude:NpcAttitude\)/);
assert.match(screen,/worldAttitude=\{localReaction\.attitude\}/);
assert.match(interior,/attitudeRef\.current/);
console.log("RC18 world AI PASS — "+count+" real ambient residents across five distinct districts, walkable routes and faction-reactive speech.");
