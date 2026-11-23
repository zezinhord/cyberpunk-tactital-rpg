/** Author-written contextual dialogue, not generated external text.
 * A check can add a narrative-only response, NEVER bypass a quest/reward API.
 * The actor can reveal only their own authored knowledge.
 */
import type {PlayerCharacter} from "../character/types.ts";
import type {ConversationNode,ConversationOption,PatioCitizen} from "../dialogues/patio.ts";
import type {Reputation} from "../story/reputation.ts";
import {statRank} from "../progression/tree.ts";
import {npcRemembers,type WorldMemory} from "./world-memory.ts";
export interface ConversationContext{
 character:PlayerCharacter;reputation:Reputation;memory:WorldMemory;
}
export function contextualPatioConversation(
 actor:PatioCitizen,node:ConversationNode,ctx:ConversationContext
):ConversationNode{
 const {character,reputation,memory}=ctx;
 const classes=[character.classId,character.multiclassId];
 const technical=classes.includes("tecnico")||classes.includes("netrunner")||
  character.originId==="pesquisador"||
  statRank(character,"interface")>=3;
 const medical=classes.includes("medtech")||statRank(character,"vigor")>=4;
 const diplomacy=statRank(character,"influencia")>=3;
 const options:ConversationOption[]=[...node.choices];
 if(actor==="lia"&&technical)options.push({
  id:"ai-lia-engineering",label:"[TÉCNICA] Auditar o protocolo da bomba",
  reply:"Lia confirma que as máquinas registram comandos de manutenção, mas não a origem da autorização. A prova física permanece na rota V-09."});
 if(actor==="ramon"&&technical)options.push({
  id:"ai-ramon-interface",label:"[INTERFACE] Analisar a credencial",
  reply:"Ramon explica que os conectores usam um protocolo de manutenção antigo. A origem da compra ainda não foi comprovada."});
 if(actor==="duda"&&medical)options.push({
  id:"ai-duda-triage",label:"[MEDICINA] Perguntar sobre os sinais da vítima",
  reply:"Duda recorda sinais de exaustão e tremores, mas não pode confirmar uma causa médica. Uma avaliação na clínica continua necessária."});
 if(actor==="duda"&&diplomacy)options.push({
  id:"ai-duda-trust",label:"[INFLUÊNCIA 3] Ouvir a versão dos moradores",
  reply:"Duda relata que a cooperativa preservou relatos em papel. Ela concorda em conversar, mas não entrega informações que desconhece."});
 const met=npcRemembers(memory,actor,"met");
 const helped=npcRemembers(memory,actor,"help");
 const isTrusted=reputation.community>=4;
 const remark=helped?" Você já nos ajudou, e não esquecemos disso.":
  met?" Reconheço você da última conversa.":
  isTrusted?" A cooperativa ouviu falar de seu trabalho no distrito.":"";
 return {...node,text:node.text+remark,choices:options};
}
