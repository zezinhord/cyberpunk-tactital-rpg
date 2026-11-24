import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,ctx,next){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&
    !/\.[cm]?[jt]s$/.test(specifier))return next(specifier+".ts",ctx);
 return next(specifier,ctx);
}});
const {decideEnemy,initialEnemyMemory,hearEnemy,enemyTemperament}=
 await import("../src/game/ai/tactical-brain.ts");
const {enemyProfile}=await import("../src/game/tactics.ts");
const unit=(id,x,y,hp=20,maxHp=20)=>({id,x,y,hp,maxHp,side:id==="runner"?"player":"enemy",
 name:id,armorClass:13,attackBonus:4});
const occludedEnemy=unit("drone",5,2),occludedPlayer=unit("runner",1,2);
const profile=enemyProfile("district-aurea",1);
let memory=initialEnemyMemory();
let decision=decideEnemy(occludedEnemy,occludedPlayer,[occludedEnemy,occludedPlayer],
 profile,memory,1);
assert.equal(decision.perception.saw,false,"Opaque wall blocks psychic vision");
assert.equal(decision.memory.lastKnown,null,"Unperceived hidden location must be unknown");
assert.notEqual(decision.selected,"attack","No attacking a hidden target");
memory=hearEnemy(memory,{x:2,y:2},1,8);
decision=decideEnemy(occludedEnemy,occludedPlayer,[occludedEnemy,occludedPlayer],
 profile,memory,1);
assert.equal(decision.perception.heard,true);
assert.equal(decision.memory.awareness,"investigate");
assert.deepEqual(decision.memory.lastKnown,{x:2,y:2},
 "Investigate the noise, not the unseen player's exact position");
// Two equally unseen positions must not change search behavior through
// collision occupancy or distance calculations in the path planner.
const alternateHidden=unit("runner",1,3);
const dA=decideEnemy(occludedEnemy,occludedPlayer,
 [occludedEnemy,occludedPlayer],profile,memory,1);
const dB=decideEnemy(occludedEnemy,alternateHidden,
 [occludedEnemy,alternateHidden],profile,memory,1);
assert.deepEqual(dA.plan,dB.plan,
 "Unseen real coordinates must not leak through pathfinding occupation");
const seenEnemy=unit("drone",5,0),seenPlayer=unit("runner",4,0);
const spotted=decideEnemy(seenEnemy,seenPlayer,[seenEnemy,seenPlayer],profile,
 initialEnemyMemory(),2);
assert.equal(spotted.perception.saw,true);
assert.equal(spotted.memory.awareness,"engaged");
const lost=decideEnemy(occludedEnemy,occludedPlayer,[occludedEnemy,occludedPlayer],
 profile,spotted.memory,3);
assert.equal(lost.perception.saw,false);
assert.equal(lost.memory.awareness,"search");
assert.deepEqual(lost.memory.lastKnown,{x:4,y:0});
const expired=decideEnemy(occludedEnemy,occludedPlayer,[occludedEnemy,occludedPlayer],
 profile,lost.memory,8);
assert.equal(expired.perception.lastKnown,null);
assert.equal(expired.memory.awareness,"patrol");
const criticalEnemy=unit("drone",4,0,3,20);
const criticalPlayer=unit("runner",3,0);
const defensive=enemyProfile("district-aurea",1);
const retreat=decideEnemy(criticalEnemy,criticalPlayer,
 [criticalEnemy,criticalPlayer],defensive,initialEnemyMemory(),2);
assert.equal(retreat.perception.saw,true);
assert.ok(["retreat","cover","flank","attack"].includes(retreat.selected),
 "Wounded fighter takes a legal deterministic choice");
assert.equal(enemyTemperament("helix"),"disciplined");
assert.equal(enemyTemperament("saboteur"),"stealthy");
const before=decision;
const repeat=decideEnemy(occludedEnemy,occludedPlayer,[occludedEnemy,occludedPlayer],
 profile,memory,1);
assert.deepEqual(before,repeat,"Identical perceptions must yield identical actions");
// 200 bounded decisions, no timers, external network or unbounded search.
for(let i=0;i<200;i++){
 const en=unit("drone",4+i%2,0),pl=unit("runner",1,6);
 const d=decideEnemy(en,pl,[en,pl],profile,initialEnemyMemory(),i+1);
 assert.ok(["advance","attack","reposition","blocked"].includes(d.plan.action));
 assert.ok(d.plan.target.x>=0&&d.plan.target.x<8&&d.plan.target.y>=0&&d.plan.target.y<8);
}
const manager=readFileSync("src/game/TurnManager.ts","utf8");
for(const code of ["decideEnemy(enemy,player,this.state.units",
 "this.aiMemory=decision.memory",
 "this.state.enemyAwareness=decision.memory.awareness",
 "this.aiMemory=hearEnemy(this.aiMemory,player",
 "visibleNow&&withinShot(enemy,player",
 "this.aiMemory=initialEnemyMemory();"])
 assert.ok(manager.includes(code),"Combat AI integration missing: "+code);
console.log("Tactical AI: occlusion, noise, search, memory expiry, retreat decision, bounded paths, 200 deterministic scenarios passed.");
