import type {PlayerCharacter} from "../character/types.ts";
import {getOriginById} from "../character/origins.ts";
import type {CinematicShot,CinematicTimeline,CinematicContext} from "./cinematic-engine.ts";
import {compileCinematic,cinematicDuration} from "./cinematic-engine.ts";
export type OpeningVisual="skyline"|"aurea"|"eden"|"baixada"|"records"|"operative"|"interference"|"canal";
export interface OpeningPanel{
 id:string;label:string;title:string;visual:OpeningVisual;
 lines:readonly string[];
 shot:CinematicShot;
}
/** Intro general, sem alterar quests/XP. Cada origem recebe sua própria introdução após esta. */
export const OPENING_PANELS:readonly OpeningPanel[]=[
 {id:"pulse",label:"TRANSMISSÃO 01 · 08",title:"A cidade que lembra",visual:"skyline",
 shot:{panX:-4,panY:0,zoom:1.07,durationMs:11000,transitionMs:1100,mood:"establishing",audio:"none",focus:"environment"},lines:[
  "Nova Arcádia não dorme. Ela apenas decide quem pode descansar.",
  "As luzes continuam acesas, mesmo quando ninguém pode pagar por elas."
 ]},
 {id:"promise",label:"TRANSMISSÃO 02 · 08",title:"A promessa",visual:"aurea",
 shot:{panX:3,panY:-2,zoom:1.1,durationMs:10000,transitionMs:900,mood:"tension",audio:"terminal",focus:"evidence"},lines:[
  "Prometeram uma cidade sem sofrimento.",
  "As promessas chegaram primeiro às torres."
 ]},
 {id:"eden",label:"TRANSMISSÃO 03 · 08",title:"O sistema que nunca dorme",visual:"eden",
 shot:{panX:0,panY:0,zoom:1.05,durationMs:9500,transitionMs:1100,mood:"eden",audio:"eden",focus:"subject"},lines:[
  "PROJETO ÉDEN: fornecimento estável. Rotas otimizadas.",
  "Interrupções minimizadas. Critérios de decisão não disponíveis."
 ]},
 {id:"people",label:"TRANSMISSÃO 04 · 08",title:"Quem sustenta a cidade",visual:"baixada",
 shot:{panX:-3,panY:1,zoom:1.06,durationMs:11000,transitionMs:1000,mood:"establishing",audio:"none",focus:"environment"},lines:[
  "Na Baixada, nenhuma peça dura para sempre.",
  "Mas sempre há alguém disposto a consertar outra."
 ]},
 {id:"erased",label:"TRANSMISSÃO 05 · 08",title:"O registro ausente",visual:"records",
 shot:{panX:2,panY:-1,zoom:1.12,durationMs:11000,transitionMs:700,mood:"discovery",audio:"archive",focus:"evidence"},lines:[
  "Entrada confirmada. Identidade removida.",
  "A pessoa existiu. O sistema discorda."
 ]},
 {id:"you",label:"TRANSMISSÃO 06 · 08",title:"Seu passado",visual:"operative",
 shot:{panX:1,panY:0,zoom:1.06,durationMs:13000,transitionMs:950,mood:"memory",audio:"none",focus:"hero"},lines:[
  "{name}. Sua história começou muito antes desta investigação.",
  "{originLine}"
 ]},
 {id:"intrusion",label:"TRANSMISSÃO 07 · 08",title:"Interferência",visual:"interference",
 shot:{panX:0,panY:1,zoom:1.08,durationMs:10500,transitionMs:650,mood:"eden",audio:"eden",focus:"evidence"},lines:[
  "REGISTRO NÃO LOCALIZADO. Integridade do arquivo: indeterminada.",
  "...Por que há uma cópia fora da rede?"
 ]},
 {id:"begin",label:"TRANSMISSÃO 08 · 08",title:"A primeira pista",visual:"canal",
 shot:{panX:-2,panY:0,zoom:1.05,durationMs:13000,transitionMs:1200,mood:"departure",audio:"terminal",focus:"environment"},lines:[
  "Uma médica da Baixada guardou um prontuário que deveria ter desaparecido.",
  "A ocorrência V-09 conduz ao Canal Sul. Sua investigação está começando."
 ]},
] as const;

