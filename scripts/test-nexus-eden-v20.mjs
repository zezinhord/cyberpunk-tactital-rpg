import assert from "node:assert/strict";
import {registerHooks} from "node:module";
registerHooks({resolve(path,context,next){
 if((path.startsWith("./")||path.startsWith("../"))&&!/\.[cm]?[jt]s$/.test(path))
  return next(path+".ts",context);
 return next(path,context);
}});
const {EXPANSION_ROOM_DESIGNS}=await import("../src/game/districts/expansion-interiors.ts");
const N=await import("../src/game/story/nexus-eden.ts");
const memory=new Map();
globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
assert.equal(EXPANSION_ROOM_DESIGNS.length,28);
assert.equal(N.NEXUS_NODES,6);assert.equal(N.NEXUS_FRAMES,24);
assert.ok(N.validNexus(N.EMPTY_NEXUS));
const seen=new Set();
let hacks=0,moves=0,recharged=0,jammed=0,xp=0,retreats=0;
for(const room of EXPANSION_ROOM_DESIGNS){
 const id=room.id;
 const unlocked={version:1,active:{},completed:{[id]:{stages:5}}};
 assert.equal(N.nexusUnlocked(unlocked,id),true);
 assert.equal(N.nexusUnlocked({version:1,active:{},completed:{}},id),false);
 assert.equal(N.startNexus(N.EMPTY_NEXUS,{version:1,active:{},completed:{}},id).ok,false);
 let state=N.startNexus(N.EMPTY_NEXUS,unlocked,id).state;
 assert.equal(N.startNexus(state,unlocked,id).ok,false);
 assert.equal(N.moveNexus(state,id,7,7).ok,false,"teleport blocked");
 assert.equal(N.syncNexus(state,id,0).ok,false,"remote hack blocked");
 const map=N.nexusMap(id);
 assert.equal(map.nodes.length,6);
 assert.deepEqual(map.nodes.at(-1),map.exit);
 assert.equal(map.corridor.length,14);
 assert.equal(N.nexusGuards(id,0).length,3);
 assert.ok(map.nodes.every(p=>!map.blocked.has(p.x+","+p.y)));
 for(let stage=0;stage<6;stage++){
  const task=N.nexusQuestion(id,stage);
  assert.equal(task.options.length,3);
  assert.ok(task.title.length>7&&task.brief.length>20);
  seen.add(id+"-"+stage+"-"+task.title);
  let run=N.activeNexus(state,id),iterations=0;
  while(run.stage===stage && !(run.x===map.nodes[stage].x&&run.y===map.nodes[stage].y)){
   let route=N.planNexusRoute(id,run);
   assert.ok(route.steps.length>0,"No route "+id+"/"+stage);
   const cell=route.steps[0];
   assert.equal(Math.abs(cell.x-run.x)+Math.abs(cell.y-run.y),1);
   if(run.energy<2){
    const result=N.rechargeNexus(state,id);
    assert.equal(result.ok,true,result.message);state=result.state;recharged++;
   }else if(run.trace>=4){
    const result=N.jamNexus(state,id);
    assert.equal(result.ok,true,result.message);state=result.state;jammed++;
   }else{
    const result=N.moveNexus(state,id,cell.x,cell.y,"silencioso");
    assert.equal(result.ok,true,id+" "+result.message);
    state=result.state;moves++;
   }
   run=N.activeNexus(state,id);
   if(run.breaches)retreats=Math.max(retreats,run.breaches);
   assert.ok(iterations++<110,id+" must terminate");
  }
  assert.equal(N.syncNexus(state,id,99).ok,false);
  const choice=(stage+id.length)%3,cost=[2,1,3][choice];
  while(N.activeNexus(state,id).energy<cost){
   const result=N.rechargeNexus(state,id);
   assert.equal(result.ok,true);state=result.state;recharged++;
  }
  const result=N.syncNexus(state,id,choice);
  assert.equal(result.ok,true,id+" "+result.message);
  state=result.state;hacks++;
 }
 assert.equal(N.validNexus(state),true);
 assert.equal(N.activeNexus(state,id),null);
 const outcome=state.completed[id];
 assert.equal(outcome.nodes,6);assert.equal(outcome.choices.length,6);
 assert.ok(outcome.xp>=130&&outcome.xp<=230);
 xp+=outcome.xp;
 assert.equal(N.startNexus(state,unlocked,id).ok,false,"repeat XP blocked");
 assert.equal(N.saveNexus(id,state),true);
 assert.deepEqual(N.readNexus(id),state);
 assert.equal(N.validNexus({...state,completed:{[id]:{...outcome,xp:1000}}}),false);
 assert.equal(N.nexusFrame(null),0);
 assert.equal(N.nexusFrame({stage:5,turn:100}),23);
}
assert.equal(seen.size,168);assert.equal(hacks,168);
assert.ok(moves>200);
assert.ok(xp>3600);
assert.equal(N.validNexus({version:1,active:{"../escape":{}},completed:{}}),false);
assert.equal(N.validNexus({version:1,active:{},completed:{"../escape":{}}}),false);
assert.equal(N.saveNexus("",N.EMPTY_NEXUS),false);
console.log("OPERAÇÃO NEXO PASS",JSON.stringify({missions:28,relays:hacks,moves,recharged,jammed,retreats,xp}));
