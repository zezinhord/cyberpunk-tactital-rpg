/** Important encounter introductions, staged over the ACTUAL battle scene.
 * Only summaries of canonical, already-unlocked mission objectives appear.
 * No combat stats, quest progression or rewards are modified here.
 */
import type {EncounterId} from "../types.ts";
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
export function battleIntroFor(encounter:EncounterId):BattleCinematicBeat|null{
 return INTRO[encounter]??null;
}
