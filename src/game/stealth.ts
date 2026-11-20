/** Nova Arcádia 2.0 — infiltração tática em operações de campanha.
 * Sem reroll: escolha por encontro é persistida UMA vez por personagem.
 * Êxito não ignora combate; gera vantagem real na primeira onda. Falhas
 * aumentam a resposta hostil, sem bloquear a missão principal.
 */
import type {ClassId} from "./classes/registry.ts";
import type {CyberwareId} from "./cyberware.ts";
import {cyberwareStealth} from "./cyberware.ts";
import type {PartyState} from "./companions.ts";
import type {CismaProgress} from "./story/cisma-v20.ts";
export const STEALTH_KEY="cyberpunk-tactical-rpg.stealth-v20.v1.";
export const STEALTH_ENCOUNTERS=["cisma-intercept","cisma-containment","cisma-core"] as const;
export type StealthEncounter=typeof STEALTH_ENCOUNTERS[number];
export type StealthMode="stealth"|"assault";
export type StealthOutcome="undetected"|"spotted"|"assault";
export interface StealthRecord{
 encounter:StealthEncounter;mode:StealthMode;outcome:StealthOutcome;
 score:number;threshold:number;
}
export interface StealthState{
 version:1;records:Readonly<Partial<Record<StealthEncounter,StealthRecord>>>;
}
export const INITIAL_STEALTH:Readonly<StealthState>={version:1,records:{}};
const SPECIALTY:Readonly<Record<ClassId,number>>={
 solo:0,netrunner:2,tecnico:1,medtech:1,rockerboy:0,midia:1,
 corporativo:1,policial:0,nomade:2,marginal:3,fixador:2,
};
const THRESHOLDS:Readonly<Record<StealthEncounter,number>>={
 "cisma-intercept":4,"cisma-containment":6,"cisma-core":7,
};
export interface StealthContext{
 classId:ClassId;level:number;cyberware:readonly CyberwareId[];
 party:PartyState;cisma:CismaProgress;
}
export function isStealthEncounter(value:unknown):value is StealthEncounter{
 return typeof value==="string"&&STEALTH_ENCOUNTERS.some(id=>id===value);
}
export function validStealth(input:unknown):input is StealthState{
 if(!input||typeof input!=="object"||Array.isArray(input))return false;
 const x=input as Record<string,unknown>;
 if(Object.keys(x).some(key=>key!=="version"&&key!=="records")||x.version!==1||
 !x.records||typeof x.records!=="object"||Array.isArray(x.records))return false;
 const records=x.records as Record<string,unknown>;
 return Object.entries(records).every(([key,v])=>{
  if(!isStealthEncounter(key)||!v||typeof v!=="object"||Array.isArray(v))return false;
  const o=v as Record<string,unknown>;
  if(Object.keys(o).some(k=>!["encounter","mode","outcome","score","threshold"].includes(k))||
   o.encounter!==key||!(o.mode==="stealth"||o.mode==="assault")||
   !(o.outcome==="undetected"||o.outcome==="spotted"||o.outcome==="assault")||
   !Number.isSafeInteger(o.score)||Number(o.score)<-10||Number(o.score)>20||
   o.threshold!==THRESHOLDS[key]||
   (o.mode==="assault"&&o.outcome!=="assault")||
   (o.mode==="stealth"&&o.outcome==="assault")||
   (o.outcome==="undetected"&&Number(o.score)<Number(o.threshold))||
   (o.outcome==="spotted"&&Number(o.score)>=Number(o.threshold)))return false;
  return true;
 });
}
export function readStealth(id:string):StealthState{
 if(!id)return {...INITIAL_STEALTH};
 try{const s=globalThis.localStorage?.getItem(STEALTH_KEY+id);
  const input:unknown=s?JSON.parse(s):null;
  return validStealth(input)?input:{...INITIAL_STEALTH};
 }catch{return {...INITIAL_STEALTH};}
}
export function saveStealth(id:string,state:StealthState):boolean{
 if(!id||!validStealth(state))return false;
 try{const storage=globalThis.localStorage;if(!storage)return false;
 storage.setItem(STEALTH_KEY+id,JSON.stringify(state));return true;
 }catch{return false;}
}
export function planStealth(state:StealthState,encounter:StealthEncounter,mode:StealthMode,
 ctx:StealthContext):{ok:boolean;state:StealthState;record:StealthRecord;message:string}{
 const previous=state.records[encounter];
 if(previous)return {ok:true,state,record:previous,
  message:"Plano anterior preservado: "+previous.outcome+". Não é possível repetir a rolagem."};
 const implants=cyberwareStealth(ctx.cyberware);
 const partyBonus=ctx.party.active.filter(id=>id==="mara"||id==="teo").length;
 const levelBonus=Math.floor(Math.max(1,ctx.level)/3);
 const exposurePenalty=Math.floor(ctx.cisma.exposure/2);
 const score=Math.max(-10,Math.min(20,
   1+SPECIALTY[ctx.classId]+implants+partyBonus+levelBonus-exposurePenalty));
 const threshold=THRESHOLDS[encounter];
 const outcome:StealthOutcome=mode==="assault"?"assault":
   score>=threshold?"undetected":"spotted";
 const record:StealthRecord={encounter,mode,outcome,score,threshold};
 return {ok:true,state:{version:1,records:{...state.records,[encounter]:record}},record,
  message:outcome==="undetected"?"Infiltração bem-sucedida: o primeiro inimigo começa ferido e sem resposta imediata.":
   outcome==="spotted"?"Vigias detectaram o avanço: o primeiro inimigo recebe reforço de ataque.":
   "Entrada frontal planejada: nenhuma vantagem de infiltração é aplicada."};
}
export function stealthCombatEntry(state:StealthState,encounter:string):StealthRecord|null{
 return isStealthEncounter(encounter)&&validStealth(state)?state.records[encounter]??null:null;
}
