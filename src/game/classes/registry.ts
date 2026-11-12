/** Origens NÃO são classes. Nenhuma classe aprovada/selecionável ainda consta no GDD
 * ou na base 0.6.7a. Este registro permanece vazio até aprovação explícita.
 */
export type ClassRole = "offense" | "defense" | "control" | "support" | "mobility";
export interface CombatClass {
  id:string; name:string; role:ClassRole; description:string;
  startingAbilities: readonly string[];
}
export interface ClassSkill {
  id:string; classId:string; name:string; description:string;
  role:ClassRole; cost:number; cooldown:number; range:number;
  minimumLevel:number; damage:number; healing:number;
  armorBonus:number; armorDuration:number; jamTurns:number;
  area:number; visual:"emp"|"shield"|"repair"|"hit";
}
/** Não inventar nomes canônicos ou atribuir classes às seis origens. */
export const PLAYABLE_CLASSES: Readonly<Record<string,CombatClass>>={};
export const CLASS_SKILLS: Readonly<Record<string,ClassSkill>>={};
export function getClassSkills(classId:string|null):ClassSkill[] {
  if(!classId||!PLAYABLE_CLASSES[classId])return [];
  return Object.values(CLASS_SKILLS).filter(s=>s.classId===classId);
}
export function isPlayableClass(id:string|null):boolean {
  return Boolean(id&&PLAYABLE_CLASSES[id]);
}
