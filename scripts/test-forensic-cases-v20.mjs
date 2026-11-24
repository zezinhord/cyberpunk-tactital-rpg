import assert from "node:assert/strict";
import {FORENSIC_CASES} from "../src/game/story/forensic-cases.ts";
import {CONTRACT_IDS,INNER_CONTRACTS,EMPTY_CONTRACTS,validateContracts,
 readContracts,saveContracts,startContract,completeContract,solveForensicCase}
 from "../src/game/story/inner-contracts.ts";
import {INNER_BLUEPRINTS} from "../src/game/districts/interiors.ts";
import {innerReceipt} from "../src/game/story/indoor-rewards.ts";
import {createStartingInventory,grantRewardInventoryItem}
 from "../src/game/inventory.ts";

const db=new Map();
globalThis.localStorage={
 getItem:k=>db.get(k)??null,
 setItem:(k,v)=>db.set(k,String(v)),
 removeItem:k=>db.delete(k),
};
assert.equal(Object.keys(FORENSIC_CASES).length,28);
assert.deepEqual(Object.keys(FORENSIC_CASES).sort(),[...CONTRACT_IDS].sort());
assert.equal(new Set(Object.values(FORENSIC_CASES).map(x=>x.question)).size,28);
assert.equal(validateContracts({version:1,accepted:[],completed:[]}),true,
 "RC4 saves without analysed must remain compatible");
let state=EMPTY_CONTRACTS;
let inventory=createStartingInventory("forensic-hero");
let total=0;
for(const id of CONTRACT_IDS){
 const c=FORENSIC_CASES[id];
 assert.equal(c.options.length,3);
 assert.equal(new Set(c.options).size,3);
 assert.ok(c.question.length>60);
 assert.ok(c.explanation.length>70);
 assert.ok(c.options.every(x=>x.length>18));
 assert.ok(c.correctIndex>=0&&c.correctIndex<3);
 assert.equal(solveForensicCase(state,id,c.correctIndex).ok,false,
  "Cannot award forensic XP before collecting evidence");
 state=startContract(state,id).state;
 for(const prop of INNER_BLUEPRINTS[id].props)
  inventory=grantRewardInventoryItem(inventory,prop.item,1,innerReceipt(id,prop));
 const delivered=completeContract(state,id,inventory);
 assert.equal(delivered.ok,true);
 state=delivered.state;
 const incorrect=(c.correctIndex+1)%3;
 const rejected=solveForensicCase(state,id,incorrect);
 assert.equal(rejected.ok,false);
 assert.deepEqual(rejected.state,state,"Bad answer cannot mutate saves");
 assert.equal(rejected.xp,0);
 assert.equal(solveForensicCase(state,id,-1).ok,false);
 assert.equal(solveForensicCase(state,id,NaN).ok,false);
 const accepted=solveForensicCase(state,id,c.correctIndex);
 assert.equal(accepted.ok,true);
 assert.equal(accepted.xp,c.rewardXp);
 state=accepted.state;
 total+=accepted.xp;
 assert.equal(solveForensicCase(state,id,c.correctIndex).ok,false,
  "No duplicate XP when reopening forensic dialogue");
 assert.equal(saveContracts("forensic-hero",state),true);
 assert.deepEqual(readContracts("forensic-hero"),state);
 assert.equal(validateContracts(state),true);
}
assert.equal(state.analysed?.length,28);
assert.equal(state.completed.length,28);
assert.ok(total>=28*24);
assert.equal(validateContracts({...state,analysed:[...state.analysed,"../../bad"]}),false);
assert.equal(validateContracts({...state,analysed:[...state.analysed,state.analysed[0]]}),false);
assert.equal(validateContracts({...EMPTY_CONTRACTS,analysed:["baixada-observatorio"]}),false);
assert.equal(validateContracts({...state,analysed:[...state.analysed],unexpected:4}),false);
const old={version:1,accepted:["baixada-observatorio"],completed:["baixada-observatorio"]};
assert.equal(saveContracts("legacy",old),true);
assert.deepEqual(readContracts("legacy"),old);
console.log("28 unique playable forensic verdicts, zero repeat rewards, legacy save and hostile backup checks passed.");
