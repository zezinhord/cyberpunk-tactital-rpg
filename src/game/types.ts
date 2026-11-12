export type Side = "player" | "enemy";

export interface Position {
  x: number;
  y: number;
}

export interface Unit extends Position {
  id: string;
  name: string;
  side: Side;
  hp: number;
  maxHp: number;
  armorClass: number;
  attackBonus: number;
}

import type { SpecialId } from "./abilities/catalog";

export type CombatVisual = "basic" | "hit" | "miss" | "move" | "emp" | "shield" | "repair" | "terminal";
export interface CombatCue { sequence: number; visual: CombatVisual; target: "player" | "enemy" | "terminal"; amount?: number }

export interface GameState {
  units: Unit[];
  archetypeId: string;
  characterLevel: number;
  originId: string;
  classId: string | null;
  energy: number;
  maxEnergy: number;
  cooldowns: Record<SpecialId, number>;
  barrierTurns: number;
  enemyJamTurns: number;
  terminalUsed: boolean;
  cue: CombatCue | null;
  activeSide: Side;
  round: number;
  movementRemaining: number;
  movementPerTurn: number;
  originAbilityAvailable: boolean;
  originAbilityName: string;
  mainActionAvailable: boolean;
  bonusActionAvailable: boolean;
  combatComplete: boolean;
  message: string;
  log: string[];
}

export interface GameEvents {
  "game:state": GameState;
  "game:log": string;
}