const ORIGIN_LINES:Readonly<Record<PlayerCharacter["originId"],string>>={
 corporativo:"Você conhece as portas que a Helix prefere manter fechadas.",
 baixada:"Você conhece quem mantém a cidade em funcionamento.",
 gangue:"Algumas dívidas continuam ativas mesmo depois da saída.",
 militar:"Você sabe que uma ordem não equivale a justiça.",
 pesquisador:"Você aprendeu a desconfiar de resultados perfeitos demais.",
 nomade:"Você reconhece caminhos que os mapas oficiais não mostram.",
};
/** Legados sem openingSeen nunca são forçados a rever a introdução. */
export function nextStoryScreen(character:Pick<PlayerCharacter,"introductionCompleted"|"openingSeen">|null):
 "opening"|"introduction"|"exploration"{
 if(character?.introductionCompleted)return "exploration";
 return character?.openingSeen===false?"opening":"introduction";
}
export function markOpeningSeen<T extends PlayerCharacter>(character:T):T{
 return {...character,openingSeen:true,updatedAt:new Date().toISOString()};
}
export function openingLines(panel:OpeningPanel,character:PlayerCharacter):readonly string[]{
 return panel.lines.map(line=>line.replaceAll("{name}",character.name)
   .replaceAll("{originLine}",ORIGIN_LINES[character.originId]));
}

/** Six personalized memory environments, grounded in official origins. */
export const ORIGIN_CINEMATIC_MEMORY:Readonly<Record<PlayerCharacter["originId"],{
 location:string;detail:string;motif:string;contact:string
}>>={
 corporativo:{location:"ÁUREA · ANEXO HELIX",detail:"Seu identificador corporativo ainda deixa rastros nos arquivos da torre.",
   motif:"CREDENCIAL REVOGADA",contact:"Helena Voss"},
 baixada:{location:"BAIXADA · OFICINAS",detail:"Você cresceu entre consertos, canais e redes de apoio da comunidade.",
   motif:"PEÇAS REAPROVEITADAS",contact:"Cooperativa"},
 gangue:{location:"SUBSOLO · PASSAGENS",detail:"O mapa dos túneis guarda caminhos que você preferiu abandonar.",
   motif:"ROTA NÃO DECLARADA",contact:"Subsolo"},
 militar:{location:"FERRUGEM · CONTROLE",detail:"Os turnos e as ordens da zona industrial ainda parecem familiares.",
   motif:"ORDEM ARQUIVADA",contact:"Ferrugem"},
 pesquisador:{location:"ÁUREA · PESQUISA",detail:"Os padrões de triagem parecem precisos demais para deixar espaço às pessoas.",
   motif:"RESULTADO SOB REVISÃO",contact:"Laboratório"},
 nomade:{location:"PERIFERIA · ESTRADAS",detail:"Você sabe onde ficam os caminhos fora da rede de rotas oficiais.",
   motif:"TRAJETO SEM SINAL",contact:"Periferia"},
};
export const OPENING_CINEMATIC_TIMELINE:CinematicTimeline={
 id:"opening-nova-arcadia-v20",
 beats:OPENING_PANELS.map(panel=>({id:panel.id,shot:panel.shot}))
};
/** Canonical timeline with protagonist facts, not an unrelated new narrative. */
export function compileOpening(character:PlayerCharacter):CinematicTimeline{
 const context:CinematicContext={originId:character.originId,classId:character.classId,facts:new Set()};
 return compileCinematic(OPENING_CINEMATIC_TIMELINE,context);
}
export const OPENING_TARGET_DURATION_MS=cinematicDuration(OPENING_CINEMATIC_TIMELINE);
export function openingOriginSetting(character:PlayerCharacter):string{
 return getOriginById(character.originId).startingLocation.areaName;
}
