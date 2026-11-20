import type {PlayerCharacter} from "./types.ts";
import {isPlayerCharacter,parseCharacterSave,saveCharacter} from "./storage.ts";
import {containsCharacterSlot,hasSlotCapacity,readCharacterSlot} from "./slots.ts";
import {CHARACTER_SAVE_KEY,CHARACTER_SLOT_INDEX,CHARACTER_SLOT_PREFIX} from "./slot-core.ts";
import {TRIAL_STEPS} from "../story/field-test.ts";
import {FERRUGEM_STEPS} from "../ferrugem/story.ts";
import {isSavedWorldArea} from "../baixada/world-area.ts";
import {validateDistrictBackup} from "../districts/progress.ts";
import {validateDistrictPositions} from "../districts/positions.ts";
import {FAVORS_KEY,validateFavorBackup} from "../story/favors.ts";
import {EDEN_KEY,validateEdenBackup} from "../story/eden-echoes.ts";
import {CISMA_KEY,validateCismaBackup} from "../story/cisma-v20.ts";
import {OPERATIONS_KEY,validOperationsBackup} from "../story/cisma-operations.ts";
import {PARTY_KEY,validateParty} from "../companions.ts";
import {STEALTH_KEY,validStealth} from "../stealth.ts";
import {CONTRACTS_KEY,validateContracts} from "../story/inner-contracts.ts";
import {URBAN_KEY,validateUrbanBackup} from "../story/urban-chronicles.ts";
/** Somente estes campos do jogo podem ser restaurados do arquivo fornecido.
 * Nunca executar JSON de backup nem escrever chave arbitrária de armazenamento.
 */
