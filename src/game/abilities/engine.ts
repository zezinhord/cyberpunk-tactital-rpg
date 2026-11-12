import { SPECIAL_IDS, SPECIALS } from "./catalog.ts";
import type { SpecialId } from "./catalog.ts";
import type { GameState, Unit } from "../types";

export type AbilityCheck = { available: true } | { available: false; reason: string };
export interface AbilityResult {
  ok: boolean;
  message: string;
  amount: number;
  visual?: "emp" | "shield" | "repair";
  target?: "player" | "enemy";
}

function getUnits(state: GameState): { player?: Unit; enemy?: Unit } {
  return { player: state.units.find((u) => u.id === "runner"), enemy: state.units.find((u) => u.id === "drone") };
}

export function distanceManhattan(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function checkSpecial(state: GameState, id: SpecialId): AbilityCheck {
  const def = SPECIALS[id];
  const { player, enemy } = getUnits(state);
  if (state.combatComplete || state.activeSide !== "player" || !player || player.hp <= 0) {
    return { available: false, reason: "Fora do seu turno." };
  }
  if (!state.mainActionAvailable) return { available: false, reason: "Ação principal já utilizada." };
  if (state.cooldowns[id] > 0) return { available: false, reason: "Recarga: " + state.cooldowns[id] + " turno(s)." };
  if (state.energy < def.cost) return { available: false, reason: "Energia insuficiente." };
  if (def.target === "enemy" && (!enemy || enemy.hp <= 0)) return { available: false, reason: "Sem alvo ativo." };
  if (def.condition === "enemy-in-range" && enemy && distanceManhattan(player, enemy) > def.range) {
    return { available: false, reason: "Aproxime-se a até " + def.range + " células." };
  }
  if (def.condition === "injured" && player.hp >= player.maxHp) {
    return { available: false, reason: "Vida já está no máximo." };
  }
  if (def.condition === "barrier-not-active" && state.barrierTurns > 0) {
    return { available: false, reason: "Barreira já ativa." };
  }
  return { available: true };
}

export function useSpecial(state: GameState, id: SpecialId): AbilityResult {
  const check = checkSpecial(state, id);
  if (!check.available) return { ok: false, message: check.reason, amount: 0 };
  const def = SPECIALS[id];
  const { player, enemy } = getUnits(state);
  if (!player) return { ok: false, message: "Protagonista indisponível.", amount: 0 };

  state.energy -= def.cost;
  state.mainActionAvailable = false;
  // A recarga avança na passagem para cada novo turno do jogador, inclusive a atual.
  state.cooldowns[id] = def.cooldownTurns + 1;

  let amount = 0;
  if (def.damage && enemy) {
    amount = Math.min(enemy.hp, def.damage);
    enemy.hp = Math.max(0, enemy.hp - def.damage);
  }
  if (def.healing) {
    amount = Math.min(def.healing, player.maxHp - player.hp);
    player.hp += amount;
  }
  if (def.armorBonus) {
    player.armorClass += def.armorBonus;
    state.barrierTurns = def.durationTurns;
  }
  if (def.jamTurns && enemy?.hp && enemy.hp > 0) state.enemyJamTurns = Math.max(state.enemyJamTurns, def.jamTurns);

  let message = def.name + " ativada.";
  if (def.damage) message += " Dano energético: " + amount + ".";
  if (def.healing) message += " Vida recuperada: " + amount + ".";
  if (def.armorBonus) message += " Defesa +" + def.armorBonus + " por " + def.durationTurns + " turno(s) hostis.";
  if (state.enemyJamTurns > 0 && def.jamTurns) message += " Interferência: sentinela bloqueada por 1 ação.";
  if (enemy && enemy.hp <= 0) {
    state.combatComplete = true;
    message += " Sentinela neutralizada.";
  }
  state.message = message;
  return { ok: true, message, amount, visual: def.visual, target: def.target === "enemy" ? "enemy" : "player" };
}

/** Executar uma vez no início de cada novo turno do jogador, após a ação hostil. */
export function advanceSpecialRound(state: GameState): void {
  for (const id of SPECIAL_IDS) state.cooldowns[id] = Math.max(0, state.cooldowns[id] - 1);
  state.energy = Math.min(state.maxEnergy, state.energy + 2);
}

/** Efeitos por ação inimiga: antes de movimentar/atacar, e depois da ação. */
export function isEnemyJammed(state: GameState): boolean {
  if (state.enemyJamTurns <= 0) return false;
  state.enemyJamTurns -= 1;
  return true;
}

export function advanceBarrierAfterEnemyAction(state: GameState): boolean {
  if (state.barrierTurns <= 0) return false;
  state.barrierTurns -= 1;
  if (state.barrierTurns === 0) {
    const player = state.units.find((u) => u.id === "runner");
    if (player) player.armorClass -= SPECIALS.barrier.armorBonus;
    return true;
  }
  return false;
}
