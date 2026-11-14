import assert from "node:assert/strict";
import {createPlayerCharacter,loadCharacter,saveCharacter,CHARACTER_SAVE_KEY} from "../src/game/character/storage.ts";
import {listCharacterSlots,loadCharacterSlot,removeCharacterSlot,MAX_CHARACTER_SLOTS,
  readCharacterSlot,containsCharacterSlot} from "../src/game/character/slots.ts";
import {exportCharacterBackup,importCharacterBackup} from "../src/game/character/backup.ts";
import {CHARACTER_SLOT_INDEX,setActiveRaw} from "../src/game/character/slot-core.ts";
import {createStartingInventory,saveInventory} from "../src/game/inventory.ts";
import {HEALTH_KEY,loadHealth,saveHealth,healAtClinic} from "../src/game/combat/health.ts";
import {TRIAL_KEY,TRIAL_STEPS,startTrial,FRESH_TRIAL,advanceTrial,readTrial,saveTrial} from "../src/game/story/field-test.ts";

let db=new Map();
globalThis.localStorage={
 getItem:k=>db.get(k)??null,
 setItem:(k,v)=>db.set(k,String(v)),
 removeItem:k=>db.delete(k),
};
const a=createPlayerCharacter("Andarilho","baixada","netrunner");
a.experience=37;a.questRewards=["v09"];
const b=createPlayerCharacter("Oficial","militar","solo");
b.experience=92;
assert.equal(saveCharacter(a),true);
assert.equal(saveCharacter(b),true);
assert.equal(listCharacterSlots().length,2);
assert.equal(loadCharacter()?.id,b.id);
// Falha no terceiro registro não pode sobrescrever só o slot ou seu índice.
let failActiveOnce=true;
globalThis.localStorage.setItem=(key,value)=>{
 if(key===CHARACTER_SAVE_KEY&&failActiveOnce){failActiveOnce=false;throw new Error("quota");}
 db.set(key,String(value));
};
assert.equal(saveCharacter({...b,name:"NÃO SALVAR"}),false);
assert.equal(loadCharacter()?.name,"Oficial","Personagem ativo preservado após escrita parcial");
assert.equal(readCharacterSlot(b.id)?.name,"Oficial","Slot preservado após escrita parcial");
assert.equal(listCharacterSlots().length,2);
assert.equal(readCharacterSlot(a.id)?.experience,37);
assert.equal(loadCharacter()?.id,b.id,"Consulta passiva não pode alterar o protagonista ativo");
assert.equal(loadCharacterSlot(a.id)?.id,a.id);
assert.equal(loadCharacter()?.id,a.id);
assert.equal(loadCharacterSlot(b.id)?.id,b.id);
assert.equal(loadCharacter()?.experience,92);
const id=a.id;
db.set("cyberpunk-tactical-rpg.mission.v1."+id,JSON.stringify({step:3,clues:["canal","patio"]}));
db.set("cyberpunk-tactical-rpg.inventory.v1."+id,JSON.stringify({version:1,ownerId:id,
 quantities:{pistola_manutencao:1,colete_reaproveitado:1,curativo_campo:2,conector_reuso:1},
 equipped:{weapon:"pistola_manutencao",armor:null}}));
