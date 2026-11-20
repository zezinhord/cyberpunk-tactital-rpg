import assert from "node:assert/strict";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,context,nextResolve){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&!/\.[cm]?[jt]s$/.test(specifier))
  return nextResolve(specifier+".ts",context);
 return nextResolve(specifier,context);
}});
const {INITIAL_STEALTH,STEALTH_ENCOUNTERS,STEALTH_KEY,planStealth,
 readStealth,saveStealth,validStealth,stealthCombatEntry}=await import("../src/game/stealth.ts");
const {INITIAL_CISMA}=await import("../src/game/story/cisma-v20.ts");
const {EMPTY_PARTY}=await import("../src/game/companions.ts");
const {TurnManager}=await import("../src/game/TurnManager.ts");
const db=new Map();globalThis.localStorage={
 getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k),
};
const ctx={classId:"marginal",level:6,cyberware:["retina-espectral","nervo-silencioso"],
 party:{version:1,recruited:["mara"],active:["mara"]},cisma:{...INITIAL_CISMA,exposure:1}};
assert.equal(STEALTH_ENCOUNTERS.length,3);
assert.equal(validStealth(INITIAL_STEALTH),true);
let stealth=INITIAL_STEALTH;
for(const encounter of STEALTH_ENCOUNTERS){
 const result=planStealth(stealth,encounter,"stealth",ctx);
 assert.equal(result.ok,true);
 assert.equal(result.record.outcome,"undetected");
 assert.ok(result.record.score>=result.record.threshold);
 stealth=result.state;
 assert.equal(validStealth(stealth),true);
 const repeat=planStealth(stealth,encounter,"assault",ctx);
 assert.deepEqual(repeat.state,stealth,"No rerolls or replacement after choosing");
}
assert.equal(saveStealth("ghost",stealth),true);
assert.deepEqual(readStealth("ghost"),stealth);
assert.equal(stealthCombatEntry(stealth,"eden-core"),null);
for(const encounter of STEALTH_ENCOUNTERS){
 const base=new TurnManager({encounterId:encounter});
 const silent=new TurnManager({encounterId:encounter,infiltration:stealthCombatEntry(stealth,encounter)});
 assert.equal(silent.getState().units[1].hp,base.getState().units[1].hp-5);
 assert.equal(silent.getState().enemyJamTurns,1);
 assert.equal(base.getState().enemyJamTurns,0);
}
const weak={classId:"solo",level:1,cyberware:[],party:EMPTY_PARTY,
 cisma:{...INITIAL_CISMA,exposure:5}};
const spotted=planStealth(INITIAL_STEALTH,"cisma-core","stealth",weak);
assert.equal(spotted.record.outcome,"spotted");
const spottedFight=new TurnManager({encounterId:"cisma-core",infiltration:spotted.record});
assert.equal(spottedFight.getState().units[1].attackBonus,5);
const frontal=planStealth(INITIAL_STEALTH,"cisma-core","assault",ctx);
assert.equal(frontal.record.outcome,"assault");
const frontFight=new TurnManager({encounterId:"cisma-core",infiltration:frontal.record});
assert.equal(frontFight.getState().units[1].attackBonus,4);
assert.equal(frontFight.getState().units[1].hp,25);
assert.equal(validStealth({...INITIAL_STEALTH,extra:"hack"}),false);
assert.equal(validStealth({version:1,records:{"../../a":spotted.record}}),false);
assert.equal(validStealth({version:1,records:{"cisma-core":{...spotted.record,score:999}}}),false);
assert.equal(validStealth({version:1,records:{"cisma-core":{...spotted.record,outcome:"undetected"}}}),false);
db.set(STEALTH_KEY+"bad","invalid");
assert.deepEqual(readStealth("bad"),INITIAL_STEALTH);
const storage=globalThis.localStorage;globalThis.localStorage=undefined;
assert.equal(saveStealth("ghost",stealth),false);
globalThis.localStorage=storage;
console.log("Stealth 2.0: 3 approaches, class/level/implant/ally scoring, failed/success consequences and no reroll approved.");
