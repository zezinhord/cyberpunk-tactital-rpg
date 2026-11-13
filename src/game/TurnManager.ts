import { TypedEventBus } from "./EventBus";
import { CLASS_SKILLS,getClassSkills } from "./classes/registry";
import { checkClassSkill,executeClassSkill,advanceClassRound,advanceClassGuard,advanceClassEnemyDebuffs } from "./classes/engine";
import { checkSpecial, useSpecial, advanceSpecialRound, isEnemyJammed, advanceBarrierAfterEnemyAction } from "./abilities/engine.ts";
import type { SpecialId } from "./abilities/catalog";
import type { AbilityCheck } from "./abilities/engine.ts";
import type { CombatVisual } from "./types";
import { findPath, getReachableCells, MOVEMENT_PER_TURN } from "./map";
import type { GameEvents, GameState, Position, Unit } from "./types";
import type { OriginGameplayProfile } from "./character/types";

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function distance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function livingUnit(units: Unit[], id: string): Unit | undefined {
  return units.find((unit) => unit.id === id && unit.hp > 0);
}

export interface TurnManagerOptions {
  playerName?: string;
  originProfile?: OriginGameplayProfile;
  equipmentBonuses?: { attackBonus: number; armorBonus: number };
  characterLevel?: number;
  currentHp?: number;
  originId?: string;
  classId?: string | null;
  characterAbilities?: readonly string[];
  encounterId?: "test" | "v09";
}

export class TurnManager {
  private readonly events = new TypedEventBus<GameEvents>();
  private readonly originProfile?: OriginGameplayProfile;
  private temporaryArmorBonus = 0;
  private temporaryMovementBonus = 0;
  private nextAttackDamageBonus = 0;
  private nextAttackAccuracyBonus = 0;
  private state: GameState;

  constructor(options: TurnManagerOptions = {}) {
    this.originProfile = options.originProfile;
    const movementPerTurn = MOVEMENT_PER_TURN + (this.originProfile?.movementBonus ?? 0);
    const maxHp = 18 + (this.originProfile?.maxHpBonus ?? 0);
    this.state = {
      units: [
        {
          id: "runner",
          name: options.playerName?.trim() || "Operativo",
          side: "player",
          x: 1,
          y: 6,
          hp: Number.isFinite(options.currentHp)
            ? Math.min(maxHp,Math.max(1,Math.floor(options.currentHp!)))
            : maxHp,
          maxHp,
          armorClass: 12 + (this.originProfile?.armorBonus ?? 0) + (options.equipmentBonuses?.armorBonus ?? 0),
          attackBonus: 5 + (this.originProfile?.attackBonus ?? 0) + (options.equipmentBonuses?.attackBonus ?? 0),
        },
        {
          id: "drone",
          name: options.encounterId==="v09" ? "Unidade de Vigilância V-09" : "Sentinela-07",
          side: "enemy",
          x: 6,
          y: 1,
          hp: options.encounterId==="v09" ? 16 : 12,
          maxHp: options.encounterId==="v09" ? 16 : 12,
          armorClass: 13,
          attackBonus: 4,
        },
      ],
      activeSide: "player",
      encounterId: options.encounterId ?? "test",
      archetypeId: "field-operative", characterLevel: options.characterLevel ?? 1,
      originId: options.originId ?? "corporativo", classId: options.classId ?? null,
      characterAbilities: options.characterAbilities ?? [], classCooldowns:{}, classGuardBonus:0, classGuardTurns:0,
      classExtraMovement:0,classNextDamageBonus:0,classNextAccuracyBonus:0,
      classEnemyArmorReduction:0,classEnemyArmorTurns:0,
      classEnemyAttackReduction:0,classEnemyAttackTurns:0,
      energy: 10, maxEnergy: 10,
      cooldowns: { "pulse-emp": 0, barrier: 0, regeneration: 0 },
      barrierTurns: 0, enemyJamTurns: 0, terminalUsed: false, cue: null,
      round: 1,
      movementRemaining: movementPerTurn,
      movementPerTurn,
      mainActionAvailable: true,
      bonusActionAvailable: true,
      originAbilityAvailable: Boolean(this.originProfile),
      originAbilityName: this.originProfile?.abilityName ?? "Habilidade de origem",
      combatComplete: false,
      message: options.encounterId==="v09" ? "Encontro V-09: neutralize a unidade que interceptou os registros de manutenção." : "Área de teste ativa. Alcance a sentinela e neutralize-a.",
      log: options.encounterId==="v09" ? ["[MISSÃO] V-09: ameaça localizada no Pátio do Reúso.", "[COMBATE] Proteja os registros da cooperativa."] : ["[SISTEMA] Campo de teste conectado.", "[MISSÃO] Neutralize a unidade sentinela."],
    };
  }

