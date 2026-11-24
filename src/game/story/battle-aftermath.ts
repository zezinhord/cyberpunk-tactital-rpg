/** RC20: post-combat cinematics tied only to actual encounters and to
 * the seven persisted council decisions. This module NEVER changes quest
 * steps, awards rewards, commits a political choice or simulates an ending.
 */
import type {EncounterId} from "../types.ts";
import type {PlayerCharacter} from "../character/types.ts";
import {COUNCIL_IDS,DISTRICT_COUNCILS,readCouncils,
  isCouncilId} from "./district-councils.ts";
import {CLASS_IDS,getClassById,isPlayableClass} from "../classes/registry.ts";
import {getOriginById} from "../character/origins.ts";

export interface AftermathScene{
 cinematicId:string;speaker:string;role:string;portrait:string;text:string;
 title:string;encounter:EncounterId;
}
export const BATTLE_AFTERMATH_IDS:readonly EncounterId[]=[
 "v09","trial-1","trial-2","trial-3",
 "district-aurea","district-subsolo","district-setor-zero",
 "district-prisma","district-periferia",
 "eden-relay","eden-core","cisma-intercept","cisma-containment","cisma-core",
 ...COUNCIL_IDS.map(id=>"council-"+id as EncounterId),
] as const;
const scenes:Partial<Record<EncounterId,{title:string;detail:string}>>={
 v09:{title:"O sinal V-09",detail:"A interceptação da unidade V-09 foi interrompida. Os registros de manutenção ainda precisam ser examinados com as testemunhas e a cooperativa."},
 "trial-1":{title:"A primeira interceptação",detail:"O circuito foi defendido. Os contatos da Baixada ainda precisam confirmar quais rotas são seguras."},
 "trial-2":{title:"Sinais sob vigilância",detail:"A ameaça foi repelida, mas os dispositivos usados pelos hostis revelam preparação para novas tentativas de interceptação."},
 "trial-3":{title:"O Circuito Fantasma",detail:"O exercício operacional demonstrou que a rede pode resistir ao bloqueio. Decisões sobre os dados e os moradores permanecem na campanha."},
 "district-aurea":{title:"O arquivo intacto",detail:"A equipe Helix recuou. Os registros clínicos e os critérios de triagem continuam exigindo auditoria humana."},
 "district-subsolo":{title:"Rotas sem cadastro",detail:"Os vigias foram neutralizados. A localização dos abrigos continua sensível; os moradores decidirão o que pode ser compartilhado."},
 "district-setor-zero":{title:"O protocolo de isolamento",detail:"A defesa foi vencida. O funcionamento da quarentena ainda deve ser confrontado com o consentimento das pessoas afetadas."},
 "district-prisma":{title:"Sinal independente",detail:"O bloqueio de transmissão foi interrompido. A proteção das fontes continua tão importante quanto a divulgação das provas."},
 "district-periferia":{title:"A estrada aberta",detail:"Os perseguidores foram afastados. As caravanas ainda precisam de um acordo duradouro de abastecimento e segurança."},
 "eden-relay":{title:"O repetidor de Éden",detail:"A defesa da rede cedeu. O conteúdo do sinal e suas consequências dependem das escolhas registradas na campanha."},
 "eden-core":{title:"O núcleo preservado",detail:"Os guardiões foram neutralizados. O destino dos protocolos de Éden não é determinado pela vitória militar."},
 "cisma-intercept":{title:"Vozes em conflito",detail:"A interceptação foi vencida, mas a divergência entre controle e autonomia permanece aberta nos registros da cidade."},
 "cisma-containment":{title:"A quarentena contestada",detail:"A contenção perdeu suas unidades de segurança. A investigação e os cuidados com as pessoas afetadas continuam."},
 "cisma-core":{title:"O último bloqueio",detail:"A defesa do núcleo foi neutralizada. A escolha política permanece ligada às decisões efetivamente tomadas pelo protagonista."},
};
export function battleAftermathFor(
 encounter:EncounterId,
 character:Pick<PlayerCharacter,"id"|"originId"|"classId">,
):AftermathScene|null{
 if(!BATTLE_AFTERMATH_IDS.includes(encounter))return null;
 let title:string,detail:string,speaker="REGISTRO DE CAMPO";
 let council="";
 if(encounter.startsWith("council-")){
   const region=encounter.slice("council-".length);
   if(!isCouncilId(region))return null;
   const src=DISTRICT_COUNCILS[region];
   title="Acordo defendido · "+src.title;
   speaker=src.guide;
   const current=readCouncils(character.id);
   const choice=current.choices[region];
   const decided=choice?src.choices.find(item=>item.id===choice):undefined;
   // Only narrate facts already saved before the defense. No invented vote.
   council=decided?"A assembleia já havia decidido: "+decided.label+
     ". "+decided.outcome:"A disputa sobre a infraestrutura continua no conselho.";
   detail="Os ataques contra o acordo foram repelidos. "+council;
 }else{
   const copy=scenes[encounter];
   if(!copy)return null;
   title=copy.title;detail=copy.detail;
 }
 const origin=getOriginById(character.originId);
 const profession=isPlayableClass(character.classId)?
   getClassById(character.classId).name:null;
 const text=title+".\n\n"+detail+
   "\n\nPERSPECTIVA DO PROTAGONISTA · "+origin.name+
   (profession?" · "+profession:"")+
   ". A continuação depende dos contatos e das missões já registradas. "+
   "A vitória não substitui escolhas narrativas nem concede novos pontos de decisão.";
 return {cinematicId:"battle-aftermath:"+encounter,encounter,title,
   speaker,role:"REVELAÇÃO · DESFECHO TÁTICO",portrait:"▤",text};
}
