import type {PlayerCharacter} from "../character/types.ts";

export type OpeningVisual="skyline"|"eden"|"districts"|"records"|"operative"|"canal";
export interface OpeningPanel{
  id:string;
  label:string;
  title:string;
  visual:OpeningVisual;
  lines:readonly string[];
}

/** Prólogo novo e opcional: nenhuma informação de campanha é desbloqueada aqui.
 * Textos curtos para Android horizontal; nenhum recurso de rede ou animação pesada.
 */
export const OPENING_PANELS:readonly OpeningPanel[]=[
  {id:"promise",label:"TRANSMISSÃO 01 · 06",title:"Uma cidade construída sobre promessas",
   visual:"skyline",lines:[
    "Chamaram de Nova Arcádia o lugar onde a tecnologia resolveria todos os problemas.",
    "Entre torres de vidro e ruas alagadas, a promessa nunca chegou por igual."
   ]},
  {id:"eden",label:"TRANSMISSÃO 02 · 06",title:"O sistema que nunca dorme",
   visual:"eden",lines:[
    "O Projeto Éden administra o trânsito, a energia e serviços essenciais.",
    "Suas decisões chegam a cada bairro. Seus critérios, quase ninguém conhece."
   ]},
  {id:"divide",label:"TRANSMISSÃO 03 · 06",title:"Dois mundos, uma cidade",
   visual:"districts",lines:[
    "Na Áurea, portas se abrem ao reconhecer uma credencial.",
    "Na Baixada, a cidade continua funcionando porque seus moradores a consertam."
   ]},
  {id:"erased",label:"TRANSMISSÃO 04 · 06",title:"Quando os nomes desaparecem",
   visual:"records",lines:[
    "Um prontuário sem assinatura. Uma rota de serviço alterada. Um nome apagado.",
    "Quem controla o registro de uma vida também pode tentar apagar seus vestígios."
   ]},
  {id:"you",label:"TRANSMISSÃO 05 · 06",title:"A cidade também é sua",
   visual:"operative",lines:[
    "{name}, sua história começou muito antes deste encontro.",
    "{originLine}"
   ]},
  {id:"begin",label:"TRANSMISSÃO 06 · 06",title:"A primeira pista",
   visual:"canal",lines:[
    "Uma médica da Baixada guardou uma cópia que deveria ter sido destruída.",
    "O código é V-09. A investigação começa na clínica comunitária."
   ]},
] as const;

const ORIGIN_LINES:Readonly<Record<PlayerCharacter["originId"],string>>={
  corporativo:"Você conhece as portas que a Helix prefere manter fechadas.",
  baixada:"Você conhece as pessoas que mantêm a Baixada viva.",
  gangue:"Você aprendeu cedo a reconhecer o preço de uma dívida.",
  militar:"Você sabe que uma ordem não significa necessariamente justiça.",
  pesquisador:"Você aprendeu a desconfiar de resultados perfeitos demais.",
  nomade:"Você reconhece caminhos que os mapas oficiais não mostram.",
};

/** Preserva dados anteriores à cutscene: ausência do marcador significa legado. */
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
