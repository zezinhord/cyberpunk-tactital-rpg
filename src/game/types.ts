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
export interface CombatCue { sequence: number; visual: CombatVisual;
 target: "player" | "enemy" | "terminal"; amount?: number;
 /** Caminho confirmado, somente para animar; regras já consomem passos no motor. */
 path?:readonly Position[];
}

export type EncounterId="test"|"v09"|"trial-1"|"trial-2"|"trial-3"|
 "district-aurea"|"district-subsolo"|"district-setor-zero"|
 "district-prisma"|"district-periferia"|"eden-relay"|"eden-core"|
 "cisma-intercept"|"cisma-containment"|"cisma-core"|
 "council-baixada"|"council-ferrugem"|"council-aurea"|
 "council-subsolo"|"council-setor-zero"|"council-prisma"|
 "council-periferia";
export interface GameState {
  units: Unit[];
  archetypeId: string;
  characterLevel: number;
  originId: string;
  classId: string | null;
  characterAbilities: readonly string[];
  characterSkillRanks?: Readonly<Record<string,number>>;
  classCooldowns: Record<string,number>;
  classGuardBonus: number;
  classGuardTurns: number;
  classExtraMovement: number;
  classNextDamageBonus: number;
  classNextAccuracyBonus: number;
  classEnemyArmorReduction: number;
  classEnemyArmorTurns: number;
  classEnemyAttackReduction: number;
  classEnemyAttackTurns: number;
  encounterId: EncounterId;
  wave:number;
  totalWaves:number;
  /** Número de inimigos efetivamente neutralizados neste encontro. */
  defeatedEnemyCount:number;
  energy: number;
  maxEnergy: number;
  cooldowns: Record<SpecialId, number>;
  barrierTurns: number;
  enemyJamTurns: number;
  /** Ação principal preparada para disparar antes da ação inimiga. */
  overwatchReady:boolean;
  /** Redução de movimento aplicada no próximo turno do jogador. */
  suppressionTurns:number;
  terminalUsed: boolean;
  cue: CombatCue | null;
  activeSide: Side;
  round: number;
  movementRemaining: number;
  movementPerTurn: number;
  /** Cada aliado ativo só presta apoio uma vez por combate. */
  companionUsed: readonly string[];
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
