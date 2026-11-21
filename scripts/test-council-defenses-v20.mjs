import assert from "node:assert/strict";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,context,nextResolve){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&
  !/\.[cm]?[jt]s$/.test(specifier))
   return nextResolve(specifier+".ts",context);
 return nextResolve(specifier,context);
}});
const {TurnManager}=await import("../src/game/TurnManager.ts");
const {enemyProfile}=await import("../src/game/tactics.ts");
const {COUNCIL_IDS,COUNCIL_DEFENSES,EMPTY_COUNCILS,
 councilDefenseAvailable,finishCouncilDefense,
 saveCouncils,readCouncils,validateCouncilProgress}=await
 import("../src/game/story/district-councils.ts");
const files=new Map();
globalThis.localStorage={
 getItem:key=>files.get(key)??null,
 setItem:(key,value)=>files.set(key,String(value)),
 removeItem:key=>files.delete(key),
};
assert.equal(COUNCIL_IDS.length,7);
assert.equal(councilDefenseAvailable(EMPTY_COUNCILS,"baixada"),false);
for(const id of COUNCIL_IDS){
 const battle=COUNCIL_DEFENSES[id];
 const version="council-"+id;
 const options={playerName:"Test Operative",originId:"baixada",
  characterLevel:4,classId:"solo",encounterId:version,
  progressionBonuses:{hp:12,attack:2,armor:1,movement:1,energy:1}};
 const manager=new TurnManager(options);
 assert.equal(manager.getState().wave,1);
 assert.equal(manager.getState().totalWaves,battle.waves);
 assert.equal(manager.getState().units[1].name,enemyProfile(version,1).name);
 const baseline={version:1,choices:{[id]:"solidarity"}};
 assert.equal(validateCouncilProgress(baseline),true);
 assert.equal(councilDefenseAvailable(baseline,id),true);
 assert.equal(finishCouncilDefense(EMPTY_COUNCILS,id).ok,false);
 for(let wave=1;wave<=battle.waves;wave++){
  manager.state.units[0].x=5;
  manager.state.units[0].y=1;
  manager.state.units[0].attackBonus=150;
  manager.state.units[1].x=6;
  manager.state.units[1].y=1;
  manager.state.units[1].hp=1;
  manager.state.mainActionAvailable=true;
  manager.state.activeSide="player";
  manager.state.combatComplete=false;
  manager.attack();
  const state=manager.getState();
  assert.equal(state.defeatedEnemyCount,wave,version);
  if(wave<battle.waves){
   assert.equal(state.wave,wave+1,version+" wave progression");
   assert.equal(state.combatComplete,false,version+" premature victory");
   assert.equal(state.units[1].name,
    enemyProfile(version,wave+1).name+" · "+(wave+1));
   assert.ok(state.units[1].hp>0);
  }else{
   assert.equal(state.combatComplete,true,version+" final victory");
   assert.equal(state.units[1].hp,0);
  }
 }
 const won=finishCouncilDefense(baseline,id);
 assert.equal(won.ok,true);
 assert.equal(won.xp,battle.xp);
 assert.equal(won.state.defended.includes(id),true);
 assert.equal(councilDefenseAvailable(won.state,id),false);
 assert.equal(saveCouncils("hero-"+id,won.state),true);
 assert.deepEqual(readCouncils("hero-"+id),won.state);
 const again=finishCouncilDefense(readCouncils("hero-"+id),id);
 assert.equal(again.ok,false);
 assert.equal(again.xp,0);
 assert.deepEqual(again.state,won.state);
 assert.equal(validateCouncilProgress({
  ...won.state,defended:[id,id]}),false,"Duplicate battle receipts forbidden");
 assert.equal(validateCouncilProgress({
  ...won.state,choices:{},defended:[id]}),false,
  "Cannot forge completed defense without vote");
}
console.log("Seven playable post-council defenses: 16 enemy waves, 21 alternate resolutions, unique rewards and legacy save compatibility.");
