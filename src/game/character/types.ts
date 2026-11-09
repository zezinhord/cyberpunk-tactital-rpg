import type { OriginId } from "./origins";

/** Dados persistentes do protagonista, independentes das unidades de combate. */
export interface PlayerCharacter {
  id: string;
  name: string;
  originId: OriginId;
  classId: string | null;
  attributes: Readonly<Record<string, number>>;
  skills: readonly string[];
  abilities: readonly string[];
  equipment: readonly string[];
  level: number;
  experience: number;
  createdAt: string;
  updatedAt: string;
  introductionCompleted: boolean;
}

export interface OriginIntroduction {
  id: string;
  title: string;
  setting: string;
  narrative: string;
  objective: string;
  openingLine: string;
}

export type OriginAbilityEffect = "guard" | "heal" | "damage" | "accuracy" | "movement";

export interface OriginGameplayProfile {
  passiveDescription: string;
  passiveEffect: string;
  maxHpBonus: number;
  armorBonus: number;
  attackBonus: number;
  movementBonus: number;
  abilityId: string;
  abilityName: string;
  abilityDescription: string;
  abilityEffect: OriginAbilityEffect;
  abilityPower: number;
}

export interface CharacterSave {
  version: 1;
  character: PlayerCharacter;
}