export const CHARACTER_BACKUP_KEYS={
 inventory:"cyberpunk-tactical-rpg.inventory.v1.",
 appearance:"cyberpunk-tactical-rpg.arena-appearance.v1.",
 location:"cyberpunk-tactical-rpg.world-location.v068.",
 mission:"cyberpunk-tactical-rpg.mission.v1.",
 v09:"cyberpunk-tactical-rpg.story-v09.v068.",
 market:"cyberpunk-tactical-rpg.market.v1.",
 health:"cyberpunk-tactical-rpg.health.v1.",
 trial:"cyberpunk-tactical-rpg.trial.v1.",
 sewer:"cyberpunk-tactical-rpg.sewer-v09.v1.",
 ferrugem:"cyberpunk-tactical-rpg.ferrugem.v1.",
 area:"cyberpunk-tactical-rpg.world-area.v1.",
 city:"cyberpunk-tactical-rpg.city-chapters.v1.",
 districtPositions:"cyberpunk-tactical-rpg.district-positions.v1.",
 favors:FAVORS_KEY,
 eden:EDEN_KEY,
 cisma:CISMA_KEY,
 operations:OPERATIONS_KEY,
 party:PARTY_KEY,
 stealth:STEALTH_KEY,
 contracts:CONTRACTS_KEY,
 urban:URBAN_KEY,
} as const;
export type BackupField=keyof typeof CHARACTER_BACKUP_KEYS;
export interface CharacterBackup{
 format:"nova-arcadia-save";version:1;exportedAt:string;
 character:PlayerCharacter;data:Partial<Record<BackupField,string>>;
}
export function exportCharacterBackup(id:string):string {
 const character=readCharacterSlot(id);
 if(!character)throw new Error("O slot solicitado não foi encontrado.");
 const data:Partial<Record<BackupField,string>>={};
 for(const [field,key] of Object.entries(CHARACTER_BACKUP_KEYS)){
   const value=globalThis.localStorage?.getItem(key+id);
   if(value!==null&&value!==undefined)data[field as BackupField]=value;
 }
 return JSON.stringify({format:"nova-arcadia-save",version:1,
   exportedAt:new Date().toISOString(),character,data} satisfies CharacterBackup,null,2);
}
export function importCharacterBackup(text:string,overwrite=false):
  {ok:boolean;message:string;character?:PlayerCharacter}{
 if(text.length>1_000_000)return {ok:false,message:"O backup excede 1 MB."};
 let obj:unknown;
 try{obj=JSON.parse(text);}catch{return {ok:false,message:"Arquivo JSON inválido."};}
 if(!obj||typeof obj!=="object")return {ok:false,message:"Formato inválido."};
 const parsed=obj as Partial<CharacterBackup>;
 if(parsed.format!=="nova-arcadia-save"||parsed.version!==1||!isPlayerCharacter(parsed.character))
   return {ok:false,message:"Este arquivo não é um salvamento válido de Nova Arcádia."};
 const character=parseCharacterSave(JSON.stringify({version:1,character:parsed.character}));
 if(!character)return {ok:false,message:"Os dados do personagem não passaram pela validação."};
 const exists=containsCharacterSlot(character.id);
 if(exists&&!overwrite)return {ok:false,message:"Já existe um slot com este identificador. Confirme a substituição."};
 if(!exists&&!hasSlotCapacity())return {ok:false,message:"Todos os slots estão ocupados."};
 if(parsed.data && (typeof parsed.data!=="object"||Array.isArray(parsed.data)))
   return {ok:false,message:"Dados adicionais inválidos."};
 const data=parsed.data??{};
 for(const field of Object.keys(data)){
   if(!Object.prototype.hasOwnProperty.call(CHARACTER_BACKUP_KEYS,field))
     return {ok:false,message:"Chave de backup não autorizada."};
   const value=data[field as BackupField];
   if(typeof value!=="string"||value.length>200_000)
     return {ok:false,message:"Campo do backup inválido: "+field};
   if(field!=="appearance"){
     let decoded:unknown;
     try{decoded=JSON.parse(value);}
     catch{return {ok:false,message:"Conteúdo inválido: "+field};}
     if(field==="city"&&!validateDistrictBackup(decoded))
       return {ok:false,message:"Capítulos da cidade inválidos."};
     if(field==="districtPositions"&&!validateDistrictPositions(decoded))
       return {ok:false,message:"Coordenadas dos distritos inválidas."};
     if(field==="favors"&&!validateFavorBackup(decoded))
       return {ok:false,message:"Quadro de favores e carteira inválidos."};
     if(field==="urban"&&!validateUrbanBackup(decoded))
       return {ok:false,message:"Ocorrências urbanas inválidas no backup."};
     if(field==="eden"&&!validateEdenBackup(decoded))
       return {ok:false,message:"Campanha Éden inválida no backup."};
     if(field==="cisma"&&!validateCismaBackup(decoded))
       return {ok:false,message:"Campanha Cisma 2.0 inválida no backup."};
     if(field==="operations"&&!validOperationsBackup(decoded))
       return {ok:false,message:"Operações da expansão 2.0 inválidas no backup."};
     if(field==="party"&&!validateParty(decoded))
       return {ok:false,message:"Equipe da expansão 2.0 inválida no backup."};
     if(field==="stealth"&&!validStealth(decoded))
       return {ok:false,message:"Planos de infiltração inválidos no backup."};
     if(field==="contracts"&&!validateContracts(decoded))
       return {ok:false,message:"Dossiês e contratos de investigação inválidos no backup."};
     if(field==="area"&&!isSavedWorldArea(decoded))
       return {ok:false,message:"Área ativa inválida no backup."};
     if(field==="sewer"){
       if(!decoded||typeof decoded!=="object"||Array.isArray(decoded))
         return {ok:false,message:"Investigação do esgoto inválida."};
       const fields=["traceFound","pumpRestored","gateOpened","manifestRecovered","sampleRecovered"];
       const value=decoded as Record<string,unknown>;
       if(Object.keys(value).some(key=>!fields.includes(key))||
          fields.some(key=>typeof value[key]!=="boolean"))
         return {ok:false,message:"Investigação do esgoto inválida."};
     }
     if(field==="ferrugem"){
       if(!decoded||typeof decoded!=="object"||Array.isArray(decoded))
         return {ok:false,message:"Capítulo Ferrugem inválido."};
       const chapter=decoded as Record<string,unknown>;
       if(typeof chapter.started!=="boolean"||typeof chapter.completed!=="boolean"||
          !Number.isSafeInteger(chapter.step)||Number(chapter.step)<0||
          Number(chapter.step)>FERRUGEM_STEPS.length||
          !Array.isArray(chapter.history)||
          chapter.history.length>FERRUGEM_STEPS.length||
          !chapter.history.every(id=>typeof id==="string"&&FERRUGEM_STEPS.some(s=>s.id===id))||
          (chapter.ending!==null&&chapter.ending!=="publicar"&&chapter.ending!=="proteger")||
          (chapter.completed===true&&(chapter.step!==FERRUGEM_STEPS.length||chapter.ending===null)))
         return {ok:false,message:"Progresso de Ferrugem inválido."};
     }
     if(field==="trial"){
       if(!decoded||typeof decoded!=="object"||Array.isArray(decoded))
         return {ok:false,message:"Progresso da campanha inválido."};
       const progress=decoded as Record<string,unknown>;
       if(typeof progress.started!=="boolean"||typeof progress.completed!=="boolean"||
          !Number.isSafeInteger(progress.step)||Number(progress.step)<0||
          Number(progress.step)>TRIAL_STEPS.length||!Array.isArray(progress.history)||
          !progress.history.every(id=>typeof id==="string"&&TRIAL_STEPS.some(step=>step.id===id))||
          (progress.completed===true&&progress.step!==TRIAL_STEPS.length))
         return {ok:false,message:"Progresso da campanha inválido."};
     }
   }else if(value!=="masculine"&&value!=="feminine")
     return {ok:false,message:"Apresentação corporal inválida."};
 }
 const storage=globalThis.localStorage;
 if(!storage)return {ok:false,message:"Armazenamento local indisponível."};
 // Snapshot de todos os registros atingidos: importações interrompidas não
 // podem deixar um slot substituído pela metade ou apagar dados anteriores.
 const keys=[
   CHARACTER_SAVE_KEY,CHARACTER_SLOT_INDEX,CHARACTER_SLOT_PREFIX+character.id,
   ...Object.values(CHARACTER_BACKUP_KEYS).map(prefix=>prefix+character.id),
 ];
 const previous=new Map<string,string|null>();
 try{
   for(const key of keys)previous.set(key,storage.getItem(key));
 }catch{return {ok:false,message:"Não foi possível verificar o armazenamento antes da importação."};}
 const rollback=()=>{
   for(const [key,original] of previous){
     try{
       if(original===null)storage.removeItem(key);
       else storage.setItem(key,original);
     }catch{/* Preserva os demais registros mesmo quando o dispositivo está cheio. */}
   }
 };
 try{
   if(!saveCharacter(character)){
     rollback();
     return {ok:false,message:"Não foi possível gravar o personagem restaurado. Os dados anteriores foram preservados quando possível."};
   }
   for(const [field,prefix] of Object.entries(CHARACTER_BACKUP_KEYS)){
     const value=data[field as BackupField];
     // Backups substituem integralmente os campos do slot: uma importação
     // antiga não deve conservar um desfecho ou evento de outro salvamento.
     if(value===undefined)storage.removeItem(prefix+character.id);
     else storage.setItem(prefix+character.id,value);
   }
 }catch{
   rollback();
   return {ok:false,message:"Falha ao restaurar o backup. Os dados anteriores foram preservados quando possível."};
 }
 return {ok:true,character,message:"Backup restaurado. Slot "+character.name+" disponível."};
}
