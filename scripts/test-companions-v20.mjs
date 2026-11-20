import assert from "node:assert/strict";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,context,nextResolve){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&!/\.[cm]?[jt]s$/.test(specifier))
  return nextResolve(specifier+".ts",context);
 return nextResolve(specifier,context);
}});
const {COMPANION_IDS,COMPANION_CATALOG,PARTY_KEY,EMPTY_PARTY,
 validateParty,recruitCompanion,toggleCompanion,activeCompanions,readParty,saveParty}
  =await import("../src/game/companions.ts");
const {TurnManager}=await import("../src/game/TurnManager.ts");
const db=new Map();
globalThis.localStorage={getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
assert.equal(COMPANION_IDS.length,4);
assert.equal(new Set(COMPANION_IDS.map(id=>COMPANION_CATALOG[id].aid)).size,4);
assert.equal(validateParty(EMPTY_PARTY),true);
assert.equal(validateParty({...EMPTY_PARTY,active:["nilo"]}),false);
assert.equal(validateParty({...EMPTY_PARTY,recruited:["nilo","nilo"]}),false);
assert.equal(validateParty({...EMPTY_PARTY,evil:1}),false);
assert.equal(recruitCompanion(EMPTY_PARTY,"nilo",false).ok,false);
let party=EMPTY_PARTY;
for(const id of COMPANION_IDS){
 const result=recruitCompanion(party,id,true);
 assert.equal(result.ok,true,id);
 party=result.state;
 assert.equal(recruitCompanion(party,id,true).ok,false);
}
assert.equal(party.recruited.length,4);
assert.equal(party.active.length,2);
assert.deepEqual(party.active,["nilo","mara"]);
assert.equal(toggleCompanion(party,"joana").ok,false,"max 2 active");
let res=toggleCompanion(party,"mara");
assert.equal(res.ok,true);party=res.state;
res=toggleCompanion(party,"joana");
assert.equal(res.ok,true);party=res.state;
assert.deepEqual(party.active,["nilo","joana"]);
assert.equal(saveParty("hero",party),true);
assert.deepEqual(readParty("hero"),party);
assert.deepEqual(readParty("stranger").active,[]);
const withAll=(ids)=>activeCompanions({version:1,recruited:[...COMPANION_IDS],active:ids});
const base=new TurnManager({encounterId:"cisma-intercept"});
const all=new TurnManager({encounterId:"cisma-intercept",partySupport:withAll(["nilo","joana"])});
assert.equal(all.getState().maxEnergy,base.getState().maxEnergy+1);
assert.equal(all.getState().units[0].maxHp,base.getState().units[0].maxHp+2);
assert.deepEqual(all.getCompanionSupports().map(x=>x.id),["nilo","joana"]);
all.state.energy=2;
assert.equal(all.useCompanionSupport("nilo"),true);
assert.equal(all.getState().energy,6);
assert.equal(all.getState().bonusActionAvailable,false);
assert.deepEqual(all.getState().companionUsed,["nilo"]);
assert.equal(all.useCompanionSupport("nilo"),false,"each ally once per combat");
all.endPlayerTurn();
all.state.units[0].hp=10;
assert.equal(all.useCompanionSupport("joana"),true,"other ally on a later turn");
assert.equal(all.getState().units[0].hp,16);
assert.equal(all.useCompanionSupport("mara"),false,"cannot use inactive ally");
const mara=new TurnManager({encounterId:"cisma-core",partySupport:withAll(["mara"])});
assert.equal(mara.getState().units[0].armorClass,base.getState().units[0].armorClass+1);
assert.equal(mara.useCompanionSupport("mara"),true);
assert.equal(mara.getState().enemyJamTurns,1);
const teo=new TurnManager({encounterId:"cisma-core",partySupport:withAll(["teo"])});
assert.equal(teo.getState().units[0].attackBonus,base.getState().units[0].attackBonus+1);
assert.equal(teo.useCompanionSupport("teo"),true);
assert.equal(teo.nextAttackAccuracyBonus,3);
assert.equal(saveParty("",party),false);
db.set(PARTY_KEY+"bad","not-json");assert.deepEqual(readParty("bad"),EMPTY_PARTY);
console.log("Companions 2.0: 4 contacts, 2 active allies, encounter actions, saved roster and replay protection approved.");
