import { TypedEventBus } from "./EventBus";
import { ALL_CLASS_SKILLS,getClassSkills,isPlayableClass } from "./classes/registry";
import {getHybridArchetype,isValidSecondary,MULTICLASS_UNLOCK_LEVEL} from "./classes/hybrids.ts";
import { checkClassSkill,executeClassSkill,advanceClassRound,advanceClassGuard,advanceClassEnemyDebuffs } from "./classes/engine";
import { checkSpecial, useSpecial, advanceSpecialRound, isEnemyJammed, advanceBarrierAfterEnemyAction } from "./abilities/engine.ts";
import type { SpecialId } from "./abilities/catalog";
import type { AbilityCheck } from "./abilities/engine.ts";
import type { CombatVisual } from "./types";
import { findPath,getReachableCells,pathCost,elevationAccuracyBonus,
  coverBetween,coverArmorBonus,MOVEMENT_PER_TURN,
  type CoverGrade } from "./map";
import {enemyProfile,withinShot} from "./tactics";
import {decideEnemy,hearEnemy,initialEnemyMemory,
  type EnemyMemory} from "./ai/tactical-brain.ts";
import {hasLineOfSight,hasObjectLineOfSight} from "./map.ts";
import {capacityForEnemy,enemyTacticTurn,initializeEnemyTactics,
  type EnemyTacticPool} from "./ai/enemy-resources.ts";
import type {EnemyRole} from "./tactics.ts";
import {attackHits,attackHitChance} from "./combat/attack-rules.ts";
import {activeEnemies,targetEnemy,spawnSquadMembers,squadSupportProfile}
  from "./combat/squad-encounters.ts";
import type {UrbanCombatSupport} from "./story/urban-chronicles.ts";
import type { GameEvents, GameState, Position, Unit,EncounterId } from "./types";
import type { OriginGameplayProfile } from "./character/types";
import {ITEM_CATALOG,type ItemId,type EquipmentBonuses} from "./inventory.ts";
import type {CompanionProfile,CompanionId} from "./companions.ts";
import {chooseCompanionAction,type PartyPosture} from "./ai/companion-brain.ts";
import type {StealthRecord} from "./stealth.ts";
import {layoutForEncounter,copyTacticalLayout,updateTacticalProp,
  type TacticalLayout,type TacticalPropState} from "./combat/tactical-maps.ts";
import {activateSiegeTerminal} from "./combat/siege-terminals.ts";

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
  multiclassId?: string | null;
  characterAbilities?: readonly string[];
  characterSkillRanks?:Readonly<Record<string,number>>;
  weaponId?:string|null;
  encounterId?: EncounterId;
  /** Slot identity isolates environmental changes between protagonists. */
  characterId?:string;
  districtSupport?:UrbanCombatSupport|null;
  partySupport?:readonly CompanionProfile[];
  partyPosture?:PartyPosture;
  infiltration?:StealthRecord|null;
}

export class TurnManager {
  private readonly events = new TypedEventBus<GameEvents>();
  private readonly originProfile?: OriginGameplayProfile;
  private readonly arenaLayout:TacticalLayout|null;
  private readonly environmentStorageKey:string|null;
  private readonly weaponRange:number;
  private readonly districtSupport:UrbanCombatSupport|null;
  private readonly partySupport:readonly CompanionProfile[];
  private readonly partyPosture:PartyPosture;
  private temporaryArmorBonus = 0;
  private temporaryMovementBonus = 0;
  private nextAttackDamageBonus = 0;
  private nextAttackAccuracyBonus = 0;
  private sabotageBlocksRecovery=false;
  private aiMemory:EnemyMemory=initialEnemyMemory();
  private readonly wingMemories=new Map<string,EnemyMemory>();
  private state: GameState;

