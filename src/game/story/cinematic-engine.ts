/** Shared, deterministic cinematic timeline. Presentation only: quest state is
 * owned by the canonical mission engines and is never mutated here.
 * Renderer-agnostic shots work with the current React/CSS compositor and can
 * later be driven by Phaser cameras without duplicating narrative content.
 */
import type {OriginId} from "../character/origins.ts";
import type {ClassId} from "../classes/registry.ts";

export type CinematicMood="establishing"|"tension"|"memory"|"discovery"|"eden"|"departure";
export type CinematicAudio="none"|"terminal"|"archive"|"eden";
export interface CinematicShot {
  /** Within safe framing bounds; % pan relative to the stage. */
  panX:number;panY:number;zoom:number;
  durationMs:number;transitionMs:number;
  mood:CinematicMood;audio:CinematicAudio;
  focus:"environment"|"hero"|"subject"|"evidence";
}
export interface CinematicCondition {
  origins?:readonly OriginId[];
  classes?:readonly ClassId[];
  /** Only facts supplied from an official quest save may gate a beat. */
  requiredFacts?:readonly string[];
}
export interface CinematicBeat {
  id:string;shot:CinematicShot;condition?:CinematicCondition;
  /** A choice must resolve via the original game callback, not this module. */
  choices?:readonly string[];
}
export interface CinematicContext {
  originId:OriginId;classId:ClassId|null;
  facts:ReadonlySet<string>;
}
export interface CinematicTimeline{
  id:string;beats:readonly CinematicBeat[];
  /** Unique actions are intentionally delegated to existing quest systems. */
}
export interface CinematicState {
  index:number;finished:boolean;pendingChoice:boolean;
}
const clamp=(n:number,min:number,max:number)=>Number.isFinite(n)?
  Math.min(max,Math.max(min,n)):min;
