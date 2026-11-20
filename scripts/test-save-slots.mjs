import assert from "node:assert/strict";
import {createPlayerCharacter,loadCharacter,saveCharacter,CHARACTER_SAVE_KEY} from "../src/game/character/storage.ts";
import {listCharacterSlots,loadCharacterSlot,removeCharacterSlot,MAX_CHARACTER_SLOTS,
  readCharacterSlot,containsCharacterSlot} from "../src/game/character/slots.ts";
import {exportCharacterBackup,importCharacterBackup} from "../src/game/character/backup.ts";
import {CHARACTER_SLOT_INDEX,setActiveRaw} from "../src/game/character/slot-core.ts";
import {createStartingInventory,saveInventory} from "../src/game/inventory.ts";
import {HEALTH_KEY,loadHealth,saveHealth,healAtClinic} from "../src/game/combat/health.ts";
import {TRIAL_KEY,TRIAL_STEPS,startTrial,FRESH_TRIAL,advanceTrial,readTrial,saveTrial} from "../src/game/story/field-test.ts";
import {SEWER_KEY,readSewer,saveSewer,applySewerEvent,FRESH_SEWER} from "../src/game/story/sewer-v09.ts";
import {FERRUGEM_SAVE_PREFIX,readFerrugem,saveFerrugem,startFerrugem,advanceFerrugem,FRESH_FERRUGEM} from "../src/game/ferrugem/story.ts";
import {WORLD_AREA_KEY,loadWorldArea,saveWorldArea} from "../src/game/baixada/world-area.ts";
import {readDistrictProgress,saveDistrictProgress,DISTRICT_SAVE_KEY,beginDistrict,FRESH_CHAPTER} from "../src/game/districts/progress.ts";
import {DISTRICT_POSITIONS_KEY,saveDistrictPosition,loadDistrictPosition} from "../src/game/districts/positions.ts";
import {FAVORS_KEY,INITIAL_FAVORS,saveFavors,readFavors,acceptFavor,recordFavorActivity,claimFavor} from "../src/game/story/favors.ts";
import {EDEN_KEY,INITIAL_EDEN,saveEden,readEden} from "../src/game/story/eden-echoes.ts";
import {CISMA_KEY,INITIAL_CISMA,CISMA_STEPS,beginCisma,advanceCisma,
 saveCisma,readCisma} from "../src/game/story/cisma-v20.ts";
import {OPERATIONS_KEY,INITIAL_OPERATIONS,OPERATIONS_STAGES,startOperations,
 advanceOperation,readOperations,saveOperations} from "../src/game/story/cisma-operations.ts";
import {PARTY_KEY,EMPTY_PARTY,recruitCompanion,readParty,saveParty} from "../src/game/companions.ts";
import {STEALTH_KEY,INITIAL_STEALTH,planStealth,readStealth,saveStealth} from "../src/game/stealth.ts";
import {CONTRACTS_KEY,EMPTY_CONTRACTS,startContract,readContracts,saveContracts}
 from "../src/game/story/inner-contracts.ts";

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
const trackedSewer=applySewerEvent(FRESH_SEWER,"sewer-track").state;
assert.equal(saveSewer(a.id,trackedSewer),true);
const ferrugemStage=advanceFerrugem(startFerrugem(FRESH_FERRUGEM),"ferrugem-foreman").progress;
assert.equal(saveFerrugem(a.id,ferrugemStage),true);
assert.equal(saveWorldArea(a.id,"ferrugem"),true);
const newChapter=beginDistrict(FRESH_CHAPTER);
assert.equal(saveDistrictProgress(a.id,"aurea",newChapter),true);
assert.equal(saveDistrictPosition(a.id,"aurea",{x:5,y:10}),true);
const favorAccepted=acceptFavor({...INITIAL_FAVORS},"triagem",{missionStep:1,v09Defeated:false});
assert.equal(favorAccepted.ok,true);
const favorReady=recordFavorActivity(favorAccepted.state,"terminal-clinica").state;
const favorComplete=claimFavor(favorReady,"triagem");
assert.equal(favorComplete.ok,true);
assert.equal(saveFavors(a.id,favorComplete.state),true);
assert.equal(saveEden(a.id,{...INITIAL_EDEN,started:true}),true);
const cismaStage=advanceCisma(beginCisma(INITIAL_CISMA,true),CISMA_STEPS[0].actor,
  undefined,"netrunner").progress;
