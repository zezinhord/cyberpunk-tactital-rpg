import type {PlayerCharacter} from "../character/types.ts";
export type OpeningVisual="skyline"|"aurea"|"eden"|"baixada"|"records"|"operative"|"interference"|"canal";
export interface OpeningPanel{
 id:string;label:string;title:string;visual:OpeningVisual;
 lines:readonly string[];
}
/** Intro general, sem alterar quests/XP. Cada origem recebe sua própria introdução após esta. */
export const OPENING_PANELS:readonly OpeningPanel[]=[
 {id:"pulse",label:"TRANSMISSÃO 01 · 08",title:"A cidade que lembra",visual:"skyline",lines:[
  "Nova Arcádia não dorme. Ela apenas decide quem pode descansar.",
  "As luzes continuam acesas, mesmo quando ninguém pode pagar por elas."
 ]},
 {id:"promise",label:"TRANSMISSÃO 02 · 08",title:"A promessa",visual:"aurea",lines:[
  "Prometeram uma cidade sem sofrimento.",
  "As promessas chegaram primeiro às torres."
 ]},
 {id:"eden",label:"TRANSMISSÃO 03 · 08",title:"O sistema que nunca dorme",visual:"eden",lines:[
  "PROJETO ÉDEN: fornecimento estável. Rotas otimizadas.",
  "Interrupções minimizadas. Critérios de decisão não disponíveis."
 ]},
 {id:"people",label:"TRANSMISSÃO 04 · 08",title:"Quem sustenta a cidade",visual:"baixada",lines:[
  "Na Baixada, nenhuma peça dura para sempre.",
  "Mas sempre há alguém disposto a consertar outra."
 ]},
 {id:"erased",label:"TRANSMISSÃO 05 · 08",title:"O registro ausente",visual:"records",lines:[
  "Entrada confirmada. Identidade removida.",
  "A pessoa existiu. O sistema discorda."
 ]},
 {id:"you",label:"TRANSMISSÃO 06 · 08",title:"Seu passado",visual:"operative",lines:[
  "{name}. Sua história começou muito antes desta investigação.",
  "{originLine}"
 ]},
 {id:"intrusion",label:"TRANSMISSÃO 07 · 08",title:"Interferência",visual:"interference",lines:[
  "REGISTRO NÃO LOCALIZADO. Integridade do arquivo: indeterminada.",
  "...Por que há uma cópia fora da rede?"
 ]},
 {id:"begin",label:"TRANSMISSÃO 08 · 08",title:"A primeira pista",visual:"canal",lines:[
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
