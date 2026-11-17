import { TypedEventBus } from "./EventBus";
import { ALL_CLASS_SKILLS,getClassSkills } from "./classes/registry";
import { checkClassSkill,executeClassSkill,advanceClassRound,advanceClassGuard,advanceClassEnemyDebuffs } from "./classes/engine";
import { checkSpecial, useSpecial, advanceSpecialRound, isEnemyJammed, advanceBarrierAfterEnemyAction } from "./abilities/engine.ts";
import type { SpecialId } from "./abilities/catalog";
import type { AbilityCheck } from "./abilities/engine.ts";
import type { CombatVisual } from "./types";
import { findPath,getReachableCells,coverBetween,coverArmorBonus,MOVEMENT_PER_TURN,
  type CoverGrade } from "./map";
import {enemyProfile,planEnemyTurn,withinShot} from "./tactics";
import type {UrbanCombatSupport} from "./story/urban-chronicles.ts";
import type { GameEvents, GameState, Position, Unit,EncounterId } from "./types";
import type { OriginGameplayProfile } from "./character/types";
import {ITEM_CATALOG,type ItemId,type EquipmentBonuses} from "./inventory.ts";

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
  equipmentBonuses?: EquipmentBonuses;
  characterLevel?: number;
  currentHp?: number;
  progressionBonuses?:{hp:number;attack:number;armor:number;movement:number;energy:number};
  originId?: string;
  classId?: string | null;
  characterAbilities?: readonly string[];
  characterSkillRanks?:Readonly<Record<string,number>>;
  weaponId?:string|null;
  encounterId?: EncounterId;
  districtSupport?:UrbanCombatSupport|null;
}

export class TurnManager {
  private readonly events = new TypedEventBus<GameEvents>();
  private readonly originProfile?: OriginGameplayProfile;
  private readonly weaponRange:number;
  private readonly districtSupport:UrbanCombatSupport|null;
  private temporaryArmorBonus = 0;
  private temporaryMovementBonus = 0;
  private nextAttackDamageBonus = 0;
  private nextAttackAccuracyBonus = 0;
  private sabotageBlocksRecovery=false;
  private state: GameState;

