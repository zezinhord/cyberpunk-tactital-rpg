import {getClassById,isPlayableClass,type ClassId,type ClassRole,type ClassSkill} from "./registry.ts";
import type {PlayerCharacter} from "../character/types.ts";

/** Exactly two classes total: one established primary role and one secondary.
 * Choosing the second role is a paid specialization, NEVER a free full class.
 */
export const MULTICLASS_UNLOCK_LEVEL=4;
export const MULTICLASS_SKILL_COST=2;
export const SECONDARY_MAX_RANK=2;
export type HybridBonus="attack"|"armor"|"energy"|"movement";
export interface HybridArchetype{
 id:string;name:string;description:string;
 bonus:HybridBonus;bonusText:string;
}
type PairKey=`${ClassRole}+${ClassRole}`;
const ARCHETYPES:Readonly<Partial<Record<PairKey,readonly [string,string,HybridBonus]>>>={
 "offense+offense":["Executor de Rua","Duas disciplinas de assalto, uma abordagem ofensiva.","attack"],
 "control+offense":["Predador de Sinais","Combate direto apoiado por interferência digital.","attack"],
 "defense+offense":["Bastião de Choque","Ofensiva na linha de frente com proteção tática.","armor"],
 "offense+support":["Socorrista de Choque","Intervenção ofensiva com logística de campo.","energy"],
 "mobility+offense":["Infiltrador de Ataque","Ataques de oportunidade seguidos de retirada.","movement"],
 "control+control":["Arquiteto de Interferência","Duas formas de contenção e intrusão especializada.","attack"],
 "control+defense":["Guardião de Protocolos","Bloqueio de sistemas e proteção de objetivos.","armor"],
 "control+support":["Operador de Resposta","Rede, suporte e adaptação a equipamentos.","energy"],
 "control+mobility":["Fantasma de Rede","Intrusão móvel e deslocamento sob vigilância.","movement"],
 "defense+defense":["Sentinela Blindada","Proteção de posição e resistência disciplinada.","armor"],
 "defense+support":["Engenheiro de Salvamento","Proteção combinada com energia e reparos.","energy"],
 "defense+mobility":["Escolta de Fronteira","Cobertura móvel de aliados e rotas de fuga.","movement"],
 "support+support":["Especialista de Campo","Logística, tratamento e sustentação de recursos.","energy"],
 "mobility+support":["Resgatista Urbano","Mobilidade e suporte para operações de extração.","movement"],
 "mobility+mobility":["Corredor Fantasma","Manobras de escape e exploração avançada.","movement"],
};
const bonusText:Readonly<Record<HybridBonus,string>>={
 attack:"+1 de acerto básico",armor:"+1 de Defesa em combate",
 energy:"+1 de Energia máxima",movement:"+1 movimento por turno",
};
export function isValidSecondary(primary:ClassId|null,secondary:unknown):secondary is ClassId{
 return Boolean(primary&&isPlayableClass(secondary)&&secondary!==primary);
}
export function getHybridArchetype(primary:ClassId|null,secondary:ClassId|null|undefined):HybridArchetype|null{
 if(!isValidSecondary(primary,secondary))return null;
 const roles=[getClassById(primary!).role,getClassById(secondary).role].sort() as [ClassRole,ClassRole];
 const key=`${roles[0]}+${roles[1]}` as PairKey;
 const entry=ARCHETYPES[key];
 if(!entry)return null;
 return {id:key,name:entry[0],description:entry[1],
   bonus:entry[2],bonusText:bonusText[entry[2]]};
}
export function activeClassIds(char:Pick<PlayerCharacter,"classId"|"multiclassId">):ClassId[]{
 if(!char.classId||!isPlayableClass(char.classId))return [];
 return isValidSecondary(char.classId,char.multiclassId)?
  [char.classId,char.multiclassId]:[char.classId];
}
export function effectiveSkillMinimumLevel(
 char:Pick<PlayerCharacter,"classId"|"multiclassId">,skill:ClassSkill):number{
 if(char.classId===skill.classId)return skill.minimumLevel;
 if(isValidSecondary(char.classId,char.multiclassId)&&char.multiclassId===skill.classId)
  return Math.max(MULTICLASS_UNLOCK_LEVEL,skill.minimumLevel+2);
 return Number.POSITIVE_INFINITY;
}
export function effectiveSkillMaxRank(
 char:Pick<PlayerCharacter,"classId"|"multiclassId">,skill:ClassSkill):number{
 if(char.classId===skill.classId)return skill.maxRank;
 if(isValidSecondary(char.classId,char.multiclassId)&&char.multiclassId===skill.classId)
  return Math.min(SECONDARY_MAX_RANK,skill.maxRank);
 return 0;
}
