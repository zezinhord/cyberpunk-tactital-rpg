import {lazy,Suspense,useEffect,useMemo,useRef,useState} from "react";
// Phaser só deve ser baixado e inicializado quando uma batalha começar.
 // Evita carregar o motor de combate no primeiro boot Android da Baixada.
 const Battlefield=lazy(()=>import("./components/Battlefield"));
import SceneRecovery from "./components/SceneRecovery";
import AbilityBar from "./components/AbilityBar";
import OpeningCutscene from "./components/OpeningCutscene";
import {nextStoryScreen,markOpeningSeen} from "./game/story/opening";
import CombatAbilityPicker from "./components/CombatAbilityPicker";
import { loadTestAppearance, saveTestAppearance } from "./game/test-arena/appearance";
import type { TestAppearance } from "./game/test-arena/appearance";
import { TurnManager } from "./game/TurnManager";
import type { GameState, Unit,EncounterId } from "./game/types";
import {
  createPlayerCharacter,
  assignCharacterClass,
  getAllOrigins,
  getOriginById,
  getOriginGameplay,
  getOriginIntroduction,
  loadCharacter,
  saveCharacter,
} from "./game/character";
import type { OriginId, PlayerCharacter } from "./game/character";
// O mapa, NPCs e atlas só são analisados após sair do menu.
// Evita inicializar a cidade inteira durante o boot do Android de entrada.
const ExplorationScreen=lazy(()=>import("./screens/ExplorationScreen"));
import TitleScreen from "./screens/TitleScreen";
import {
  createStartingInventory, loadInventory, saveInventory,
  toggleEquipment, consumeItem, getEquipmentBonuses, grantItem, grantRewardInventoryItem, ITEM_CATALOG,ITEM_IDS,
} from "./game/inventory";
import type { ItemId, InventoryState } from "./game/inventory";
import {craftRecipe,type RecipeId} from "./game/crafting";
import { getPlayerSpriteUrl } from "./game/baixada/sprites";
import ClassSelection from "./components/ClassSelection";
import {getClassById,type ClassId} from "./game/classes/registry";
import {getHybridArchetype} from "./game/classes/hybrids.ts";
import {installCyberware,removeCyberware,type CyberwareId} from "./game/cyberware.ts";
import {readParty,activeCompanions} from "./game/companions.ts";
import {readStealth,stealthCombatEntry} from "./game/stealth.ts";
import {readContracts,INNER_CONTRACTS} from "./game/story/inner-contracts.ts";
import {FORENSIC_CASES} from "./game/story/forensic-cases.ts";
import {DISTRICT_COUNCILS,COUNCIL_DEFENSES,readCouncils,saveCouncils,isCouncilId,
  finishCouncilDefense} from "./game/story/district-councils.ts";
import { audioDirector } from "./audio/director";
import { markV09Defeated,grantV09Experience } from "./game/story/v09";
import {listCharacterSlots,loadCharacterSlot,removeCharacterSlot,hasSlotCapacity} from "./game/character/slots";
import {exportCharacterBackup,importCharacterBackup} from "./game/character/backup";
import {loadHealth,saveHealth,healAtClinic} from "./game/combat/health";
import {isOperativeDefeated,recoverFromDefeat,type DefeatChoice} from "./game/combat/defeat.ts";
import {combatProgression,grantUniqueExperience,earnedMasterySkillPoints,
  purchaseAttribute,purchaseSkill,purchaseMulticlass,
  type StatId} from "./game/progression/tree";
import {advanceTrialBattle,isTrialEncounter,readTrial,saveTrial,reconcileTrial} from "./game/story/field-test";
import {isDistrictId} from "./game/districts/catalog";
import {FAVORS,readFavors,saveFavors,claimFavor,buyFromNilo,syncFavorItems,
  type FavorId,type FavorState} from "./game/story/favors";
import {readMarket} from "./game/story/market";
import {EDEN_STEPS,readEden,saveEden,advanceEdenBattle,syncEdenItems,type EdenEncounter} from "./game/story/eden-echoes.ts";
import {readOperations,saveOperations,advanceOperationBattle,isOperationsCombat,
  OPERATIONS_STAGES} from "./game/story/cisma-operations.ts";
import {readCisma,CISMA_STEPS} from "./game/story/cisma-v20.ts";
import {claimDiscovery,DISCOVERY_AREAS,DISCOVERY_REWARDS} from "./game/story/discoveries.ts";
import {collectInnerProp,reconcileInnerExperience} from "./game/story/indoor-rewards.ts";
import {readReputation,syncFactionAids} from "./game/story/reputation";
import {SIEGE_TERMINAL_NAMES} from "./game/combat/siege-terminals.ts";
import {readSimulations,SIMULATION_PHASES,SIMULATION_REWARD_XP} from "./game/story/field-simulations.ts";
import {readPerimeter,PERIMETER_XP} from "./game/story/perimeter-routes.ts";
import {readVigil} from "./game/story/vigil-escorts.ts";
import {readShelter} from "./game/story/shelter-network.ts";
import {readNexus} from "./game/story/nexus-eden.ts";
import {readRecovery,RECOVERY_TASKS,mergeRecoverySupport,
 recoveryCombatSupport} from "./game/story/recovery-network.ts";
import {readUrban,urbanCombatSupport} from "./game/story/urban-chronicles.ts";
import {readDistrictProgress,saveDistrictProgress,advanceDistrict,
 districtCurrentStep} from "./game/districts/progress";

function getUnit(state: GameState, id: string): Unit | undefined {
  return state.units.find((unit) => unit.id === id);
}

function buzz(duration = 12): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(duration);
}

