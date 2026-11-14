import assert from "node:assert/strict";
import {TRIAL_STEPS,ESTIMATED_MINUTES,FRESH_TRIAL,startTrial,advanceTrial,
 advanceTrialBattle,trialCombatForActor,reconcileTrial,readTrial,saveTrial} from "../src/game/story/field-test.ts";
import {ACTOR_TILES,ROAMING_NPCS} from "../src/game/baixada/layout.ts";
// Um objetivo sem ator/terminal registrado bloqueia a campanha inteira.
const campaignActors=new Set([
 ...Object.keys(ACTOR_TILES),...ROAMING_NPCS.map(actor=>actor.id),
 "dra-amara","terminal-clinica","teo",
]);
for(const step of TRIAL_STEPS){
 assert.ok(campaignActors.has(step.actor),"Ator de missão ausente do mundo: "+step.id+" -> "+step.actor);
 if(step.kind==="combat")assert.ok(step.encounter,"Combate sem encontro: "+step.id);
}
let storage=new Map();
globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
assert.equal(TRIAL_STEPS.length,19);
assert.ok(ESTIMATED_MINUTES>=30,"Campanha não chega a 30 minutos planejados.");
assert.equal(TRIAL_STEPS.filter(x=>x.kind==="combat").length,3);
const a=startTrial(FRESH_TRIAL);
assert.equal(startTrial(a),a,"Não reiniciar missão sem permissão.");
let state=a,points=0;
for(const step of TRIAL_STEPS){
 assert.equal(state.step,TRIAL_STEPS.indexOf(step));
 assert.equal(advanceTrial(state,"not-an-actor").advanced,false);
 if(step.kind==="combat"){
  assert.equal(trialCombatForActor(state,step.actor),step.encounter);
  assert.equal(advanceTrial(state,step.actor).advanced,false,"Vencer combate obrigatório");
  const won=advanceTrialBattle(state,step.encounter);
  assert.equal(won.advanced,true);
  state=won.progress;
 }else{
  assert.equal(trialCombatForActor(state,step.actor),null);
  const ok=advanceTrial(state,step.actor);
  assert.equal(ok.advanced,true);
  state=ok.progress;
 }
 points+=step.xp;
 assert.equal(saveTrial("test",state),true);
 assert.deepEqual(readTrial("test"),state);
}
assert.equal(state.completed,true);
assert.equal(state.step,19);
assert.equal(advanceTrial(state,"dra-amara").advanced,false,"Não repetir XP");
assert.equal(reconcileTrial(a,TRIAL_STEPS.slice(0,5).map(step=>"trial-"+step.id)).step,5);
assert.ok(points>=300);
console.log("Campanha: 19 objetivos, 3 encontros, "+ESTIMATED_MINUTES+" minutos estimados, XP, checkpoints e persistência aprovados.");
