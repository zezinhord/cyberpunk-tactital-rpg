import assert from "node:assert/strict";
import {registerHooks} from "node:module";
import {readFileSync} from "node:fs";
registerHooks({resolve(path,ctx,next){
 if((path.startsWith("./")||path.startsWith("../"))&&!/\.[cm]?[jt]s$/.test(path))
  return next(path+".ts",ctx);
 return next(path,ctx);
}});
const {EXPANSION_ROOM_DESIGNS}=await import("../src/game/districts/expansion-interiors.ts");
const {COUNCIL_IDS}=await import("../src/game/story/district-councils.ts");
const {RECOVERY_TASKS,resolveRecovery,repairRecoveryEquipment}
 =await import("../src/game/story/recovery-network.ts");
const {EMPTY_SIMULATIONS,SIMULATION_KEY,SIMULATION_PHASES,SIMULATION_FRAMES_PER_ROOM,
 SIMULATION_FRAMES_PER_PHASE,SIMULATION_REWARD_XP,problemsForRoom,
 validateSimulations,readSimulations,saveSimulations,simulationUnlocked,
 simulationPhase,answerSimulation}
 =await import("../src/game/story/field-simulations.ts");
const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)??null,
 setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)};
assert.equal(EXPANSION_ROOM_DESIGNS.length,28);
assert.equal(COUNCIL_IDS.length,7);
assert.equal(SIMULATION_FRAMES_PER_PHASE,4);
assert.equal(SIMULATION_FRAMES_PER_ROOM,24);
assert.equal(SIMULATION_PHASES,6);
assert.equal(SIMULATION_REWARD_XP,96);
assert.equal(validateSimulations(EMPTY_SIMULATIONS),true);
const problemIds=new Set();
let correctDecisions=0,wrongDecisions=0,totalXp=0;
for(const room of EXPANSION_ROOM_DESIGNS){
 const id=room.id;
 const region=COUNCIL_IDS.find(d=>id.startsWith(d+"-"));
 assert.ok(region);
 const council={version:1,choices:{[region]:"solidarity"},defended:[region]};
 let recovery={version:1,repairs:{},outcomes:{}};
 for(const task of RECOVERY_TASKS[region]){
  const r=repairRecoveryEquipment(recovery,council,task.room,"sistema");
  assert.ok(r.ok);recovery=r.state;
 }
 const done=resolveRecovery(recovery,council,region,"collective");
 assert.ok(done.ok);recovery=done.state;
 assert.ok(simulationUnlocked(recovery,id));
 assert.equal(simulationUnlocked({version:1,repairs:{},outcomes:{}},id),false);
 let state={version:1,solved:{}};
 const scenario=problemsForRoom(id);
 assert.equal(scenario.length,6,id);
 for(let phase=0;phase<6;phase++){
  const p=scenario[phase];
  assert.ok(p.title.length>5&&p.prompt.length>45&&p.hint.length>18);
  assert.ok(p.resolution.length>22);
  assert.equal(p.options.length,3);
  assert.equal(new Set(p.options).size,3);
  problemIds.add(region+":"+phase+":"+p.title);
  const wrong=(p.correct+1)%3;
  let result=answerSimulation(state,recovery,id,phase,wrong);
  assert.equal(result.ok,false);
  assert.equal(result.state,state);
  assert.equal(result.xp,0);
  wrongDecisions++;
  assert.equal(answerSimulation(state,recovery,id,phase+1,p.correct).ok,false,
    "Future stage must be locked");
  result=answerSimulation(state,recovery,id,phase,p.correct);
  assert.equal(result.ok,true);
  assert.ok(validateSimulations(result.state));
  assert.equal(simulationPhase(result.state,id),phase+1);
  assert.equal(result.xp,phase===5?96:0);
  state=result.state;correctDecisions++;totalXp+=result.xp;
 }
 assert.equal(simulationPhase(state,id),6);
 assert.equal(answerSimulation(state,recovery,id,5,scenario[5].correct).ok,false);
 assert.equal(saveSimulations("hero-"+id,state),true);
 assert.deepEqual(readSimulations("hero-"+id),state);
 assert.equal(storage.has(SIMULATION_KEY+"hero-"+id),true);
}
assert.equal(problemIds.size,42,"Six original cases per seven real districts");
assert.equal(correctDecisions,168);
assert.equal(wrongDecisions,168);
assert.equal(totalXp,28*96);
for(const invalid of [
 {version:0,solved:{}},
 {version:1,solved:{hacked:6}},
 {version:1,solved:{"baixada-observatorio":7}},
 {version:1,solved:{"baixada-observatorio":-1}},
 {version:1,solved:{"baixada-observatorio":2.5}},
 {version:1,solved:{},eval:"evil"},
])assert.equal(validateSimulations(invalid),false);
storage.set(SIMULATION_KEY+"bad","{not JSON");
assert.deepEqual(readSimulations("bad"),EMPTY_SIMULATIONS);
const gallery=readFileSync("src/components/DossierGallery.tsx","utf8");
assert.ok(gallery.includes('mode==="spritesheet"'));
assert.ok(gallery.includes("answerSimulation(simulations,recovery,simulationRoom,solved,option)"));
assert.ok(gallery.includes('onQuestXp("field-simulation-"+simulationRoom'));
const backup=readFileSync("src/game/character/backup.ts","utf8");
assert.ok(backup.includes("simulations:SIMULATION_KEY"));
assert.ok(backup.includes("validateSimulations(decoded)"));
const app=readFileSync("src/App.tsx","utf8");
assert.ok(app.includes('grantTrialXp("field-simulation-"+room'));
console.log("A Cidade Responde: 28 playable sites, 168 locked stages, 42 district-specific authored tactics, 84 choices patterns; no duplicated reward and secure backups.");
