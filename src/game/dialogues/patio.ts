import type { OriginId } from "../character/origins";

export interface ConversationOption { id:string; label:string; reply:string; clue?:string; marketAction?:string }
export interface ConversationNode {
  speaker:string; role:string; portrait:string; text:string;
  choices: readonly ConversationOption[];
}
const CONVERSATIONS = {
  lia: {
    speaker:"Lia",role:"OPERADORA DAS BOMBAS",portrait:"L",
    text:"O Pátio não parou de trabalhar nem quando a rede central cortou nossa energia. Fazemos as bombas funcionar com peças que encontramos. Ontem uma unidade de vigilância chegou com autorização que ninguém daqui reconhece.",
    choices:[
      {id:"route",label:"O que essa unidade procurava?",reply:"O código V-09 veio junto de um manifesto adulterado. A carga não era sucata. Havia material de interface neural.",clue:"lia"},
      {id:"people",label:"Como vocês mantêm as bombas ativas?",reply:"A cooperativa organiza turnos e reparos. O sistema automatizado nos chama de improdutivos, mas sem a gente o canal alaga."},
    ],
  },
  ramon:{
    speaker:"Ramon",role:"RECUPERADOR DE COMPONENTES",portrait:"R",
    text:"Tenho uma banca de componentes recuperados. Alguém começou a comprar conectores de manutenção em lotes grandes. Depois vieram os drones de patrulha.",
    choices:[
      {id:"source",label:"Quem comprou os conectores?",reply:"Usavam credenciais de manutenção, não de segurança. Uma delas estava vinculada à transferência V-09.",clue:"ramon"},
      {id:"machine",label:"Os drones são perigosos?",reply:"Eles deveriam medir pressão nos dutos. Este responde a comandos que não pertencem à rede do Pátio."},
    ],
  },
  duda:{
    speaker:"Duda",role:"MORADORA DO PÁTIO",portrait:"D",
    text:"Se fecharem as bombas, o esgoto sobe primeiro nas casas de baixo. A cidade se lembra da gente só quando precisa passar tubulação por aqui.",
    choices:[
      {id:"testimony",label:"Alguém desapareceu por aqui?",reply:"Vi uma pessoa ser escoltada pelo acesso de serviço. Parecia doente, e a equipe não deixou ninguém ajudar. Guardei o horário.",clue:"duda"},
      {id:"community",label:"O que vocês pretendem fazer?",reply:"Estamos registrando tudo fora da rede municipal. Quando os arquivos somem, os testemunhos ainda ficam."},
    ],
  },
} as const satisfies Record<string,ConversationNode>;

export type PatioCitizen = keyof typeof CONVERSATIONS;
export function isPatioCitizen(id:string):id is PatioCitizen {
  return Object.prototype.hasOwnProperty.call(CONVERSATIONS,id);
}
export function getPatioConversation(id:PatioCitizen, origin:OriginId, resolved:boolean):ConversationNode {
  const base=CONVERSATIONS[id];
  const context=origin==="pesquisador" && id==="lia" ? " Seus dados sobre interfaces neurais podem ajudar a conferir o manifesto."
    : origin==="militar" && id==="ramon" ? " Seu treinamento permite reconhecer a credencial operacional falsificada."
    : origin==="baixada" && id==="duda" ? " Você conhece a necessidade dos registros da comunidade."
    : "";
  return {...base,text:base.text+context+(resolved?
    " Depois que a sentinela foi desativada, os trabalhadores retomaram o acesso às bombas.":"")};
}