  constructor(options: TurnManagerOptions = {}) {
    this.originProfile = options.originProfile;
    this.arenaLayout=copyTacticalLayout(layoutForEncounter(options.encounterId??"test"));
    this.environmentStorageKey=options.characterId&&this.arenaLayout?
      "nova-arcadia.tactical-env.v2."+options.characterId+"."+(options.encounterId??"test"):null;
    this.restoreEnvironment();
    this.districtSupport=options.districtSupport??null;
    this.partySupport=(options.partySupport??[]).slice(0,2);
    this.partyPosture=options.partyPosture??"manual";
    const party=this.partySupport.reduce((sum,c)=>({
      attack:sum.attack+c.attack,armor:sum.armor+c.armor,
      hp:sum.hp+c.hp,energy:sum.energy+c.energy,movement:sum.movement+c.movement,
    }),{attack:0,armor:0,hp:0,energy:0,movement:0});
    this.weaponRange=options.weaponId?
      (ITEM_CATALOG[options.weaponId as ItemId]?.range??1):1;
    const bonus=options.progressionBonuses;
    const primary=isPlayableClass(options.classId)?options.classId:null;
    const secondary=primary&&(options.characterLevel??1)>=MULTICLASS_UNLOCK_LEVEL&&
      isValidSecondary(primary,options.multiclassId)?options.multiclassId:null;
    const archetype=getHybridArchetype(primary,secondary);
    const bonusKind=archetype?.bonus;
    const movementPerTurn = Math.max(1,MOVEMENT_PER_TURN+
      (bonusKind==="movement"?1:0)+(this.originProfile?.movementBonus??0)+(bonus?.movement??0)+(options.equipmentBonuses?.movementBonus??0)+(this.districtSupport?.movement??0)+party.movement);
    const maxHp = 18 + (this.originProfile?.maxHpBonus ?? 0)+(bonus?.hp??0)+(options.equipmentBonuses?.hpBonus??0)+party.hp;
    const maxEnergy=10+(bonus?.energy??0)+(options.equipmentBonuses?.energyBonus??0)+(this.districtSupport?.energy??0)+party.energy+(bonusKind==="energy"?1:0);
    const trial=options.encounterId?.startsWith("trial-")??false;
    const eden=options.encounterId?.startsWith("eden-")??false;
    const district=options.encounterId?.startsWith("district-")??false;
    const council=options.encounterId?.startsWith("council-")??false;
    const cisma=options.encounterId?.startsWith("cisma-")??false;
    const trialWaveCount=options.encounterId==="trial-3"||
      options.encounterId==="district-setor-zero"||options.encounterId==="eden-core"||
      options.encounterId==="cisma-core"||options.encounterId==="council-setor-zero"||
      options.encounterId==="council-aurea"?3:trial||district||eden||cisma||council?2:1;
    const infiltration=options.infiltration?.encounter===options.encounterId?
      options.infiltration:null;
    const firstEnemyRole=enemyProfile(options.encounterId??"test",1).role;
    const encounterHp=options.encounterId==="cisma-core"?25:
      options.encounterId==="cisma-containment"?22:
      options.encounterId==="cisma-intercept"?20:
      options.encounterId==="eden-core"?24:options.encounterId==="eden-relay"?19:options.encounterId==="v09"?16:council?21:district?17:trial?14:12;
    this.state = {
      units: [
        {
          id: "runner",
          name: options.playerName?.trim() || "Operativo",
          side: "player",
          x: this.arenaLayout?.playerSpawn.x??1,
          y: this.arenaLayout?.playerSpawn.y??6,
          hp: Number.isFinite(options.currentHp)
            ? Math.min(maxHp,Math.max(1,Math.floor(options.currentHp!)))
            : maxHp,
          maxHp,
          armorClass: 12 + (this.originProfile?.armorBonus ?? 0) + (options.equipmentBonuses?.armorBonus ?? 0) + (bonus?.armor??0)+(this.districtSupport?.armor??0)+party.armor+(bonusKind==="armor"?1:0),
          attackBonus: 5 + (this.originProfile?.attackBonus ?? 0) + (options.equipmentBonuses?.attackBonus ?? 0) + (bonus?.attack??0)+(this.districtSupport?.attack??0)+party.attack+(bonusKind==="attack"?1:0),
        },
        {
          id: "drone",
          name: council?enemyProfile(options.encounterId!,1).name:
            cisma?enemyProfile(options.encounterId??"cisma-intercept",1).name:
            eden?(options.encounterId==="eden-core"?"Guardião do Éden":"Interceptador de Prisma"):
            options.encounterId==="v09" ? "Unidade de Vigilância V-09"
             : district ? "Agente de Segurança Helix" : trial ? "Drone de Interceptação" : "Sentinela-07",
          side: "enemy",
          x: this.arenaLayout?.enemySpawn.x??6,
          y: this.arenaLayout?.enemySpawn.y??1,
          hp: Math.max(1,encounterHp-(infiltration?.outcome==="undetected"?5:0)),
          maxHp: encounterHp,
          armorClass: 13,
          attackBonus: 4+(infiltration?.outcome==="spotted"?1:0),
        },
      ],
      activeSide: "player",
      selectedEnemyId:"drone",
      encounterId: options.encounterId ?? "test",
      wave:1,totalWaves:trialWaveCount,defeatedEnemyCount:0,
      archetypeId: archetype?.id??"field-operative",enemyAwareness:"patrol",
      enemyPerception:"Nenhuma percepção hostil confirmada",
      enemyTacticalCharges:capacityForEnemy(firstEnemyRole),
      enemyTacticalCooldown:0,enemyTacticalRole:firstEnemyRole,
      characterLevel: options.characterLevel ?? 1,
      originId: options.originId ?? "corporativo", classId: primary,multiclassId:secondary,
      characterAbilities: options.characterAbilities ?? [],characterSkillRanks:options.characterSkillRanks ?? {}, classCooldowns:{}, classGuardBonus:0, classGuardTurns:0,
      classExtraMovement:0,classNextDamageBonus:0,classNextAccuracyBonus:0,
      classEnemyArmorReduction:0,classEnemyArmorTurns:0,
      classEnemyAttackReduction:0,classEnemyAttackTurns:0,
      energy: maxEnergy, maxEnergy,
      cooldowns: { "pulse-emp": 0, barrier: 0, regeneration: 0 },
      barrierTurns: 0,
      enemyJamTurns: infiltration?.outcome==="undetected"?1:0,
      overwatchReady:false,suppressionTurns:0,
      companionUsed:[],
       terminalUsed: false, cue: null,
      round: 1,
      movementRemaining: movementPerTurn,
      movementPerTurn,
      mainActionAvailable: true,
      bonusActionAvailable: true,
      originAbilityAvailable: Boolean(this.originProfile),
      originAbilityName: this.originProfile?.abilityName ?? "Habilidade de origem",
      combatComplete: false,
      message: cisma?"O Cisma de Éden · defesa hostil · onda 1 de "+trialWaveCount+
        ". "+(infiltration?.outcome==="undetected"?"Infiltração: abertura silenciosa!":
         infiltration?.outcome==="spotted"?"Infiltração detectada: vigias reforçados.":
         "Proteja as provas e os pacientes."):
        council?"DEFESA DO CONSELHO · onda 1 de "+trialWaveCount+". Preserve o acordo coletivo.":
        district?"Intervenção hostil no distrito · onda 1 de "+trialWaveCount+". Proteja as provas.":trial?"Operação Circuito Fantasma · onda 1 de "+trialWaveCount+". Proteja a comunidade."
        : options.encounterId==="v09" ? "Encontro V-09: neutralize a unidade que interceptou os registros de manutenção."
        : "Área de teste ativa. Alcance a sentinela e neutralize-a.",
      log: options.encounterId==="v09" ? ["[MISSÃO] V-09: ameaça localizada no Pátio do Reúso.", "[COMBATE] Proteja os registros da cooperativa."] : ["[SISTEMA] Campo de teste conectado.", "[MISSÃO] Neutralize a unidade sentinela."],
    };
    const player=this.state.units[0]!,leader=this.state.units[1]!;
    this.state.units.push(...spawnSquadMembers(this.state.encounterId,
      this.state.wave,leader,player,this.arenaLayout));
    if(this.state.units.length>2)
      this.state.message+=" · Ameaça coordenada: "+(this.state.units.length-1)+
        " unidades hostis presentes.";
  }

