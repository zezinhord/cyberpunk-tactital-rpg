import assert from "node:assert/strict";
import {createStartingInventory} from "../src/game/inventory.ts";
import {INITIAL_FAVORS} from "../src/game/story/favors.ts";
import {INITIAL_MARKET} from "../src/game/story/market.ts";
import {calculateReputation} from "../src/game/story/reputation.ts";
import {EDEN_ENDING_CHOICES,EDEN_STEPS,INITIAL_EDEN,EDEN_KEY,advanceEden,
 advanceEdenBattle,saveEden,readEden,startEden,syncEdenItems,
 validateEdenBackup,edenObjective} from "../src/game/story/eden-echoes.ts";
import {createEdenEpilogue,endingDistrictImpact} from "../src/game/story/eden-epilogues.ts";

const db=new Map();
globalThis.localStorage={
 getItem:key=>db.get(key)??null,
 setItem:(key,value)=>db.set(key,String(value)),
 removeItem:key=>db.delete(key),
};
assert.deepEqual(EDEN_ENDING_CHOICES.map(x=>x.id),["publicar","resguardar","autonomia"]);
const bonuses={
 publicar:{item:"dados_criptografados",amount:2},
 resguardar:{item:"kit_trauma",amount:2},
 autonomia:{item:"bateria_portatil",amount:2},
};
const titles=new Set();
for(const choice of EDEN_ENDING_CHOICES){
 const owner="character-"+choice.id;
 let progress=startEden(INITIAL_EDEN,true,true);
 for(const step of EDEN_STEPS){
  const previous=progress;
  const result=step.kind==="combat"?
   advanceEdenBattle(progress,step.encounter):
   step.kind==="decision"?advanceEden(progress,step.actor,choice.id):
   advanceEden(progress,step.actor);
  assert.equal(result.advanced,true,"Etapa precisa avançar: "+step.id);
  progress=result.state;
  assert.notDeepEqual(progress,previous);
 }
 assert.equal(progress.completed,true);
 assert.equal(progress.ending,choice.id);
 assert.equal(edenObjective(progress),choice.postgame);
 assert.equal(validateEdenBackup(progress),true);
 assert.equal(saveEden(owner,progress),true);
 const read=readEden(owner);
 assert.deepEqual(read,progress,"Decisão precisa sobreviver ao save/reload");
 const inventory=createStartingInventory(owner);
 const rewarded=syncEdenItems(inventory,read);
 const {item,amount}=bonuses[choice.id];
 assert.equal(rewarded.quantities[item],
  EDEN_STEPS.filter(step=>step.rewardItem===item).length+amount,
  "Recompensa final soma-se aos itens já recebidos na campanha");
 assert.deepEqual(syncEdenItems(rewarded,read),rewarded,"Recibos não duplicam itens");
 const reputation=calculateReputation({favors:INITIAL_FAVORS,market:INITIAL_MARKET,eden:read});
 const epilogue=createEdenEpilogue(read,{
  name:"Protagonista",origin:"Habitante da Baixada",className:"Netrunner",
 },reputation,7);
 assert.ok(epilogue);
 assert.equal(epilogue.title,choice.title);
 assert.ok(epilogue.lead.includes("Netrunner"));
 assert.ok(epilogue.decisions.includes("7 ocorrência(s)"));
 assert.equal(epilogue.impacts.length,3);
 titles.add(epilogue.title);
 for(const impact of epilogue.impacts){
  assert.deepEqual(endingDistrictImpact(choice.id,impact.district),impact);
  assert.ok(impact.consequence.length>40);
  assert.ok(impact.pressure>=-1&&impact.pressure<=1);
 }
 assert.equal(advanceEden(read,"feira-archive",choice.id).advanced,false,
  "Final não pode conceder mais XP ao rever epílogo");
}
assert.equal(titles.size,3,"Finais distintos precisam ter cenas próprias");
assert.equal(endingDistrictImpact(null,"baixada"),null);
assert.equal(createEdenEpilogue(INITIAL_EDEN,{name:"x",origin:"y",className:"z"},
 calculateReputation({favors:INITIAL_FAVORS,market:INITIAL_MARKET}),0),null);
const old=JSON.stringify({version:1,started:true,completed:true,step:EDEN_STEPS.length,
 history:EDEN_STEPS.map(s=>s.id),ending:"resguardar"});
assert.equal(validateEdenBackup(JSON.parse(old)),true,"Salvar um final antigo deve continuar válido");
db.set(EDEN_KEY+"legacy",old);
assert.equal(readEden("legacy").ending,"resguardar");
const storage=globalThis.localStorage;
globalThis.localStorage=undefined;
assert.equal(saveEden("offline",INITIAL_EDEN),false,
 "Sem acesso ao armazenamento não se pode anunciar salvamento");
globalThis.localStorage=storage;
console.log("Éden: três decisões, saves v1, epílogos regionais e itens idempotentes testados.");