assert.equal(saveCisma(a.id,cismaStage),true);
const cismaComplete={...cismaStage,started:true,completed:true,step:8,
 history:CISMA_STEPS.map(step=>step.id),ending:"auditoria"};
const operationsStage=advanceOperation(
 startOperations(INITIAL_OPERATIONS,cismaComplete),OPERATIONS_STAGES[0].actor).progress;
assert.equal(saveOperations(a.id,operationsStage),true);
const partyStage=recruitCompanion(EMPTY_PARTY,"nilo",true).state;
assert.equal(saveParty(a.id,partyStage),true);
const stealthStage=planStealth(INITIAL_STEALTH,"cisma-intercept","assault",{
 classId:"netrunner",level:4,cyberware:[],party:partyStage,cisma:cismaStage,
}).state;
assert.equal(saveStealth(a.id,stealthStage),true);
const contractStage=startContract(EMPTY_CONTRACTS,"baixada-observatorio").state;
assert.equal(saveContracts(a.id,contractStage),true);
const exported=exportCharacterBackup(a.id);
assert.equal(loadCharacter()?.id,previouslyActive,"Exportar slot inativo não deve trocar protagonista");
const parsed=JSON.parse(exported);
assert.equal(parsed.version,1);
assert.equal(parsed.character.id,a.id);
assert.ok(parsed.data.inventory&&parsed.data.market&&parsed.data.health&&parsed.data.mission&&parsed.data.trial);
assert.ok(parsed.data.sewer,"Backup inclui evidências do esgoto");
assert.ok(parsed.data.ferrugem,"Backup inclui investigação industrial");
assert.ok(parsed.data.area,"Backup inclui área ativa de Ferrugem");
assert.ok(parsed.data.city,"Backup inclui campanhas de novos distritos");
assert.ok(parsed.data.districtPositions,"Backup inclui posição em cada distrito");
assert.ok(parsed.data.favors,"Backup inclui favores, créditos e Honra");
assert.ok(parsed.data.eden,"Backup inclui progresso do arco Éden");
assert.ok(parsed.data.cisma,"Backup da 2.0 inclui as decisões do Cisma");
assert.ok(parsed.data.operations,"Backup inclui a campanha dos atos II-IV");
assert.ok(parsed.data.party,"Backup inclui os aliados recrutados da versão 2.0");
assert.ok(parsed.data.stealth,"Backup inclui escolhas de aproximação furtiva");
assert.ok(parsed.data.contracts,"Backup inclui contratos dos interiores 2.0");
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
assert.equal(importCharacterBackup(JSON.stringify({...parsed,data:{...parsed.data,sewer:JSON.stringify({traceFound:"sim"})}})).ok,false,"Backup rejeita estado do esgoto malformado");
assert.equal(importCharacterBackup(JSON.stringify({...parsed,data:{...parsed.data,ferrugem:JSON.stringify({started:true,completed:true,step:999,history:[],ending:"publicar"})}})).ok,false,"Importação rejeita capítulo Ferrugem adulterado");
assert.equal(importCharacterBackup(JSON.stringify({...parsed,data:{...parsed.data,area:JSON.stringify("../../foo")}})).ok,false,"Backup rejeita área maliciosa");
assert.equal(importCharacterBackup(JSON.stringify({...parsed,data:{...parsed.data,
 favors:JSON.stringify({...favorComplete.state,credits:999999})}})).ok,false,
 "Backup não aceita créditos falsificados");
assert.equal(importCharacterBackup(JSON.stringify({...parsed,data:{...parsed.data,
 operations:JSON.stringify({...operationsStage,step:23})}})).ok,false,
 "Backup adulterado dos atos II-IV deve ser rejeitado");
assert.equal(importCharacterBackup(JSON.stringify({...parsed,data:{...parsed.data,
 cisma:JSON.stringify({...cismaStage,step:7})}})).ok,false,
 "Backup adulterado do Cisma é rejeitado antes de qualquer escrita");