  getCompanionSupports():readonly CompanionProfile[]{return this.partySupport;}
  useCompanionSupport(id:CompanionId):boolean{
    const member=this.partySupport.find(c=>c.id===id);
    const p=livingUnit(this.state.units,"runner");
    const enemy=targetEnemy(this.state);
    if(!member||!p||!enemy||this.state.combatComplete||
       this.state.activeSide!=="player"||!this.state.bonusActionAvailable||
       this.state.companionUsed.includes(id))return false;
    if(member.aid==="heal"&&p.hp>=p.maxHp){
      this.setMessage("O protagonista já está com Vida máxima.");return false;
    }
    if(member.aid==="energy"&&this.state.energy>=this.state.maxEnergy){
      this.setMessage("A reserva de energia já está completa.");return false;
    }
    const amount=member.aid==="heal"?
      Math.min(member.power,p.maxHp-p.hp):
      member.aid==="energy"?Math.min(member.power,this.state.maxEnergy-this.state.energy):
      member.power;
    if(member.aid==="heal")p.hp+=amount;
    else if(member.aid==="energy")this.state.energy+=amount;
    else if(member.aid==="jam")this.state.enemyJamTurns=Math.max(this.state.enemyJamTurns,amount);
    else this.nextAttackAccuracyBonus+=amount;
    this.state.companionUsed=[...this.state.companionUsed,id];
    this.state.bonusActionAvailable=false;
    this.state.message=member.name+" prestou apoio tático: "+member.description;
    this.addLog("[ALIADO] "+member.name+": "+member.description);
    this.setCue(member.aid==="jam"?"emp":
      member.aid==="focus"?"shield":"repair",
      member.aid==="jam"?"enemy":"player",amount);
    this.publish();return true;
  }
  getDistrictSupportDescription():string{return this.districtSupport?.label??"";}
  getArenaLayout():TacticalLayout|null{return this.arenaLayout;}
  private restoreEnvironment():void{
    if(!this.environmentStorageKey||!this.arenaLayout||typeof localStorage==="undefined")return;
    try{
      const record=JSON.parse(localStorage.getItem(this.environmentStorageKey)??"{}") as
        Record<string,{state:TacticalPropState;hp:number}>;
      for(const [key,entry] of Object.entries(record)){
        const prop=this.arenaLayout.objects.get(key);
        if(!prop||!entry||!["damaged","disabled","destroyed"].includes(entry.state))continue;
        const updated=updateTacticalProp(this.arenaLayout,prop.position,entry.state);
        if(updated&&Number.isInteger(entry.hp)&&entry.hp>=0&&entry.hp<=prop.maxHp)
          (this.arenaLayout.objects as Map<string,typeof updated>).set(key,{...updated,hp:entry.hp});
        if(entry.state==="destroyed"&&prop.kind==="pipe")this.releaseHazard(prop.position);
      }
    }catch{/* A corrupt optional environmental record never blocks loading. */}
  }
  private persistEnvironment():void{
    if(!this.environmentStorageKey||!this.arenaLayout||typeof localStorage==="undefined")return;
    const record:Record<string,{state:TacticalPropState;hp:number}>={};
    for(const [key,prop] of this.arenaLayout.objects)
      if(prop.state!=="intact")record[key]={state:prop.state,hp:prop.hp};
    try{localStorage.setItem(this.environmentStorageKey,JSON.stringify(record));}
    catch{this.addLog("[SISTEMA] Sem espaço para persistir as mudanças do cenário.");}
  }
  private releaseHazard(origin:Position):void{
    if(!this.arenaLayout)return;
    for(const offset of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]){
      const x=origin.x+offset.x,y=origin.y+offset.y,key=x+","+y;
      if(x>=0&&x<8&&y>=0&&y<8&&!this.arenaLayout.blocked.has(key))
        (this.arenaLayout.terrain as Map<string,string>).set(key,"hazard");
    }
  }
  /** Direct, adjacency-checked actions. Destroying a door updates LoS and A*. */
  interactWithObject(x:number,y:number):boolean{
    const player=livingUnit(this.state.units,"runner");
    const object=this.arenaLayout?.objects.get(x+","+y);
    if(!player||!object||!this.arenaLayout||this.state.combatComplete||
       this.state.activeSide!=="player")return false;
    const adjacent=distance(player,{x,y})<=1;
    const canFire=this.weaponRange>1&&distance(player,{x,y})<=this.weaponRange&&
      hasObjectLineOfSight(player,{x,y},this.arenaLayout);
    if(!adjacent&&!canFire){
      this.setMessage("Objeto fora do alcance ou atrás de cobertura. Aproxime-se ou equipe arma de longo alcance.");
      return false;
    }
    if(!this.state.mainActionAvailable){this.setMessage("Ação principal já utilizada.");return false;}
    if(object.state==="destroyed"||object.state==="disabled"){
      this.setMessage("Equipamento já neutralizado.");return false;
    }
    const digital=this.state.classId==="netrunner"||this.state.classId==="tecnico";
    const bypass=adjacent&&digital&&(object.kind==="security-door"||object.kind==="generator");
    const result=bypass?"disabled":object.hp<=1?"destroyed":"damaged";
    const updated=updateTacticalProp(this.arenaLayout,{x,y},result);
    if(!updated)return false;
    this.state.mainActionAvailable=false;
    if(!adjacent)this.aiMemory=hearEnemy(this.aiMemory,player,this.state.round,6);
    if(result==="destroyed"&&object.kind==="pipe")this.releaseHazard({x,y});
    if(result==="disabled"&&object.kind==="generator"){
      this.state.enemyJamTurns=Math.max(this.state.enemyJamTurns,1);
      this.state.energy=Math.min(this.state.maxEnergy,this.state.energy+2);
    }
    this.persistEnvironment();
    this.state.message=object.kind+" · "+(result==="disabled"?"sistema invadido":
      result==="destroyed"?"obstáculo removido":"estrutura danificada")+".";
    this.addLog("[AMBIENTE] "+this.state.message);
    this.setCue(result==="disabled"?"emp":"hit","terminal");
    this.publish();return true;
  }

  getState(): GameState {
    return {
      ...this.state,
      units: this.state.units.map((unit) => ({ ...unit })),
      log: [...this.state.log],
      cooldowns: { ...this.state.cooldowns },
      classCooldowns:{...this.state.classCooldowns},
      companionUsed:[...this.state.companionUsed],
      cue: this.state.cue ? {...this.state.cue,
        path:this.state.cue.path?.map(tile=>({...tile}))} : null,
    };
  }

  subscribe(listener: (state: GameState) => void): () => void {
    return this.events.on("game:state", listener);
  }

  getClassAbilities(){
    // Secondary skills share ONE primary action, energy reserve and global
    // tactical cooldown system. There is never a second combat turn.
    return [...getClassSkills(this.state.classId),
      ...getClassSkills(this.state.multiclassId??null)].filter(skill=>
       this.state.characterAbilities.includes(skill.id)&&
       this.state.characterLevel>=
        (skill.classId===this.state.multiclassId?
          Math.max(MULTICLASS_UNLOCK_LEVEL,skill.minimumLevel+2):
          skill.minimumLevel));
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
    const source=livingUnit(this.state.units,"runner");
    if(source)this.aiMemory=hearEnemy(this.aiMemory,source,this.state.round,
       skill.target==="enemy"?7:3);
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
    const source=livingUnit(this.state.units,"runner");
    if(source)this.aiMemory=hearEnemy(this.aiMemory,source,this.state.round,6);
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
      this.setMessage("Terminal auxiliar já utilizado neste confronto.");
      return;
    }
    if(this.arenaLayout){
      this.state.terminalUsed=true;
      const result=activateSiegeTerminal(this.state,this.arenaLayout.site);
      this.state.message=result.message;
      this.addLog("[CENÁRIO] "+result.name+": "+result.message);
      this.setCue("terminal","terminal",result.energy);
      this.publish();
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
    return getReachableCells(this.state.units, player, this.state.movementRemaining,this.arenaLayout);
  }

  /** Target is a UI choice, not a new persistent slot. The same selection
   * drives basic attacks, origin/skill powers and companion focus. */
  setEnemyTarget(id:string):boolean{
    const enemy=activeEnemies(this.state).find(unit=>unit.id===id);
    if(!enemy||this.state.combatComplete)return false;
    this.state.selectedEnemyId=id;
    this.state.message="Alvo designado: "+enemy.name+
      " · "+enemy.hp+"/"+enemy.maxHp+" HP.";
    this.publish();
    return true;
  }
  getSquadThreatCount():number{return activeEnemies(this.state).length;}

  /** Prévia única para lógica, HUD e ação real: evita indicadores mentirosos. */
  getBasicAttackPreview(targetId?:string):{
    available:boolean;reason:string;range:number;distance:number;
    mode:"melee"|"ranged";cover:CoverGrade;defense:number;hitChance:number;
  }{
    const player=livingUnit(this.state.units,"runner");
    const enemy=targetId?activeEnemies(this.state).find(e=>e.id===targetId):
      targetEnemy(this.state);
    const mode=this.weaponRange>1?"ranged":"melee";
    const range=this.weaponRange;
    const dist=player&&enemy?distance(player,enemy):0;
    const cover=player&&enemy&&range>1?coverBetween(player,enemy,this.arenaLayout):"none";
    const defense=Math.max(1,(enemy?.armorClass??0)+(cover==="partial"?2:0)-
      (player&&enemy?elevationAccuracyBonus(player,enemy,this.arenaLayout):0));
    let reason="";
    if(!player||!enemy)reason="Sem alvo disponível.";
    else if(this.state.combatComplete)reason="Combate encerrado.";
    else if(this.state.activeSide!=="player")reason="Aguarde seu turno.";
    else if(!this.state.mainActionAvailable)reason="Ação principal já utilizada.";
    else if(dist>range)reason="Alvo fora do alcance ("+range+" células).";
    else if(range>1&&cover==="full")reason="Disparo bloqueado por obstáculo.";
    const totalBonus=(player?.attackBonus??0)+this.nextAttackAccuracyBonus+
      this.state.classNextAccuracyBonus;
    const hitChance=reason?0:attackHitChance(totalBonus,defense);
    return {available:reason==="",reason,range,distance:dist,mode,cover,defense,hitChance};
  }

  canAttack(): boolean {
    return this.getBasicAttackPreview().available;
  }

  /** Intenção contextual antecipada, sem revelar resultados aleatórios. */
  getEnemyIntent():string{
    const player=livingUnit(this.state.units,"runner");
    const enemy=targetEnemy(this.state);
    if(!player||!enemy||this.state.combatComplete)return "Sem ameaça ativa";
    if(this.state.enemyJamTurns>0)return "Interferência ativa: ação hostil bloqueada";
    // Cheap perceptual HUD: no path search or utility scoring on renders.
    // Full reasoning runs ONLY once when the enemy actually takes a turn.
    const sight=distance(enemy,player)<=6&&
      hasLineOfSight(enemy,player,this.arenaLayout);
    if(sight)return "ALERTA · contato visual confirmado";
    if(this.aiMemory.noise&&this.aiMemory.noise.round>=this.state.round-2&&
      distance(enemy,this.aiMemory.noise.at)<=this.aiMemory.noise.strength)
      return "SUSPEITA · ruído identificado";
    if(this.aiMemory.lastKnown&&this.aiMemory.lastKnownRound>=0&&
       this.state.round-this.aiMemory.lastKnownRound<=
       (this.aiMemory.lastKnownSense==="sound"?2:3))
      return this.aiMemory.lastKnownSense==="sound"?
        "BUSCA · último ruído percebido":
        "BUSCA · último contato visual";
    return "PATRULHA · nenhum alvo identificado";
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
       !livingUnit(this.state.units,"runner")||activeEnemies(this.state).length===0)return false;
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
    const path = findPath(player, { x, y }, this.state.units, player.id,this.arenaLayout);
    if (!path) {
      this.setMessage("Destino bloqueado ou sem rota segura. Escolha uma célula ciano próxima.");
      return;
    }
    if (path.length < 2) {
      this.setMessage("Você já está nessa posição. Escolha outra célula.");
      return;
    }
    const cost = pathCost(path,this.arenaLayout);
    if (cost > this.state.movementRemaining) {
      this.setMessage("Alvo distante: "+cost+" células necessárias, "+this.state.movementRemaining+" disponíveis. Avance por uma célula ciano.");
      return;
    }
    player.x = x;
    player.y = y;
    const hazards=path.slice(1).filter(tile=>
      this.arenaLayout?.terrain.get(tile.x+","+tile.y)==="hazard").length;
    if(hazards){
      player.hp=Math.max(0,player.hp-hazards*2);
      this.addLog("[TERRENO] "+hazards+" zona(s) de risco: "+hazards*2+" dano.");
      if(player.hp===0)this.state.combatComplete=true;
    }
    this.setCue("move", "player",undefined,path);
    this.state.movementRemaining -= cost;
    this.state.message = `Movimento concluído: ${cost} célula(s) consumida(s).`;
    this.addLog(`[MOVIMENTO] ${player.name} avançou ${cost} célula(s).`);
    this.aiMemory=hearEnemy(this.aiMemory,player,this.state.round,2);
    this.publish();
  }

  attack(targetId?:string): void {
    if(targetId)this.setEnemyTarget(targetId);
    const preview=this.getBasicAttackPreview();
    if(!preview.available){this.setMessage(preview.reason);return;}
    const player=livingUnit(this.state.units,"runner")!;
    const enemy=targetEnemy(this.state)!;
    const roll=rollDie(20);
    const attackBonus=player.attackBonus+this.nextAttackAccuracyBonus+
      this.state.classNextAccuracyBonus;
    const total=roll+attackBonus;
    this.state.mainActionAvailable=false;
    this.nextAttackAccuracyBonus=0;
    this.state.classNextAccuracyBonus=0;
    if(attackHits(roll,attackBonus,preview.defense)){
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
    this.aiMemory=hearEnemy(this.aiMemory,player,this.state.round,
      preview.mode==="ranged"?8:4);
    this.resolveEnemyDown();
    this.publish();
  }

  endPlayerTurn(): void {
    if (this.state.activeSide !== "player" || this.state.combatComplete) return;
    const player = livingUnit(this.state.units, "runner");
    const enemy=targetEnemy(this.state);
    if (!player || !enemy) return;
    const activeWave=this.state.wave;
    // Player-selected autonomous order. Uses the ORIGINAL one-use support
    // function, so it cannot bypass bonus action economy or heal full HP.
    const ally=chooseCompanionAction(this.partySupport,this.state,this.partyPosture);
    if(ally)this.useCompanionSupport(ally);
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
    const role=(this.state.enemyTacticalRole??profile.role) as EnemyRole;
    const pool:EnemyTacticPool={
      role,charges:this.state.enemyTacticalCharges??capacityForEnemy(role),
      cooldown:this.state.enemyTacticalCooldown??0,
    };
    // Once per enemy turn. Uses the enemy's current profile on a new wave,
    // even when an old save/test changes the active wave directly.
    const resolveDevice=(canFire:boolean)=>{
      const decision=enemyTacticTurn(pool,profile.role,canFire,this.state.energy);
      this.state.enemyTacticalRole=decision.next.role;
      this.state.enemyTacticalCharges=decision.next.charges;
      this.state.enemyTacticalCooldown=decision.next.cooldown;
      if(decision.device){
        this.addLog("[RECURSO HOSTIL] "+profile.name+" preparou "+
          (decision.device==="suppression"?"supressão":"sabotagem")+
          "; restam "+decision.next.charges+" cargas.");
      }
      return decision.device;
    };
    const pendingOverwatch=this.state.overwatchReady;
    this.state.overwatchReady=false;
    if(!jammed){
      const decision=decideEnemy(enemy,player,this.state.units,
        profile,this.aiMemory,this.state.round,this.arenaLayout);
      this.aiMemory=decision.memory;
      this.state.enemyAwareness=decision.memory.awareness;
      this.state.enemyPerception=decision.perception.reason;
      const plan=decision.plan;
      this.addLog("[PERCEPÇÃO] "+profile.name+" · "+decision.perception.reason+
        " · "+decision.reason+".");
      if(plan.action==="advance"||plan.action==="reposition"){
        // The navigator may plan without knowing an occluded occupant.
        // Validate ACTUAL collision/path at execution, never teleport or
        // overlap the runner; a blocked route consumes no extra action.
        const legalPath=findPath(enemy,plan.target,this.state.units,
          enemy.id,this.arenaLayout);
        if(legalPath&&legalPath.length>1&&
           pathCost(legalPath,this.arenaLayout)<=profile.mobility){
          enemy.x=plan.target.x;
          enemy.y=plan.target.y;
          if(this.arenaLayout?.terrain.get(enemy.x+","+enemy.y)==="hazard"){
            enemy.hp=Math.max(1,enemy.hp-2);
            this.addLog("[TERRENO] O hostil sofre 2 de dano em zona de risco.");
          }
          this.addLog("[IA TÁTICA] "+profile.name+" · "+plan.intent+".");
        }else{
          this.addLog("[IA TÁTICA] Rota ocupada ou alterada: movimento cancelado com segurança.");
        }
      }
      if(pendingOverwatch){
        if(withinShot(player,enemy,this.weaponRange,this.arenaLayout)){
          const defense=Math.max(1,enemy.armorClass+
            coverArmorBonus(player,enemy,this.arenaLayout)-
            elevationAccuracyBonus(player,enemy,this.arenaLayout));
          const reactionRoll=rollDie(20);
          if(attackHits(reactionRoll,player.attackBonus,defense)){
            const damage=rollDie(6)+2+(this.weaponRange===5?1:0);
            enemy.hp=Math.max(0,enemy.hp-damage);
            this.setCue("hit","enemy",damage);
            this.addLog("[VIGILÂNCIA] Reação acertou "+profile.name+": "+damage+" dano.");
          }else{
            this.setCue("miss","enemy");
            this.addLog("[VIGILÂNCIA] Reação falhou contra defesa "+defense+".");
          }
        }else this.addLog("[VIGILÂNCIA] Sem linha de tiro: reação consumida.");
        if(enemy.hp<=0){
          this.resolveEnemyDown();
          if(this.state.combatComplete||this.state.wave!==activeWave){
            this.publish();return;
          }
        }
      }
      // Attack only after currently sensing the target, not its last known tile.
      const visibleNow=hasLineOfSight(enemy,player,this.arenaLayout)&&
        distance(enemy,player)<=6;
      if(enemy.hp>0&&visibleNow&&withinShot(enemy,player,profile.range,this.arenaLayout)){
        // The charge is consumed on ATTEMPT, including a miss.
        const device=resolveDevice(true);
        const cover=profile.range>1?coverArmorBonus(enemy,player,this.arenaLayout):0;
        const defense=Math.max(1,player.armorClass+cover-
          elevationAccuracyBonus(enemy,player,this.arenaLayout));
        const roll=rollDie(20);
        if(attackHits(roll,enemy.attackBonus,defense)){
          const damage=rollDie(profile.range>1?6:4)+(profile.range>1?1:1);
          player.hp=Math.max(0,player.hp-damage);
          this.setCue("hit","player",damage);
          this.addLog(`[INIMIGO] ${profile.range>1?"Disparo":"Golpe"}: d20 ${roll} + ${enemy.attackBonus} vs ${defense}. ${damage} dano.`);
          if(device==="suppression"){
            this.state.suppressionTurns=1;
            this.addLog("[SUPRESSÃO] Próximo deslocamento reduzido em 2 células.");
          }
          if(device==="sabotage"){
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
        resolveDevice(false);
        this.addLog("[IA TÁTICA] "+profile.name+" aguarda abertura na linha de tiro.");
      }

    }else resolveDevice(false);
    // Every surviving wing gets ONE deterministic tactical decision. Only
    // one wing may fire per round; the others patrol/flank to avoid an unfair
    // burst of three attacks against entry-level Android players.
    if(!jammed)this.runWingTurns(player,enemy.id);
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
    if(activeEnemies(this.state).length===0){
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

  /** RC19: one action per living wing. No omniscient targeting through
   * buildings, no overlapping units, no per-frame A* or network calls.
   * Squad members share the leader's actual wave but have their own
   * perception memory and must validate a legal path before moving.
   */
  private runWingTurns(player:Unit,actingId:string):void{
    const leaderProfile=enemyProfile(this.state.encounterId,this.state.wave);
    let attacked=false;
    for(const wing of this.state.units.filter(u=>u.side==="enemy"&&
      u.id!=="drone"&&u.id!==actingId&&u.hp>0)){
      const index=Number(wing.id.split("-").at(-1)??1);
      const profile=squadSupportProfile(leaderProfile,Number.isFinite(index)?index:1);
      const memory=this.wingMemories.get(wing.id)??initialEnemyMemory();
      const decision=decideEnemy(wing,player,this.state.units,
        profile,memory,this.state.round,this.arenaLayout);
      this.wingMemories.set(wing.id,decision.memory);
      const plan=decision.plan;
      if(plan.action==="advance"||plan.action==="reposition"){
        const path=findPath(wing,plan.target,this.state.units,
          wing.id,this.arenaLayout);
        if(path&&path.length>1&&
           pathCost(path,this.arenaLayout)<=profile.mobility){
          wing.x=plan.target.x;wing.y=plan.target.y;
          this.addLog("[ESQUADRÃO] "+wing.name+" reposicionou-se: "+plan.intent+".");
        }
      }
      if(attacked||player.hp<=0)continue;
      const sight=distance(wing,player)<=6&&
        hasLineOfSight(wing,player,this.arenaLayout);
      if(!sight||!withinShot(wing,player,profile.range,this.arenaLayout))continue;
      attacked=true;
      const defense=Math.max(1,player.armorClass+
        coverArmorBonus(wing,player,this.arenaLayout)-
        elevationAccuracyBonus(wing,player,this.arenaLayout));
      const roll=rollDie(20);
      if(attackHits(roll,wing.attackBonus,defense)){
        const damage=rollDie(4);
        player.hp=Math.max(0,player.hp-damage);
        this.setCue("hit","player",damage);
        this.addLog("[ESQUADRÃO] "+wing.name+" disparou: "+damage+
          " dano contra defesa "+defense+".");
      }else{
        this.addLog("[ESQUADRÃO] "+wing.name+" errou o disparo tático.");
      }
    }
  }

  /** Resolve a próxima onda para qualquer fonte de dano (básico, classe ou comum).
   * Não concede missão/XP antes de TODAS as ondas terminarem.
   */
  private resolveEnemyDown():void{
    const enemy=this.state.units.find(unit=>unit.id==="drone");
    if(!enemy||activeEnemies(this.state).length>0||
       this.state.defeatedEnemyCount>=this.state.wave)return;
    // Registro por inimigo, inclusive ondas intermediárias; o App concede
    // XP com ID único e persistente no slot do personagem.
    this.state.defeatedEnemyCount++;
    const trial=this.state.encounterId.startsWith("trial-");
    const district=this.state.encounterId.startsWith("district-");
    const council=this.state.encounterId.startsWith("council-");
    const eden=this.state.encounterId.startsWith("eden-");
    const cisma=this.state.encounterId.startsWith("cisma-");
    const waves=trial||district||eden||cisma||council;
    if(waves&&this.state.wave<this.state.totalWaves){
      this.state.wave+=1;
      const hp=(cisma?(this.state.encounterId==="cisma-core"?25:
        this.state.encounterId==="cisma-containment"?22:20):
        eden?(this.state.encounterId==="eden-core"?24:19):council?21:district?17:14)+3*(this.state.wave-1);
      enemy.hp=hp;enemy.maxHp=hp;enemy.armorClass=13+this.state.wave-1;
      enemy.attackBonus=4+this.state.wave-1;
      enemy.x=this.arenaLayout?.enemySpawn.x??6;
      enemy.y=this.arenaLayout?.enemySpawn.y??1;
      enemy.name=enemyProfile(this.state.encounterId,this.state.wave).name+" · "+this.state.wave;
      const player=this.state.units.find(u=>u.id==="runner")!;
      this.state.units=[player,enemy,...spawnSquadMembers(this.state.encounterId,
        this.state.wave,enemy,player,this.arenaLayout)];
      this.state.selectedEnemyId="drone";
      this.wingMemories.clear();
      this.state.classDebuffTargetId=undefined;
      this.state.combatComplete=false;
      this.state.mainActionAvailable=true;
      this.state.bonusActionAvailable=true;
      this.state.activeSide="player";
      this.state.energy=Math.min(this.state.maxEnergy,this.state.energy+3);
      this.state.movementRemaining=this.state.movementPerTurn;
      this.state.enemyJamTurns=0;
      this.aiMemory=initialEnemyMemory();
      const nextRole=enemyProfile(this.state.encounterId,this.state.wave).role;
      const nextPool=initializeEnemyTactics(nextRole);
      this.state.enemyTacticalCharges=nextPool.charges;
      this.state.enemyTacticalCooldown=nextPool.cooldown;
      this.state.enemyTacticalRole=nextRole;
      this.state.enemyAwareness="patrol";
      this.state.enemyPerception="Nova onda: nenhum contato ainda";
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
