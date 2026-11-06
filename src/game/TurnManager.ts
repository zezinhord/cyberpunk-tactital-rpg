import { TypedEventBus } from "./EventBus";
import { findPath, getReachableCells, MOVEMENT_PER_TURN } from "./map";
import type { GameEvents, GameState, Position, Unit } from "./types";

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function distance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function livingUnit(units: Unit[], id: string): Unit | undefined {
  return units.find((unit) => unit.id === id && unit.hp > 0);
}

export class TurnManager {
  private readonly events = new TypedEventBus<GameEvents>();
  private state: GameState = {
    units: [
      {
        id: "runner",
        name: "Vesper",
        side: "player",
        x: 1,
        y: 6,
        hp: 18,
        maxHp: 18,
        armorClass: 12,
        attackBonus: 5,
      },
      {
        id: "drone",
        name: "Sentinela-07",
        side: "enemy",
        x: 6,
        y: 1,
        hp: 12,
        maxHp: 12,
        armorClass: 13,
        attackBonus: 4,
      },
    ],
    activeSide: "player",
    round: 1,
    movementRemaining: MOVEMENT_PER_TURN,
    mainActionAvailable: true,
    bonusActionAvailable: true,
    combatComplete: false,
    message: "A área está hostil. Alcance a sentinela e neutralize-a.",
    log: ["[SISTEMA] Conexão tática estabelecida.", "[MISSÃO] Neutralize a unidade sentinela."],
  };

  getState(): GameState {
    return {
      ...this.state,
      units: this.state.units.map((unit) => ({ ...unit })),
      log: [...this.state.log],
    };
  }

  subscribe(listener: (state: GameState) => void): () => void {
    return this.events.on("game:state", listener);
  }

  getReachableCells(): Position[] {
    const player = livingUnit(this.state.units, "runner");
    if (!player || this.state.activeSide !== "player" || this.state.combatComplete) return [];
    return getReachableCells(this.state.units, player, this.state.movementRemaining);
  }

  canAttack(): boolean {
    const player = livingUnit(this.state.units, "runner");
    const enemy = livingUnit(this.state.units, "drone");
    return Boolean(
      player &&
        enemy &&
        this.state.activeSide === "player" &&
        !this.state.combatComplete &&
        this.state.mainActionAvailable &&
        distance(player, enemy) <= 1,
    );
  }

  movePlayerTo(x: number, y: number): void {
    const player = livingUnit(this.state.units, "runner");
    if (!player || this.state.activeSide !== "player" || this.state.combatComplete) return;

    const path = findPath(player, { x, y }, this.state.units, player.id);
    if (!path || path.length < 2) return;

    const cost = path.length - 1;
    if (cost > this.state.movementRemaining) {
      this.setMessage("Movimento insuficiente para alcançar essa célula.");
      return;
    }

    player.x = x;
    player.y = y;
    this.state.movementRemaining -= cost;
    this.state.message = `Movimento concluído: ${cost} célula(s) consumida(s).`;
    this.addLog(`[MOVIMENTO] ${player.name} avançou ${cost} célula(s).`);
    this.publish();
  }

  attack(): void {
    const player = livingUnit(this.state.units, "runner");
    const enemy = livingUnit(this.state.units, "drone");

    if (!player || !enemy || this.state.activeSide !== "player" || this.state.combatComplete) return;
    if (!this.state.mainActionAvailable) {
      this.setMessage("Ação principal já utilizada neste turno.");
      return;
    }
    if (distance(player, enemy) > 1) {
      this.setMessage("A sentinela está fora do alcance corpo a corpo.");
      return;
    }

    const roll = rollDie(20);
    const total = roll + player.attackBonus;
    this.state.mainActionAvailable = false;

    if (roll === 20 || total >= enemy.armorClass) {
      const damage = rollDie(6) + 2;
      enemy.hp = Math.max(0, enemy.hp - damage);
      this.state.message = `${player.name} acertou o ataque e causou ${damage} de dano.`;
      this.addLog(`[ATAQUE] d20 ${roll} + ${player.attackBonus} = ${total}. ${damage} de dano.`);
    } else {
      this.state.message = `${player.name} errou o ataque.`;
      this.addLog(`[ATAQUE] d20 ${roll} + ${player.attackBonus} = ${total}. Ataque falhou.`);
    }

    if (enemy.hp <= 0) {
      this.state.combatComplete = true;
      this.state.message = "Sentinela neutralizada. Área temporariamente segura.";
      this.addLog("[MISSÃO] Objetivo concluído.");
    }

    this.publish();
  }

  endPlayerTurn(): void {
    if (this.state.activeSide !== "player" || this.state.combatComplete) return;

    const player = livingUnit(this.state.units, "runner");
    const enemy = livingUnit(this.state.units, "drone");
    if (!player || !enemy) return;

    this.state.activeSide = "enemy";
    this.state.message = "Turno da sentinela. Mantenha cobertura e prepare o próximo movimento.";
    this.addLog("[TURNO] A sentinela está agindo.");
    this.publish();

    const adjacentTargets: Position[] = [
      { x: player.x, y: player.y - 1 },
      { x: player.x + 1, y: player.y },
      { x: player.x, y: player.y + 1 },
      { x: player.x - 1, y: player.y },
    ];

    const possiblePaths = adjacentTargets
      .map((target) => findPath(enemy, target, this.state.units, enemy.id))
      .filter((path): path is Position[] => path !== null)
      .sort((a, b) => a.length - b.length);

    const path = possiblePaths[0];
    if (distance(enemy, player) > 1 && path && path.length > 1) {
      const destination = path[Math.min(2, path.length - 1)];
      if (destination) {
        enemy.x = destination.x;
        enemy.y = destination.y;
        this.addLog("[IA TÁTICA] A sentinela reposicionou-se em direção ao alvo.");
      }
    }

    if (distance(enemy, player) <= 1) {
      const roll = rollDie(20);
      const total = roll + enemy.attackBonus;
      if (roll === 20 || total >= player.armorClass) {
        const damage = rollDie(4) + 1;
        player.hp = Math.max(0, player.hp - damage);
        this.addLog(`[INIMIGO] Ataque confirmado: ${damage} de dano recebido.`);
      } else {
        this.addLog("[INIMIGO] Ataque da sentinela não atingiu o alvo.");
      }
    }

    if (player.hp <= 0) {
      this.state.combatComplete = true;
      this.state.message = "Operativo incapacitado. Missão fracassada.";
      this.addLog("[MISSÃO] Falha: o operativo foi incapacitado.");
      this.publish();
      return;
    }

    if (enemy.hp <= 0) {
      this.state.combatComplete = true;
      this.state.message = "Sentinela neutralizada. Área temporariamente segura.";
      this.publish();
      return;
    }

    this.state.activeSide = "player";
    this.state.round += 1;
    this.state.movementRemaining = MOVEMENT_PER_TURN;
    this.state.mainActionAvailable = true;
    this.state.bonusActionAvailable = true;
    this.state.message = "Seu turno. Reposicione-se ou ataque quando estiver ao alcance.";
    this.addLog(`[TURNO] Rodada ${this.state.round}. Seu turno começou.`);
    this.publish();
  }

  private setMessage(message: string): void {
    this.state.message = message;
    this.publish();
  }

  private addLog(message: string): void {
    this.state.log = [...this.state.log.slice(-7), message];
    this.events.emit("game:log", message);
  }

  private publish(): void {
    this.events.emit("game:state", this.getState());
  }
}
