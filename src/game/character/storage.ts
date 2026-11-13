import type { CharacterSave, PlayerCharacter } from "./types";
import { isOriginId } from "./origins.ts";
import {readV09,markV09Defeated} from "../story/v09.ts";
import { isPlayableClass,getStartingClassAbilities,type ClassId } from "../classes/registry.ts";

export const CHARACTER_SAVE_KEY = "cyberpunk-tactical-rpg.character.v1";

function isPlayerCharacter(value: unknown): value is PlayerCharacter {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string"
    && typeof candidate.name === "string"
    && candidate.name.trim().length > 0
    && isOriginId(candidate.originId)
    && typeof candidate.level === "number" && Number.isSafeInteger(candidate.level) && candidate.level >= 1
    && typeof candidate.experience === "number" && Number.isSafeInteger(candidate.experience) && candidate.experience >= 0
    && typeof candidate.introductionCompleted === "boolean";
}

export function loadCharacter(): PlayerCharacter | null {
  try {
    const raw = globalThis.localStorage?.getItem(CHARACTER_SAVE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const save = parsed as Partial<CharacterSave>;
    if(save.version!==1 || !isPlayerCharacter(save.character))return null;
    const saved=save.character;
    // Migração conservadora: saves 0.6.8a sem classe continuam válidos e
    // poderão defini-la no menu sem perder nome, origem, inventário ou missão.
    const classId=isPlayableClass(saved.classId)?saved.classId:null;
    const savedAbilities=Array.isArray(saved.abilities)
      ? saved.abilities.filter((a):a is string=>typeof a==="string"):[];
    const starting=classId?getStartingClassAbilities(classId):[];
    const rewardIds=Array.isArray(saved.questRewards)
      ? saved.questRewards.filter((id):id is string=>typeof id==="string"):[];
    // Compatibilidade: personagens que venceram a V-09 antes deste patch já
    // receberam a recompensa pelo formato legado. Nunca conceder XP duas vezes.
    if(readV09(saved.id).defeated && !rewardIds.includes("v09"))rewardIds.push("v09");
    const normalized:PlayerCharacter={...saved,classId,abilities:[...new Set([...savedAbilities,...starting])],
      skills:Array.isArray(saved.skills)?saved.skills:[],
      questRewards:[...new Set(rewardIds)],
      attributes:saved.attributes && typeof saved.attributes==="object"?saved.attributes:{}};
    if(normalized.questRewards.includes("v09"))markV09Defeated(saved.id);
    return normalized;
  } catch {
    return null;
  }
}

export function saveCharacter(character: PlayerCharacter): boolean {
  try {
    if (typeof globalThis.localStorage === "undefined") return false;
    const save: CharacterSave = { version: 1, character: { ...character, updatedAt: new Date().toISOString() } };
    globalThis.localStorage?.setItem(CHARACTER_SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function deleteCharacterSave(): void {
  try { globalThis.localStorage?.removeItem(CHARACTER_SAVE_KEY); } catch { /* armazenamento indisponível */ }
}

/** A classe é uma escolha separada da origem; legado ainda aceita null. */
export function createPlayerCharacter(name:string,originId:PlayerCharacter["originId"],classId:ClassId|null=null):PlayerCharacter {
  const now = new Date().toISOString();
  const randomId = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `character-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  return {
    id: randomId,
    name: name.trim(),
    originId,
    classId,
    attributes: {},
    skills: [],
    abilities: classId?getStartingClassAbilities(classId):[],
    equipment: [],
    level: 1,
    experience: 0,
    questRewards: [],
    createdAt: now,
    updatedAt: now,
    introductionCompleted: false,
  };
}

/** Permite uma única definição de classe para personagens antigos sem classe.
 * Não reinicia nível, origem, atributos, equipamentos, missões ou inventário.
 */
export function assignCharacterClass(character:PlayerCharacter,classId:ClassId):PlayerCharacter {
 if(character.classId!==null && character.classId!==undefined)
   return character;
 if(!isPlayableClass(classId))return character;
 return {...character,classId,
   abilities:[...new Set([...(character.abilities??[]),...getStartingClassAbilities(classId)])],
   updatedAt:new Date().toISOString()};
}