assert.equal(importCharacterBackup(JSON.stringify({...parsed,data:{...parsed.data,
 party:JSON.stringify({...partyStage,active:["mara"]})}})).ok,false,
 "Backup não pode introduzir aliados não recrutados");
assert.equal(importCharacterBackup(JSON.stringify({...parsed,data:{...parsed.data,
 stealth:JSON.stringify({...stealthStage,records:{"../../admin":"hack"}})}})).ok,false,
 "Backup não pode introduzir operações ou chaves de infiltração falsas");
assert.equal(importCharacterBackup(JSON.stringify({...parsed,data:{...parsed.data,
 contracts:JSON.stringify({...contractStage,accepted:["../../bad"]})}})).ok,false,
 "Backup não pode inventar contratos inexistentes");
assert.equal(importCharacterBackup(exported.padEnd(1_000_002," ")).ok,false);
// Recriar armazenamento de outro aparelho e importar backup exportado.
db=new Map();
assert.equal(importCharacterBackup(exported).ok,true);
assert.equal(loadCharacter()?.id,a.id);
assert.equal(loadHealth(a.id,20),9);
assert.equal(readTrial(a.id).step,1,"Progresso da campanha deve sobreviver a exportação e importação");
assert.equal(readSewer(a.id).traceFound,true,"Pistas da Galeria sobrevivem a importação");
assert.equal(readFerrugem(a.id).step,1,"Missão Ferrugem preservada no backup");
assert.equal(loadWorldArea(a.id),"ferrugem","Backup retoma distrito correto");
assert.equal(readFavors(a.id).credits,60,"Créditos sobrevivem ao backup");
assert.equal(readFavors(a.id).honor,1,"Honra sobrevive ao backup");
assert.equal(readEden(a.id).started,true,"Campanha Éden sobrevive à importação");
assert.deepEqual(readCisma(a.id),cismaStage,"Expansão 2.0 sobrevive à exportação/importação");
assert.deepEqual(readOperations(a.id),operationsStage,"Campanha completa preservada no backup");
assert.deepEqual(readParty(a.id),partyStage,"Recrutamento preservado no backup JSON");
assert.deepEqual(readStealth(a.id),stealthStage,"Aproximações táticas preservadas no backup");
assert.deepEqual(readContracts(a.id),contractStage,"Contratos aceitos preservados no backup");
const withoutEden={...parsed,data:{...parsed.data}};
delete withoutEden.data.eden;
assert.equal(importCharacterBackup(JSON.stringify(withoutEden),true).ok,true);
assert.equal(db.has(EDEN_KEY+a.id),false,
 "Backup de versão anterior deve limpar o capítulo órfão ao sobrescrever");
assert.equal(importCharacterBackup(exported,true).ok,true,"Backup integral recupera o arco Éden");
const withoutCisma={...parsed,data:{...parsed.data}};
delete withoutCisma.data.cisma;
assert.equal(importCharacterBackup(JSON.stringify(withoutCisma),true).ok,true);
assert.equal(db.has(CISMA_KEY+a.id),false,
 "Backup anterior à 2.0 não deve reter dados órfãos de campanhas futuras");