function UnitCard({ unit, role, accent }: { unit?: Unit; role: string; accent: "cyan" | "pink" }) {
  if (!unit) return null;
  const percentage = Math.max(0, (unit.hp / unit.maxHp) * 100);
  return (
    <div className={`unit-card ${accent}`}>
      <div className="unit-head"><strong>{unit.name}</strong><span>{role}</span></div>
      <div className="unit-stats"><b>{unit.hp}<small>/{unit.maxHp}</small></b><span>CA {unit.armorClass}</span></div>
      <div className="hp-track" role="meter" aria-label={`Vida de ${unit.name}`} aria-valuemin={0} aria-valuemax={unit.maxHp} aria-valuenow={unit.hp}>
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function ActionChip({ label, ready }: { label: string; ready: boolean }) {
  return <div className={`eco ${ready ? "ready" : "spent"}`}><i aria-hidden="true" />{label}<span className="sr-only">{ready ? ", disponível" : ", utilizada"}</span></div>;
}

function getHint(state: GameState, canAttack: boolean): string {
  if(isOperativeDefeated(state))return "Operativo incapacitado: escolha evacuação ou nova tentativa.";
  if (state.combatComplete) return state.encounterId==="v09"
    ? "Confronto V-09 encerrado. Retorne à Baixada para continuar a investigação."
    : "Combate de teste encerrado";
  if (state.activeSide !== "player") return "A sentinela está agindo";
  if (canAttack) return "Alvo ao alcance. Confirme o ataque";
  return "Toque em uma célula ciano para mover";
}

function CreationScreen({
  initialName,
  initialOrigin,
  onCreate,
  onBackToSaved,
}: {
  initialName: string;
  initialOrigin: OriginId;
  onCreate: (name: string, originId: OriginId, appearance: TestAppearance, classId: ClassId) => void;
  onBackToSaved?: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [originId, setOriginId] = useState<OriginId>(initialOrigin);
  const [presentation, setPresentation] = useState<TestAppearance>("masculine");
  const [classId,setClassId]=useState<ClassId|null>(null);
  const selected = getOriginById(originId);
  const profile = getOriginGameplay(originId);
  const canCreate = name.trim().length >= 2 && classId !== null;

  return (
    <main className="app-shell creation-shell">
      <header className="creation-header">
        <p className="eyebrow">NOVA ARCÁDIA · PROJETO ÉDEN</p>
        <h1>Criação do protagonista</h1>
        <p>Seu passado determina onde a história começa — e o que a cidade sabe sobre você.</p>
      </header>

      <section className="creation-form">
        <label className="field-label" htmlFor="character-name">Nome do personagem</label>
        <input id="character-name" className="name-input" value={name} maxLength={24} onChange={(event: { target: { value: string } }) => setName(event.target.value)} placeholder="Digite um nome" autoComplete="off" />

        <div className="section-heading">
          <div><p className="eyebrow">ESCOLHA SUA ORIGEM</p><h2>De onde você vem?</h2></div>
          <span className="selection-count">6 origens</span>
        </div>
        <div className="origin-grid">
          {getAllOrigins().map((origin) => (
            <button key={origin.id} type="button" className={`origin-card ${originId === origin.id ? "selected" : ""}`} onClick={() => setOriginId(origin.id)} aria-pressed={originId === origin.id}>
              <span className="origin-symbol" aria-hidden="true">{origin.id === "corporativo" ? "⌘" : origin.id === "baixada" ? "⌂" : origin.id === "gangue" ? "◇" : origin.id === "militar" ? "⊕" : origin.id === "pesquisador" ? "⌬" : "↗"}</span>
              <strong>{origin.name}</strong>
              <small>{origin.tagline}</small>
              <span className="origin-location">{origin.startingLocation.areaName}</span>
            </button>
          ))}
        </div>

        <section className="creation-body-options" aria-label="Apresentação corporal, apenas visual">
          <span className="eyebrow">APRESENTAÇÃO CORPORAL · MESMAS CAPACIDADES</span>
          <div className="creation-body-choices" role="group" aria-label="Escolha a apresentação visual">
            {(["masculine", "feminine"] as const).map((choice) => (
              <button type="button" key={choice} aria-pressed={presentation === choice}
                onClick={() => setPresentation(choice)}>
                <span className="creation-sprite-preview" aria-hidden="true" style={{
                  backgroundImage: `url("${getPlayerSpriteUrl(originId, choice)}")`,
                  backgroundPosition: "0px -240px",
                }} />
                <strong>{choice === "masculine" ? "Masculina" : "Feminina"}</strong>
              </button>
            ))}
          </div>
        </section>

        <ClassSelection value={classId} onChange={setClassId} />

        <article className="origin-detail">
          <div className="detail-topline"><span>ORIGEM SELECIONADA</span><span>LOCAL DE INÍCIO</span></div>
          <h2>{selected.name}</h2>
          <p>{selected.description}</p>
          <p className="origin-background">{selected.background}</p>
          <div className="starting-point"><span>⌖</span><div><small>Introdução exclusiva</small><strong>{selected.startingLocation.areaName}</strong></div></div>
          <div className="perk-preview">
            <div><small>VANTAGEM PASSIVA</small><strong>{profile.passiveDescription}</strong><span>{profile.passiveEffect}</span></div>
            <div><small>HABILIDADE DE ORIGEM</small><strong>{profile.abilityName}</strong><span>{profile.abilityDescription}</span></div>
          </div>
        </article>

        <button className="primary-button" type="button" disabled={!canCreate} onClick={() => {if(classId)onCreate(name, originId, presentation, classId);}}>Criar protagonista <span>→</span></button>
        {!canCreate && <p className="validation-note">Informe um nome com pelo menos 2 caracteres e selecione uma das 11 classes.</p>}
        {onBackToSaved && <button className="text-button" type="button" onClick={onBackToSaved}>Voltar ao menu inicial</button>}
      </section>
      <footer className="screen-footer">Protótipo de desenvolvimento · Os efeitos e valores ainda podem ser balanceados.</footer>
    </main>
  );
}

function ResumeScreen({ character, onContinue, onNew }: { character: PlayerCharacter; onContinue: () => void; onNew: () => void }) {
  const origin = getOriginById(character.originId);
  return (
    <main className="app-shell resume-shell">
      <div className="brand-mark">N<span>A</span></div>
      <p className="eyebrow">REGISTRO LOCAL ENCONTRADO</p>
      <h1>Bem-vindo de volta, <span>{character.name}</span>.</h1>
      <article className="saved-card">
        <span className="saved-label">PROTAGONISTA SALVO</span>
        <h2>{character.name}</h2>
        <p>{origin.name} · {character.classId?getClassById(character.classId).name:"Classe ainda não definida"}</p>
        <div className="saved-meta"><span>Nível {character.level}</span><span>{origin.startingLocation.areaName}</span></div>
        <p className="saved-status">Salvo neste dispositivo · {new Date(character.updatedAt).toLocaleString("pt-BR")}</p>
      </article>
      <button className="primary-button" onClick={onContinue}>Continuar <span>→</span></button>
      <button className="secondary-button" onClick={onNew}>Criar novo protagonista</button>
      <p className="screen-footer">O salvamento desta versão fica no armazenamento local deste aparelho.</p>
    </main>
  );
}

function IntroductionScreen({ character, onContinue }: { character: PlayerCharacter; onContinue: () => void }) {
  const origin = getOriginById(character.originId);
  const intro = getOriginIntroduction(character.originId);
  return (
    <main className="app-shell intro-shell">
      <header className="intro-top"><span className="eyebrow">PRÓLOGO INDIVIDUAL · {origin.name.toUpperCase()}</span><span className="intro-index">01 / 06</span></header>
      <div className="intro-art"><div className="intro-art-grid" /><span className="intro-art-mark">É</span><span className="intro-art-caption">NOVA ARCÁDIA // REGISTRO DE ORIGEM</span></div>
      <section className="intro-content">
        <p className="eyebrow">{intro.setting}</p>
        <h1>{intro.title}</h1>
        <p className="intro-narrative">{intro.narrative}</p>
        <blockquote>{intro.openingLine}</blockquote>
        <div className="intro-objective"><span>OBJETIVO INICIAL</span><p>{intro.objective}</p></div>
        <div className="eden-record"><span>PRIMEIRO INDÍCIO DO PROJETO ÉDEN</span><strong>{origin.edenRecord.title}</strong><p>{origin.edenRecord.firstClue}</p></div>
        <div className="contact-line"><span>CONTATO ASSOCIADO</span>{origin.contacts.map((contact) => <p key={contact.id}><strong>{contact.name}</strong> — {contact.role}</p>)}</div>
        <button className="primary-button" onClick={onContinue}>Entrar na Baixada <span>→</span></button>
      </section>
    </main>
  );
}

export default function App() {
  useEffect(()=>{audioDirector.install();},[]);
  const [character, setCharacter] = useState<PlayerCharacter | null>(() => loadCharacter());
  // A referência evita perder XP quando duas recompensas são concedidas no
  // mesmo tick (por exemplo, inimigo final + objetivo da missão).
  const characterRef=useRef(character);
  characterRef.current=character;
  const [slots,setSlots]=useState<PlayerCharacter[]>(()=>listCharacterSlots());
  const [screen, setScreen] = useState<"title" | "creation" | "resume" | "opening" | "introduction" | "exploration" | "battle">("title");
  const [openingReplay,setOpeningReplay] = useState(false);
  const [openingError,setOpeningError] = useState("");
  const [battleReset, setBattleReset] = useState(0);
  const [battleMode, setBattleMode] = useState<EncounterId>("test");
  const [defeatNotice,setDefeatNotice]=useState("");
  const [abilityPickerOpen,setAbilityPickerOpen] = useState(false);
  const [victoryDetailsOpen,setVictoryDetailsOpen] = useState(false);
  useEffect(()=>{audioDirector.setScene(screen==="battle"?"battle":screen==="exploration"?"exploration":screen==="title"?"menu":"story");},[screen]);
  const [appearance, setAppearance] = useState<TestAppearance>(() => loadTestAppearance(loadCharacter()?.id ?? ""));
  const chooseAppearance = (choice: TestAppearance) => {
    setAppearance(choice);
    if (character) saveTestAppearance(character.id, choice);
  };
  const [inventory, setInventory] = useState<InventoryState>(() => loadInventory(loadCharacter()?.id ?? ""));
  const [selectedSupply,setSelectedSupply]=useState<ItemId>("curativo_campo");
  const bonuses = useMemo(() => getEquipmentBonuses(inventory),
    [inventory.equipped.weapon,inventory.equipped.armor,inventory.equipped.implant,inventory.cyberware]);
  useEffect(() => {
    if (character && inventory.ownerId === character.id) saveInventory(inventory);
  }, [character?.id, inventory]);
  const [saveMessage, setSaveMessage] = useState("Salvamento local ativo");
  const [healthValue,setHealthValue]=useState(()=>{
    const saved=loadCharacter();
    return loadHealth(saved?.id??"",18+(saved?getOriginGameplay(saved.originId).maxHpBonus:0)+combatProgression(saved).hp);
  });

  const originProfile = useMemo(() => character ? getOriginGameplay(character.originId) : undefined, [character?.originId]);
  const progressionBonuses=combatProgression(character);
  const maximumHp=18+(originProfile?.maxHpBonus??0)+progressionBonuses.hp+bonuses.hpBonus;
  const manager = useMemo(() => new TurnManager({ playerName: character?.name, originProfile, equipmentBonuses: bonuses, characterLevel: character?.level, originId: character?.originId, classId: character?.classId, multiclassId:character?.multiclassId,
    characterAbilities:character?.abilities,characterSkillRanks:character?.skillRanks,
    currentHp:loadHealth(character?.id??"",maximumHp),
    progressionBonuses:combatProgression(character),encounterId:battleMode,weaponId:inventory.equipped.weapon,
     districtSupport:character?mergeRecoverySupport(
       urbanCombatSupport(readUrban(character.id),battleMode),
       recoveryCombatSupport(readRecovery(character.id),battleMode)):null,
     partySupport:character?activeCompanions(readParty(character.id)):[],
     partyPosture:character?readParty(character.id).posture??"manual":"manual",
     infiltration:character?stealthCombatEntry(readStealth(character.id),battleMode):null }),
     [character?.id, battleReset, battleMode, originProfile, bonuses, inventory.equipped.weapon]);
  const [state, setState] = useState<GameState>(() => manager.getState());
  const player = getUnit(state, "runner");
  const enemy = getUnit(state, "drone");
  const attackPreview=manager.getBasicAttackPreview();
  const canAttack = attackPreview.available;
  const victory = Boolean(state.combatComplete && enemy && enemy.hp <= 0);
  const defeated=isOperativeDefeated(state);

  useEffect(() => {
    setState(manager.getState());
    return manager.subscribe((next)=>{
      setState(next);
      if(screen==="battle"&&character?.id){
        for(let enemyIndex=1;enemyIndex<=next.defeatedEnemyCount;enemyIndex++)
          grantTrialXp("enemy-"+next.encounterId+"-"+enemyIndex,8);
        const unit=next.units.find(u=>u.id==="runner");
        if(unit){
          saveHealth(character.id,unit.hp,unit.maxHp);
          setHealthValue(Math.max(1,unit.hp));
        }
      }
    });
  }, [manager,screen,character?.id]);

  const beginBattle = (mode: EncounterId = "test") => {
    setVictoryDetailsOpen(false);
    setDefeatNotice("");
    setAbilityPickerOpen(false);
    setBattleMode(mode);
    setBattleReset((n)=>n+1);
    setScreen("battle");
  };
  const grantTrialXp=(eventId:string,amount:number):boolean=>{
    const current=characterRef.current;
    if(!current)return false;
    const next=grantUniqueExperience(current,eventId,amount);
    if(!next.awarded)return current.questRewards.includes(eventId);
    const masteryGained=earnedMasterySkillPoints(next.character)-
      earnedMasterySkillPoints(current);
    if(!saveCharacter(next.character)){
      setSaveMessage("Erro ao gravar XP. Verifique o espaço disponível.");return false;
    }
    characterRef.current=next.character;
    setCharacter(next.character);
    setSlots(listCharacterSlots());
    setSaveMessage(next.levelsGained>0
      ? "SUBIU DE NÍVEL! Nível "+next.character.level+
        " · +"+(next.levelsGained*2)+" pontos de cada tipo na Árvore."
      : masteryGained>0
        ? "MAESTRIA AVANÇOU! +"+masteryGained+
          " HAB para especializar sua classe · Abra a Árvore."
        : "+"+amount+" XP · "+eventId.replaceAll("-"," ")+".");
    return true;
  };
  /** Sincroniza recibos pendentes depois de uma suspensão/crash sem duplicar XP ou itens. */
  const reconcileFavorRewards=(state:FavorState):boolean=>{
    const active=characterRef.current;
    if(!active)return false;
    const stored=loadInventory(active.id);
    const next=syncEdenItems(syncFactionAids(syncFavorItems(stored,state),readMarket(active.id)),readEden(active.id));
    if(next!==stored){
      if(!saveInventory(next))return false;
      setInventory(next);
    }
    for(const id of state.claimed){
      const quest=FAVORS.find(f=>f.id===id);
      if(quest&&!grantTrialXp("favor-"+id,quest.reward.xp))return false;
    }
    for(const area of DISCOVERY_AREAS){
      if(next.rewardReceipts?.includes("discovery-"+area)&&
          !grantTrialXp("discovery-"+area,DISCOVERY_REWARDS[area].xp))return false;
    }
    if(!reconcileInnerExperience(next,grantTrialXp))return false;
    const narrative=readEden(active.id);
    for(const id of narrative.history){
      const step=EDEN_STEPS.find(s=>s.id===id);
      if(step&&!grantTrialXp("eden-"+id,step.xp))return false;
    }
    const innerContracts=readContracts(active.id);
    for(const id of innerContracts.completed)
      if(!grantTrialXp("inner-contract-"+id,INNER_CONTRACTS[id].rewardXp))return false;
    for(const id of innerContracts.analysed??[])
      if(!grantTrialXp("inner-forensic-"+id,FORENSIC_CASES[id].rewardXp))return false;
    const councilProgress=readCouncils(active.id);
    for(const id of Object.keys(councilProgress.choices))
      if(isCouncilId(id)&&!grantTrialXp("district-council-"+id,DISTRICT_COUNCILS[id].rewardXp))
        return false;
    for(const id of councilProgress.defended??[])
      if(!grantTrialXp("council-defense-"+id,COUNCIL_DEFENSES[id].xp))
        return false;
    const recovered=readRecovery(active.id);
    for(const region of Object.keys(recovered.repairs)){
      if(!isCouncilId(region))continue;
      const locations=recovered.repairs[region]??[];
      for(const location of locations){
        const task=RECOVERY_TASKS[region].find(x=>x.room===location);
        if(task&&!grantTrialXp("recovery-repair-"+location,task.xp))return false;
      }
    }
    for(const region of Object.keys(recovered.outcomes)){
      if(isCouncilId(region)&&!grantTrialXp("recovery-final-"+region,78))
        return false;
    }
    const scenes=readSimulations(active.id);
    for(const [room,phase] of Object.entries(scenes.solved)){
      if(phase===SIMULATION_PHASES&&
        !grantTrialXp("field-simulation-"+room,SIMULATION_REWARD_XP))return false;
    }
    const perimeter=readPerimeter(active.id);
    for(const room of Object.keys(perimeter.completed)){
      if(!grantTrialXp("perimeter-"+room,PERIMETER_XP))return false;
    }
    const vigils=readVigil(active.id);
    for(const [room,outcome] of Object.entries(vigils.completed)){
      if(outcome&&!grantTrialXp("vigil-"+room,outcome.xp))return false;
    }
    const shelters=readShelter(active.id);
    for(const [room,outcome] of Object.entries(shelters.completed)){
      if(outcome&&!grantTrialXp("shelter-"+room,outcome.xp))return false;
    }
    const nexus=readNexus(active.id);
    for(const [room,outcome] of Object.entries(nexus.completed)){
      if(outcome&&!grantTrialXp("nexus-"+room,outcome.xp))return false;
    }
    const cisma=readCisma(active.id);
    for(const id of cisma.history){
      const step=CISMA_STEPS.find(s=>s.id===id);
      if(step&&!grantTrialXp("cisma-"+id,step.xp))return false;
    }
    const operations=readOperations(active.id);
    for(const id of operations.history){
      const step=OPERATIONS_STAGES.find(s=>s.id===id);
      if(step&&!grantTrialXp("cisma-operation-"+id,step.xp))return false;
    }
    return true;
  };
  const claimNpcFavor=(id:FavorId):{ok:boolean;message:string}=>{
    const active=characterRef.current;
    if(!active)return {ok:false,message:"Carregue um protagonista para receber o favor."};
    const current=readFavors(active.id);
    const result=claimFavor(current,id);
    if(!result.ok)return {ok:false,message:result.message};
    // Primeiro registrar o recibo e a moeda/honra no save próprio.
    // A reconciliação de XP e inventário usa o ID gravado e é idempotente.
    if(!saveFavors(active.id,result.state))
      return {ok:false,message:"Sem espaço para salvar o favor; tente novamente."};
    const synced=reconcileFavorRewards(result.state);
    return {ok:true,message:result.message+(synced?"":" Recompensa registrada; o restante será sincronizado ao retomar o jogo.")};
  };
  const buyWorkshopItem=(item:ItemId):{ok:boolean;message:string}=>{
    const active=characterRef.current;
    if(!active)return {ok:false,message:"Nenhum protagonista ativo."};
    const result=buyFromNilo(readFavors(active.id),item,readReputation(active.id));
    if(!result.ok)return {ok:false,message:result.message};
    // A retirada em inventário é atrelada ao recibo e é retomável após falha.
    if(!saveFavors(active.id,result.state))
      return {ok:false,message:"Falha ao salvar compra. Nenhum crédito foi debitado."};
    const synced=reconcileFavorRewards(result.state);
    return {ok:true,message:result.message+(synced?"":" Item pendente de sincronização no inventário.")};
  };
  useEffect(()=>{
    const active=characterRef.current;
    if(screen!=="exploration"||!active)return;
    const state=readFavors(active.id);
    reconcileFavorRewards(state);
    // A reconciliação deve rodar na entrada da exploração e troca de slot,
    // nunca a cada animação de diálogo ou tick de combate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[screen,character?.id]);

  const installCyberwareItem=(id:CyberwareId):string=>{
    if(!character||inventory.ownerId!==character.id)return "Carregue um protagonista primeiro.";
    const result=installCyberware(inventory,id,character.level);
    if(!result.ok)return result.message;
    if(!saveInventory(result.state))return "Falha ao salvar cyberware; os materiais não foram debitados.";
    setInventory(result.state);
    return result.message;
  };
  const removeCyberwareItem=(id:CyberwareId):string=>{
    if(!character||inventory.ownerId!==character.id)return "Carregue um protagonista primeiro.";
    const result=removeCyberware(inventory,id);
    if(!result.ok)return result.message;
    if(!saveInventory(result.state))return "Falha ao salvar remoção; o implante continua instalado.";
    setInventory(result.state);
    return result.message;
  };
  const craftAtWorkshop=(id:RecipeId):string=>{
    if(!character||inventory.ownerId!==character.id)return "Nenhum personagem ativo para fabricar.";
    const result=craftRecipe(inventory,id);
    if(!result.ok)return result.message;
    if(!saveInventory(result.state))return "Não foi possível salvar a fabricação. Nenhum componente foi consumido.";
    setInventory(result.state);
    return result.message;
  };

  const buyAttribute=(id:StatId):string=>{
    // Android users can tap multiple buttons before React commits the next
    // render. Always purchase against the latest successfully saved snapshot,
    // never a stale character captured by this render's event handler.
    const active=characterRef.current;
    if(!active)return "Nenhum personagem ativo.";
    const purchase=purchaseAttribute(active,id);
    if(!purchase.ok)return purchase.message;
    if(!saveCharacter(purchase.character))return "Falha ao salvar o atributo.";
    characterRef.current=purchase.character;
    setCharacter(purchase.character);
    setSlots(listCharacterSlots());
    const hp=18+getOriginGameplay(active.originId).maxHpBonus+
      combatProgression(purchase.character).hp;
    setHealthValue(loadHealth(active.id,hp));
    return purchase.message;
  };
  const buyMulticlass=(id:ClassId):string=>{
    const active=characterRef.current;
    if(!active)return "Nenhum personagem ativo.";
    const choice=purchaseMulticlass(active,id);
    if(!choice.ok)return choice.message;
    if(!saveCharacter(choice.character))return "Falha ao salvar a segunda classe. Seus pontos não foram usados.";
    characterRef.current=choice.character;
    setCharacter(choice.character);
    setSlots(listCharacterSlots());
    return choice.message;
  };
  const buySkill=(id:string):string=>{
    const active=characterRef.current;
    if(!active)return "Nenhum personagem ativo.";
    const purchase=purchaseSkill(active,id);
    if(!purchase.ok)return purchase.message;
    if(!saveCharacter(purchase.character))return "Falha ao salvar a habilidade.";
    characterRef.current=purchase.character;
    setCharacter(purchase.character);
    setSlots(listCharacterSlots());
    return purchase.message;
  };

  useEffect(()=>{
    if(screen!=="battle" || !characterRef.current || !state.combatComplete)return;
    const enemyDefeated=state.units.find(u=>u.id==="drone")?.hp===0;
    const active=characterRef.current;
    if(!active)return;
    if(enemyDefeated&&state.encounterId.startsWith("council-")){
      const region=state.encounterId.slice("council-".length);
      if(isCouncilId(region)){
        const completed=finishCouncilDefense(readCouncils(active.id),region);
        if(completed.ok){
          if(saveCouncils(active.id,completed.state)){
            if(!grantTrialXp("council-defense-"+region,completed.xp))
              setSaveMessage("A defesa do conselho foi salva; a XP será reconciliada ao carregar.");
            else setSaveMessage(COUNCIL_DEFENSES[region].title+" concluído · +"+
              completed.xp+" XP.");
            audioDirector.effect("victory");
          }else setSaveMessage("Sem espaço para registrar a defesa. Libere armazenamento e retorne.");
        }
      }
      return;
    }
    if(enemyDefeated&&isOperationsCombat(state.encounterId)){
      const result=advanceOperationBattle(readOperations(active.id),state.encounterId);
      if(result.advanced&&result.stage){
        if(saveOperations(active.id,result.progress)){
          if(!grantTrialXp("cisma-operation-"+result.stage.id,result.stage.xp))
            setSaveMessage("Operação 2.0 salva; XP será reconciliado ao carregar.");
          audioDirector.effect("victory");
        }else setSaveMessage("Não foi possível salvar o confronto 2.0. Libere espaço e retorne ao jogo.");
      }
      return;
    }
    if(enemyDefeated&&state.encounterId.startsWith("eden-")){
      const result=advanceEdenBattle(readEden(active.id),state.encounterId as EdenEncounter);
      if(result.advanced&&result.step){
        if(saveEden(active.id,result.state)){
          if(!grantTrialXp("eden-"+result.step.id,result.step.xp))
            setSaveMessage("Registro Éden preservado; XP será reconciliado ao carregar o personagem.");
          reconcileFavorRewards(readFavors(active.id));
          audioDirector.effect("victory");
        }else setSaveMessage("Sem espaço para registrar o confronto Éden; libere armazenamento.");
      }
      return;
    }
    if(enemyDefeated && isTrialEncounter(state.encounterId)){
      const stored=readTrial(active.id);
      const progress=reconcileTrial(stored,active.questRewards);
      const next=advanceTrialBattle(progress,state.encounterId);
      if(next.advanced&&next.completedStep){
        const key="trial-"+next.completedStep.id;
        if(grantTrialXp(key,next.completedStep.xp)){
          saveTrial(active.id,next.progress);
          audioDirector.effect("victory");
        }
      }
      return;
    }
    if(enemyDefeated&&state.encounterId.startsWith("district-")){
      const id=state.encounterId.slice("district-".length);
      if(isDistrictId(id)){
        const stored=readDistrictProgress(active.id,id);
        const step=districtCurrentStep(id,stored);
        if(step?.id==="rede"&&step.slot==="relay"){
          const next=advanceDistrict(id,stored,"district-"+id+"-relay");
          if(next.advanced&&next.step&&grantTrialXp(
            "district-"+id+"-"+next.step.id,next.step.xp)){
            if(saveDistrictProgress(active.id,id,next.state)){
              audioDirector.effect("victory");
            }else setSaveMessage("XP salvo, mas não foi possível registrar o confronto do distrito.");
          }
        }
      }
      return;
    }
    if(state.encounterId!=="v09")return;
    const defeated=state.units.find(u=>u.id==="drone")?.hp===0;
    if(!defeated)return;
    const reward=grantV09Experience(characterRef.current ?? active);
    if(!reward.awarded){
      // Em caso de encerramento entre as duas gravações, a recompensa
      // atômica no personagem permite restaurar o marco narrativo.
      markV09Defeated(active.id);
      return;
    }
    // XP e marcador de recompensa pertencem a UM registro local. A história
    // só é marcada após a persistência da recompensa; nunca o inverso.
    if(saveCharacter(reward.character)){
      markV09Defeated(active.id);
      characterRef.current=reward.character;
      setCharacter(reward.character);
      setSlots(listCharacterSlots());
      if(reward.character.level>active.level)
        setSaveMessage("SUBIU DE NÍVEL! Nível "+reward.character.level+" · Abra a árvore para evoluir.");
      audioDirector.effect("victory");
    }else{
      setSaveMessage("Falha ao salvar recompensa V-09. Libere espaço no aparelho.");
    }
  },[screen,character,state]);

  const assignExistingClass=(classId:ClassId)=>{
    if(!character || character.classId)return;
    const updated=assignCharacterClass(character,classId);
    if(updated===character)return;
    if(!saveCharacter(updated)){
      setSaveMessage("Não foi possível salvar a classe.");
      return;
    }
    characterRef.current=updated;
    setCharacter(updated);
    setSlots(listCharacterSlots());
    setSaveMessage("Classe registrada no salvamento local");
  };

  const handleCreate = (name: string, originId: OriginId, presentation: TestAppearance, classId:ClassId) => {
    const nextCharacter = createPlayerCharacter(name, originId, classId);
    const saved = saveCharacter(nextCharacter);
    // Nunca apagar inventário ou missão de um protagonista antigo: ele tem seu slot.
    if(!saved){
      setSaveMessage("Falha ao criar o slot. Exporte um backup ou libere um slot.");
      return;
    }
    setSlots(listCharacterSlots());
    setCharacter(nextCharacter);
    setAppearance(presentation);
    saveTestAppearance(nextCharacter.id, presentation);
    setInventory(createStartingInventory(nextCharacter.id));
    setHealthValue(18+getOriginGameplay(nextCharacter.originId).maxHpBonus);
    setSaveMessage("Personagem salvo em slot próprio neste dispositivo");
    setOpeningReplay(false);
    setOpeningError("");
    setScreen("opening");
  };

  const completeOpening = () => {
    if(!character){setScreen("title");return;}
    if(openingReplay){
      setOpeningReplay(false);
      setOpeningError("");
      setScreen("title");
      return;
    }
    const updated=markOpeningSeen(character);
    if(!saveCharacter(updated)){
      setOpeningError("Não foi possível salvar a apresentação. Verifique o armazenamento antes de continuar.");
      return;
    }
    setCharacter(updated);
    setSlots(listCharacterSlots());
    setOpeningError("");
    setScreen("introduction");
  };

  const finishIntroduction = () => {
    if (!character) return;
    const nextCharacter = { ...character, introductionCompleted: true, updatedAt: new Date().toISOString() };
    setCharacter(nextCharacter);
    setSaveMessage(saveCharacter(nextCharacter) ? "Personagem salvo neste dispositivo" : "Falha ao salvar personagem");
    setScreen("exploration");
  };

  const startNewCharacter = () => {
    if(!hasSlotCapacity()){
      setSaveMessage("Limite de slots atingido. Exporte ou exclua um antes de criar.");
      return;
    }
    // O protagonista anterior permanece no índice e mantém todos seus dados.
    setInventory(createStartingInventory(""));
    setCharacter(null);
    setScreen("creation");
  };

  const cancelNewCharacter = () => {
    const saved = loadCharacter();
    setCharacter(saved);
    setAppearance(loadTestAppearance(saved?.id ?? ""));
    setInventory(loadInventory(saved?.id ?? ""));
    setScreen("title");
  };

  const handleLoadSlot=(id:string)=>{
    const selected=loadCharacterSlot(id);
    if(!selected){setSaveMessage("Não foi possível carregar esse slot.");return;}
    setCharacter(selected);
    setAppearance(loadTestAppearance(selected.id));
    setInventory(loadInventory(selected.id));
    setHealthValue(loadHealth(selected.id,18+getOriginGameplay(selected.originId).maxHpBonus+combatProgression(selected).hp));
    setSlots(listCharacterSlots());
    setOpeningReplay(false);
    setOpeningError("");
    setScreen(nextStoryScreen(selected));
  };
  const handleDeleteSlot=(id:string)=>{
    if(!window.confirm("Excluir permanentemente este protagonista deste dispositivo? Faça um backup primeiro."))return;
    if(!removeCharacterSlot(id)){setSaveMessage("Falha ao excluir o slot.");return;}
    const active=loadCharacter();
    setCharacter(active);
    setAppearance(loadTestAppearance(active?.id??""));
    setInventory(loadInventory(active?.id??""));
    setSlots(listCharacterSlots());
    setSaveMessage("Slot excluído. Outros personagens foram preservados.");
  };
  const handleExport=async(id:string):Promise<string>=>{
    try{
      const data=exportCharacterBackup(id);
      const filename="nova-arcadia-backup-"+id.slice(0,16)+".json";
      const file=new File([data],filename,{type:"application/json"});
      if(navigator.canShare?.({files:[file]})){
        try{await navigator.share({files:[file],title:"Backup Nova Arcádia"});
          return "Backup enviado ao compartilhamento do Android.";}
        catch{/* usar exportação pelo navegador */}
      }
      const url=URL.createObjectURL(new Blob([data],{type:"application/json"}));
      const a=document.createElement("a");
      a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),5000);
      return "Backup gerado. Confira os downloads do aparelho.";
    }catch(e){return "Não foi possível exportar: "+(e instanceof Error?e.message:"erro desconhecido");}
  };
  const handleImport=async(file:File):Promise<string>=>{
    try{
      const contents=await file.text();
      let result=importCharacterBackup(contents);
      if(!result.ok && result.message.includes("Já existe um slot")){
        if(window.confirm("Este backup já existe. Sobrescrever os dados do mesmo personagem?"))
          result=importCharacterBackup(contents,true);
      }
      if(!result.ok)return result.message;
      const selected=loadCharacter();
      setCharacter(selected);
      setSlots(listCharacterSlots());
      setInventory(loadInventory(selected?.id??""));
      setAppearance(loadTestAppearance(selected?.id??""));
      setHealthValue(loadHealth(selected?.id??"",18+(selected?getOriginGameplay(selected.originId).maxHpBonus+combatProgression(selected).hp:0)));
      return result.message;
    }catch(e){return "Erro ao importar backup: "+(e instanceof Error?e.message:"arquivo inválido");}
  };
  const treatAtClinic=():number=>{
    if(!character)return 0;
    const max=18+getOriginGameplay(character.originId).maxHpBonus+combatProgression(character).hp+bonuses.hpBonus;
    const current=loadHealth(character.id,max);
    if(!healAtClinic(character.id,max))return 0;
    setHealthValue(max);
    return Math.max(0,max-current);
  };

  const handleUseSupply = () => {
    if (inventory.quantities[selectedSupply] < 1) return;
    const item=ITEM_CATALOG[selectedSupply];
    const used=item.healAmount?manager.useMedicalSupply(item.healAmount):
      item.energyAmount?manager.useEnergySupply(item.energyAmount):false;
    if(used)setInventory(current=>consumeItem(current,selectedSupply));
  };
  /** Recuperação após 0 PV: sem alterar missão, facções ou experiência.
   * O modal independe de scroll e sempre oferece saída no Android landscape.
   */
  /** Saída de combate sempre presente na barra principal.
   * Abandonar uma missão em andamento não registra vitória nem recompensas.
   * A vitória real continua sendo tratada pelo efeito de persistência anterior.
   */
  const exitBattle=():void=>{
    setAbilityPickerOpen(false);
    setDefeatNotice("");
    setVictoryDetailsOpen(false);
    setScreen("exploration");
  };
  const handleDefeatChoice=(choice:DefeatChoice):void=>{
    if(!character||!defeated)return;
    const result=recoverFromDefeat(character.id,maximumHp,choice);
    if(!result.ok){setDefeatNotice(result.message);return;}
    setDefeatNotice("");
    setAbilityPickerOpen(false);
    setHealthValue(result.hp);
    setSaveMessage(result.message);
    if(choice==="clinic"){
      setScreen("exploration");
    }else{
      setBattleReset(n=>n+1);
    }
  };

  const consumables=ITEM_IDS.filter(id=>ITEM_CATALOG[id].category==="consumable");
  const supply=ITEM_CATALOG[selectedSupply];
  const supplyUseful=Boolean(supply.healAmount&&player&&player.hp<player.maxHp||
    supply.energyAmount&&state.energy<state.maxEnergy);

  if (screen === "title") {
    return <TitleScreen character={character} slots={slots} onLoadSlot={handleLoadSlot}
      onDeleteSlot={handleDeleteSlot} onExport={handleExport} onImport={handleImport}
      saveNotice={saveMessage}
      onReplayOpening={()=>{
        if(!character)return;
        setOpeningReplay(true);
        setOpeningError("");
        setScreen("opening");
      }}
      onContinue={() => setScreen(character?nextStoryScreen(character):"title")} onNew={startNewCharacter} />;
  }
  if (screen === "creation") {
    return <CreationScreen initialName="" initialOrigin="corporativo" onCreate={handleCreate} onBackToSaved={cancelNewCharacter} />;
  }
  if (screen === "resume" && character) {
    return <ResumeScreen character={character} onContinue={() => setScreen(nextStoryScreen(character))} onNew={startNewCharacter} />;
  }
  if (screen === "opening" && character) {
    return <OpeningCutscene key={character.id} character={character} appearance={appearance}
      onFinish={completeOpening} error={openingError}/>;
  }
  if (screen === "introduction" && character) {
    return <IntroductionScreen character={character} onContinue={finishIntroduction} />;
  }
  if (!character || !originProfile) {
    return <CreationScreen initialName="" initialOrigin="corporativo" onCreate={handleCreate} onBackToSaved={cancelNewCharacter} />;
  }

  if (screen === "exploration") {
    return (
      <Suspense fallback={<main className="na-world-startup" role="status"
        aria-live="polite" style={{minHeight:"100dvh",display:"grid",placeItems:"center",background:"#0b0d17",color:"#d5f6fa"}}>
        Preparando a cidade em modo econômico…</main>}>
      <ExplorationScreen
        character={character}
        appearance={appearance}
        onChangeAppearance={chooseAppearance}
        onChooseClass={assignExistingClass}
        onPurchaseAttribute={buyAttribute}
        onPurchaseSkill={buySkill}
        onPurchaseMulticlass={buyMulticlass}
        onQuestXp={grantTrialXp}
        onClaimFavor={claimNpcFavor}
        onBuyWithCredits={buyWorkshopItem}
        onSyncFactionAids={()=>{
          const active=characterRef.current;
          return active?reconcileFavorRewards(readFavors(active.id)):false;
        }}
        onOpenBattle={beginBattle}
        onTreatAtClinic={treatAtClinic}
        currentHp={healthValue}
        maxHp={maximumHp}
        progressNotice={saveMessage}
        onReturnToTitle={() => setScreen("title")}
        inventory={inventory}
        onToggleEquipment={(id: ItemId) => setInventory((current) => toggleEquipment(current, id))}
        onCraft={craftAtWorkshop}
        onInstallCyberware={installCyberwareItem}
        onRemoveCyberware={removeCyberwareItem}
        onCollectDistrictCache={area=>{
          const active=characterRef.current;
          if(!active)return false;
          const owned=inventory.ownerId===active.id?inventory:loadInventory(active.id);
          const result=claimDiscovery(owned,area);
          if(!result.ok||!saveInventory(result.state))return false;
          setInventory(result.state);
          return true;
        }}
        onCollectInteriorProp={(area,prop)=>{
          const active=characterRef.current;
          if(!active)return false;
          const stored=inventory.ownerId===active.id?inventory:loadInventory(active.id);
          const result=collectInnerProp(stored,area,prop);
          if(!result.ok||!saveInventory(result.state))return false;
          setInventory(result.state);
          return true;
        }}
        onGrantIndustrialItem={(id:ItemId)=>setInventory(current=>grantItem(current,id))}
        onGrantQuestItem={(id:ItemId)=>setInventory(current=>grantRewardInventoryItem(current,id,1,"story-first-"+id))}
      />
      </Suspense>
    );
  }

  const origin = getOriginById(character.originId);
  return (
    <main className="app-shell game-shell arena-v030">
      <header className="topbar arena-head">
        <div className="mission">
          <h1>{battleMode.startsWith("council-")?"Defesa do Conselho · "+
            COUNCIL_DEFENSES[battleMode.slice(8) as keyof typeof COUNCIL_DEFENSES]?.title:
            battleMode.startsWith("district-")?"Defesa do Distrito · Interceptação Helix":battleMode==="v09"?"Pátio do Reúso · Encontro V-09":
            isTrialEncounter(battleMode)?"Operação Circuito Fantasma · Interceptação":
            "Limbo de Teste · Personagens e Habilidades"}</h1>
          <p>{battleMode.startsWith("council-")?"ACORDO COMUNITÁRIO · "+state.wave+" / "+state.totalWaves+" ONDAS":
            battleMode.startsWith("district-")?"OPERAÇÃO INTERDISTRITAL · "+state.wave+" / "+state.totalWaves+" ONDAS":battleMode==="v09"?"MISSÃO PRINCIPAL · O NOME QUE SUMIU":
            isTrialEncounter(battleMode)?"CAMPANHA TÁTICA · "+state.wave+" / "+state.totalWaves+" ONDAS":
            "LIMBO DE TESTE · MECÂNICAS TÁTICAS E ARQUÉTIPOS"}</p>
        </div>
        <button type="button" className="na-arena-exit-quick"
          data-combat-exit="true" onClick={exitBattle}
          aria-label={state.combatComplete?"Continuar explorando após o combate":
            "Abandonar confronto e voltar ao mapa sem concluir a missão"}>
          {state.combatComplete?"✓ CONTINUAR NO MAPA":"← SAIR DO COMBATE"}
        </button>
        <div className="turn">
          <span className="turn-pill" data-side={state.activeSide}>
            {state.combatComplete ? (victory ? "Vitória" : "Derrota") : state.activeSide === "player" ? "Seu turno" : "Turno hostil"}
          </span>
          <span>Rodada {state.round}</span>
        </div>
      </header>
      <section className="arena-field" aria-label="Arena e visualização de personagens">
        <div className="arena-presentation">
          <div className="na-hybrid-combat-identity">
            <strong>{character.name} · {origin.name} · {character.classId?getClassById(character.classId).name:"Sem classe"}
              {character.multiclassId?" + "+getClassById(character.multiclassId).name:""}</strong>
            {getHybridArchetype(character.classId,character.multiclassId)&&
             <small>ARQUÉTIPO · {getHybridArchetype(character.classId,character.multiclassId)?.name}
               {" · "}{getHybridArchetype(character.classId,character.multiclassId)?.bonusText}</small>}
          </div>
          <div className="arena-appearance-group" role="group" aria-label="Apresentação visual do Operativo de Campo">
            <button type="button" aria-pressed={appearance === "masculine"} onClick={() => chooseAppearance("masculine")}>Masculina</button>
            <button type="button" aria-pressed={appearance === "feminine"} onClick={() => chooseAppearance("feminine")}>Feminina</button>
          </div>
        </div>
        <section className="battle-panel" aria-label="Combate tático isométrico">
          <div className="map-label"><span>{battleMode.startsWith("council-")?"DEFESA DO CONSELHO · ONDA "+state.wave+" / "+state.totalWaves:
             battleMode.startsWith("district-")?"AGENTES HELIX · ONDA "+state.wave+" / "+state.totalWaves: battleMode==="v09"?"UNIDADE HOSTIL · V-09":
             isTrialEncounter(battleMode)?"ONDA "+state.wave+" DE "+state.totalWaves+" · 8 × 8":"SIMULAÇÃO 01 · 8 × 8"}</span><span>{manager.getArenaLayout()?"TERMINAL: "+
              SIEGE_TERMINAL_NAMES[manager.getArenaLayout()!.site]+" (1 USO)":
              "TERMINAL ÂMBAR: +3 EN (1 USO)"}</span></div>
          <SceneRecovery name="arena de combate"><Suspense fallback={<div className="battlefield-canvas" role="status">
            Preparando arena tática sem bloquear a exploração…
          </div>}>
            <Battlefield manager={manager} appearance={appearance} originId={character.originId} />
          </Suspense></SceneRecovery>
          <p className="board-hint">{getHint(state, canAttack)}</p>
          <div className="na-combat-tactical-readout" aria-live="polite">
            <span>ALCANCE: {attackPreview.range} · {attackPreview.mode==="ranged"?"ARMA DE FOGO":"CORPO A CORPO"}</span>
            <span>COBERTURA DO ALVO: {attackPreview.cover==="partial"?"PARCIAL +2 DEF":
              attackPreview.cover==="full"?"TIRO BLOQUEADO":"SEM COBERTURA"}</span>
            {attackPreview.available&&<span className="na-tactic-hit-chance">
              CHANCE DE ACERTO: {attackPreview.hitChance}% · D20 (1 = FALHA, 20 = ACERTO)
            </span>}
            <span className="na-ai-awareness" data-awareness={state.enemyAwareness??"patrol"}>
              PERCEPÇÃO HOSTIL: {(state.enemyAwareness??"patrol").toUpperCase()}
              {" · "}{state.enemyPerception??"Nenhum contato confirmado"}
            </span>
            <span>INTENÇÃO HOSTIL: {manager.getEnemyIntent()}</span>
            {manager.getDistrictSupportDescription()&&<span>APOIO REGIONAL: {manager.getDistrictSupportDescription()}</span>}
            {state.overwatchReady&&<span>VIGILÂNCIA PREPARADA · 2 EN INVESTIDOS</span>}
            {state.suppressionTurns>0&&<span>SUPRESSÃO ATIVA · -2 CÉLULAS</span>}
            {!attackPreview.available&&state.activeSide==="player"&&!state.combatComplete&&
              <span className="na-tactic-disabled-reason">{attackPreview.reason}</span>}
          </div>
        </section>
      </section>
      <aside className="arena-console" aria-label="Painel de combate e habilidades">
        <div className="arena-console-scroll" aria-label="Informações e habilidades">
        <section className="units" aria-label="Unidades em combate">
          <UnitCard unit={player} role="Protagonista" accent="cyan" />
          <UnitCard unit={enemy} role={battleMode==="v09"?"VIGILÂNCIA · V-09":"Sentinela"} accent="pink" />
        </section>
        <AbilityBar state={state} manager={manager} />
        <p className="combat-message" role="status">{state.message}</p>
        <section className="origin-power-panel">
          <div className="power-heading"><div><span className="eyebrow">VANTAGEM DE ORIGEM</span><strong>{originProfile.passiveDescription}</strong><small>{originProfile.passiveEffect}</small></div><span className="passive-tag">PASSIVA</span></div>
          <div className="power-action"><div><span className="eyebrow">HABILIDADE ÚNICA · 1 USO</span><strong>{originProfile.abilityName}</strong><small>{originProfile.abilityDescription}</small></div><button type="button" className="ability-button" disabled={!state.originAbilityAvailable || state.activeSide !== "player" || state.combatComplete} onClick={() => { buzz(18); manager.activateOriginAbility(); }}>{state.originAbilityAvailable ? "Usar" : "Usada"}</button></div>
        </section>
        <details className="log-panel">
          <summary>{battleMode==="v09"?"Relatório de confronto":"Registro do teste"} <span>{state.log.length}</span></summary>
          <p className="objective">{battleMode==="v09" ? "A unidade interceptou os registros V-09. Sua derrota terá consequências persistentes para a cooperativa." : "Use movimento por toque, ataque básico, 3 habilidades e o terminal de recarga. Este ambiente não é um distrito da campanha."}</p>
          <ol className="log-list">{state.log.slice(-8).reverse().map((entry,index) => <li key={index}>{entry}</li>)}</ol>
          <p className="build-note">{saveMessage}</p>
        </details>
        </div>
        <section className="control-sheet" aria-label="Comandos do turno">
          <button type="button" className="na-abilities-open" disabled={state.combatComplete} onClick={()=>setAbilityPickerOpen(true)}
            aria-haspopup="dialog" aria-expanded={abilityPickerOpen}
            aria-label="Escolher habilidades de combate">
            <span><strong>⚡ HABILIDADES</strong><small>{manager.getClassAbilities().length} da classe · 3 comuns · 1 de origem</small></span>
            <b>ESCOLHER ›</b>
          </button>
          {state.combatComplete && <div className={`result-banner ${victory ? "victory" : "defeat"}`}>{victory ? (battleMode==="v09" ? "V-09 neutralizada · registros recuperados"
              : battleMode.startsWith("council-")?"Acordo distrital defendido · segurança restaurada"
               : battleMode.startsWith("district-")?"Segurança Helix neutralizada · provas protegidas"
              : isTrialEncounter(battleMode)?"Interceptação vencida · campanha continua"
              :"Sentinela neutralizada") : "Operativo incapacitado"}</div>}
          <div className="economy">
            <div className="eco move">Mover<span className="pips" aria-hidden="true">{Array.from({ length: state.movementPerTurn }, (_, index) => <i key={index} className={index < state.movementRemaining ? "on" : undefined} />)}</span><b>{state.movementRemaining}/{state.movementPerTurn}</b></div>
            <ActionChip label="Principal" ready={state.mainActionAvailable} />
            <ActionChip label="Bônus" ready={state.bonusActionAvailable} />
          </div>
          <div className="actions">
            <label className="na-supply-select">
              <span>SUPRIMENTO</span>
              <select value={selectedSupply} onChange={event=>setSelectedSupply(event.target.value as ItemId)} aria-label="Escolher suprimento de combate">
                {consumables.map(id=><option key={id} value={id}>{ITEM_CATALOG[id].name} ({inventory.quantities[id]})</option>)}
              </select>
            </label>
            <button type="button" className="end-turn-button" disabled={state.activeSide!=="player"||state.combatComplete||!state.bonusActionAvailable||!supplyUseful||inventory.quantities[selectedSupply]<1} onClick={handleUseSupply}>Usar suprimento</button>
            <button type="button" className="end-turn-button" onClick={() => { buzz(); manager.endPlayerTurn(); }} disabled={state.activeSide !== "player" || state.combatComplete}>Encerrar turno</button>
            <button type="button" className="attack-button" onClick={() => { buzz(20); manager.attack(); }}
              title={canAttack?`Alvo a ${attackPreview.distance} células · Defesa ${attackPreview.defense} · ${attackPreview.hitChance}% de chance`:attackPreview.reason}
              disabled={!canAttack}>{attackPreview.mode==="ranged"?"Disparar":"Ataque corpo a corpo"}</button>
          </div>
          <div className="secondary-actions">
            {manager.getCompanionSupports().map(member=><button type="button"
              className="end-turn-button" key={member.id}
              disabled={state.activeSide!=="player"||state.combatComplete||
                !state.bonusActionAvailable||state.companionUsed.includes(member.id)}
              title={member.description}
              onClick={()=>{buzz();manager.useCompanionSupport(member.id);}}>
              {state.companionUsed.includes(member.id)?"✓ "+member.name+" usou apoio":
                "◆ "+member.name+" · Apoio"}
            </button>)}
            {attackPreview.range>1&&<button type="button"
              className="end-turn-button na-overwatch-button"
              disabled={state.activeSide!=="player"||state.combatComplete||!state.mainActionAvailable||state.energy<2}
              title="Consome a ação principal e 2 EN; dispara antes da ação inimiga se houver linha de tiro."
              onClick={()=>{buzz();manager.prepareOverwatch();}}>⌖ Vigiar · 2 EN</button>}
            {battleMode==="test" && <button type="button" onClick={() => {setVictoryDetailsOpen(false);setDefeatNotice("");setBattleReset((value) => value + 1);}}>Reiniciar arena</button>}
            <button type="button" className="na-arena-exit-secondary"
              data-combat-exit="true" onClick={exitBattle}>
              {state.combatComplete?"✓ CONTINUAR EXPLORANDO":"← Voltar à exploração"}
            </button></div>
        </section>

      </aside>
      {victory&&!victoryDetailsOpen&&<div className="na-victory-backdrop"
         data-combat-victory="true">
        <section className="na-victory-dialog" role="dialog" aria-modal="true"
          aria-labelledby="na-victory-title">
          <span className="na-victory-eyebrow">NOVA ARCÁDIA · RELATÓRIO TÁTICO</span>
          <h2 id="na-victory-title">Vitória confirmada</h2>
          <p>{battleMode==="v09"?"Unidade V-09 neutralizada. A investigação continua no mapa da Baixada.":
            battleMode.startsWith("district-")?"Segurança Helix neutralizada. A investigação distrital continua.":
            "Hostis neutralizados. Retorne à exploração para seguir as missões."}</p>
          <p className="na-victory-save-note">Recompensas, XP e eventos da missão são registrados
            pelo sistema de progresso do personagem.</p>
          <button type="button" className="na-victory-continue"
            data-combat-exit="true" onClick={exitBattle}>✓ CONTINUAR EXPLORANDO</button>
          <button type="button" className="na-victory-report"
            onClick={()=>setVictoryDetailsOpen(true)}>Ver relatório e campo de batalha</button>
        </section>
      </div>}
      {defeated&&<div className="na-defeat-backdrop" data-combat-defeat="true">
        <section className="na-defeat-dialog" role="dialog" aria-modal="true"
          aria-labelledby="na-defeat-title" aria-describedby="na-defeat-description">
          <span className="na-defeat-eyebrow">SISTEMA DE EVACUAÇÃO · NOVA ARCÁDIA</span>
          <h2 id="na-defeat-title">Operativo incapacitado</h2>
          <p id="na-defeat-description">Você caiu em combate. A missão não foi perdida:
            suas pistas, itens e progresso continuam salvos. Escolha como retornar.</p>
          <div className="na-defeat-options">
            <button type="button" className="na-defeat-clinic"
              onClick={()=>handleDefeatChoice("clinic")}>
              <strong>Retornar à clínica</strong><small>Evacuação à Baixada · 35% da Vida</small>
            </button>
            <button type="button" className="na-defeat-retry"
              onClick={()=>handleDefeatChoice("retry")}>
              <strong>Tentar novamente</strong><small>Recomeçar o confronto · 50% da Vida</small>
            </button>
          </div>
          {defeatNotice&&<p role="alert" className="na-defeat-error">{defeatNotice}</p>}
          <button type="button" className="na-defeat-menu"
            onClick={()=>{setAbilityPickerOpen(false);setDefeatNotice("");setScreen("title");}}>
            Voltar ao menu sem apagar o personagem
          </button>
        </section>
      </div>}
      {abilityPickerOpen&&<CombatAbilityPicker manager={manager} state={state}
        className={character.classId?getClassById(character.classId).name:"Sem classe"}
        originDescription={originProfile.abilityDescription}
        onClose={()=>setAbilityPickerOpen(false)}/>}
    </main>
  );
}
