import assert from "node:assert/strict";
import {createStartingInventory} from "../src/game/inventory.ts";
import {INITIAL_FAVORS} from "../src/game/story/favors.ts";
import {INITIAL_MARKET} from "../src/game/story/market.ts";
import {calculateReputation} from "../src/game/story/reputation.ts";
import {EDEN_STEPS,EDEN_KEY,INITIAL_EDEN,readEden,saveEden,startEden,
 currentEdenStep,advanceEden,advanceEdenBattle,syncEdenItems,validateEdenBackup,
 edenObjective} from "../src/game/story/eden-echoes.ts";
const db=new Map();
globalThis.localStorage={
 getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k),
};
assert.equal(EDEN_STEPS.length,10);
assert.equal(new Set(EDEN_STEPS.map(x=>x.id)).size,10);
assert.deepEqual(startEden(INITIAL_EDEN,false,true),INITIAL_EDEN);
assert.deepEqual(startEden(INITIAL_EDEN,true,false),INITIAL_EDEN);
let state=startEden(INITIAL_EDEN,true,true);
assert.equal(state.started,true);
assert.ok(edenObjective(state).includes("Amara"));
assert.equal(advanceEden(state,"terminal-canal").advanced,false,"Etapas fora da ordem não devem avançar");
assert.equal(advanceEdenBattle(state,"eden-core").advanced,false);
for(const step of EDEN_STEPS){
 assert.equal(currentEdenStep(state)?.id,step.id);
 let result;
 if(step.kind==="combat"){
   assert.equal(advanceEden(state,step.actor).advanced,false,"Confronto exige vitória");
   assert.equal(advanceEdenBattle(state,step.encounter==="eden-core"?"eden-relay":"eden-core").advanced,false);
   result=advanceEdenBattle(state,step.encounter);
 }else if(step.kind==="decision"){
   assert.equal(advanceEden(state,step.actor).advanced,false,"Decisão explícita obrigatória");
   result=advanceEden(state,step.actor,"resguardar");
 }else result=advanceEden(state,step.actor);
 assert.equal(result.advanced,true,step.id);
 state=result.state;
 assert.equal(state.history.includes(step.id),true);
 assert.equal(validateEdenBackup(state),true);
 assert.equal(saveEden("runner",state),true);
 state=readEden("runner");
}
assert.equal(state.completed,true);
assert.equal(state.ending,"resguardar");
assert.equal(currentEdenStep(state),null);
assert.equal(advanceEden(state,"feira-archive","publicar").advanced,false);
assert.equal(state.history.length,EDEN_STEPS.length);
const inv=createStartingInventory("runner");
const rewarded=syncEdenItems(inv,state);
assert.ok(rewarded.quantities.reagente_bio>0);
assert.equal(rewarded.quantities.mira_neural,1);
assert.deepEqual(syncEdenItems(rewarded,state),rewarded,"Recibos impedem duplicação após reload");
assert.equal(validateEdenBackup({...state,step:900}),false);
assert.equal(validateEdenBackup({...state,history:["nucleo",...state.history.slice(1)]}),false);
assert.equal(validateEdenBackup({...state,ending:"other"}),false);
assert.equal(validateEdenBackup({...state,hidden:"payload"}),false);
const guarded=calculateReputation({favors:INITIAL_FAVORS,market:INITIAL_MARKET,eden:state});
const published=calculateReputation({favors:INITIAL_FAVORS,market:INITIAL_MARKET,
 eden:{...state,ending:"publicar"}});
assert.ok(guarded.factions.mercado_cinzento>published.factions.mercado_cinzento);
assert.ok(guarded.factions.helix>published.factions.helix);
assert.ok(EDEN_KEY.endsWith("."));
console.log("Éden: 10 etapas, 2 confrontos, finais legados, saves v1, reputação e recompensas únicas aprovados.");
