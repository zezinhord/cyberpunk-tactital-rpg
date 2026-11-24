/** Compact, deterministic NPC memory. Story quests, XP, inventory and
 * faction reputation remain owned by their existing authoritative systems.
 * These records affect greetings and available dialogue, NEVER grant rewards.
 */
export const AI_WORLD_MEMORY_KEY="cyberpunk-tactical-rpg.ai-world-memory.v1.";
export type MemoryKind="met"|"clue"|"help"|"threat"|"witness";
export interface NpcMemoryFact{
 id:string;actor:string;kind:MemoryKind;district:string;
 summary:string;sequence:number;
}
export interface WorldMemory {version:1;facts:readonly NpcMemoryFact[]}
export const EMPTY_WORLD_MEMORY:WorldMemory={version:1,facts:[]};
const validText=(x:unknown,max:number):x is string=>
 typeof x==="string"&&x.length>0&&x.length<=max&&
 !/[<>\u0000-\u001f]/.test(x);
const kinds:readonly MemoryKind[]=["met","clue","help","threat","witness"];
export function normalizeWorldMemory(input:unknown):WorldMemory{
 if(!input||typeof input!=="object"||Array.isArray(input))return {...EMPTY_WORLD_MEMORY};
 const raw=input as Record<string,unknown>;
 if(raw.version!==1||!Array.isArray(raw.facts))return {...EMPTY_WORLD_MEMORY};
 const result:NpcMemoryFact[]=[];const seen=new Set<string>();const counts=new Map<string,number>();
 for(const value of raw.facts.slice(-128)){
  if(!value||typeof value!=="object"||Array.isArray(value))continue;
  const v=value as Record<string,unknown>;
  if(!validText(v.id,70)||!validText(v.actor,55)||
     !validText(v.district,40)||!validText(v.summary,140)||
     !kinds.includes(v.kind as MemoryKind)||
     !Number.isSafeInteger(v.sequence)||Number(v.sequence)<1||
     seen.has(v.id))continue;
  if((counts.get(v.actor)??0)>=8)continue;
  seen.add(v.id);counts.set(v.actor,(counts.get(v.actor)??0)+1);
  result.push({id:v.id,actor:v.actor,kind:v.kind as MemoryKind,
    district:v.district,summary:v.summary,sequence:Number(v.sequence)});
 }
 return {version:1,facts:result.slice(-48)};
}
export function recordNpcMemory(state:WorldMemory,
 actor:string,kind:MemoryKind,district:string,source:string,summary:string):
 {state:WorldMemory;changed:boolean}{
 if(!validText(actor,55)||!validText(district,40)||
    !validText(source,55)||!validText(summary,140))return {state,changed:false};
 const id=actor+":"+source;
 if(state.facts.some(f=>f.id===id))return {state,changed:false};
 const sequence=(state.facts.at(-1)?.sequence??0)+1;
 const facts=[...state.facts.filter(f=>f.actor!==actor||
   state.facts.filter(g=>g.actor===actor).indexOf(f)>=
    Math.max(0,state.facts.filter(g=>g.actor===actor).length-7)),
  {id,actor,kind,district,summary,sequence}].slice(-48);
 return {state:{version:1,facts},changed:true};
}
export function npcRemembers(state:WorldMemory,actor:string,kind?:MemoryKind){
 return state.facts.some(f=>f.actor===actor&&(!kind||f.kind===kind));
}
/** Strict backup validation: never restore arbitrary keys into the sandbox. */
export function validWorldMemoryBackup(value:unknown):value is WorldMemory{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const raw=value as Record<string,unknown>;
 if(Object.keys(raw).some(k=>k!=="version"&&k!=="facts")||
    raw.version!==1||!Array.isArray(raw.facts)||raw.facts.length>48)return false;
 const seen=new Set<string>(),counts=new Map<string,number>();
 for(const item of raw.facts){
  if(!item||typeof item!=="object"||Array.isArray(item))return false;
  const row=item as Record<string,unknown>;
  if(Object.keys(row).some(k=>!["id","actor","kind","district","summary","sequence"].includes(k))||
   !validText(row.id,70)||!validText(row.actor,55)||
   !validText(row.district,40)||!validText(row.summary,140)||
   !kinds.includes(row.kind as MemoryKind)||
   !Number.isSafeInteger(row.sequence)||Number(row.sequence)<1||
   seen.has(row.id))return false;
  seen.add(row.id);counts.set(row.actor,(counts.get(row.actor)??0)+1);
  if(counts.get(row.actor)!>8)return false;
 }
 return true;
}
export function readWorldMemory(characterId:string):WorldMemory{
 if(!validText(characterId,110))return {...EMPTY_WORLD_MEMORY};
 try{const raw=globalThis.localStorage?.getItem(AI_WORLD_MEMORY_KEY+characterId);
  return raw?normalizeWorldMemory(JSON.parse(raw)):{...EMPTY_WORLD_MEMORY};
 }catch{return {...EMPTY_WORLD_MEMORY};}
}
export function saveWorldMemory(characterId:string,state:WorldMemory):boolean{
 if(!validText(characterId,110))return false;
 try{
  const storage=globalThis.localStorage;
  if(!storage)return false;
  storage.setItem(AI_WORLD_MEMORY_KEY+characterId,
    JSON.stringify(normalizeWorldMemory(state)));return true;
 }catch{return false;}
}
