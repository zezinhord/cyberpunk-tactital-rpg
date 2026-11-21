import assert from "node:assert/strict";
import {registerHooks} from "node:module";
registerHooks({resolve(p,c,next){
 if((p.startsWith("./")||p.startsWith("../"))&&!/\.[cm]?[jt]s$/.test(p))return next(p+".ts",c);
 return next(p,c);
}});
const {EXPANSION_ROOM_DESIGNS}=await import("../src/game/districts/expansion-interiors.ts");
const R=await import("../src/game/story/shelter-network.ts");
const memory=new Map();
globalThis.localStorage={getItem:k=>memory.get(k)??null,
 setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
assert.equal(EXPANSION_ROOM_DESIGNS.length,28);
assert.equal(R.SHELTER_STEPS,5);
assert.equal(R.SHELTER_FRAMES,20);
let moves=0,decisions=0,resupplies=0,rewarded=0;
const taskNames=new Set();
for(const {id} of EXPANSION_ROOM_DESIGNS){
 const ready={version:1,active:{},completed:{[id]:{rescued:4}}};
 assert.equal(R.shelterUnlocked(ready,id),true);
 assert.equal(R.shelterUnlocked({version:1,active:{},completed:{}},id),false);
 assert.equal(R.startShelter(R.EMPTY_SHELTER,{version:1,active:{},completed:{}},id).ok,false);
 let state=R.startShelter(R.EMPTY_SHELTER,ready,id).state;
 assert.equal(R.startShelter(state,ready,id).ok,false);
 assert.equal(R.moveShelter(state,id,7,7).ok,false,"Teleport rejected");
 assert.equal(R.decideShelter(state,id,0).ok,false,"No remote intervention");
 for(let stage=0;stage<5;stage++){
  const task=R.shelterTask(id,stage);
  assert.equal(task.choices.length,3);
  assert.ok(task.title.length>=6);
  taskNames.add(id+"::"+task.title);
  let run=R.activeShelter(state,id),steps=0;
  const goal=R.SHELTER_GOALS[stage];
  while(run.x!==goal.x||run.y!==goal.y){
   const plan=R.planShelterRoute(id,run);
   assert.ok(plan.steps.length,"Disconnected floorplan "+id+" "+stage);
   const step=plan.steps[0];
   assert.equal(Math.abs(step.x-run.x)+Math.abs(step.y-run.y),1);
   const moved=R.moveShelter(state,id,step.x,step.y,"equilibrado");
   assert.equal(moved.ok,true,moved.message);
   state=moved.state;run=R.activeShelter(state,id);
   assert.ok(steps++<64);
   moves++;
  }
  assert.equal(R.decideShelter(state,id,99).ok,false);
  const option=(stage+id.length)%3;
  while(R.activeShelter(state,id).supplies<task.choices[option].cost){
   const restock=R.supplyShelter(state,id);
   assert.equal(restock.ok,true,restock.message);
   state=restock.state;resupplies++;
  }
  const result=R.decideShelter(state,id,option);
  assert.equal(result.ok,true,result.message);
  state=result.state;decisions++;
 }
 assert.equal(R.validShelter(state),true);
 const final=state.completed[id];
 assert.equal(final.stages,5);
 assert.equal(final.choices.length,5);
 assert.ok(final.xp>=125&&final.xp<=185);
 rewarded+=final.xp;
 assert.equal(R.startShelter(state,ready,id).ok,false,"Reward once only");
 assert.equal(R.saveShelter(id,state),true);
 assert.deepEqual(R.readShelter(id),state);
 assert.equal(R.validShelter({...state,completed:{[id]:{...final,xp:999}}}),false);
 assert.equal(R.shelterFrame(4,9)>=16,true);
}
assert.equal(decisions,140);
assert.equal(taskNames.size,140);
assert.ok(moves>=140);
assert.equal(R.validShelter({version:1,active:{"../path":{}},completed:{}}),false);
assert.equal(R.validShelter({version:1,active:{},completed:{"../path":{}}}),false);
console.log("OPERAÇÃO REFÚGIO",JSON.stringify({rooms:28,interventions:decisions,moves,resupplies,rewarded}));