  constructor(options: TurnManagerOptions = {}) {
    this.originProfile = options.originProfile;
    this.districtSupport=options.districtSupport??null;
    this.weaponRange=options.weaponId?
      (ITEM_CATALOG[options.weaponId as ItemId]?.range??1):1;
    const bonus=options.progressionBonuses;
    const movementPerTurn = Math.max(1,MOVEMENT_PER_TURN+(this.originProfile?.movementBonus??0)+(bonus?.movement??0)+(options.equipmentBonuses?.movementBonus??0)+(this.districtSupport?.movement??0));
    const maxHp = 18 + (this.originProfile?.maxHpBonus ?? 0)+(bonus?.hp??0)+(options.equipmentBonuses?.hpBonus??0);
    const maxEnergy=10+(bonus?.energy??0)+(options.equipmentBonuses?.energyBonus??0)+(this.districtSupport?.energy??0);
    const trial=options.encounterId?.startsWith("trial-")??false;
    const eden=options.encounterId?.startsWith("eden-")??false;
    const district=options.encounterId?.startsWith("district-")??false;
    const trialWaveCount=options.encounterId==="trial-3"||
      options.encounterId==="district-setor-zero"||options.encounterId==="eden-core"?3:trial||district||eden?2:1;
    const encounterHp=options.encounterId==="eden-core"?24:options.encounterId==="eden-relay"?19:options.encounterId==="v09"?16:district?17:trial?14:12;
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
          armorClass: 12 + (this.originProfile?.armorBonus ?? 0) + (options.equipmentBonuses?.armorBonus ?? 0) + (bonus?.armor??0)+(this.districtSupport?.armor??0),
          attackBonus: 5 + (this.originProfile?.attackBonus ?? 0) + (options.equipmentBonuses?.attackBonus ?? 0) + (bonus?.attack??0)+(this.districtSupport?.attack??0),
        },
        {
          id: "drone",
          name: eden?(options.encounterId==="eden-core"?"Guardião do Éden":"Interceptador de Prisma"):
            options.encounterId==="v09" ? "Unidade de Vigilância V-09"
             : district ? "Agente de Segurança Helix" : trial ? "Drone de Interceptação" : "Sentinela-07",
          side: "enemy",
          x: 6,
          y: 1,
          hp: encounterHp,
          maxHp: encounterHp,
          armorClass: 13,
          attackBonus: 4,
        },
      ],
      activeSide: "player",
      encounterId: options.encounterId ?? "test",
      wave:1,totalWaves:trialWaveCount,defeatedEnemyCount:0,
      archetypeId: "field-operative", characterLevel: options.characterLevel ?? 1,
      originId: options.originId ?? "corporativo", classId: options.classId ?? null,
      characterAbilities: options.characterAbilities ?? [],characterSkillRanks:options.characterSkillRanks ?? {}, classCooldowns:{}, classGuardBonus:0, classGuardTurns:0,
      classExtraMovement:0,classNextDamageBonus:0,classNextAccuracyBonus:0,
      classEnemyArmorReduction:0,classEnemyArmorTurns:0,
      classEnemyAttackReduction:0,classEnemyAttackTurns:0,
      energy: maxEnergy, maxEnergy,
      cooldowns: { "pulse-emp": 0, barrier: 0, regeneration: 0 },
      barrierTurns: 0, enemyJamTurns: 0, overwatchReady:false,suppressionTurns:0,
       terminalUsed: false, cue: null,
      round: 1,
      movementRemaining: movementPerTurn,
      movementPerTurn,
      mainActionAvailable: true,
      bonusActionAvailable: true,
      originAbilityAvailable: Boolean(this.originProfile),
      originAbilityName: this.originProfile?.abilityName ?? "Habilidade de origem",
      combatComplete: false,
      message: district?"Intervenção hostil no distrito · onda 1 de "+trialWaveCount+". Proteja as provas.":trial?"Operação Circuito Fantasma · onda 1 de "+trialWaveCount+". Proteja a comunidade."
        : options.encounterId==="v09" ? "Encontro V-09: neutralize a unidade que interceptou os registros de manutenção."
        : "Área de teste ativa. Alcance a sentinela e neutralize-a.",
      log: options.encounterId==="v09" ? ["[MISSÃO] V-09: ameaça localizada no Pátio do Reúso.", "[COMBATE] Proteja os registros da cooperativa."] : ["[SISTEMA] Campo de teste conectado.", "[MISSÃO] Neutralize a unidade sentinela."],
    };
  }

  getDistrictSupportDescription():string{return this.districtSupport?.label??"";}

  getState(): GameState {
    return {
      ...this.state,
      units: this.state.units.map((unit) => ({ ...unit })),
      log: [...this.state.log],
      cooldowns: { ...this.state.cooldowns },
      classCooldowns:{...this.state.classCooldowns},
      cue: this.state.cue ? {...this.state.cue,
        path:this.state.cue.path?.map(tile=>({...tile}))} : null,
    };
  }

  subscribe(listener: (state: GameState) => void): () => void {
    return this.events.on("game:state", listener);
  }

  getClassAbilities(){
    return getClassSkills(this.state.classId).filter(skill=>
      this.state.characterAbilities.includes(skill.id)
      && this.state.characterLevel>=skill.minimumLevel);
  }
  getClassAvailability(id:string):AbilityCheck{
    const skill=ALL_CLASS_SKILLS[id];
    return skill?checkClassSkill(this.state,skill):{available:false,reason:"Habilidade desconhecida."};
  }
  activateClassAbility(id:string):void{
    const skill=ALL_CLASS_SKILLS[id];
    if(!skill){this.setMessage("Habilidade desconhecida.");return;}
    const result=executeClassSkill(this.state,skill);
    if(!result.ok){this.setMessage(result.message);return;}
    this.addLog("[CLASSE] "+result.message);
    this.setCue(skill.visual,skill.target==="enemy"?"enemy":"player",result.amount);
    this.resolveEnemyDown();
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
    this.resolveEnemyDown();
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

  private setCue(visual: CombatVisual, target: "player" | "enemy" | "terminal",
    amount?: number,path?:readonly Position[]): void {
    this.state.cue = {sequence:(this.state.cue?.sequence??0)+1,
      visual,target,amount,path};
  }

  getReachableCells(): Position[] {
    const player = livingUnit(this.state.units, "runner");
    if (!player || this.state.activeSide !== "player" || this.state.combatComplete) return [];
    return getReachableCells(this.state.units, player, this.state.movementRemaining);
  }

  /** Prévia única para lógica, HUD e ação real: evita indicadores mentirosos. */
  getBasicAttackPreview():{
    available:boolean;reason:string;range:number;distance:number;
    mode:"melee"|"ranged";cover:CoverGrade;defense:number;
  }{
    const player=livingUnit(this.state.units,"runner");
    const enemy=livingUnit(this.state.units,"drone");
    const mode=this.weaponRange>1?"ranged":"melee";
    const range=this.weaponRange;
    const dist=player&&enemy?distance(player,enemy):0;
    const cover=player&&enemy&&range>1?coverBetween(player,enemy):"none";
    const defense=(enemy?.armorClass??0)+(cover==="partial"?2:0);
    let reason="";
    if(!player||!enemy)reason="Sem alvo disponível.";
    else if(this.state.combatComplete)reason="Combate encerrado.";
    else if(this.state.activeSide!=="player")reason="Aguarde seu turno.";
    else if(!this.state.mainActionAvailable)reason="Ação principal já utilizada.";
    else if(dist>range)reason="Alvo fora do alcance ("+range+" células).";
    else if(range>1&&cover==="full")reason="Disparo bloqueado por obstáculo.";
    return {available:reason==="",reason,range,distance:dist,mode,cover,defense};
  }

  canAttack(): boolean {
    return this.getBasicAttackPreview().available;
  }

  /** Intenção contextual antecipada, sem revelar resultados aleatórios. */
  getEnemyIntent():string{
    const player=livingUnit(this.state.units,"runner");
    const enemy=livingUnit(this.state.units,"drone");
    if(!player||!enemy||this.state.combatComplete)return "Sem ameaça ativa";
    if(this.state.enemyJamTurns>0)return "Interferência ativa: ação hostil bloqueada";
    return planEnemyTurn(enemy,player,this.state.units,
      enemyProfile(this.state.encounterId,this.state.wave)).intent;
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

  /** Vigilância consome a ação principal e 2 EN para preparar uma reação.
   * A linha de tiro é reavaliada após o movimento do inimigo. */
  prepareOverwatch():boolean{
    if(this.state.activeSide!=="player"||this.state.combatComplete||
       !livingUnit(this.state.units,"runner")||!livingUnit(this.state.units,"drone"))return false;
    if(!this.state.mainActionAvailable){this.setMessage("Ação principal já utilizada.");return false;}
    if(this.weaponRange<2){this.setMessage("Vigilância exige arma de fogo equipada.");return false;}
    if(this.state.energy<2){this.setMessage("Vigilância exige 2 pontos de energia.");return false;}
    this.state.energy-=2;this.state.mainActionAvailable=false;
    this.state.overwatchReady=true;
    this.state.message="Vigilância armada. Encerre o turno para reagir antes do ataque hostil.";
    this.addLog("[VIGILÂNCIA] Preparação: -2 EN, ação principal consumida.");
    this.setCue("shield","player");this.publish();return true;
  }

  /** Recarga única com ação bônus, alimentada por item real do inventário. */
  useEnergySupply(amount:number):boolean{
    if(this.state.combatComplete||this.state.activeSide!=="player"||
       !this.state.bonusActionAvailable||!Number.isFinite(amount)||amount<1||
       this.state.energy>=this.state.maxEnergy)return false;
    const gained=Math.min(Math.floor(amount),this.state.maxEnergy-this.state.energy);
    this.state.energy+=gained;this.state.bonusActionAvailable=false;
    this.setCue("repair","player",gained);
    this.state.message="Bateria de campo: +"+gained+" energia.";
    this.addLog("[ITEM] Bateria de campo: +"+gained+" energia.");
    this.publish();return true;
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
    this.setCue("move", "player",undefined,path);
    this.state.movementRemaining -= cost;
    this.state.message = `Movimento concluído: ${cost} célula(s) consumida(s).`;
    this.addLog(`[MOVIMENTO] ${player.name} avançou ${cost} célula(s).`);
    this.publish();
  }

  attack(): void {
    const preview=this.getBasicAttackPreview();
    if(!preview.available){this.setMessage(preview.reason);return;}
    const player=livingUnit(this.state.units,"runner")!;
    const enemy=livingUnit(this.state.units,"drone")!;
    const roll=rollDie(20);
    const attackBonus=player.attackBonus+this.nextAttackAccuracyBonus+
      this.state.classNextAccuracyBonus;
    const total=roll+attackBonus;
    this.state.mainActionAvailable=false;
    this.nextAttackAccuracyBonus=0;
    this.state.classNextAccuracyBonus=0;
    if(roll===20||total>=preview.defense){
      const baseDamage=rollDie(preview.mode==="ranged"?6:6)+2+
        (this.weaponRange===5?1:0);
      const damage=baseDamage+this.nextAttackDamageBonus+this.state.classNextDamageBonus;
      enemy.hp=Math.max(0,enemy.hp-damage);
      this.setCue("hit","enemy",Math.min(damage,enemy.hp+damage));
      this.state.message=preview.mode==="ranged"?
        `${player.name} disparou e causou ${damage} de dano.`:
        `${player.name} acertou e causou ${damage} de dano.`;
      this.addLog(`[ATAQUE] ${preview.mode==="ranged"?"Tiro":"Corpo a corpo"} · d20 ${roll} + ${attackBonus} = ${total} vs ${preview.defense}. ${damage} dano.`);
    }else{
      this.setCue("miss","enemy");
      this.state.message="O ataque não atingiu o alvo.";
      this.addLog(`[ATAQUE] d20 ${roll} + ${attackBonus} = ${total} vs ${preview.defense}. Falha.`);
    }
    this.nextAttackDamageBonus=0;
    this.state.classNextDamageBonus=0;
    this.resolveEnemyDown();
    this.publish();
  }

  endPlayerTurn(): void {
    if (this.state.activeSide !== "player" || this.state.combatComplete) return;
    const player = livingUnit(this.state.units, "runner");
    const enemy = livingUnit(this.state.units, "drone");
    if (!player || !enemy) return;
    this.state.activeSide = "enemy";
    this.state.message = "Turno hostil. Observe a linha de tiro e as coberturas.";
    this.addLog("[TURNO] A unidade hostil está agindo.");
    this.publish();
    const jammed = isEnemyJammed(this.state);
    if (jammed) {
      this.addLog("[CONTROLE] EMP bloqueou a ação da sentinela.");
      this.setCue("emp", "enemy");
    }
    const profile=enemyProfile(this.state.encounterId,this.state.wave);
    const pendingOverwatch=this.state.overwatchReady;
    this.state.overwatchReady=false;
    if(!jammed){
      const plan=planEnemyTurn(enemy,player,this.state.units,profile);
      if(plan.action==="advance"||plan.action==="reposition"){
        enemy.x=plan.target.x;
        enemy.y=plan.target.y;
        this.addLog("[IA TÁTICA] "+profile.name+" · "+plan.intent+".");
      }
      if(pendingOverwatch){
        if(withinShot(player,enemy,this.weaponRange)){
          const defense=enemy.armorClass+coverArmorBonus(player,enemy);
          const reactionRoll=rollDie(20);
          if(reactionRoll===20||reactionRoll+player.attackBonus>=defense){
            const damage=rollDie(6)+2+(this.weaponRange===5?1:0);
            enemy.hp=Math.max(0,enemy.hp-damage);
            this.setCue("hit","enemy",damage);
            this.addLog("[VIGILÂNCIA] Reação acertou "+profile.name+": "+damage+" dano.");
          }else{
            this.setCue("miss","enemy");
            this.addLog("[VIGILÂNCIA] Reação falhou contra defesa "+defense+".");
          }
        }else this.addLog("[VIGILÂNCIA] Sem linha de tiro: reação consumida.");
        if(enemy.hp<=0){this.resolveEnemyDown();this.publish();return;}
      }
      if(withinShot(enemy,player,profile.range)){
        const cover=profile.range>1?coverArmorBonus(enemy,player):0;
        const defense=player.armorClass+cover;
        const roll=rollDie(20),total=roll+enemy.attackBonus;
        if(roll===20||total>=defense){
          const damage=rollDie(profile.range>1?6:4)+(profile.range>1?1:1);
          player.hp=Math.max(0,player.hp-damage);
          this.setCue("hit","player",damage);
          this.addLog(`[INIMIGO] ${profile.range>1?"Disparo":"Golpe"}: d20 ${roll} + ${enemy.attackBonus} vs ${defense}. ${damage} dano.`);
          if(profile.role==="suppressor"){
            this.state.suppressionTurns=1;
            this.addLog("[SUPRESSÃO] Próximo deslocamento reduzido em 2 células.");
          }
          if(profile.role==="saboteur"){
            const drained=Math.min(2,this.state.energy);
            this.state.energy-=drained;
            this.sabotageBlocksRecovery=true;
            this.addLog("[SABOTAGEM] Interferência em baterias: -"+drained+" EN e recarga interrompida.");
          }
        }else{
          this.setCue("miss","player");
          this.addLog(`[INIMIGO] Ataque não atingiu o protagonista (defesa ${defense}).`);
        }
      }else{
        this.addLog("[IA TÁTICA] "+profile.name+" aguarda abertura na linha de tiro.");
      }
    }
    if(jammed&&pendingOverwatch)this.addLog("[VIGILÂNCIA] EMP bloqueou ação inimiga; reação consumida.");
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
    if(enemy.hp<=0){
      this.resolveEnemyDown();
      this.publish();
      return;
    }
    this.state.activeSide = "player";
    this.state.round += 1;
    if (this.temporaryMovementBonus > 0) {
      this.state.movementPerTurn -= this.temporaryMovementBonus;
      this.temporaryMovementBonus = 0;
    }
    const energyBeforeRecovery=this.state.energy;
    advanceSpecialRound(this.state);
    if(this.sabotageBlocksRecovery){
      // Sem isto, a recarga passiva (+2 EN) neutralizaria o efeito no mesmo turno.
      this.state.energy=energyBeforeRecovery;
      this.sabotageBlocksRecovery=false;
    }
    advanceClassRound(this.state);
    if (this.state.classExtraMovement>0) {
      this.state.movementPerTurn-=this.state.classExtraMovement;
      this.state.classExtraMovement=0;
    }
    const slowdown=this.state.suppressionTurns>0?2:0;
    this.state.movementRemaining = Math.max(1,this.state.movementPerTurn-slowdown);
    this.state.suppressionTurns=0;
    this.state.mainActionAvailable = true;
    this.state.bonusActionAvailable = true;
    this.state.message = slowdown?"Sob supressão: deslocamento reduzido em 2 células neste turno.":
      "Seu turno. Utilize cobertura, alcance e posicionamento para agir.";
    this.addLog(`[TURNO] Rodada ${this.state.round}. Seu turno começou.`);
    this.publish();
  }

  /** Resolve a próxima onda para qualquer fonte de dano (básico, classe ou comum).
   * Não concede missão/XP antes de TODAS as ondas terminarem.
   */
  private resolveEnemyDown():void{
    const enemy=this.state.units.find(unit=>unit.id==="drone");
    if(!enemy||enemy.hp>0||this.state.defeatedEnemyCount>=this.state.wave)return;
    // Registro por inimigo, inclusive ondas intermediárias; o App concede
    // XP com ID único e persistente no slot do personagem.
    this.state.defeatedEnemyCount++;
    const trial=this.state.encounterId.startsWith("trial-");
    const district=this.state.encounterId.startsWith("district-");
    const eden=this.state.encounterId.startsWith("eden-");
    const waves=trial||district||eden;
    if(waves&&this.state.wave<this.state.totalWaves){
      this.state.wave+=1;
      const hp=(eden?(this.state.encounterId==="eden-core"?24:19):district?17:14)+3*(this.state.wave-1);
      enemy.hp=hp;enemy.maxHp=hp;enemy.armorClass=13+this.state.wave-1;
      enemy.attackBonus=4+this.state.wave-1;
      enemy.x=6;enemy.y=1;
      enemy.name=enemyProfile(this.state.encounterId,this.state.wave).name+" · "+this.state.wave;
      this.state.combatComplete=false;
      this.state.mainActionAvailable=true;
      this.state.bonusActionAvailable=true;
      this.state.activeSide="player";
      this.state.energy=Math.min(this.state.maxEnergy,this.state.energy+3);
      this.state.movementRemaining=this.state.movementPerTurn;
      this.state.enemyJamTurns=0;
      this.state.overwatchReady=false;this.state.suppressionTurns=0;
      this.state.classEnemyArmorTurns=0;
      this.state.classEnemyArmorReduction=0;
      this.state.classEnemyAttackTurns=0;
      this.state.classEnemyAttackReduction=0;
      this.state.message="Nova ameaça! Onda "+this.state.wave+" de "+this.state.totalWaves+". Energia +3.";
      this.addLog("[CAMPANHA] Segurança enviou um novo drone. Onda "+this.state.wave+".");
      return;
    }
    this.state.combatComplete=true;
    const mission=this.state.encounterId==="v09";
    this.state.message=waves?"Todas as "+this.state.totalWaves+" ondas foram neutralizadas. Volte à exploração."
      :mission?"V-09 neutralizada. Os registros da cooperativa foram recuperados."
      :"Sentinela neutralizada. Área de teste temporariamente segura.";
    this.addLog(waves?"[CAMPANHA] Interceptação superada. Recompensa ao retornar."
      :mission?"[MISSÃO] Interceptação V-09 encerrada.":"[MISSÃO] Objetivo de teste concluído.");
  }

  private setMessage(message: string): void { this.state.message = message; this.publish(); }
  private addLog(message: string): void {
    this.state.log = [...this.state.log.slice(-7), message];
    this.events.emit("game:log", message);
  }
  private publish(): void { this.events.emit("game:state", this.getState()); }
}