db.set("cyberpunk-tactical-rpg.world-location.v068."+id,JSON.stringify({x:12,y:26}));
db.set("cyberpunk-tactical-rpg.market.v1."+id,JSON.stringify({clues:["market-lot"],decisions:[],trust:2,heat:1}));
assert.equal(saveHealth(id,9,20),true);
assert.equal(loadHealth(id,20),9);
assert.equal(loadHealth(id,10),9);
assert.equal(saveHealth(id,0,20),true);
assert.equal(loadHealth(id,20),1,"Derrota deve deixar 1 HP, não estado inválido");
assert.equal(healAtClinic(id,20),true);
assert.equal(loadHealth(id,20),20);
assert.equal(saveHealth("",2,20),false);
assert.equal(loadHealth("unknown",18),18);
db.set(HEALTH_KEY+"bad","not json");
assert.equal(loadHealth("bad",18),18);
assert.equal(saveHealth(id,9,20),true);
const started=startTrial(FRESH_TRIAL);
const firstStep=advanceTrial(started,TRIAL_STEPS[0].actor).progress;
assert.equal(firstStep.step,1);
assert.equal(saveTrial(id,firstStep),true);
const previouslyActive=loadCharacter()?.id;
const exported=exportCharacterBackup(a.id);
assert.equal(loadCharacter()?.id,previouslyActive,"Exportar slot inativo não deve trocar protagonista");
const parsed=JSON.parse(exported);
assert.equal(parsed.version,1);
assert.equal(parsed.character.id,a.id);
assert.ok(parsed.data.inventory&&parsed.data.market&&parsed.data.health&&parsed.data.mission&&parsed.data.trial);
const beforeCount=listCharacterSlots().length;
assert.equal(importCharacterBackup(exported).ok,false,"Mesmo ID exige confirmação");
assert.equal(listCharacterSlots().length,beforeCount);
// Falha simulada na última etapa da importação: slot e dados prévios não podem
// ficar substituídos parcialmente, mesmo quando o armazenamento falha.
assert.equal(saveHealth(id,7,20),true);
let failOnce=true;
globalThis.localStorage.setItem=(key,value)=>{
 if(key===TRIAL_KEY+id&&failOnce){failOnce=false;throw new Error("storage quota");}
 db.set(key,String(value));
};
assert.equal(importCharacterBackup(exported,true).ok,false);
assert.equal(loadHealth(id,20),7,"Falha deve reverter dados anteriores");
assert.equal(readTrial(id).step,1,"Campanha anterior deve permanecer intacta");
assert.equal(saveHealth(id,9,20),true);
assert.equal(importCharacterBackup(exported,true).ok,true,"Restaurar mesmo ID mediante autorização");
assert.equal(importCharacterBackup(JSON.stringify({...parsed,format:"invalid"})).ok,false);
assert.equal(importCharacterBackup(JSON.stringify({...parsed,data:{...parsed.data,"../../../admin":"x"}})).ok,false);
assert.equal(importCharacterBackup(JSON.stringify({...parsed,data:{...parsed.data,constructor:"{}"}})).ok,false);
assert.equal(importCharacterBackup(JSON.stringify({...parsed,data:{...parsed.data,trial:JSON.stringify({started:true,completed:false,step:999,history:[]})}})).ok,false);
assert.equal(importCharacterBackup(exported.padEnd(1_000_002," ")).ok,false);
// Recriar armazenamento de outro aparelho e importar backup exportado.
db=new Map();
assert.equal(importCharacterBackup(exported).ok,true);
assert.equal(loadCharacter()?.id,a.id);
assert.equal(loadHealth(a.id,20),9);
assert.equal(readTrial(a.id).step,1,"Progresso da campanha deve sobreviver a exportação e importação");
assert.equal(db.get("cyberpunk-tactical-rpg.world-location.v068."+id),JSON.stringify({x:12,y:26}));
assert.ok(listCharacterSlots().length===1);
assert.equal(loadCharacterSlot(b.id),null,"Slots não existentes neste dispositivo não devem aparecer");
assert.equal(removeCharacterSlot(a.id),true);
assert.equal(db.get(HEALTH_KEY+a.id),undefined);
assert.equal(db.get("cyberpunk-tactical-rpg.inventory.v1."+a.id),undefined);
assert.equal(db.get("cyberpunk-tactical-rpg.mission.v1."+a.id),undefined);
assert.equal(db.get(TRIAL_KEY+a.id),undefined,"Exclusão remove progresso da campanha do slot");
assert.equal(loadCharacter(),null);
assert.equal(listCharacterSlots().length,0);
// Migração a partir da chave única v1 sem índice.
db.set(CHARACTER_SAVE_KEY,JSON.stringify({version:1,character:b}));
assert.deepEqual(JSON.parse(db.get(CHARACTER_SLOT_INDEX)??"[]"),[]);
assert.equal(listCharacterSlots().length,1);
assert.equal(listCharacterSlots()[0].id,b.id);
// Limite de oito slots; sem destruir nenhum save anterior.
for(let i=1;i<MAX_CHARACTER_SLOTS;i++){
 const c=createPlayerCharacter("Extra-"+i,"nomade","fixador");
 assert.equal(saveCharacter(c),true);
}
assert.equal(listCharacterSlots().length,MAX_CHARACTER_SLOTS);
const overflow=createPlayerCharacter("Over","corporativo","solo");
assert.equal(saveCharacter(overflow),false);
assert.equal(containsCharacterSlot(b.id),true);
// Não anunciar sucesso quando as permissões ou o contexto bloqueiam localStorage.
const availableStorage=globalThis.localStorage;
globalThis.localStorage=undefined;
assert.equal(saveHealth(a.id,5,20),false);
assert.equal(saveTrial(a.id,firstStep),false);
assert.equal(saveInventory(createStartingInventory(a.id)),false);
assert.equal(setActiveRaw("save"),false);
globalThis.localStorage=availableStorage;
console.log("Saves: legado, slots independentes, limite, backup seguro, importação, Vida persistente e tratamento aprovados.");
