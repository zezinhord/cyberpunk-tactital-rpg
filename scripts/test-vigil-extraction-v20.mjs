import assert from "node:assert/strict";
import {registerHooks} from "node:module";
registerHooks({resolve(path,ctx,next){
 if((path.startsWith("./")||path.startsWith("../"))&&!/\.[cm]?[jt]s$/.test(path))
  return next(path+".ts",ctx);
 return next(path,ctx);
}});
const {EXPANSION_ROOM_DESIGNS}=await import("../src/game/districts/expansion-interiors.ts");
const {EMPTY_VIGIL,mapForVigil,vigilGuards,startVigil,rescueVigil,
 divertVigil,vigilRun,validVigil,planVigilRoute}=await import("../src/game/story/vigil-escorts.ts");
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
let exposed=0,concealed=0,retreats=0;
for(const room of EXPANSION_ROOM_DESIGNS){
 const id=room.id,map=mapForVigil(id),group=map.groups[0];
 const perimeter={version:1,active:{},completed:{[id]:true}};
 const initial=startVigil(EMPTY_VIGIL,perimeter,id).state;
 const origin=vigilRun(initial,id);
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
assert.ok(exposed>0,"At least one extraction must be observed");
assert.ok(concealed>0,"At least one extraction must remain unseen");
console.log("VIGIL EXTRACTION QA PASS",JSON.stringify({exposed,concealed,retreats}));
