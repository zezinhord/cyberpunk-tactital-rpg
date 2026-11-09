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

export interface GameState {
  units: Unit[];
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
