/** Nova Arcádia 2.0 — contatos que se tornam aliados táticos.
 * Os aliados acompanham o protagonista como apoio remoto de combate (não são
 * unidades sobrepostas no tabuleiro 8×8). Cada um age uma vez por confronto.
 * Dois podem ser ativados; recrutamento depende de encontro presencial.
 */
export const COMPANION_IDS=["nilo","mara","joana","teo"] as const;
export type CompanionId=typeof COMPANION_IDS[number];
export type CompanionAid="energy"|"jam"|"heal"|"focus";
export interface CompanionProfile{
 id:CompanionId;name:string;role:string;home:string;bio:string;
 aid:CompanionAid;power:number;description:string;
 attack:number;armor:number;hp:number;energy:number;movement:number;
}
export const COMPANION_CATALOG:Readonly<Record<CompanionId,CompanionProfile>>={
 nilo:{id:"nilo",name:"Nilo",role:"Técnico de Campo",home:"Oficina do Nilo · Baixada",
 bio:"Nilo empresta ferramentas e energia depois de confiar nas decisões do protagonista.",
 aid:"energy",power:4,description:"Fornece 4 pontos de energia durante um combate.",
 attack:0,armor:0,hp:0,energy:1,movement:0},
 mara:{id:"mara",name:"Mara",role:"Coordenadora do Subsolo",home:"Abrigo do Vão · Subsolo",
 bio:"A líder de rotas livres protege os trajetos sem expor a localização de pessoas abrigadas.",
 aid:"jam",power:1,description:"Bloqueia uma ação inimiga com pulso de interferência.",
 attack:0,armor:1,hp:0,energy:0,movement:0},
 joana:{id:"joana",name:"Joana",role:"Socorrista Comunitária",home:"Casa Comum · Baixada",
 bio:"Joana acompanha equipes que socorrem pessoas excluídas do sistema hospitalar.",
 aid:"heal",power:6,description:"Recupera até 6 pontos de vida no confronto.",
 attack:0,armor:0,hp:2,energy:0,movement:0},
 teo:{id:"teo",name:"Téo",role:"Operador dos Canais",home:"Galeria do Canal · Baixada",
 bio:"Téo traça rotas de comunicação e observa interferências antes dos confrontos.",
 aid:"focus",power:3,description:"Aumenta a precisão do próximo ataque em 3 pontos.",
 attack:1,armor:0,hp:0,energy:0,movement:0},
};
export const PARTY_KEY="cyberpunk-tactical-rpg.party-v20.v1.";
export interface PartyState{
 version:1;recruited:readonly CompanionId[];active:readonly CompanionId[];
}
export const EMPTY_PARTY:Readonly<PartyState>={version:1,recruited:[],active:[]};
export function isCompanionId(value:unknown):value is CompanionId{
 return typeof value==="string"&&Object.prototype.hasOwnProperty.call(COMPANION_CATALOG,value);
}
export function validateParty(input:unknown):input is PartyState{
 if(!input||typeof input!=="object"||Array.isArray(input))return false;
 const v=input as Record<string,unknown>;
 if(!Array.isArray(v.recruited)||!Array.isArray(v.active))return false;
 return Object.keys(v).every(k=>["version","recruited","active"].includes(k))&&
  v.version===1&&Array.isArray(v.recruited)&&v.recruited.length<=COMPANION_IDS.length&&
  v.recruited.every(isCompanionId)&&
  new Set(v.recruited).size===v.recruited.length&&
  Array.isArray(v.active)&&v.active.length<=2&&
  v.active.every(isCompanionId)&&new Set(v.active).size===v.active.length&&
  v.active.every(id=>v.recruited.includes(id));
}
export function readParty(characterId:string):PartyState{
 if(!characterId)return {...EMPTY_PARTY};
 try{const raw=globalThis.localStorage?.getItem(PARTY_KEY+characterId);
  if(!raw)return {...EMPTY_PARTY};
  const val:unknown=JSON.parse(raw);return validateParty(val)?val:{...EMPTY_PARTY};
 }catch{return {...EMPTY_PARTY};}
}
export function saveParty(characterId:string,state:PartyState):boolean{
 if(!characterId||!validateParty(state))return false;
 try{const db=globalThis.localStorage;if(!db)return false;
  db.setItem(PARTY_KEY+characterId,JSON.stringify(state));return true;
 }catch{return false;}
}
export function recruitCompanion(state:PartyState,id:CompanionId,atHome:boolean):
 {ok:boolean;state:PartyState;message:string}{
 if(!atHome)return {ok:false,state,message:"Encontre este aliado em seu próprio distrito."};
 if(state.recruited.includes(id))return {ok:false,state,message:"Este aliado já integra sua rede de contatos."};
 const recruited=[...state.recruited,id];
 const active=state.active.length<2?[...state.active,id]:[...state.active];
 return {ok:true,state:{version:1,recruited,active},
 message:COMPANION_CATALOG[id].name+" recrutado. "+(active.includes(id)?"Apoio ativado.":"Abra a equipe para ativar seu apoio.")};
}
export function toggleCompanion(state:PartyState,id:CompanionId):
 {ok:boolean;state:PartyState;message:string}{
 if(!state.recruited.includes(id))return {ok:false,state,message:"Encontre e recrute este aliado primeiro."};
 if(state.active.includes(id)){
  return {ok:true,state:{...state,active:state.active.filter(x=>x!==id)},
    message:COMPANION_CATALOG[id].name+" ficou de reserva."};
 }
 if(state.active.length>=2)return {ok:false,state,message:"A equipe tática comporta apenas dois aliados ativos."};
 return {ok:true,state:{...state,active:[...state.active,id]},
  message:COMPANION_CATALOG[id].name+" ativado para a próxima operação."};
}
export function activeCompanions(state:PartyState):readonly CompanionProfile[]{
 return validateParty(state)?state.active.map(id=>COMPANION_CATALOG[id]):[];
}
export function partyPassiveBonuses(state:PartyState){
 return activeCompanions(state).reduce((b,c)=>({
  attack:b.attack+c.attack,armor:b.armor+c.armor,hp:b.hp+c.hp,
  energy:b.energy+c.energy,movement:b.movement+c.movement,
 }),{attack:0,armor:0,hp:0,energy:0,movement:0});
}
