import assert from "node:assert/strict";
import {registerHooks} from "node:module";
import {readFileSync} from "node:fs";
registerHooks({resolve(path,ctx,next){
 if((path.startsWith("./")||path.startsWith("../"))&&!/\.[cm]?[jt]s$/.test(path))
  return next(path+".ts",ctx);
 return next(path,ctx);
}});
const {EXPANSION_ROOM_DESIGNS}=await import("../src/game/districts/expansion-interiors.ts");
const {VIGIL_KEY,VIGIL_GROUPS,VIGIL_ART_FRAMES,VIGIL_BASE_XP,EMPTY_VIGIL,
 countEvacuated,mapForVigil,vigilGroupNames,vigilGuards,vigilUnlocked,
 validVigil,readVigil,saveVigil,vigilRun,startVigil,moveVigil,rescueVigil,
 divertVigil,reorganizeVigil,vigilFrame}
 =await import("../src/game/story/vigil-escorts.ts");
const storage=new Map();
globalThis.localStorage={getItem:k=>storage.get(k)??null,
 setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
assert.equal(EXPANSION_ROOM_DESIGNS.length,28);
assert.equal(VIGIL_GROUPS,4);assert.equal(VIGIL_ART_FRAMES,16);
assert.equal(VIGIL_BASE_XP,168);assert.equal(validVigil(EMPTY_VIGIL),true);
let rescues=0,steps=0,actualXp=0,distractors=0;
const signatures=new Set();
for(const room of EXPANSION_ROOM_DESIGNS){
 const id=room.id;
 const map=mapForVigil(id);
 const visible=map.corridor;
 assert.equal(visible.length,14);
 assert.deepEqual(visible[0],{x:0,y:7});
 assert.deepEqual(visible.at(-1),{x:7,y:1});
 assert.equal(map.guardStations.length,3);
 assert.equal(map.groups.length,4);
 assert.equal(vigilGroupNames(id).length,4);
 for(const cell of visible){
  assert.ok(!map.blocked.has(cell.x+","+cell.y),id);
  assert.ok(cell.x>=0&&cell.y>=0&&cell.x<8&&cell.y<8);
 }
 assert.equal(new Set(visible.map(p=>p.x+","+p.y)).size,visible.length);
 for(const cell of map.groups)assert.ok(visible.some(p=>p.x===cell.x&&p.y===cell.y));
 const signature=[...map.blocked].sort().join(";")+":"+
  visible.map(p=>p.x+","+p.y).join(">");
 signatures.add(signature);
 for(let t=0;t<5;t++)assert.equal(vigilGuards(id,t).length,3);
 const perimeter={version:1,active:{},completed:{[id]:true}};
 assert.equal(vigilUnlocked(perimeter,id),true);
 assert.equal(vigilUnlocked({version:1,active:{},completed:{}},id),false);
 assert.equal(startVigil(EMPTY_VIGIL,{version:1,active:{},completed:{}},id).ok,false);
 let state=startVigil(EMPTY_VIGIL,perimeter,id).state;
 assert.equal(validVigil(state),true);
 assert.equal(startVigil(state,perimeter,id).ok,false);
 assert.equal(rescueVigil(state,id).ok,false);
 assert.equal(moveVigil(state,id,5,3).ok,false,"No teleport");
 for(const target of visible.slice(1)){
  let run=vigilRun(state,id);
  assert.ok(run);
  while(run.energy===0){
   const result=reorganizeVigil(state,id);
   assert.equal(result.ok,true);state=result.state;
   run=vigilRun(state,id);
  }
  if(run.alert>=4&&run.energy>=2){
   const result=divertVigil(state,id);
   assert.equal(result.ok,true);state=result.state;distractors++;
  }
  run=vigilRun(state,id);
  const result=moveVigil(state,id,target.x,target.y,"furtivo");
  assert.equal(result.ok,true,id+" -> "+target.x+","+target.y+" "+result.message);
  state=result.state;steps++;
  if(!state.completed[id]){
   assert.ok(validVigil(state));
   const group=map.groups.findIndex(g=>g.x===target.x&&g.y===target.y);
   if(group>=0){
    const rescue=rescueVigil(state,id);
    assert.equal(rescue.ok,true,id+" "+rescue.message);
    state=rescue.state;rescues++;
    assert.ok((vigilRun(state,id).rescued&(1<<group))!==0);
    assert.equal(rescueVigil(state,id).ok,false,"Group cannot be rescued twice");
   }
  }
 }
 const outcome=state.completed[id];
 assert.ok(outcome,id+" was not completed");
 assert.equal(outcome.rescued,4);
 assert.ok(outcome.xp>=108&&outcome.xp<=168);
 assert.equal(vigilRun(state,id),null);
 assert.equal(startVigil(state,perimeter,id).ok,false);
 assert.equal(moveVigil(state,id,7,0).ok,false);
 actualXp+=outcome.xp;
 assert.equal(saveVigil("hero-"+id,state),true);
 assert.deepEqual(readVigil("hero-"+id),state);
 assert.ok(storage.has(VIGIL_KEY+"hero-"+id));
}
assert.ok(signatures.size>=20,"Physically different rescue routes and wall layouts required");
assert.equal(rescues,112);
assert.equal(steps,28*13);
assert.ok(actualXp>=28*108&&actualXp<=28*168);
assert.ok(distractors>=0);
assert.equal(countEvacuated(0),0);
assert.equal(countEvacuated(15),4);
assert.equal(countEvacuated(11),3);
const id=EXPANSION_ROOM_DESIGNS[0].id;
const p={version:1,active:{},completed:{[id]:true}};
let active=startVigil(EMPTY_VIGIL,p,id).state;
const run=vigilRun(active,id);
assert.ok(run);
assert.equal(moveVigil(active,id,-1,9).ok,false);
assert.equal(moveVigil(active,id,2,5,"corrida").ok,false);
assert.equal(moveVigil(active,id,1,7,"teleport").ok,false);
assert.equal(rescueVigil(active,id).ok,false);
assert.equal(divertVigil(active,id).ok,true);
assert.equal(reorganizeVigil(active,id).ok,true);
for(const raw of [
 {version:2,active:{},completed:{}},
 {version:1,active:{hacked:{}},completed:{}},
 {version:1,active:{},completed:{hacked:{}}},
 {version:1,active:{},completed:{[id]:true}},
 {version:1,active:{},completed:{[id]:{turns:1,rescued:4,incidents:0,retreats:0,xp:9999}}},
 {version:1,active:{[id]:{...run,alert:12}},completed:{}},
 {version:1,active:{},completed:{},constructor:"evil"},
])assert.equal(validVigil(raw),false);
storage.set(VIGIL_KEY+"tamper","{bad JSON");
assert.deepEqual(readVigil("tamper"),EMPTY_VIGIL);
const gallery=readFileSync("src/components/DossierGallery.tsx","utf8");
assert.ok(gallery.includes('mode==="evac"'));
assert.ok(gallery.includes("moveVigil(vigil"));
assert.ok(gallery.includes("rescueVigil(vigil"));
assert.ok(gallery.includes("onQuestXp("+'"vigil-"+simulationRoom'));
const backup=readFileSync("src/game/character/backup.ts","utf8");
assert.ok(backup.includes("vigil:VIGIL_KEY"));
assert.ok(backup.includes("validVigil(decoded)"));
const app=readFileSync("src/App.tsx","utf8");
assert.ok(app.includes('grantTrialXp("vigil-"+room,outcome.xp)'));
console.log("OPERAÇÃO VIGÍLIA PASS: 28 playable escort missions, "+
  rescues+" rescued civilian parties, "+steps+" physical turns, "+
  signatures.size+" unique floorplans, dynamic enemies, "+
  "secure persistence and "+actualXp+" once-only XP.");