export function safeShot(shot:CinematicShot):CinematicShot{
  return {...shot,
    panX:clamp(shot.panX,-12,12),panY:clamp(shot.panY,-10,10),
    zoom:clamp(shot.zoom,1,1.16),
    durationMs:clamp(shot.durationMs,2200,20000),
    transitionMs:clamp(shot.transitionMs,0,1500)};
}
export function matchCinematicCondition(
 condition:CinematicCondition|undefined,context:CinematicContext
):boolean{
 if(!condition)return true;
 if(condition.origins&&!condition.origins.includes(context.originId))return false;
 if(condition.classes&&(!context.classId||!condition.classes.includes(context.classId)))return false;
 if(condition.requiredFacts&&condition.requiredFacts.some(f=>!context.facts.has(f)))return false;
 return true;
}
export function compileCinematic(
 timeline:CinematicTimeline,context:CinematicContext
):CinematicTimeline{
 const ids=new Set<string>();
 if(!timeline.id||timeline.beats.length>64)throw Error("Timeline inválida.");
 const beats=timeline.beats.filter(beat=>matchCinematicCondition(beat.condition,context))
   .map(beat=>{
     if(!beat.id||ids.has(beat.id))throw Error("Plano duplicado: "+beat.id);
     ids.add(beat.id);
     return {...beat,shot:safeShot(beat.shot)};
   });
 if(!beats.length)throw Error("A sequência não possui enquadramentos acessíveis.");
 return {id:timeline.id,beats};
}
export function startCinematic(timeline:CinematicTimeline):CinematicState{
 return {index:0,finished:timeline.beats.length===0,
  pendingChoice:Boolean(timeline.beats[0]?.choices?.length)};
}
export function advanceCinematic(timeline:CinematicTimeline,
 state:CinematicState,choiceId?:string):CinematicState{
 if(state.finished)return state;
 const beat=timeline.beats[state.index];
 if(!beat)return {...state,finished:true,pendingChoice:false};
 if(beat.choices?.length&&(!choiceId||!beat.choices.includes(choiceId)))return state;
 const next=state.index+1;
 return {index:Math.min(next,timeline.beats.length-1),
  finished:next>=timeline.beats.length,
  pendingChoice:next<timeline.beats.length&&Boolean(timeline.beats[next]?.choices?.length)};
}
export function skipCinematic(timeline:CinematicTimeline,state:CinematicState):CinematicState{
 if(state.finished)return state;
 // Never forge a choice or future quest consequence on skip.
 if(timeline.beats.slice(state.index).some(beat=>beat.choices?.length))return state;
 return {...state,finished:true,pendingChoice:false};
}
export function cinematicDuration(timeline:CinematicTimeline):number{
 return timeline.beats.reduce((ms,beat)=>ms+safeShot(beat.shot).durationMs,0);
}
export type DialoguePresentation="simple"|"dramatic"|"cinematic";
export function dialoguePresentation(
 speaker:string,role:string,totalPages:number,hasChoices:boolean
):DialoguePresentation{
 const text=(speaker+" "+role).toLocaleLowerCase("pt-BR");
 if(/éden|eden|cisma|última autorização|decisão coletiva|assembleia|fim da campanha|projeto éden|projeto eden|v-09|nó de retransmissão|quarentena|revelação/.test(text))
   return "cinematic";
 if(hasChoices||totalPages>=3||
    /helix|amara|helena|elias|mara|dorian|auditoria|investigação|conselho|testemunh|interceptaç|câmara|sabotagem|rostos/.test(text))
   return "dramatic";
 return "simple";
}
export type TextSpeed="slow"|"normal"|"fast"|"instant";
export interface CinematicPreferences {
 speed:TextSpeed;autoPlay:boolean;reduceMotion:boolean;
}
export const CINEMA_SETTINGS_KEY="cyberpunk-tactical-rpg.cinema-settings.v2";
export const DEFAULT_CINEMA_SETTINGS:Readonly<CinematicPreferences>={
 speed:"normal",autoPlay:true,reduceMotion:false
};
export function sanitizeCinematicPreferences(raw:unknown):CinematicPreferences{
 if(!raw||typeof raw!=="object")return {...DEFAULT_CINEMA_SETTINGS};
 const r=raw as Partial<CinematicPreferences>;
 return {speed:r.speed==="slow"||r.speed==="fast"||r.speed==="instant"||
   r.speed==="normal"?r.speed:"normal",
  autoPlay:typeof r.autoPlay==="boolean"?r.autoPlay:true,
  reduceMotion:r.reduceMotion===true};
}
export function readCinematicPreferences():CinematicPreferences{
 try{const value=globalThis.localStorage?.getItem(CINEMA_SETTINGS_KEY);
   return value?sanitizeCinematicPreferences(JSON.parse(value)):
     {...DEFAULT_CINEMA_SETTINGS};
 }catch{return {...DEFAULT_CINEMA_SETTINGS};}
}
export function saveCinematicPreferences(value:CinematicPreferences):void{
 try{globalThis.localStorage?.setItem(CINEMA_SETTINGS_KEY,
   JSON.stringify(sanitizeCinematicPreferences(value)));}
 catch{/* Storage problems never interrupt cutscenes. */}
}
export function textCharacterInterval(speed:TextSpeed):number{
 return speed==="slow"?48:speed==="fast"?12:speed==="instant"?0:25;
}
export const CINEMA_HISTORY_PREFIX="cyberpunk-tactical-rpg.cinema-history.v2.";
export function readCinematicHistory(characterId:string):readonly string[]{
 if(!characterId)return [];
 try{const raw=globalThis.localStorage?.getItem(CINEMA_HISTORY_PREFIX+characterId);
   const parsed:unknown=raw?JSON.parse(raw):[];
   return Array.isArray(parsed)?parsed.filter((x):x is string=>
     typeof x==="string"&&x.length>0&&x.length<90).slice(-50):[];
 }catch{return [];}
}
export function markCinematicSeen(characterId:string,sequenceId:string):boolean{
 if(!characterId||!sequenceId)return false;
 try{
   const values=readCinematicHistory(characterId);
   if(values.includes(sequenceId))return true;
   globalThis.localStorage?.setItem(CINEMA_HISTORY_PREFIX+characterId,
     JSON.stringify([...values,sequenceId].slice(-50)));
   return true;
 }catch{return false;}
}
