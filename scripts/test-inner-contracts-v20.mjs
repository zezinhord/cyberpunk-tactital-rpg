import assert from "node:assert/strict";
import {CONTRACT_IDS,INNER_CONTRACTS,CONTRACTS_KEY,EMPTY_CONTRACTS,
 isContractId,validateContracts,readContracts,saveContracts,startContract,
 contractObjective,contractEvidenceCount,completeContract}
 from "../src/game/story/inner-contracts.ts";
import {INNER_BLUEPRINTS} from "../src/game/districts/interiors.ts";
import {innerReceipt} from "../src/game/story/indoor-rewards.ts";
import {createStartingInventory,grantRewardInventoryItem}
 from "../src/game/inventory.ts";
const db=new Map();
globalThis.localStorage={getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
assert.equal(CONTRACT_IDS.length,28);
assert.equal(new Set(CONTRACT_IDS).size,28);
assert.equal(new Set(CONTRACT_IDS.map(id=>INNER_CONTRACTS[id].title)).size,28);
assert.equal(validateContracts(EMPTY_CONTRACTS),true);
assert.equal(isContractId("baixada-observatorio"),true);
assert.equal(isContractId("../../etc"),false);
let state=EMPTY_CONTRACTS,inventory=createStartingInventory("quest-hero"),totalXp=0;
for(const id of CONTRACT_IDS){
 const mission=INNER_CONTRACTS[id],room=INNER_BLUEPRINTS[id];
 assert.equal(mission.guide,room.guide);
 assert.equal(mission.requires.length,3);
 assert.ok(mission.introduction.length>80);
 assert.ok(mission.conclusion.length>200);
 assert.ok(contractObjective(id,state,inventory).includes("Fale"));
 const started=startContract(state,id);assert.equal(started.ok,true);
 state=started.state;
 assert.equal(startContract(state,id).ok,false);
 assert.equal(completeContract(state,id,inventory).ok,false,"cannot finish without proofs");
 assert.equal(contractEvidenceCount(id,inventory),0);
 for(const prop of room.props){
  const receipt=innerReceipt(id,prop);
  assert.ok(mission.requires.includes(receipt));
  inventory=grantRewardInventoryItem(inventory,prop.item,1,receipt);
 }
 assert.equal(contractEvidenceCount(id,inventory),3);
 assert.ok(contractObjective(id,state,inventory).includes("Volte"));
 const done=completeContract(state,id,inventory);
 assert.equal(done.ok,true);
 assert.equal(done.xp,mission.rewardXp);
 assert.ok(done.xp>40);
 state=done.state;totalXp+=done.xp;
 assert.equal(completeContract(state,id,inventory).ok,false,
  "No replay of quest XP from repeated NPC conversation");
 assert.ok(contractObjective(id,state,inventory).includes("concluído"));
 assert.equal(validateContracts(state),true);
 assert.equal(saveContracts("quest-hero",state),true);
 assert.deepEqual(readContracts("quest-hero"),state);
}
assert.equal(state.completed.length,28);
assert.ok(totalXp>1400);
assert.equal(inventory.rewardReceipts.length,84);
assert.equal(validateContracts({...state,completed:[...state.completed,"../hack"]}),false);
assert.equal(validateContracts({...state,accepted:["baixada-observatorio","baixada-observatorio"]}),false);
assert.equal(validateContracts({...EMPTY_CONTRACTS,completed:["baixada-observatorio"]}),false);
assert.equal(validateContracts({...state,unexpected:true}),false);
db.set(CONTRACTS_KEY+"bad","{broken");
assert.deepEqual(readContracts("bad"),EMPTY_CONTRACTS);
const storage=globalThis.localStorage;globalThis.localStorage=undefined;
assert.equal(saveContracts("x",state),false);
globalThis.localStorage=storage;
console.log("28 side quests with real 84 proofs, returns to guides, persistent completion and unique XP approved.");