  getState(): GameState {
    return {
      ...this.state,
      units: this.state.units.map((unit) => ({ ...unit })),
      log: [...this.state.log],
      cooldowns: { ...this.state.cooldowns },
      classCooldowns:{...this.state.classCooldowns},
      cue: this.state.cue ? { ...this.state.cue } : null,
    };
  }

  subscribe(listener: (state: GameState) => void): () => void {
    return this.events.on("game:state", listener);
  }

  getClassAbilities(){return getClassSkills(this.state.classId);}
  getClassAvailability(id:string):AbilityCheck{
    const skill=CLASS_SKILLS[id];
    return skill?checkClassSkill(this.state,skill):{available:false,reason:"Habilidade desconhecida."};
  }
  activateClassAbility(id:string):void{
    const skill=CLASS_SKILLS[id];
    if(!skill){this.setMessage("Habilidade desconhecida.");return;}
    const result=executeClassSkill(this.state,skill);
    if(!result.ok){this.setMessage(result.message);return;}
    this.addLog("[CLASSE] "+result.message);
    this.setCue(skill.visual,skill.target==="enemy"?"enemy":"player",result.amount);
    this.publish();
  }
  getSpecialAvailability(id: SpecialId): AbilityCheck {
    return checkSpecial(this.state, id);
  }

  activateSpecial(id: SpecialId): void {
    const result = useSpecial(this.state, id);
    if (!result.ok) {
      this.setMessage(result.message);
      return;
    }
    this.addLog("[ESPECIAL] " + result.message);
    this.setCue(result.visual ?? "basic", result.target ?? "player", result.amount);
    this.publish();
  }

  interactWithTerminal(x: number, y: number): void {
    const player = livingUnit(this.state.units, "runner");
    if (!player || x !== 0 || y !== 6 || this.state.activeSide !== "player" || this.state.combatComplete) return;
    if (distance(player, { x, y }) > 1) {
      this.setMessage("Aproxime-se do terminal para ativá-lo.");
      return;
    }
    if (this.state.terminalUsed) {
      this.setMessage("Terminal auxiliar já utilizado neste teste.");
      return;
    }
    if (this.state.energy === this.state.maxEnergy) {
      this.setMessage("Energia já está no máximo. Use uma habilidade antes de acessar o terminal.");
      return;
    }
    const recovered = Math.min(3, this.state.maxEnergy - this.state.energy);
    this.state.energy += recovered;
    this.state.terminalUsed = true;
    this.state.message = "Terminal auxiliar: +" + recovered + " de energia. Acesso consumido.";
    this.addLog("[OBJETO] Terminal recuperou +" + recovered + " energia.");
    this.setCue("terminal", "terminal", recovered);
    this.publish();
  }

