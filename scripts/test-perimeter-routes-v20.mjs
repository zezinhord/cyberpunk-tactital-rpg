import assert from "node:assert/strict";
import {registerHooks} from "node:module";
import {readFileSync} from "node:fs";
registerHooks({resolve(spec,ctx,next){
 if((spec.startsWith("./")||spec.startsWith("../"))&&!/\.[cm]?[jt]s$/.test(spec))
  return next(spec+".ts",ctx);
 return next(spec,ctx);
}});
const {EXPANSION_ROOM_DESIGNS}=await import("../src/game/districts/expansion-interiors.ts");
const {SIMULATION_PHASES}=await import("../src/game/story/field-simulations.ts");
const {PERIMETER_KEY,PERIMETER_STAGES,PERIMETER_FRAMES,PERIMETER_XP,
 EMPTY_PERIMETER,validatePerimeter,readPerimeter,savePerimeter,
 perimeterUnlocked,layoutForRoom,currentRoute,routeGoal,routeBrief,
 startPerimeter,movePerimeter,answerPerimeter,routeFrame}
 =await import("../src/game/story/perimeter-routes.ts");
const db=new Map();
globalThis.localStorage={getItem:key=>db.get(key)??null,
 setItem:(key,val)=>db.set(key,String(val)),removeItem:key=>db.delete(key)};
assert.equal(PERIMETER_STAGES,5);
assert.equal(PERIMETER_FRAMES,20);
assert.equal(PERIMETER_XP,138);
assert.equal(EXPANSION_ROOM_DESIGNS.length,28);
assert.equal(validatePerimeter(EMPTY_PERIMETER),true);
const corridor=[[0,7],[1,7],[2,7],[2,6],[3,6],[3,5],
 [4,5],[4,4],[5,4],[5,3],[6,3],[6,2],[7,2],[7,1]];
const stationIdx=[3,5,7,9,11];
const ids=new Set();
let decisions=0,moves=0,totalXp=0;
for(const room of EXPANSION_ROOM_DESIGNS){
 const id=room.id,sim={version:1,solved:{[id]:SIMULATION_PHASES}};
 const map=layoutForRoom(id);
 assert.equal(map.stations.length,5);
 assert.equal(map.entrance.x,0);assert.equal(map.exit.y,1);
 const unique=[...map.blocked].sort().join(";");
 ids.add(unique);
 for(const [x,y] of corridor)assert.ok(!map.blocked.has(x+","+y),id);
 assert.equal(perimeterUnlocked(sim,id),true);
 assert.equal(perimeterUnlocked({version:1,solved:{}},id),false);
 assert.equal(startPerimeter(EMPTY_PERIMETER,{version:1,solved:{}},id).ok,false);
 let state=startPerimeter(EMPTY_PERIMETER,sim,id).state;
 assert.ok(validatePerimeter(state));
 assert.equal(startPerimeter(state,sim,id).ok,false);
 let step=0;
 for(let phase=0;phase<5;phase++){
  const brief=routeBrief(id,phase);
  assert.ok(brief&&brief.title.length>5&&brief.prompt.includes(room.title));
  assert.equal(brief.options.length,3);
  assert.equal(new Set(brief.options).size,3);
  for(;step<stationIdx[phase];step++){
   const [x,y]=corridor[step+1];
   assert.equal(movePerimeter(state,id,x+1,y).ok,false,
     "No teleportation allowed");
   const result=movePerimeter(state,id,x,y,"careful");
   assert.equal(result.ok,true);
   assert.equal(result.xp,0);
   state=result.state;moves++;
  }
  const target=routeGoal(id,currentRoute(state,id));
  assert.equal(currentRoute(state,id).x,target.x);
  assert.equal(currentRoute(state,id).y,target.y);
  let result=answerPerimeter(state,id,(brief.correct+1)%3);
  assert.equal(result.ok,true);assert.equal(result.xp,0);
  state=result.state;
  result=answerPerimeter(state,id,brief.correct);
  assert.equal(result.ok,true);assert.equal(result.xp,0);
  state=result.state;decisions++;
  assert.equal(currentRoute(state,id).stage,phase+1);
  assert.equal(validatePerimeter(state),true);
  assert.ok(routeFrame(currentRoute(state,id))>=0);
  assert.ok(routeFrame(currentRoute(state,id))<=19);
 }
 for(;step<corridor.length-1;step++){
  const [x,y]=corridor[step+1];
  const result=movePerimeter(state,id,x,y);
  assert.equal(result.ok,true);
  state=result.state;totalXp+=result.xp;moves++;
 }
 assert.equal(totalXp%PERIMETER_XP,0);
 assert.equal(state.completed[id],true);
 assert.equal(currentRoute(state,id),null);
 assert.equal(movePerimeter(state,id,6,1).ok,false);
 assert.equal(startPerimeter(state,sim,id).ok,false);
 assert.equal(savePerimeter("hero-"+id,state),true);
 assert.deepEqual(readPerimeter("hero-"+id),state);
 assert.ok(db.has(PERIMETER_KEY+"hero-"+id));
}
assert.ok(ids.size>=10,"Map layouts must not all be the same"); // 28 room-specific maps
assert.equal(decisions,28*5);
assert.equal(moves,28*(corridor.length-1));
assert.equal(totalXp,28*PERIMETER_XP);
const map=layoutForRoom(EXPANSION_ROOM_DESIGNS[0].id);
let start=startPerimeter(EMPTY_PERIMETER,{version:1,solved:{[map.id]:6}},map.id).state;
for(const [x,y] of [[1,7],[2,7]]){
 const r=movePerimeter(start,map.id,x,y);assert.equal(r.ok,true);start=r.state;
}
assert.equal(movePerimeter(start,map.id,-1,6).ok,false);
assert.equal(movePerimeter(start,map.id,2,6,"evil").ok,false);
assert.equal(answerPerimeter(start,map.id,0).ok,false);
for(const invalid of [
 {version:0,active:{},completed:{}},
 {version:1,active:{hacked:{x:0,y:7}},completed:{}},
 {version:1,active:{},completed:{hacked:true}},
 {version:1,active:{},completed:{[map.id]:false}},
 {version:1,active:{[map.id]:{x:9,y:0,stage:0,alarm:0,tools:0,steps:0,retries:0}},completed:{}},
 {version:1,active:{},completed:{},script:"evil"},
])assert.equal(validatePerimeter(invalid),false);
db.set(PERIMETER_KEY+"broken","{broken");
assert.deepEqual(readPerimeter("broken"),EMPTY_PERIMETER);
const gallery=readFileSync("src/components/DossierGallery.tsx","utf8");
assert.ok(gallery.includes('mode==="route"'));
assert.ok(gallery.includes("movePerimeter(perimeter"));
assert.ok(gallery.includes("answerPerimeter(perimeter"));
const app=readFileSync("src/App.tsx","utf8");
assert.ok(app.includes('grantTrialXp("perimeter-"+room,PERIMETER_XP)'));
const backup=readFileSync("src/game/character/backup.ts","utf8");
assert.ok(backup.includes("perimeter:PERIMETER_KEY"));
assert.ok(backup.includes("validatePerimeter(decoded)"));
console.log("OPERAÇÃO LIMIAR: 28 navigable maps, 140 field interventions, "+moves+
 " actual grid movements, unique XP, secure saves and no repeated reward.");
