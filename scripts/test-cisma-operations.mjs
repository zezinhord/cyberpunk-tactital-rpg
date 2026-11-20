import assert from "node:assert/strict";
import {INITIAL_CISMA} from "../src/game/story/cisma-v20.ts";
import {
 OPERATIONS_KEY,OPERATIONS_STAGES,OPERATIONS_COMBAT_IDS,OPERATIONS_ENDINGS,
 INITIAL_OPERATIONS,startOperations,currentOperation,operationsObjective,
 advanceOperation,advanceOperationBattle,readOperations,saveOperations,
 validOperationsBackup,isOperationsCombat,operationsFactionDelta,operationsAreaStatus,
} from "../src/game/story/cisma-operations.ts";

const data=new Map();
globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
const districts=["baixada","ferrugem","aurea","subsolo","setor-zero","prisma","periferia"];
const ready={...INITIAL_CISMA,started:true,completed:true,step:8,
 history:["alarme","contrapulso","turno-cindido","frequencias","vozes","assinaturas","origem","assembleia"],
 ending:"refugio",method:"netrunner"};
assert.equal(OPERATIONS_STAGES.length,23);
assert.equal(OPERATIONS_STAGES.filter(s=>s.kind==="combat").length,3);
assert.deepEqual(OPERATIONS_COMBAT_IDS,["cisma-intercept","cisma-containment","cisma-core"]);
assert.equal(OPERATIONS_STAGES.filter(s=>s.act===2).length,10);
assert.equal(OPERATIONS_STAGES.filter(s=>s.act===3).length,7);
assert.equal(OPERATIONS_STAGES.filter(s=>s.act===4).length,6);
assert.equal(startOperations(INITIAL_OPERATIONS,INITIAL_CISMA).started,false);
for(const outcome of OPERATIONS_ENDINGS){
 const id="protagonist-"+outcome.id;
 let state=startOperations(INITIAL_OPERATIONS,ready);
 assert.equal(state.started,true);
 assert.equal(state.precedent,"refugio");
 assert.equal(saveOperations(id,state),true);
 for(const stage of OPERATIONS_STAGES){
  const active=currentOperation(state);
  assert.equal(active?.id,stage.id);
  assert.equal(active?.act,stage.act);
  assert.equal(operationsObjective(state),stage.objective);
  assert.equal(advanceOperation(state,"id-inexistente").advanced,false);
  assert.equal(advanceOperation(state,stage.actor).advanced,stage.kind==="interact");
  if(stage.kind==="combat"){
   assert.equal(isOperationsCombat(stage.encounter),true);
   assert.equal(advanceOperationBattle(state,stage.encounter).advanced,true);
   assert.equal(advanceOperationBattle(state,"cisma-inexistente").advanced,false);
  }else assert.equal(advanceOperationBattle(state,"cisma-core").advanced,false);
  if(stage.kind==="decision")
   assert.equal(advanceOperation(state,stage.actor,"qualquer").advanced,false);
  const result=stage.kind==="combat"?
   advanceOperationBattle(state,stage.encounter):
   advanceOperation(state,stage.actor,stage.kind==="decision"?outcome.id:undefined);
  assert.equal(result.advanced,true,stage.title);
  assert.ok(result.message.length>50);
  state=result.progress;
  assert.equal(state.history.length,state.step);
  assert.equal(validOperationsBackup(state),true);
  assert.equal(saveOperations(id,state),true);
  assert.deepEqual(readOperations(id),state,"persistencia atômica por etapa");
 }
 assert.equal(state.completed,true);
 assert.equal(state.ending,outcome.id);
 assert.ok(operationsObjective(state).length>75);
 assert.ok(Object.keys(operationsFactionDelta(state)).length>0);
 assert.equal(advanceOperation(state,"feira-archive",outcome.id).advanced,false);
 for(const area of districts){
  const status=operationsAreaStatus(state,area);
  assert.ok(status.title.length>8);
  assert.ok(status.message.length>40);
  assert.ok(status.pressure>=-1&&status.pressure<=1);
 }
}
assert.equal(operationsAreaStatus(INITIAL_OPERATIONS,"baixada"),null);
assert.equal(validOperationsBackup({...INITIAL_OPERATIONS,evil:1}),false);
assert.equal(validOperationsBackup({...INITIAL_OPERATIONS,started:true,precedent:null}),false);
assert.equal(validOperationsBackup({...INITIAL_OPERATIONS,step:23,history:[]}),false);
assert.equal(validOperationsBackup({...INITIAL_OPERATIONS,ending:"ruptura"}),false);
assert.equal(validOperationsBackup({...INITIAL_OPERATIONS,history:["hack"]}),false);
assert.equal(isOperationsCombat("eden-core"),false);
data.set(OPERATIONS_KEY+"broken","invalid{");
assert.deepEqual(readOperations("broken"),INITIAL_OPERATIONS);
const storage=globalThis.localStorage;globalThis.localStorage=undefined;
assert.equal(saveOperations("offline",INITIAL_OPERATIONS),false);
globalThis.localStorage=storage;
console.log("Atos II-IV: 23 etapas, 3 combates, 3 finais, 7 distritos, backup e reentrada aprovados.");
