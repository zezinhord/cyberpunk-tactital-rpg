import assert from "node:assert/strict";
import {registerHooks} from "node:module";
import {readFileSync} from "node:fs";
registerHooks({resolve(specifier,ctx,next){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&
  !/\.[cm]?[jt]s$/.test(specifier))return next(specifier+".ts",ctx);
 return next(specifier,ctx);
}});
const {COUNCIL_IDS,EMPTY_COUNCILS}=await import("../src/game/story/district-councils.ts");
const {INNER_BLUEPRINTS}=await import("../src/game/districts/interiors.ts");
const {EMPTY_RECOVERY,RECOVERY_KEY,RECOVERY_METHODS,RECOVERY_LINES,RECOVERY_TASKS,
 validateRecovery,readRecovery,saveRecovery,recoveryObjective,repairRecoveryEquipment,
 resolveRecovery,recoveryFactionEffects,recoveryCombatSupport,mergeRecoverySupport}
 =await import("../src/game/story/recovery-network.ts");
const {calculateReputation}=await import("../src/game/story/reputation.ts");
const {INITIAL_FAVORS}=await import("../src/game/story/favors.ts");
const {INITIAL_MARKET}=await import("../src/game/story/market.ts");
const storage=new Map();
globalThis.localStorage={getItem:k=>storage.get(k)??null,
 setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
assert.equal(COUNCIL_IDS.length,7);
assert.equal(RECOVERY_METHODS.length,3);
assert.ok(validateRecovery(EMPTY_RECOVERY));
assert.deepEqual(readRecovery("unused"),EMPTY_RECOVERY);
let sumRepairs=0,sumDecisions=0;
const all={version:1,repairs:{},outcomes:{}};
for(const region of COUNCIL_IDS){
 const before={version:1,choices:{[region]:"solidarity"}};
 const approved={...before,defended:[region]};
 const description=recoveryObjective(EMPTY_RECOVERY,approved,region);
 assert.ok(description.includes("0/3"));
 assert.equal(repairRecoveryEquipment(all,EMPTY_COUNCILS,RECOVERY_TASKS[region][0].room,"sistema").ok,false);
 assert.equal(resolveRecovery(all,before,region,"collective").ok,false);
 const seen=new Set();
 let save={version:1,repairs:{},outcomes:{}};
 for(const task of RECOVERY_TASKS[region]){
  assert.equal(task.machine,"sistema");
  assert.ok(!seen.has(task.room),"duplicate story mission room");
  seen.add(task.room);
  assert.ok(INNER_BLUEPRINTS[task.room].props.some(p=>p.id===task.machine&&p.kind==="machine"));
  assert.equal(repairRecoveryEquipment(save,approved,task.room,"arquivo").ok,false);
  const result=repairRecoveryEquipment(save,approved,task.room,task.machine);
  assert.equal(result.ok,true);
  assert.ok(result.xp>0);
  save=result.state;
  sumRepairs++;
  assert.ok(validateRecovery(save));
  assert.equal(repairRecoveryEquipment(save,approved,task.room,task.machine).ok,false,
   "same physical equipment cannot give XP again");
 }
 assert.equal((save.repairs[region]??[]).length,3);
 assert.ok(recoveryObjective(save,approved,region).includes("TRÊS MÁQUINAS"));
 for(const method of RECOVERY_METHODS){
  const decided=resolveRecovery(save,approved,region,method);
  assert.equal(decided.ok,true);
  assert.equal(decided.xp,78);
  assert.equal(resolveRecovery(decided.state,approved,region,method).xp,0);
  assert.ok(recoveryObjective(decided.state,approved,region).includes("RECONSTRUÇÃO CONCLUÍDA"));
  assert.equal(saveRecovery("hero-"+region+"-"+method,decided.state),true);
  assert.deepEqual(readRecovery("hero-"+region+"-"+method),decided.state);
  assert.ok(recoveryCombatSupport(decided.state,"district-"+region));
  assert.ok(recoveryCombatSupport(decided.state,"council-"+region));
  assert.equal(recoveryCombatSupport(decided.state,"district-"+COUNCIL_IDS.find(x=>x!==region)),null);
  const rep=calculateReputation({favors:INITIAL_FAVORS,market:INITIAL_MARKET,recovery:decided.state});
  assert.ok(Object.values(rep.factions).every(v=>v>=-5&&v<=5));
  sumDecisions++;
 }
 const r=resolveRecovery(save,approved,region,"collective").state;
 all.repairs[region]=[...r.repairs[region]];
 all.outcomes[region]="collective";
}
assert.equal(sumRepairs,21);
assert.equal(sumDecisions,21);
assert.equal(recoveryFactionEffects(all).length,7);
assert.ok(recoveryCombatSupport(all,"v09")?.energy===1,"citywide bonus after three districts");
assert.ok(mergeRecoverySupport({label:"Old",attack:1},{label:"New",energy:2})
 ?.label.includes("Old · New"));
const first=COUNCIL_IDS[0],rooms=RECOVERY_TASKS[first].map(x=>x.room);
for(const invalid of [
 {...all,repairs:{...all.repairs,[first]:[rooms[0],rooms[0]]}},
 {...all,repairs:{...all.repairs,[first]:["../../bad"]}},
 {...all,repairs:{...all.repairs,[first]:[]}},
 {...all,outcomes:{...all.outcomes,[first]:"fake"}},
 {...all,hacked:"true"},
])assert.equal(validateRecovery(invalid),false,"Reject forged/invalid backup");
storage.set(RECOVERY_KEY+"corrupt","bad-json");
assert.deepEqual(readRecovery("corrupt"),EMPTY_RECOVERY);
const screen=readFileSync("src/screens/ExplorationScreen.tsx","utf8");
assert.ok(screen.includes("repairRecoveryEquipment(recovery,councils"));
assert.ok(screen.includes('id:"recovery:"+region+":"+method'));
assert.ok(screen.includes("recoveryObjective(recovery,councils,cityArea)"));
const app=readFileSync("src/App.tsx","utf8");
assert.ok(app.includes('grantTrialXp("recovery-repair-"+location'));
assert.ok(app.includes('grantTrialXp("recovery-final-"+region'));
assert.ok(app.includes('recoveryCombatSupport(readRecovery(character.id),battleMode)'));
const backup=readFileSync("src/game/character/backup.ts","utf8");
assert.ok(backup.includes("recovery:RECOVERY_KEY"));
assert.ok(backup.includes("validateRecovery(decoded)"));
console.log("OPERAÇÃO RETOMADA: 21 real machine repairs + 21 alternative outcomes, unique XP, backup, faction changes, tactical effects all validated.");
