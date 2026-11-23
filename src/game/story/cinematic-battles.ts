/** Important encounter introductions, staged over the ACTUAL battle scene.
 * Only summaries of canonical, already-unlocked mission objectives appear.
 * No combat stats, quest progression or rewards are modified here.
 */
import type {EncounterId} from "../types.ts";
import type {PlayerCharacter} from "../character/types.ts";
import type {ClassId} from "../classes/registry.ts";
export interface BattleCinematicBeat{
 cinematicId:string;speaker:string;role:string;portrait:string;text:string;
}
const INTRO:Readonly<Partial<Record<EncounterId,BattleCinematicBeat>>>={
 "v09":{cinematicId:"battle-intro:v09",speaker:"CENTRAL DE SEGURANÇA",
  role:"ABERTURA DE CONFRONTO · PÁTIO DO REÚSO",portrait:"▤",
  text:"A unidade V-09 interceptou registros de manutenção da cooperativa. As rotas do Pátio do Reúso agora são parte da investigação; neutralize a ameaça para recuperar as provas."},
 "eden-relay":{cinematicId:"battle-intro:eden-relay",speaker:"TERMINAL DE PRISMA",
  role:"ABERTURA DE CONFRONTO · SINAL DE PRISMA",portrait:"▤",
  text:"A transmissão independente revelou rotas divergentes. Uma força automatizada tenta bloquear o retransmissor: proteja o sinal e mantenha as provas acessíveis."},
 "eden-core":{cinematicId:"battle-intro:eden-core",speaker:"CONSOLE DO SETOR ZERO",
  role:"ABERTURA DE CONFRONTO · ÚLTIMA AUTORIZAÇÃO",portrait:"▤",
  text:"O repetidor do Setor Zero mantém os protocolos de contenção ativos. Supere sua defesa para recuperar a chave de auditoria sem alterar os registros."},
 "cisma-intercept":{cinematicId:"battle-intro:cisma-intercept",speaker:"CENTRAL DE PRISMA",
  role:"ABERTURA DE CONFRONTO · O CISMA DE ÉDEN",portrait:"▤",
  text:"A interceptação da rede interrompe o acesso às provas. O combate decidirá se a operação avança, mas a escolha política continuará nas mãos do protagonista."},
 "cisma-core":{cinematicId:"battle-intro:cisma-core",speaker:"CONTROLE DE ISOLAMENTO",
  role:"ABERTURA DE CONFRONTO · NÚCLEO DO CISMA",portrait:"▤",
  text:"O núcleo protegido mantém a infraestrutura sob contenção automatizada. As unidades de defesa impedem a auditoria; preserve a possibilidade de escolha depois da batalha."},
};
export const CINEMATIC_BATTLE_IDS=Object.keys(INTRO) as EncounterId[];
/** Class-specific tactical framing without inventing success, rewards or lore. */
const CLASS_FRAMING:Readonly<Record<ClassId,string>>={
 solo:"Seu treinamento favorece aproximação, fogo e uso inteligente de cobertura.",
 netrunner:"Interfaces e painéis próximos podem oferecer uma abertura para invasão digital.",
 tecnico:"Equipamentos e obstáculos danificados podem alterar as rotas de combate.",
 medtech:"Posições protegidas oferecem tempo para estabilizar aliados e conservar recursos.",
 rockerboy:"A transmissão terá alcance social; manter a equipe em ação importa.",
 midia:"Os registros são parte da disputa: preserve a prova enquanto atravessa a área.",
 corporativo:"Os protocolos de segurança da instalação têm padrões identificáveis.",
 policial:"Controle do espaço e proteção de testemunhas são prioridades.",
 nomade:"Rotas alternativas podem evitar posições expostas e emboscadas.",
 marginal:"Becos e passagens laterais podem oferecer cobertura contra hostis.",
 fixador:"Recursos e contatos disponíveis precisam ser empregados com precisão.",
};
export function battleIntroFor(encounter:EncounterId,
 character?:Pick<PlayerCharacter,"classId"|"multiclassId"|"originId">|null
):BattleCinematicBeat|null{
 const base=INTRO[encounter];
 if(!base)return null;
 const classes=[character?.classId,character?.multiclassId].filter(
   (v):v is ClassId=>Boolean(v));
 const contextual=classes.map(cls=>CLASS_FRAMING[cls]).filter(Boolean);
 const background=character?.originId==="baixada"&&encounter==="v09"?
   "A Baixada não pode perder outra cópia dos registros.":
   character?.originId==="corporativo"&&encounter==="eden-core"?
   "A infraestrutura da Helix lhe parece familiar, mas não explica todos os protocolos.":"";
 return {...base,text:[base.text,...contextual,background].filter(Boolean).join("\n\n")};
}
