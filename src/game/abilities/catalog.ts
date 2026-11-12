/** Habilidades do arquétipo Operativo de Campo no Limbo de Teste.
 * São protótipos de regras, ainda NÃO são poderes canônicos do Projeto Éden.
 */
export const SPECIAL_IDS = ["pulse-emp", "barrier", "regeneration"] as const;
export type SpecialId = (typeof SPECIAL_IDS)[number];
import type { OriginId } from "../character/origins";
export type AbilityKind = "offense" | "defense" | "support" | "control" | "mobility";
export type AbilityTarget = "enemy" | "self";
export type AbilityCondition = "enemy-in-range" | "injured" | "barrier-not-active";
export type AbilityVisual = "emp" | "shield" | "repair";

export interface SpecialDefinition {
  id: SpecialId;
  name: string;
  description: string;
  archetype: "field-operative";
  requiredOrigin?: OriginId;
  requiredClass?: string;
  minimumLevel: number;
  kind: AbilityKind;
  target: AbilityTarget;
  cost: number;
  range: number;
  area: number;
  cooldownTurns: number;
  durationTurns: number;
  damage: number;
  healing: number;
  armorBonus: number;
  jamTurns: number;
  condition: AbilityCondition;
  visual: AbilityVisual;
  maximumRank: number;
  rankBonus: string;
}

export const SPECIALS: Readonly<Record<SpecialId, SpecialDefinition>> = {
  "pulse-emp": {
    id: "pulse-emp", name: "Pulso Eletromagnético",
    description: "Descarga de curto alcance. Causa 5 de dano e interrompe a próxima ação da sentinela.",
    archetype: "field-operative", minimumLevel: 1,
    kind: "control", target: "enemy", condition: "enemy-in-range",
    cost: 3, range: 3, area: 0, cooldownTurns: 2, durationTurns: 1,
    damage: 5, healing: 0, armorBonus: 0, jamTurns: 1,
    visual: "emp", maximumRank: 3, rankBonus: "Evolução futura: dano e alcance.",
  },
  barrier: {
    id: "barrier", name: "Barreira de Energia",
    description: "Ganha +3 de Defesa contra as próximas 2 ações da sentinela.",
    archetype: "field-operative", minimumLevel: 1,
    kind: "defense", target: "self", condition: "barrier-not-active",
    cost: 3, range: 0, area: 0, cooldownTurns: 3, durationTurns: 2,
    damage: 0, healing: 0, armorBonus: 3, jamTurns: 0,
    visual: "shield", maximumRank: 3, rankBonus: "Evolução futura: proteção e duração.",
  },
  regeneration: {
    id: "regeneration", name: "Protocolo de Regeneração",
    description: "Nanorreparos de emergência. Recupera até 7 pontos de Vida.",
    archetype: "field-operative", minimumLevel: 1,
    kind: "support", target: "self", condition: "injured",
    cost: 4, range: 0, area: 0, cooldownTurns: 3, durationTurns: 0,
    damage: 0, healing: 7, armorBonus: 0, jamTurns: 0,
    visual: "repair", maximumRank: 3, rankBonus: "Evolução futura: recuperação e custo.",
  },
};
