import assert from "node:assert/strict";
import {registerHooks} from "node:module";
registerHooks({resolve(path,ctx,next){
 if((path.startsWith("./")||path.startsWith("../"))&&!/\.[cm]?[jt]s$/.test(path))
  return next(path+".ts",ctx);
 return next(path,ctx);
}});
const {EXPANSION_ROOM_DESIGNS}=await import("../src/game/districts/expansion-interiors.ts");
const {EMPTY_VIGIL,mapForVigil,vigilGuards,startVigil,moveVigil,rescueVigil,
 divertVigil,vigilRun,validVigil,planVigilRoute,planVigilMission}=await import("../src/game/story/vigil-escorts.ts");
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
let exposed=0,concealed=0,retreats=0;
for(const room of EXPANSION_ROOM_DESIGNS){
 const id=room.id,map=mapForVigil(id),group=map.groups[0];
 const perimeter={version:1,active:{},completed:{[id]:true}};
 const initial=startVigil(EMPTY_VIGIL,perimeter,id).state;
 const origin=vigilRun(initial,id);
 const mission=planVigilMission(id,origin,"normal");
 assert.ok(mission,"Every interior must support full civilian evacuation");
 assert.equal(mission.objectives.length,5);
 assert.deepEqual(mission.objectives.at(-1),map.exit);
 assert.equal(new Set(mission.objectives.slice(0,-1).map(p=>p.x+","+p.y)).size,4);
 for(const group of map.groups)assert.ok(mission.objectives.some(p=>
   p.x===group.x&&p.y===group.y));
 const halfway={...origin,rescued:3};
 const partial=planVigilMission(id,halfway,"furtivo");
 assert.ok(partial);
 assert.equal(partial.objectives.length,3);
 const complete=planVigilMission(id,{...origin,rescued:15},"normal");
 assert.ok(complete);
 assert.equal(complete.objectives.length,1);

 for(const approach of ["normal","furtivo","corrida"]){
  const plan=planVigilRoute(id,origin,map.exit,approach);
  assert.ok(plan,"All authored missions must have an escape route");
  let cursor={x:origin.x,y:origin.y};
  for(const next of plan.steps){
   const delta=distance(cursor,next);
   assert.ok(delta===1||(approach==="corrida"&&delta===2&&
     (cursor.x===next.x||cursor.y===next.y)));
   assert.ok(!map.blocked.has(next.x+","+next.y));
   if(delta===2)assert.ok(!map.blocked.has(
     ((cursor.x+next.x)/2)+","+((cursor.y+next.y)/2)));
   cursor=next;
  }
  assert.deepEqual(cursor,map.exit);
  assert.equal(plan.turns,plan.steps.length);
 }
 assert.equal(planVigilRoute(id,origin,{x:-1,y:99}),null);

 for(let turn=0;turn<8;turn++){
  const guards=vigilGuards(id,turn+1);
  const spotted=guards.some(g=>distance(g,group)<=1);
  const run={...vigilRun(initial,id),x:group.x,y:group.y,turn,energy:4,
   alert:spotted?6:1,decoyUntil:0};
  const state={...initial,active:{[id]:run}};
  assert.equal(validVigil(state),true);
  const result=rescueVigil(state,id);
  assert.equal(result.ok,true);
  const after=vigilRun(result.state,id);
  assert.equal(after.rescued&1,1,"Civilian must stay protected");
  assert.equal(after.turn,turn+1,"Extraction must cost one turn");
  if(spotted){
   exposed++;
   assert.equal(after.retreats,1,"Critical detection must force retreat");
   assert.equal(after.incidents,1);
   retreats++;
  }else{
   concealed++;
   assert.equal(after.retreats,0);
   assert.equal(after.alert,0);
  }
  assert.equal(validVigil(result.state),true);
  assert.equal(rescueVigil(result.state,id).ok,false,
   "No repeat rescue reward from the same group");
  if(spotted){
   const hidden={...run,energy:6,decoyUntil:turn+3};
   const protectedResult=rescueVigil({...initial,active:{[id]:hidden}},id);
   assert.equal(protectedResult.ok,true);
   assert.equal(vigilRun(protectedResult.state,id).retreats,0,
    "Decoy must suppress sentry detection");
  }
 }
}
// Two-tile sprint cannot phase through sentries or hazards at its midpoint.
let midpointChecks=0;
for(const room of EXPANSION_ROOM_DESIGNS){
 const id=room.id,map=mapForVigil(id);
 const start=startVigil(EMPTY_VIGIL,
  {version:1,active:{},completed:{[id]:true}},id).state;
 for(let turn=0;turn<6;turn++){
  const guards=vigilGuards(id,turn+1);
  for(const p of map.corridor){
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const mid={x:p.x+dx,y:p.y+dy};
    const end={x:p.x+dx*2,y:p.y+dy*2};
    if(end.x<0||end.x>=8||end.y<0||end.y>=8||
      map.blocked.has(mid.x+","+mid.y)||
      map.blocked.has(end.x+","+end.y))continue;
    const midpointDanger=guards.some(g=>distance(g,mid)<=2)||
      map.hotspots.has(mid.x+","+mid.y);
    if(!midpointDanger)continue;
    const run={...vigilRun(start,id),x:p.x,y:p.y,turn,
      energy:8,alert:0};
    const result=moveVigil({...start,active:{[id]:run}},
      id,end.x,end.y,"corrida");
    assert.equal(result.ok,true);
    const pressure=point=>guards.reduce((max,g)=>Math.max(max,
      distance(g,point)===0?3:distance(g,point)===1?2:
      distance(g,point)===2?1:0),0);
    const hazard=Number(map.hotspots.has(mid.x+","+mid.y)||
      map.hotspots.has(end.x+","+end.y));
    const expected=Math.min(7,2+hazard+Math.max(pressure(mid),pressure(end)));
    assert.equal(vigilRun(result.state,id).alert,expected,
      "Sprint must count midpoint patrol/hazard exposure");
    midpointChecks++;
   }
  }
 }
}
assert.ok(midpointChecks>0,"Midpoint sprint cases must exist");
assert.ok(exposed>0,"At least one extraction must be observed");
assert.ok(concealed>0,"At least one extraction must remain unseen");
console.log("VIGIL EXTRACTION QA PASS",JSON.stringify({exposed,concealed,retreats}));