assert.equal(importCharacterBackup(exported,true).ok,true);
assert.deepEqual(readCisma(a.id),cismaStage);
const withoutOperations={...parsed,data:{...parsed.data}};
delete withoutOperations.data.operations;
assert.equal(importCharacterBackup(JSON.stringify(withoutOperations),true).ok,true);
assert.equal(db.has(OPERATIONS_KEY+a.id),false,"Backup antigo deve limpar operações órfãs");
assert.equal(importCharacterBackup(exported,true).ok,true);
assert.deepEqual(readOperations(a.id),operationsStage);
const withoutParty={...parsed,data:{...parsed.data}};
delete withoutParty.data.party;
assert.equal(importCharacterBackup(JSON.stringify(withoutParty),true).ok,true);
assert.equal(db.has(PARTY_KEY+a.id),false,"Backup sem equipe limpa aliados órfãos");
assert.equal(importCharacterBackup(exported,true).ok,true);
assert.deepEqual(readParty(a.id),partyStage);
const withoutStealth={...parsed,data:{...parsed.data}};
delete withoutStealth.data.stealth;
assert.equal(importCharacterBackup(JSON.stringify(withoutStealth),true).ok,true);
assert.equal(db.has(STEALTH_KEY+a.id),false,"Backup sem infiltração limpa escolhas órfãs");
assert.equal(importCharacterBackup(exported,true).ok,true);
assert.deepEqual(readStealth(a.id),stealthStage);
const withoutContracts={...parsed,data:{...parsed.data}};
delete withoutContracts.data.contracts;
assert.equal(importCharacterBackup(JSON.stringify(withoutContracts),true).ok,true);
assert.equal(db.has(CONTRACTS_KEY+a.id),false,"Backup legado limpa progresso órfão de contratos");
assert.equal(importCharacterBackup(exported,true).ok,true);
assert.deepEqual(readContracts(a.id),contractStage);
assert.deepEqual(readFavors(a.id).claimed,["triagem"]);
assert.equal(readDistrictProgress(a.id,"aurea").started,true,"Áurea permanece iniciada após restauração");
assert.deepEqual(loadDistrictPosition(a.id,"aurea"),{x:5,y:10},"Posição isométrica preservada");
assert.equal(db.get("cyberpunk-tactical-rpg.world-location.v068."+id),JSON.stringify({x:12,y:26}));
assert.ok(listCharacterSlots().length===1);
assert.equal(loadCharacterSlot(b.id),null,"Slots não existentes neste dispositivo não devem aparecer");
assert.equal(removeCharacterSlot(a.id),true);
assert.equal(db.get(HEALTH_KEY+a.id),undefined);
assert.equal(db.get("cyberpunk-tactical-rpg.inventory.v1."+a.id),undefined);
assert.equal(db.get("cyberpunk-tactical-rpg.mission.v1."+a.id),undefined);
assert.equal(db.get(TRIAL_KEY+a.id),undefined,"Exclusão remove progresso da campanha do slot");
assert.equal(db.get(SEWER_KEY+a.id),undefined,"Exclusão remove somente as pistas do esgoto do slot");
assert.equal(db.get(FERRUGEM_SAVE_PREFIX+a.id),undefined,"Exclusão remove capítulo industrial do slot");
assert.equal(db.get(WORLD_AREA_KEY+a.id),undefined,"Exclusão remove o mapa ativo do slot");
assert.equal(db.get(DISTRICT_SAVE_KEY+a.id),undefined,"Remoção limpa as cinco campanhas");
assert.equal(db.get(DISTRICT_POSITIONS_KEY+a.id),undefined,"Remoção limpa posições dos distritos");
assert.equal(db.get(FAVORS_KEY+a.id),undefined,"Exclusão limpa os favores do slot");
assert.equal(db.get(EDEN_KEY+a.id),undefined,"Exclusão limpa o progresso Éden do slot");
assert.equal(db.get(CISMA_KEY+a.id),undefined,"Exclusão limpa somente o Cisma deste slot");
assert.equal(db.get(OPERATIONS_KEY+a.id),undefined,"Exclusão limpa o estado dos atos II-IV");
assert.equal(db.get(PARTY_KEY+a.id),undefined,"Exclusão limpa equipe deste protagonista");
assert.equal(db.get(STEALTH_KEY+a.id),undefined,"Exclusão limpa aproximações deste protagonista");
assert.equal(db.get(CONTRACTS_KEY+a.id),undefined,"Exclusão limpa contratos deste protagonista");
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
assert.equal(saveEden(a.id,{...INITIAL_EDEN}),false);
assert.equal(saveCisma(a.id,INITIAL_CISMA),false);
assert.equal(saveOperations(a.id,INITIAL_OPERATIONS),false);
assert.equal(saveParty(a.id,EMPTY_PARTY),false);
assert.equal(saveStealth(a.id,INITIAL_STEALTH),false);
assert.equal(saveContracts(a.id,EMPTY_CONTRACTS),false);
assert.equal(setActiveRaw("save"),false);
globalThis.localStorage=availableStorage;
console.log("Saves: legado, slots independentes, limite, backup seguro, importação, Vida persistente e tratamento aprovados.");
