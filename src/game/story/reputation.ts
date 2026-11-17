/**
 * Relações sociais derivadas de fatos persistidos, sem uma segunda carteira editável.
 * Não repetir recompensas no reload: a fonte é o recibo de favor e as decisões narrativas.
 */
import {readFavors,type FavorId,type FavorState} from "./favors.ts";
import {readMarket,type MarketState} from "./market.ts";
import {readFerrugem,type FerrugemProgress} from "../ferrugem/story.ts";
import {readEden,type EdenProgress} from "./eden-echoes.ts";
import {readDistrictProgress,type ChapterProgress} from "../districts/progress.ts";
import {DISTRICTS,type DistrictId} from "../districts/catalog.ts";
import {grantRewardInventoryItem,type ItemId,type InventoryState} from "../inventory.ts";

export type FactionId="helix"|"movimento_livre"|"mercado_cinzento";
export const FACTION_NAMES:Readonly<Record<FactionId,string>>={
 helix:"Helix Corporation",
 movimento_livre:"Movimento Livre",
 mercado_cinzento:"Mercado Cinzento",
};
export interface Reputation{
 honor:number;
 community:number;
 factions:Readonly<Record<FactionId,number>>;
}
export interface ReputationSource{
 favors:FavorState;market:MarketState;
 ferrugem?:FerrugemProgress;eden?:EdenProgress;
 chapters?:Partial<Record<DistrictId,ChapterProgress>>;
}
type Delta=Partial<Record<FactionId,number>>;
const FAVOR_EFFECTS:Readonly<Record<FavorId,Delta>>={
 triagem:{movimento_livre:1},filtros:{mercado_cinzento:1},
 agua:{movimento_livre:2},rotas:{mercado_cinzento:2},
 patio:{movimento_livre:1},seguranca:{movimento_livre:1,mercado_cinzento:1},
 forja:{movimento_livre:1},auditoria:{mercado_cinzento:1},
 abrigos:{movimento_livre:2},quarentena:{movimento_livre:1},
 palco:{mercado_cinzento:2},caravana:{movimento_livre:1},
 farol:{mercado_cinzento:1},conexao:{movimento_livre:2},
 neon:{mercado_cinzento:1},
};
const MARKET_EFFECTS:Readonly<Record<string,Delta>>={
 converse:{mercado_cinzento:1},mutirao:{movimento_livre:1},
 boletim:{},entrega:{mercado_cinzento:1},caminho:{mercado_cinzento:1},
 "solo-guarda":{movimento_livre:1,helix:-1},
 "netrunner-eco":{movimento_livre:1},
 "tech-bombas":{movimento_livre:1},
 "medtech-ajuda":{movimento_livre:1},
 "rockerboy-reuniao":{movimento_livre:2,helix:-1},
 "media-fonte":{movimento_livre:1,helix:-1},
 "corpo-credencial":{helix:2,movimento_livre:-1},
 "lawman-protocolo":{movimento_livre:1,helix:-1},
 "nomad-desvio":{mercado_cinzento:1},
 "street-atalho":{mercado_cinzento:2},
 "fixer-negocio":{mercado_cinzento:2,movimento_livre:1},
 "mercado-publicar":{movimento_livre:2,helix:-2},
 "mercado-proteger":{movimento_livre:1,mercado_cinzento:1},
 "helix-proposta":{helix:2,movimento_livre:-2,mercado_cinzento:-1},
 "rede-livre-apoio":{movimento_livre:1},
 "cinzento-rotas":{mercado_cinzento:1},
 "helix-autorizacao":{helix:1,movimento_livre:-2},
};
const DISTRICT_EFFECTS:Readonly<Record<DistrictId,Readonly<Record<"divulgar"|"resguardar",Delta>>>>={
 aurea:{divulgar:{movimento_livre:2,helix:-2},resguardar:{movimento_livre:1,helix:1}},
 subsolo:{divulgar:{movimento_livre:1,mercado_cinzento:-2},resguardar:{movimento_livre:1,mercado_cinzento:2}},
 "setor-zero":{divulgar:{movimento_livre:2,helix:-2},resguardar:{movimento_livre:1,mercado_cinzento:1}},
 prisma:{divulgar:{movimento_livre:2,helix:-1},resguardar:{movimento_livre:1,mercado_cinzento:1}},
 periferia:{divulgar:{movimento_livre:2,helix:-2},resguardar:{movimento_livre:1,mercado_cinzento:1}},
};
export function factionStanding(score:number):string{
 if(score<=-3)return "Hostil";
 if(score<0)return "Desconfiada";
 if(score<2)return "Neutra";
 if(score<4)return "Colaboradora";
 return "Aliada";
}
export function calculateReputation(source:ReputationSource):Reputation{
 const scores:Record<FactionId,number>={helix:0,movimento_livre:0,mercado_cinzento:0};
 const apply=(delta:Delta|undefined)=>{if(!delta)return;
  for(const key of Object.keys(scores) as FactionId[])scores[key]+=delta[key]??0;
 };
 for(const id of new Set(source.favors.claimed))apply(FAVOR_EFFECTS[id]);
 for(const decision of new Set(source.market.decisions))apply(MARKET_EFFECTS[decision]);
 if(source.eden?.completed){
  apply(source.eden.ending==="publicar"
   ?{movimento_livre:2,helix:-2,mercado_cinzento:-1}:
   {movimento_livre:2,mercado_cinzento:1,helix:-1});
 }
 if(source.ferrugem?.completed){
  apply(source.ferrugem.ending==="publicar"
   ?{movimento_livre:2,helix:-2}
   :source.ferrugem.ending==="proteger"
    ?{movimento_livre:1,mercado_cinzento:1}:{});
 }
 for(const district of DISTRICTS){
  const chapter=source.chapters?.[district.id];
  if(chapter?.completed&&chapter.ending)
   apply(DISTRICT_EFFECTS[district.id][chapter.ending]);
 }
 for(const key of Object.keys(scores) as FactionId[])
  scores[key]=Math.min(5,Math.max(-5,scores[key]));
 const honor=Math.max(0,Math.min(99999,source.favors.honor));
 const trust=Math.max(0,Math.min(5,source.market.trust));
 return {honor,community:Math.min(10,honor+trust),factions:scores};
}
export function readReputation(characterId:string):Reputation{
 return calculateReputation({
  favors:readFavors(characterId),market:readMarket(characterId),
  ferrugem:readFerrugem(characterId),eden:readEden(characterId),
  chapters:Object.fromEntries(DISTRICTS.map(d=>[d.id,readDistrictProgress(characterId,d.id)])),
 });
}
/** Recompensas únicas atreladas à decisão persistida; sobreviver a crash e reimportação. */
export const FACTION_AIDS:readonly {action:string;item:ItemId;amount:number}[]=[
 {action:"rede-livre-apoio",item:"curativo_campo",amount:2},
 {action:"cinzento-rotas",item:"conector_reuso",amount:2},
 {action:"helix-autorizacao",item:"celula_energia",amount:1},
];
export function syncFactionAids(inventory:InventoryState,market:MarketState):InventoryState{
 let next=inventory;
 for(const aid of FACTION_AIDS)
  if(market.decisions.includes(aid.action))
   next=grantRewardInventoryItem(next,aid.item,aid.amount,"rede-"+aid.action);
 return next;
}