  private setCue(visual: CombatVisual, target: "player" | "enemy" | "terminal", amount?: number): void {
    this.state.cue = { sequence: (this.state.cue?.sequence ?? 0) + 1, visual, target, amount };
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
      player && enemy && this.state.activeSide === "player" && !this.state.combatComplete
      && this.state.mainActionAvailable && distance(player, enemy) <= 1,
    );
  }

  activateOriginAbility(): void {
    const player = livingUnit(this.state.units, "runner");
    const profile = this.originProfile;
    if (!player || !profile || !this.state.originAbilityAvailable || this.state.activeSide !== "player" || this.state.combatComplete) return;

    this.state.originAbilityAvailable = false;
    switch (profile.abilityEffect) {
      case "guard":
        player.armorClass += profile.abilityPower;
        this.temporaryArmorBonus += profile.abilityPower;
        this.state.message = `${profile.abilityName}: Defesa aumentada até a próxima ação inimiga.`;
        break;
      case "heal": {
        const healed = Math.min(profile.abilityPower, player.maxHp - player.hp);
        player.hp += healed;
        this.state.message = healed > 0
          ? `${profile.abilityName}: ${healed} pontos de Vida recuperados.`
          : "Sua Vida já está no máximo; o recurso de origem foi consumido.";
        break;
      }
      case "damage":
        this.nextAttackDamageBonus += profile.abilityPower;
        this.state.message = `${profile.abilityName}: próximo ataque causará +${profile.abilityPower} de dano se acertar.`;
        break;
      case "accuracy":
        this.nextAttackAccuracyBonus += profile.abilityPower;
        this.state.message = `${profile.abilityName}: +${profile.abilityPower} no próximo teste de ataque.`;
        break;
      case "movement":
        this.state.movementRemaining += profile.abilityPower;
        this.state.movementPerTurn += profile.abilityPower;
        this.temporaryMovementBonus += profile.abilityPower;
        this.state.message = `${profile.abilityName}: +${profile.abilityPower} células de movimento neste turno.`;
        break;
    }
    this.addLog(`[ORIGEM] ${profile.abilityName} foi utilizada.`);
    this.publish();
  }

  useMedicalSupply(amount: number): boolean {
    const player = livingUnit(this.state.units, "runner");
    if (!player || !Number.isFinite(amount) || amount <= 0 || this.state.activeSide !== "player"
        || !this.state.bonusActionAvailable || this.state.combatComplete || player.hp >= player.maxHp) {
      return false;
    }
    const healed = Math.min(Math.floor(amount), player.maxHp - player.hp);
    player.hp += healed;
    this.setCue("repair", "player", healed);
    this.state.bonusActionAvailable = false;
    this.state.message = "Curativo de campo: " + healed + " pontos de Vida recuperados.";
    this.addLog("[ITEM] Curativo utilizado: +" + healed + " Vida.");
    this.publish();
    return true;
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
    this.setCue("move", "player");
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
    const attackBonus = player.attackBonus + this.nextAttackAccuracyBonus + this.state.classNextAccuracyBonus;
    const total = roll + attackBonus;
    this.state.mainActionAvailable = false;
    this.nextAttackAccuracyBonus = 0;
    this.state.classNextAccuracyBonus = 0;
    if (roll === 20 || total >= enemy.armorClass) {
      const baseDamage = rollDie(6) + 2;
      const damage = baseDamage + this.nextAttackDamageBonus + this.state.classNextDamageBonus;
      this.nextAttackDamageBonus = 0;
      this.state.classNextDamageBonus=0;
      enemy.hp = Math.max(0, enemy.hp - damage);
      this.setCue("hit", "enemy", damage);
      this.state.message = `${player.name} acertou o ataque e causou ${damage} de dano.`;
      this.addLog(`[ATAQUE] d20 ${roll} + ${attackBonus} = ${total}. ${damage} de dano.`);
    } else {
      this.nextAttackDamageBonus = 0;
      this.state.classNextDamageBonus=0;
      this.setCue("miss", "enemy");
      this.state.message = `${player.name} errou o ataque.`;
      this.addLog(`[ATAQUE] d20 ${roll} + ${attackBonus} = ${total}. Ataque falhou.`);
    }
    if (enemy.hp <= 0) {
      this.state.combatComplete = true;
      const mission=this.state.encounterId==="v09";
      this.state.message = mission
        ? "V-09 neutralizada. Os registros da cooperativa foram recuperados."
        : "Sentinela neutralizada. Área de teste temporariamente segura.";
      this.addLog(mission?"[MISSÃO] Interceptação V-09 encerrada.":"[MISSÃO] Objetivo de teste concluído.");
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
    const jammed = isEnemyJammed(this.state);
    if (jammed) {
      this.addLog("[CONTROLE] EMP bloqueou a ação da sentinela.");
      this.setCue("emp", "enemy");
    }
    const adjacentTargets: Position[] = [
      { x: player.x, y: player.y - 1 }, { x: player.x + 1, y: player.y },
      { x: player.x, y: player.y + 1 }, { x: player.x - 1, y: player.y },
    ];
    const possiblePaths = adjacentTargets
      .map((target) => findPath(enemy, target, this.state.units, enemy.id))
      .filter((path): path is Position[] => path !== null)
      .sort((a, b) => a.length - b.length);
    const path = possiblePaths[0];
    if (!jammed && distance(enemy, player) > 1 && path && path.length > 1) {
      const destination = path[Math.min(2, path.length - 1)];
      if (destination) {
        enemy.x = destination.x;
        enemy.y = destination.y;
        this.addLog("[IA TÁTICA] A sentinela reposicionou-se em direção ao alvo.");
      }
    }
    if (!jammed && distance(enemy, player) <= 1) {
      const roll = rollDie(20);
      const total = roll + enemy.attackBonus;
      if (roll === 20 || total >= player.armorClass) {
        const damage = rollDie(4) + 1;
        player.hp = Math.max(0, player.hp - damage);
        this.setCue("hit", "player", damage);
        this.addLog(`[INIMIGO] Ataque confirmado: ${damage} de dano recebido.`);
      } else {
        this.addLog("[INIMIGO] Ataque da sentinela não atingiu o alvo.");
      }
    }
    advanceBarrierAfterEnemyAction(this.state);
    advanceClassGuard(this.state);
    advanceClassEnemyDebuffs(this.state);
    if (this.temporaryArmorBonus > 0) {
      player.armorClass -= this.temporaryArmorBonus;
      this.temporaryArmorBonus = 0;
    }
    if (player.hp <= 0) {
      this.state.combatComplete = true;
      this.state.message = this.state.encounterId==="v09"
        ? "Operativo incapacitado. A unidade V-09 continua ativa."
        : "Operativo incapacitado. Teste encerrado.";
      this.addLog(this.state.encounterId==="v09"
        ? "[MISSÃO] Confronto V-09 perdido; investigação ainda em andamento."
        : "[MISSÃO] Falha: o operativo foi incapacitado.");
      this.publish();
      return;
    }
    if (enemy.hp <= 0) {
      this.state.combatComplete = true;
      this.state.message = this.state.encounterId==="v09"
        ? "V-09 neutralizada. Os registros da cooperativa foram recuperados."
        : "Sentinela neutralizada. Área de teste temporariamente segura.";
      this.publish();
      return;
    }
    this.state.activeSide = "player";
    this.state.round += 1;
    if (this.temporaryMovementBonus > 0) {
      this.state.movementPerTurn -= this.temporaryMovementBonus;
      this.temporaryMovementBonus = 0;
    }
    advanceSpecialRound(this.state);
    advanceClassRound(this.state);
    if (this.state.classExtraMovement>0) {
      this.state.movementPerTurn-=this.state.classExtraMovement;
      this.state.classExtraMovement=0;
    }
    this.state.movementRemaining = this.state.movementPerTurn;
    this.state.mainActionAvailable = true;
    this.state.bonusActionAvailable = true;
    this.state.message = "Seu turno. Reposicione-se ou ataque quando estiver ao alcance.";
    this.addLog(`[TURNO] Rodada ${this.state.round}. Seu turno começou.`);
    this.publish();
  }

  private setMessage(message: string): void { this.state.message = message; this.publish(); }
  private addLog(message: string): void {
    this.state.log = [...this.state.log.slice(-7), message];
    this.events.emit("game:log", message);
  }
  private publish(): void { this.events.emit("game:state", this.getState()); }
}
