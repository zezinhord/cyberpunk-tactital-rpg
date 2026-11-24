import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {INITIAL_FAVORS} from "../src/game/story/favors.ts";
import {INITIAL_MARKET} from "../src/game/story/market.ts";
import {calculateReputation,readReputation} from "../src/game/story/reputation.ts";
import {COUNCIL_IDS,COUNCIL_METHODS,COUNCIL_FACTION_EFFECTS,
 councilFactionEffects,EMPTY_COUNCILS,saveCouncils,readCouncils,
 validateCouncilProgress} from "../src/game/story/district-councils.ts";
const store=new Map();
globalThis.localStorage={getItem:k=>store.get(k)??null,
 setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const make=choices=>({version:1,choices});
const source=councils=>({favors:INITIAL_FAVORS,market:INITIAL_MARKET,councils});
const identity=calculateReputation(source(EMPTY_COUNCILS));
assert.deepEqual(identity.factions,{helix:0,movimento_livre:0,
 mercado_cinzento:0,consorcio_civico:0});
assert.equal(COUNCIL_IDS.length,7);
assert.equal(COUNCIL_METHODS.length,3);
for(const region of COUNCIL_IDS){
 const methods=new Set();
 for(const method of COUNCIL_METHODS){
  const decision=make({[region]:method});
  assert.equal(validateCouncilProgress(decision),true);
  assert.deepEqual(councilFactionEffects(decision),
                   [COUNCIL_FACTION_EFFECTS[region][method]]);
  const result=calculateReputation(source(decision));
  assert.notDeepEqual(result.factions,identity.factions);
  assert.ok(Object.values(result.factions).every(x=>x>=-5&&x<=5));
  methods.add(JSON.stringify(result.factions));
  assert.equal(saveCouncils("hero-"+region+"-"+method,decision),true);
  assert.deepEqual(readCouncils("hero-"+region+"-"+method),decision);
  assert.deepEqual(readReputation("hero-"+region+"-"+method).factions,result.factions);
 }
 assert.equal(methods.size,3,"All three options must cause distinct consequences in "+region);
}
for(const method of COUNCIL_METHODS){
 const state=make(Object.fromEntries(COUNCIL_IDS.map(region=>[region,method])));
 const once=calculateReputation(source(state));
 const twice=calculateReputation(source(state));
 assert.deepEqual(once,twice,"No duplicated relation changes on reload");
 const deltas=councilFactionEffects(state);
 assert.equal(deltas.length,7);
}
const tampered=make({baixada:"nonsense"});
assert.equal(validateCouncilProgress(tampered),false);
const ui=readFileSync(new URL("../src/screens/ExplorationScreen.tsx",import.meta.url),"utf8");
assert.ok(ui.includes("chapters:cityChapters,urban,councils"));
assert.ok(ui.includes("DEPOIS DA AUDIÊNCIA"));
console.log("Seven councils: 21 distinct faction relationship outcomes, durable saves, UI and load reconciliation.");
