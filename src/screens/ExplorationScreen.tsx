import {lazy,Suspense,useEffect,useState} from "react";
import NpcDialoguePanel from "../components/NpcDialoguePanel";
import "../dialogue-cinematic.css";
import "../eden-epilogue.css";
import BaixadaWorld from "../components/BaixadaWorld";
// Carrega Phaser apenas quando o protagonista entra num interior/distrito.
 // A Baixada Android funciona com Canvas 2D sem o peso do motor Phaser.
 const InteriorWorld=lazy(()=>import("../components/InteriorWorld"));
 const DossierGallery=lazy(()=>import("../components/DossierGallery"));
import SceneRecovery from "../components/SceneRecovery";
import { getOriginById, getOriginGameplay } from "../game/character";
import CharacterMenu from "../components/CharacterMenu";
import {ITEM_CATALOG,type InventoryState,type ItemId} from "../game/inventory";
import type {CyberwareId} from "../game/cyberware.ts";
import {readParty,saveParty,recruitCompanion,toggleCompanion,
  type CompanionId} from "../game/companions.ts";
import {readStealth,saveStealth,planStealth,
 type StealthMode} from "../game/stealth.ts";
import type {RecipeId} from "../game/crafting";
import type { PlayerCharacter } from "../game/character";
import type { InteriorId } from "../game/baixada/InteriorScene";
import type { TestAppearance } from "../game/test-arena/appearance";
import { audioDirector } from "../audio/director";
import {isAndroidDevice} from "../game/performance";
import {FAVORS,NILO_SHOP,readFavors,saveFavors,acceptFavor,recordFavorActivity,
  visibleFavors,knownFavors,discoverFavors,favorStatus,shopOfferUnlocked,type FavorId} from "../game/story/favors";
import {calculateReputation,FACTION_NAMES,factionStanding} from "../game/story/reputation";
import {readUrban,saveUrban,currentUrbanCase,decideUrban,recordUrbanEvidence,recordUrbanFollowup,
  urbanActor,urbanFollowupActor,urbanFollowupNeeded,URBAN_CASES,urbanPressure} from "../game/story/urban-chronicles.ts";
import type {RadioDistrict} from "../audio/soundscapes.ts";
import {EDEN_STEPS,EDEN_ENDING_CHOICES,readEden,saveEden,startEden,currentEdenStep,edenObjective,advanceEden} from "../game/story/eden-echoes.ts";
import {createEdenEpilogue,endingDistrictImpact} from "../game/story/eden-epilogues.ts";
import {CISMA_STEPS,CISMA_OUTCOMES,CISMA_CLASS_METHODS,CISMA_ORIGIN_MEMORY,
 readCisma,saveCisma,beginCisma,currentCismaStep,cismaObjective,advanceCisma,
 cismaDistrictImpact} from "../game/story/cisma-v20.ts";
import {OPERATIONS_STAGES,OPERATIONS_ENDINGS,readOperations,saveOperations,
 startOperations,currentOperation,operationsObjective,advanceOperation,
 operationsAreaStatus} from "../game/story/cisma-operations.ts";
import {DISCOVERY_REWARDS,type DiscoveryArea} from "../game/story/discoveries.ts";
import {getClassById,type ClassId} from "../game/classes/registry";
import type {EncounterId} from "../game/types";
import {statRank,type StatId} from "../game/progression/tree";
import {TRIAL_STEPS,readTrial,saveTrial,startTrial,
 currentTrialStep,trialCombatForActor,advanceTrial,reconcileTrial} from "../game/story/field-test";
import { isPatioCitizen, getPatioConversation, type ConversationOption } from "../game/dialogues/patio";
import { readV09,markV09Reported } from "../game/story/v09";
import { MARKET_CLUE_TEXT,applyMarketAction,getMarketConversation,isMarketActor,readMarket,saveMarket } from "../game/story/market";
import { getSectorById,sectorAt,type SectorId } from "../game/baixada/layout";
import {loadWorldLocation,saveWorldLocation} from "../game/baixada/location";
import {firstMissionWaypoint} from "../game/baixada/mission-waypoint";
import {loadWorldArea,saveWorldArea} from "../game/baixada/world-area";
import {readSewer,saveSewer,sewerNextObjective,sewerStatus,applySewerEvent,
 hasSewerEvidence,type SewerEvent} from "../game/story/sewer-v09";
import {FERRUGEM_ACTORS,isFerrugemActor} from "../game/ferrugem/layout";
import {readFerrugem,saveFerrugem,startFerrugem,advanceFerrugem,
 currentFerrugemStep,ferrugemObjective,type FerrugemEnding} from "../game/ferrugem/story";
import {DISTRICTS,isDistrictId,getDistrict,actorFromId,type DistrictId} from "../game/districts/catalog";
import {isInnerId,isInnerInteract,INNER_BLUEPRINTS,INNER_IDS,type InnerId} from "../game/districts/interiors.ts";
import {innerReceipt} from "../game/story/indoor-rewards.ts";

import {readPerimeter} from "../game/story/perimeter-routes.ts";
import {readVigil} from "../game/story/vigil-escorts.ts";
import {readShelter} from "../game/story/shelter-network.ts";
import {readNexus} from "../game/story/nexus-eden.ts";
import {INNER_CONTRACTS,isContractId,readContracts,saveContracts,startContract,
 completeContract,contractObjective,solveForensicCase} from "../game/story/inner-contracts.ts";
import {FORENSIC_CASES} from "../game/story/forensic-cases.ts";
import {DISTRICT_COUNCILS,COUNCIL_DEFENSES,isCouncilId,isCouncilMethod,
  councilDefenseAvailable,
 councilUnlocked,councilObjective,councilImpact,districtOfRoom,
 readCouncils,saveCouncils,resolveCouncil,
 type CouncilId} from "../game/story/district-councils.ts";
import type {ExpansionInnerId} from "../game/districts/expansion-interiors.ts";
import {calibrationPuzzle,correctCalibration} from "../game/story/recovery-calibrations.ts";
import {RECOVERY_LINES,RECOVERY_METHODS,isRecoveryMethod,
 readRecovery,saveRecovery,repairRecoveryEquipment,resolveRecovery,
 recoveryObjective} from "../game/story/recovery-network.ts";
import {readDistrictProgress,saveDistrictProgress,beginDistrict,
 districtCurrentStep,districtObjective,advanceDistrict,type ChapterProgress,
 type DistrictEnding} from "../game/districts/progress";

const sceneLabel=(area:RadioDistrict)=>({baixada:"Baixada",ferrugem:"Ferrugem",
 aurea:"Áurea",subsolo:"Subsolo","setor-zero":"Setor Zero",
 prisma:"Prisma",periferia:"Periferia"} as const)[area];
type MissionStep = 0 | 1 | 2 | 3;
interface MissionProgress { step: MissionStep; clues: string[] }
interface DialoguePage { speaker: string; role: string; portrait: string; text: string; choices?: readonly ConversationOption[] }
interface DialogueState { pages: DialoguePage[]; index: number }
interface Props {
  character: PlayerCharacter;
  appearance: TestAppearance;
  onChangeAppearance: (appearance: TestAppearance) => void;
  onChooseClass: (classId: ClassId) => void;
  onPurchaseAttribute:(id:StatId)=>string;
  onPurchaseSkill:(id:string)=>string;
  onQuestXp:(eventId:string,amount:number)=>boolean;
  onClaimFavor:(id:FavorId)=>{ok:boolean;message:string};
  onBuyWithCredits:(item:ItemId)=>{ok:boolean;message:string};
  onSyncFactionAids:()=>boolean;
  onOpenBattle: (mode?: EncounterId) => void;
  onTreatAtClinic: () => number;
  currentHp: number;
  maxHp: number;
  progressNotice:string;
  onReturnToTitle: () => void;
  inventory: InventoryState;
  onToggleEquipment: (id: ItemId) => void;
  onGrantQuestItem: (id: ItemId) => void;
  onGrantIndustrialItem:(id:ItemId)=>void;
  onCollectDistrictCache:(area:DiscoveryArea)=>boolean;
  onCollectInteriorProp:(area:InnerId,propId:string)=>boolean;
  onCraft:(id:RecipeId)=>string;
  onInstallCyberware:(id:CyberwareId)=>string;
  onRemoveCyberware:(id:CyberwareId)=>string;
}

const MISSION_KEY = "cyberpunk-tactical-rpg.mission.v1.";
const OBJECTIVES = [
  "Encontre a clínica comunitária e converse com a Dra. Amara.",
  "Consulte o terminal de registros da clínica.",
  "Retorne à Dra. Amara com a informação encontrada.",
] as const;

const CLUE_LABELS: Record<string, string> = {
  joana: "Joana ouviu relatos de uma equipe recolhendo implantes defeituosos perto do canal.",
  nilo: "Nilo reconheceu uma peça usada em equipamentos de manutenção da rede pluvial.",
  saira: "Saira percebeu que algumas caixas chegam ao Mercado da Ponte sem identificação de origem.",
  canal: "O terminal público registra uma sequência de manutenção fora do horário normal.",
  teo: "Téo viu uma equipe entrar na galeria técnica durante uma janela de manutenção não anunciada.",
  gallery: "O registro da galeria confirma que a ocorrência V-09 foi encaminhada por uma rota de serviço.",
  lia: "Lia confirmou o manifesto V-09 adulterado na rede de bombas.",
  ramon: "Ramon identificou credenciais indevidas nos equipamentos de manutenção.",
  duda: "Duda registrou testemunho do transporte de uma pessoa doente.",
  patio: "O console do Pátio identificou a unidade de vigilância que interceptou a transferência V-09.",
  report: "Lia recebeu o relatório da sentinela neutralizada e reabriu os registros da cooperativa.",
  ...MARKET_CLUE_TEXT,
};

function readMission(characterId: string): MissionProgress {
  try {
    const raw = globalThis.localStorage?.getItem(MISSION_KEY + characterId);
    if (!raw) return { step: 0, clues: [] };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { step: 0, clues: [] };
    const value = parsed as { step?: unknown; clues?: unknown };
    const step: MissionStep =
      value.step === 1 || value.step === 2 || value.step === 3 ? value.step : 0;
    const clues = Array.isArray(value.clues)
      ? value.clues.filter(
          (clue): clue is string => typeof clue === "string" && clue in CLUE_LABELS,
        )
      : [];
    return { step, clues };
  } catch {
    return { step: 0, clues: [] };
  }
}

function saveMission(characterId: string, progress: MissionProgress): void {
  try {
    globalThis.localStorage?.setItem(MISSION_KEY + characterId, JSON.stringify(progress));
  } catch {
    // A exploração continua disponível mesmo sem armazenamento local.
  }
}

export default function ExplorationScreen({
  character,
  appearance,
  onChangeAppearance,
  onChooseClass,
  onPurchaseAttribute,
  onPurchaseSkill,
  onQuestXp,
  onClaimFavor,
  onBuyWithCredits,
  onSyncFactionAids,
  onOpenBattle,
  onTreatAtClinic,
  currentHp,
  maxHp,
  progressNotice,
  onReturnToTitle,
  inventory,
  onToggleEquipment,
  onGrantQuestItem,
  onGrantIndustrialItem,
  onCollectDistrictCache,
  onCollectInteriorProp,
  onCraft,
  onInstallCyberware,
  onRemoveCyberware,
}: Props) {
  const origin = getOriginById(character.originId);
  const [mission, setMission] = useState<MissionProgress>(() => readMission(character.id));
  const [interior, setInteriorState] = useState<InteriorId | null>(()=>loadWorldArea(character.id));
  const setInterior=(area:InteriorId|null):void=>{
    setInteriorState(area);
    // Não impede explorar se o disco ficar cheio; falha será visível no
    // diagnóstico de salvamento, e o progresso da missão permanece separado.
    saveWorldArea(character.id,area);
  };
  const [returnFromDeep,setReturnFromDeep] = useState(false);
  const [nearSewerAccess,setNearSewerAccess] = useState<string|null>(null);
  const [sewer,setSewer] = useState(()=>readSewer(character.id));
  const [sewerNotice,setSewerNotice] = useState("");
  const [ferrugem,setFerrugem] = useState(()=>readFerrugem(character.id));
  const [ferrugemNotice,setFerrugemNotice] = useState("");
  const [ferrugemDecisionPending,setFerrugemDecisionPending] = useState(false);
  const [transitOpen,setTransitOpen]=useState(false);
  const [interiorPicker,setInteriorPicker]=useState<"baixada"|"ferrugem"|DistrictId|null>(null);
const [dossierOpen,setDossierOpen]=useState(false);
  const [cityDecision,setCityDecision]=useState<DistrictId|null>(null);
  const [cityNotice,setCityNotice]=useState("");
  const [cityChapters,setCityChapters]=useState<Record<DistrictId,ChapterProgress>>(()=>({
    aurea:readDistrictProgress(character.id,"aurea"),
    subsolo:readDistrictProgress(character.id,"subsolo"),
    "setor-zero":readDistrictProgress(character.id,"setor-zero"),
    prisma:readDistrictProgress(character.id,"prisma"),
    periferia:readDistrictProgress(character.id,"periferia"),
  }));
  const [dialogue, setDialogue] = useState<DialogueState | null>(null);
  const [hubTab,setHubTab]=useState<"mission"|"favors"|"city">("mission");
  const [urban,setUrban]=useState(()=>readUrban(character.id));
  const [urbanNotice,setUrbanNotice]=useState("");
  const [hubOpen, setHubOpen] = useState(()=>!isAndroidDevice());
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuStartSection,setMenuStartSection]=useState<"character"|"progression"|"journal">("character");
  const [dismissedLevelNotice,setDismissedLevelNotice]=useState("");
  const showLevelNotice=progressNotice.startsWith("SUBIU DE NÍVEL!")&&
    dismissedLevelNotice!==progressNotice;
  const [market,setMarket]=useState(()=>readMarket(character.id));
  const [favors,setFavors]=useState(()=>readFavors(character.id));
  const [favorNotice,setFavorNotice]=useState("");
  const [trial,setTrial]=useState(()=>reconcileTrial(readTrial(character.id),character.questRewards));
  const [eden,setEden]=useState(()=>readEden(character.id));
  const [cisma,setCisma]=useState(()=>readCisma(character.id));
  const [party,setParty]=useState(()=>readParty(character.id));
  const [stealth,setStealth]=useState(()=>readStealth(character.id));
  const [contracts,setContracts]=useState(()=>readContracts(character.id));
  const [councils,setCouncils]=useState(()=>readCouncils(character.id));
  const [recovery,setRecovery]=useState(()=>readRecovery(character.id));
  const [partyNotice,setPartyNotice]=useState("");
  const [operations,setOperations]=useState(()=>readOperations(character.id));
  const [epilogueOpen,setEpilogueOpen]=useState(false);
  const [trialNotice,setTrialNotice]=useState("");
  const [sectorId,setSectorId]=useState<SectorId>(()=>sectorAt(loadWorldLocation(character.id)));
  useEffect(()=>{
    audioDirector.setDistrict(isDistrictId(interior)?interior:interior==="ferrugem"?"ferrugem":
      isInnerId(interior)?INNER_BLUEPRINTS[interior].parent??"baixada":"baixada");
    audioDirector.setScene(interior?"interior":"exploration");
  },[interior]);

  useEffect(() => {
    saveMission(character.id, mission);
  }, [character.id, mission]);
  useEffect(()=>{saveMarket(character.id,market);},[character.id,market]);

  const say = (pages: DialoguePage[]) => setDialogue({ pages, index: 0 });
  const openForensicQuestion=(id:ExpansionInnerId,prefix=""):void=>{
    const c=FORENSIC_CASES[id];
    say([{speaker:INNER_CONTRACTS[id].guide,role:"PARECER FORENSE · TRÊS PROVAS",
      portrait:"▤",text:prefix+c.question,
      choices:c.options.map((label,i)=>({id:"forensic:"+id+":"+i,
        label,reply:"Analisar evidências."}))}]);
  };
  const openCouncilQuestion=(region:CouncilId,prefix=""):void=>{
    const council=DISTRICT_COUNCILS[region];
    say([{speaker:council.guide,role:"CONSELHO DISTRITAL · QUATRO PERÍCIAS",
      portrait:"◆",text:prefix+council.question,
      choices:council.choices.map(option=>({
        id:"council:"+region+":"+option.id,label:option.label,
        reply:"Registrar a decisão pública."}))}]);
  };
  // O tratamento é uma ação médica do cenário, não uma recompensa de missão.
  // A mesma ação atende o botão visível da clínica e a conversa com Amara.
  const performClinicTreatment=():void=>{
    if(interior!=="clinic")return;
    const recovered=onTreatAtClinic();
    say([{speaker:"Dra. Amara Solis",role:"ATENDIMENTO COMUNITÁRIO",portrait:"A",
      text:recovered>0
        ?"Seus ferimentos foram tratados. Vida restaurada em "+recovered+
          " pontos. O atendimento não altera as pistas da investigação."
        : currentHp>=maxHp
          ?"Seu estado já está estabilizado. Nenhum tratamento adicional foi necessário."
          :"Não foi possível registrar o tratamento. Confira o espaço de armazenamento e tente novamente."}]);
  };
  const sayClinic=(pages:DialoguePage[]):void=>{
    const last=pages.length-1;
    say(pages.map((page,index)=>index===last?
      {...page,choices:[...(page.choices??[]),
        ...(currentHp<maxHp?[{
          id:"clinic-treatment",label:"Preciso de atendimento médico",
          reply:"Vou cuidar desses ferimentos agora."}]:[]),
        ...favorChoicesFor("dra-amara")]}:page));
  };
  const v09=readV09(character.id);
  const reputation=calculateReputation({favors,market,ferrugem,eden,cisma,operations,chapters:cityChapters,urban,councils,recovery});
  const cityArea:RadioDistrict=isInnerId(interior)?
    INNER_BLUEPRINTS[interior].parent??"baixada":
    isDistrictId(interior)?interior:interior==="ferrugem"?"ferrugem":"baixada";
  const urbanCase=currentUrbanCase(urban,cityArea,v09.defeated);
  const epilogue=createEdenEpilogue(eden,{
    name:character.name,origin:origin.name,
    className:character.classId?getClassById(character.classId).name:"sem classe",
  },reputation,Object.keys(urban.choices).length);
  const postgameImpact=eden.completed?endingDistrictImpact(eden.ending,cityArea):null;
  const cismaImpact=cismaDistrictImpact(cisma,cityArea);
  const atCompanionContacts:readonly CompanionId[]=interior==="workshop"?["nilo"]:
    interior==="canal"?["teo"]:
    interior==="subsolo"||interior==="subsolo-hideout"?["mara"]:
    interior===null||interior==="baixada-community"?["joana"]:[];
  const canOperateCyberware=interior==="clinic"||interior==="workshop";
  const operationsImpact=operationsAreaStatus(operations,cityArea);
  const councilLocalImpact=isCouncilId(cityArea)?councilImpact(councils,cityArea):null;
  useEffect(()=>{
    const post=eden.completed?endingDistrictImpact(eden.ending,cityArea):null;
    const cismaLocal=cismaDistrictImpact(cisma,cityArea);
    const operationLocal=operationsAreaStatus(operations,cityArea);
    const councilPressure=isCouncilId(cityArea)?councilImpact(councils,cityArea)?.pressure??0:0;
    const pressure=urbanPressure(urban,cityArea)+Math.floor(market.heat/3)+
      (post?.pressure??0)+(cismaLocal?.pressure??0)+(operationLocal?.pressure??0)+councilPressure;
    audioDirector.setUrbanPressure(Math.max(0,Math.min(3,pressure)));
  },[urban,cityArea,market.heat,eden.completed,eden.ending,cisma.completed,cisma.ending,operations.completed,operations.ending,councils]);
  useEffect(()=>{
    if(!epilogueOpen)return;
    const close=(event:KeyboardEvent)=>{
      if(event.key==="Escape"||event.key==="Backspace"){
        event.preventDefault();setEpilogueOpen(false);
      }
    };
    window.addEventListener("keydown",close);
    return ()=>window.removeEventListener("keydown",close);
  },[epilogueOpen]);
  const resolveUrban=(option:"a"|"b"):void=>{
    if(!urbanCase)return;
    const outcome=decideUrban(urban,cityArea,urbanCase.id,option,v09.defeated);
    if(!outcome.ok||!outcome.incident||!outcome.choice)return;
    if(!saveUrban(character.id,outcome.state)){
      setUrbanNotice("Não foi possível salvar esta ocorrência. Libere armazenamento e tente novamente.");return;
    }
    setUrban(outcome.state);
    onQuestXp("urban-"+outcome.incident.id,outcome.incident.xp);
    setUrbanNotice(outcome.incident.title+" concluída · "+outcome.incident.xp+" XP.");
    audioDirector.effect("archive");
    say([{speaker:outcome.incident.contact,role:"CONSEQUÊNCIA REGIONAL · "+sceneLabel(cityArea),
      portrait:"◆",text:outcome.choice.result}]);
  };
  const favorContext={missionStep:mission.step,v09Defeated:v09.defeated,honor:favors.honor};
  const unlockedFavors=knownFavors(favors,favorContext);
  // Ao conversar com o próprio contato, a oferta aparece sem precisar abrir o quadro.
  const favorChoicesFor=(actor:string):ConversationOption[]=>visibleFavors(favorContext)
    .filter(f=>f.contactId===actor&&!favors.claimed.includes(f.id))
    .flatMap(f=>{
      const status=favorStatus(favors,f.id);
      return status==="offered"?[{id:"favor-accept-"+f.id,
        label:"Aceitar favor: "+f.title,reply:f.synopsis,
        favorAction:"accept:"+f.id}]:
        status==="ready"?[{id:"favor-claim-"+f.id,
          label:"Entregar favor: "+f.title,reply:"Receber a recompensa combinada.",
          favorAction:"claim:"+f.id}]:[];
    });
  const actOnFavor=(command:string):void=>{
    const [action,id]=command.split(":");
    const quest=FAVORS.find(f=>f.id===id);
    if(!quest)return;
    if(action==="accept"){
      const result=acceptFavor(favors,quest.id,favorContext);
      if(!result.ok){setFavorNotice(result.message);say([{speaker:quest.contact,role:"QUADRO DE FAVORES",
       portrait:"◆",text:result.message}]);return;}
      if(!saveFavors(character.id,result.state)){
        say([{speaker:"QUADRO DE FAVORES",role:"ERRO DE ARMAZENAMENTO",portrait:"!",
          text:"Não foi possível salvar o favor. Libere espaço e tente novamente."}]);return;
      }
      setFavors(result.state);setFavorNotice(result.message);
      say([{speaker:quest.contact,role:"CONTATO COMUNITÁRIO",portrait:"◆",text:result.message}]);
      return;
    }
    if(action==="claim"){
      const result=onClaimFavor(quest.id);
      if(result.ok)setFavors(readFavors(character.id));
      setFavorNotice(result.message);
      say([{speaker:quest.contact,role:"ENTREGA DE FAVORES",portrait:"◆",text:result.message}]);
    }
  };
  const openQuestJournal=():void=>{
    setMenuStartSection("journal");setMenuOpen(true);setHubOpen(false);
  };

  const objective = mission.step<3 ? ((OBJECTIVES as readonly string[])[mission.step] ?? OBJECTIVES[0])
    : v09.reported ? (market.decisions.includes("mercado-publicar")
        ? "O dossiê comunitário foi publicado. Proteja as testemunhas da feira enquanto a Helix contesta a autoria."
        : market.decisions.includes("mercado-proteger")
        ? "As provas estão preservadas fora da rede. Investigue a autoria da triagem antes de expor os moradores."
        : market.clues.length>=2
        ? "As provas revelam uma triagem contestada. Retorne ao mural e decida se vai publicá-las ou protegê-las."
        : "Investigue o Mercado dos Cabos: fale com moradores, consulte o mural e siga as informações sobre o Projeto Éden.")
    : v09.defeated ? "Retorne a Lia para entregar os registros recuperados da unidade V-09."
    : !hasSewerEvidence(sewer) ? sewerNextObjective(sewer)
    : mission.clues.includes("patio") ? "Confronte a unidade de vigilância V-09 junto ao console do Pátio."
    : "Explore o Pátio do Reúso, converse com seus moradores e consulte o console V-09.";
  // Compact wayfinding for the original V-09 investigation only. Future
  // quest contacts remain undisclosed until their campaigns are unlocked.
  const currentWaypoint=!trial.started&&!eden.started&&!cisma.started&&
    !operations.started&&!ferrugem.started?
    firstMissionWaypoint({
      step:mission.step,hasSewerEvidence:hasSewerEvidence(sewer),
      patioConsoleRead:mission.clues.includes("patio"),
      sentinelDefeated:v09.defeated,evidenceReported:v09.reported,
    }):null;
  const addClue = (id: string) => {
    setMission((current) =>
      current.clues.includes(id)
        ? current
        : { ...current, clues: [...current.clues, id] },
    );
  };

  const registerFerrugemEvent=(actorId:string,ending?:FerrugemEnding):void=>{
    const result=advanceFerrugem(ferrugem,actorId,ending);
    if(!result.advanced||!result.stage){
      setFerrugemNotice(result.message);
      say([{speaker:"ROTA INDUSTRIAL",role:"INVESTIGAÇÃO FERRUGEM",portrait:"▤",
        text:result.message}]);
      return;
    }
    if(!saveFerrugem(character.id,result.progress)){
      setFerrugemNotice("O progresso não foi salvo. Verifique o armazenamento antes de sair.");
      say([{speaker:"ARQUIVO LOCAL",role:"FALHA DE SALVAMENTO",portrait:"!",
        text:"A evidência não pôde ser registrada. Libere armazenamento e tente novamente."}]);
      return;
    }
    setFerrugem(result.progress);
    audioDirector.effect("machine");
    if(result.progress.completed){
      // A resolução altera indicadores já usados nos diálogos do Mercado.
      // Publicar amplia o alerta da rede; proteger fortalece a confiança local.
      const adjusted={...market,
        trust:Math.min(5,market.trust+(result.progress.ending==="proteger"?1:0)),
        heat:Math.min(5,market.heat+(result.progress.ending==="publicar"?1:0)),
      };
      if(saveMarket(character.id,adjusted))setMarket(adjusted);
    }
    const rewarded=onQuestXp("ferrugem-"+result.stage.id,result.stage.xp);
    const materials:Partial<Record<string,ItemId>>={
      consumo:"celula_energia",componentes:"residuo_metalico",turno:"conector_reuso",
    };
    const collected=materials[result.stage.id];
    if(collected)onGrantIndustrialItem(collected);
    setFerrugemNotice(result.stage.title+
      (rewarded?" · +"+result.stage.xp+" XP.":" · progresso preservado.")+
      (result.progress.completed?" CAPÍTULO CONCLUÍDO.":""));
    const outcome=result.progress.completed
      ? result.progress.ending==="publicar"
        ?"Rosa concordou em publicar o dossiê de produção. A Helix conhecerá os nomes das testemunhas, e a comunidade organizará proteção e acompanhamento."
        :"Rosa entregou cópias à assembleia. A comunidade preservará os nomes e organizará uma denúncia coletiva antes da divulgação."
      : result.message;
    say([{speaker:result.stage.speaker,role:result.stage.role,portrait:"▤",text:outcome}]);
    audioDirector.effect("victory");
  };

  const enterTransit=(destination:DistrictId|"ferrugem"):void=>{
    if(!hasSewerEvidence(sewer)&&!v09.reported){
      setTransitOpen(false);
      say([{speaker:"CENTRAL DE TRANSPORTE",role:"ACESSO RESTRITO",portrait:"▤",
        text:"A rota interdistrital precisa da credencial do manifesto V-09. Termine primeiro a investigação subterrânea."}]);
      return;
    }
    if(destination==="ferrugem"){
      const started=startFerrugem(ferrugem);
      if(started!==ferrugem&&!saveFerrugem(character.id,started)){
        setCityNotice("Não foi possível salvar o capítulo de Ferrugem.");return;
      }
      if(started!==ferrugem)setFerrugem(started);
    }else{
      const started=beginDistrict(cityChapters[destination]);
      if(!saveDistrictProgress(character.id,destination,started)){
        setCityNotice("Não foi possível iniciar o capítulo. Verifique espaço no aparelho.");
        return;
      }
      setCityChapters(old=>({...old,[destination]:started}));
    }
    setTransitOpen(false);setCityDecision(null);setHubOpen(false);
    setInterior(destination);
  };
  const registerCityEvent=(district:DistrictId,actorId:string,ending?:DistrictEnding):void=>{
    const current=cityChapters[district];
    const result=advanceDistrict(district,current,actorId,ending);
    if(!result.advanced||!result.step){
      setCityNotice(result.message);
      say([{speaker:getDistrict(district).name,role:"ARQUIVO LOCAL",portrait:"▤",
        text:result.message}]);return;
    }
    const rewardId="district-"+district+"-"+result.step.id;
    if(!onQuestXp(rewardId,result.step.xp)){
      setCityNotice("Não foi possível salvar a experiência. Libere espaço e repita a interação.");
      return;
    }
    if(!saveDistrictProgress(character.id,district,result.state)){
      setCityNotice("Experiência preservada, mas a etapa não foi registrada. Interaja novamente.");
      return;
    }
    setCityChapters(old=>({...old,[district]:result.state}));
    if(result.step.id==="prova"){
      const item:ItemId=district==="aurea"?"celula_energia":
        district==="subsolo"?"conector_reuso":
        district==="setor-zero"?"residuo_metalico":
        district==="prisma"?"celula_energia":"residuo_metalico";
      onGrantIndustrialItem(item);
    }
    if(result.state.completed){
      const adjusted={...market,
        trust:Math.min(5,market.trust+(result.state.ending==="resguardar"?1:0)),
        heat:Math.min(5,market.heat+(result.state.ending==="divulgar"?1:0))};
      if(saveMarket(character.id,adjusted))setMarket(adjusted);
    }
    setCityNotice(result.step.title+" · +"+result.step.xp+
      " XP."+(result.state.completed?" CAPÍTULO CONCLUÍDO.":""));
    const conclusion=result.state.completed
      ? result.state.ending==="divulgar"
        ?"O dossiê tornou-se público. A população ganhou provas, mas a Helix aumentou a vigilância sobre as testemunhas."
        :"Uma cópia segura foi entregue à comunidade. Os nomes permanecem protegidos enquanto uma denúncia coletiva é preparada."
      :result.message;
    say([{speaker:result.step.id==="escolha"?getDistrict(district).guideName:
      getDistrict(district).name,role:"INVESTIGAÇÃO · "+getDistrict(district).name,
      portrait:"▤",text:conclusion}]);
    audioDirector.effect("victory");
  };

  const handleInteract = (id: string) => {
    // Evidência de ocorrências exige presença no objeto ou NPC real do mapa.
    // A visita também mantém a missão, comércio ou interação original ativa.
    const evidence=recordUrbanEvidence(urban,cityArea,id,v09.defeated);
    if(evidence.ok&&evidence.incident){
      if(saveUrban(character.id,evidence.state)){
        setUrban(evidence.state);
        setUrbanNotice(evidence.incident.title+" · pista inicial registrada. Investigue a segunda prova na aba Cidade.");
      }else setUrbanNotice("Espaço insuficiente: não foi possível registrar a prova.");
    }
    const followup=recordUrbanFollowup(urban,cityArea,id,v09.defeated);
    if(followup.ok&&followup.incident){
      if(saveUrban(character.id,followup.state)){
        setUrban(followup.state);
        setUrbanNotice(followup.incident.title+" · segunda prova confirmada. Decisão disponível na aba Cidade.");
        audioDirector.effect("archive");
      }else setUrbanNotice("Não foi possível salvar a segunda prova. Tente novamente.");
    }
    // Conteúdo realmente explorável: cenas internas carregadas uma por vez.
    if(id==="feira-casa-comum"){
      setInteriorPicker("baixada");audioDirector.effect("door");return;
    }
    if(id==="ferrugem-foundry-access"){
      setInteriorPicker("ferrugem");audioDirector.effect("door");return;
    }
    if(isInnerId(interior)){
      const blueprint=INNER_BLUEPRINTS[interior];
      if(id==="interior-"+interior+"-exit"){
        setInterior(blueprint.parent);audioDirector.effect("door");return;
      }
      if(id==="interior-"+interior+"-guide"){
        if(isContractId(interior)){
          const contract=INNER_CONTRACTS[interior];
          if(!contracts.accepted.includes(interior)){
            const started=startContract(contracts,interior);
            if(started.ok&&saveContracts(character.id,started.state)){
              setContracts(started.state);
              setCityNotice(contract.title+" iniciado. Examine os três objetos deste interior.");
              say([{speaker:contract.guide,role:"CONTRATO DE INVESTIGAÇÃO · 2.0",
                portrait:"◆",text:started.message}]);
            }else setCityNotice("Falha ao registrar contrato. Verifique espaço livre.");
            return;
          }
          const finished=completeContract(contracts,interior,inventory);
          if(finished.ok){
            if(!saveContracts(character.id,finished.state)){
              setCityNotice("Contrato não salvo. Libere espaço e repita a entrega.");return;
            }
            setContracts(finished.state);
            onQuestXp("inner-contract-"+interior,finished.xp);
            setCityNotice(contract.title+" concluído · +"+finished.xp+" XP.");
            audioDirector.effect("archive");
            openForensicQuestion(interior,finished.message+"\n\n"+
              "A entrega está registrada. Parecer adicional (XP único):\n");
          }else if(contracts.completed.includes(interior)&&
            !(contracts.analysed??[]).includes(interior)){
            openForensicQuestion(interior,"Dossiê entregue. Falta interpretar as três evidências.\n\n");
          }else if(councilUnlocked(districtOfRoom(interior),contracts)&&
            !councils.choices[districtOfRoom(interior)]){
            openCouncilQuestion(districtOfRoom(interior),
              "As quatro perícias independentes estão reunidas. O bairro exige uma deliberação.\n\n");
          }else if(councils.choices[districtOfRoom(interior)]){
            const region=districtOfRoom(interior);
            const regional=councilImpact(councils,region);
            const pending=councilDefenseAvailable(councils,region);
            const repairs=recovery.repairs[region]??[];
            const needsPolicy=!pending&&repairs.length===3&&!recovery.outcomes[region];
            const choices:readonly ConversationOption[]=pending?
              [{id:"council-defense:"+region,
                label:"Defender o acordo · "+COUNCIL_DEFENSES[region].waves+" ondas táticas",
                reply:"Proteger o conselho e seus recursos."}]:
              needsPolicy?RECOVERY_METHODS.map(method=>({
                id:"recovery:"+region+":"+method,
                label:RECOVERY_LINES[region].finalOptions[method].label,
                reply:RECOVERY_LINES[region].finalOptions[method].outcome,
              })):[];
            say([{speaker:contract.guide,role:"DEPOIS DA AUDIÊNCIA · "+blueprint.title,
              portrait:"◆",text:(regional?.outcome??finished.message)+
              (pending?"\n\nUma força hostil pretende reverter o acordo. "+
                COUNCIL_DEFENSES[region].briefing:
                "\n\n"+recoveryObjective(recovery,councils,region)),
              choices}]);
          }else say([{speaker:contract.guide,role:"CONTRATO · EM INVESTIGAÇÃO",
            portrait:"◆",text:finished.message}]);
          return;
        }
        const favor= blueprint.parent==="subsolo"?"movimento_livre":
          blueprint.parent==="aurea"?"helix":"movimento_livre";
        say([{speaker:blueprint.guide,role:"CONTATO LOCAL · "+blueprint.title,portrait:"◆",
          text:blueprint.guideWords+(reputation.factions[favor]>=2
            ?" Sua ajuda anterior foi reconhecida pela rede local."
            :" A confiança é conquistada pelas decisões que realmente ajudam o bairro.")}]);
        return;
      }
      const found=isInnerInteract(id);
      if(found?.area===interior){
        const claimed=onCollectInteriorProp(found.area,found.prop.id);
        if(claimed){
          audioDirector.effect(found.prop.kind==="machine"?"machine":"archive");
          onQuestXp(innerReceipt(found.area,found.prop),found.prop.xp);
        }
        const repair=found.prop.kind==="machine"&&isContractId(found.area)?
          repairRecoveryEquipment(recovery,councils,found.area,found.prop.id):null;
        const puzzle=isContractId(found.area)?calibrationPuzzle(found.area):null;
        if(repair?.ok&&puzzle){
          say([{speaker:blueprint.title,role:"OPERAÇÃO RETOMADA · CALIBRAÇÃO",
            portrait:"⚙",text:"EQUIPAMENTO: "+found.prop.title+"\n\n"+
            puzzle.prompt+"\n\nConsulte os três vestígios originais para escolher a intervenção segura.",
            choices:puzzle.options.map((option,index)=>({
              id:"calibrate:"+found.area+":"+index,label:option,
              reply:option,
            }))}]);
          return;
        }
        say([{speaker:blueprint.title,role:"DESCOBERTA · "+found.prop.title,portrait:"▤",
          text:claimed?found.prop.detail+" +"+found.prop.xp+" XP; "+found.prop.item.replaceAll("_"," ")+" recolhido."
           :repair&&!repair.ok?repair.message:
            "Este recurso já foi coletado ou o inventário não pôde ser salvo."}]);
        return;
      }
    }
    const discovered=discoverFavors(favors,id,favorContext);
    // A inspeção de um mapa regional só é válida após alcançar o distrito.
    const regionalActor=actorFromId(id);
    const taskAccessible=(id!=="patio-console"||
      (mission.step>=3&&(hasSewerEvidence(sewer)||v09.defeated)))&&
      (!regionalActor||cityChapters[regionalActor.district].started)&&
      (!id.startsWith("ferrugem-")||ferrugem.started);
    const activity=recordFavorActivity(discovered.state,id,taskAccessible);
    if(activity.state!==favors){
      if(saveFavors(character.id,activity.state)){
        setFavors(activity.state);
        const readyNames=activity.ready.map(fid=>FAVORS.find(f=>f.id===fid)?.title).filter(Boolean);
        setFavorNotice(readyNames.length?"Favor pronto para entregar: "+readyNames.join(", ")+"."
          :discovered.revealed.length?"Novos pedidos conhecidos. Abra o Quadro de Favores.":"");
      }else setFavorNotice("Falha ao registrar favor. Libere espaço no aparelho.");
    }
    const storyStage=currentEdenStep(eden);
    if(storyStage?.actor===id){
      if(storyStage.kind==="combat"){
        onOpenBattle(storyStage.encounter);
        return;
      }
      if(storyStage.kind==="decision"){
        say([{speaker:"MURAL DE BOLETINS",role:"DECISÃO COLETIVA · PROJETO ÉDEN",
          portrait:"▤",text:storyStage.message,
          choices:EDEN_ENDING_CHOICES.map(option=>({
            id:"eden-"+option.id,label:option.label,reply:option.reply,
          }))}]);
        return;
      }
      const result=advanceEden(eden,id);
      if(result.advanced&&result.step){
        if(!saveEden(character.id,result.state)){
          say([{speaker:"REGISTRO LOCAL",role:"FALHA DE SALVAMENTO",portrait:"!",
            text:"Não foi possível registrar o capítulo Éden. Libere espaço e repita a interação."}]);
          return;
        }
        setEden(result.state);
        audioDirector.effect("eden");
        onQuestXp("eden-"+result.step.id,result.step.xp);
        onSyncFactionAids();
        setCityNotice(result.step.title+" · +"+result.step.xp+" XP · próxima pista liberada.");
        say([{speaker:storyStage.sector,role:"RASTROS DO PROJETO ÉDEN",
          portrait:"▤",text:result.message}]);
        return;
      }
    }
    // 2.0: continuação pós-Éden. Somente o contato real do passo atual
    // pode avançar o ato; nenhuma conversa genérica concede progresso.
    const cismaStage=currentCismaStep(cisma);
    if(cismaStage?.actor===id){
      if(cismaStage.kind==="decision"){
        say([{speaker:"MURAL DE BOLETINS",role:"O CISMA DE ÉDEN · DECISÃO DA ASSEMBLEIA",
          portrait:"▤",text:cismaStage.discovery,
          choices:CISMA_OUTCOMES.map(option=>({
            id:"cisma-"+option.id,label:option.label,reply:option.reply,
          }))}]);
        return;
      }
      const result=advanceCisma(cisma,id,undefined,character.classId??undefined);
      if(!result.advanced||!result.step){
        say([{speaker:"ARQUIVO LOCAL",role:"OPERAÇÃO 2.0",portrait:"!",
          text:result.message}]);return;
      }
      if(!saveCisma(character.id,result.progress)){
        say([{speaker:"ARQUIVO LOCAL",role:"FALHA DE SALVAMENTO",portrait:"!",
          text:"Não foi possível registrar O Cisma de Éden. Verifique o espaço livre e repita a interação."}]);return;
      }
      setCisma(result.progress);
      onQuestXp("cisma-"+result.step.id,result.step.xp);
      setCityNotice("O Cisma de Éden · "+result.step.title+
        " · +"+result.step.xp+" XP · exposição "+result.progress.exposure+"/5.");
      audioDirector.effect("archive");
      const method=CISMA_CLASS_METHODS[result.progress.method!];
      say([{speaker:result.step.speaker,role:"O CISMA DE ÉDEN · DOSSIÊ "+(cisma.step+1)+"/"+CISMA_STEPS.length,
        portrait:"▤",text:result.message+
          "\n\nMétodo "+method.label+": "+method.insight+
          (cisma.step===0?"\n\nMEMÓRIA DE ORIGEM: "+CISMA_ORIGIN_MEMORY[character.originId]:"")}]);
      return;
    }
    const operationStage=currentOperation(operations);
    if(operationStage?.actor===id){
      if(operationStage.kind==="combat"){
        if(!operationStage.encounter)return;
        say([{speaker:operationStage.speaker,role:"OPERAÇÃO 2.0 · ROTA DE ENTRADA",
          portrait:"▤",text:operationStage.objective+
            "\n\nVocê pode atacar frontalmente ou tentar uma infiltração. A escolha será salva uma única vez por encontro, mesmo se o combate for interrompido.",
          choices:[
            {id:"ops-approach-"+operationStage.encounter+":stealth",
              label:"Infiltrar · usar classe, cyberware e contatos",
              reply:"Tentar uma rota de baixa exposição, sujeita à vigilância local."},
            {id:"ops-approach-"+operationStage.encounter+":assault",
              label:"Assalto frontal · sem teste de furtividade",
              reply:"Avançar diretamente, preservando o controle da rota."},
          ]}]);
        return;
      }
      if(operationStage.kind==="decision"){
        say([{speaker:operationStage.speaker,role:"O CISMA DE ÉDEN · ACORDO FINAL",
          portrait:"▤",text:operationStage.message,
          choices:OPERATIONS_ENDINGS.map(option=>({
            id:"cisma-operations-"+option.id,label:option.label,reply:option.reply,
          }))}]);
        return;
      }
      const result=advanceOperation(operations,id);
      if(!result.advanced||!result.stage)return;
      if(!saveOperations(character.id,result.progress)){
        say([{speaker:"ARQUIVO LOCAL",role:"FALHA DE SALVAMENTO",portrait:"!",
          text:"Não foi possível salvar a operação. Libere espaço e repita a interação."}]);return;
      }
      setOperations(result.progress);
      onQuestXp("cisma-operation-"+result.stage.id,result.stage.xp);
      setCityNotice("O Cisma de Éden · Ato "+result.stage.act+
        " · "+result.stage.title+" · +"+result.stage.xp+" XP.");
      audioDirector.effect("archive");
      say([{speaker:result.stage.speaker,role:"O CISMA DE ÉDEN · ATO "+result.stage.act,
        portrait:"▤",text:result.message}]);
      return;
    }
    const cityActor=actorFromId(id);
    if(cityActor){
      const {district,slot}=cityActor;
      if(slot==="exit"){
        setCityDecision(null);saveWorldLocation(character.id,{x:36,y:26});
        setInterior(null);return;
      }
      if(slot==="interior"){
        setInteriorPicker(district);audioDirector.effect("door");return;
      }
      if(slot==="discovery"){
        const discovery=DISCOVERY_REWARDS[district];
        const collected=onCollectDistrictCache(district);
        if(collected){audioDirector.effect("archive");onQuestXp("discovery-"+district,discovery.xp);}
        say([{speaker:getDistrict(district).name,role:"CAIXA DE SUPRIMENTOS · DESCOBERTA",
          portrait:"▤",text:collected?discovery.story+
            " Item recolhido e +"+discovery.xp+" XP.":
          "Esta caixa já foi recolhida ou o inventário não pôde ser salvo."}]);
        return;
      }
      const state=cityChapters[district];
      const stage=districtCurrentStep(district,state);
      if(stage?.id==="escolha"&&stage.slot===slot){
        setCityDecision(district);
        say([{speaker:getDistrict(district).guideName,
          role:"DECISÃO COLETIVA · "+getDistrict(district).name,portrait:"◆",
          text:stage.message}]);return;
      }
      if(stage?.id==="rede"&&stage.slot===slot){
        setCityNotice("Agentes Helix protegem o repetidor. Vença as ondas de segurança para liberar as provas.");
        onOpenBattle(("district-"+district) as EncounterId);
        return;
      }
      registerCityEvent(district,id);
      return;
    }
    const campaignBattle=trialCombatForActor(trial,id);
    if(campaignBattle){
      setTrialNotice("Interceptação iniciada · a recompensa é concedida apenas após vencer todas as ondas.");
      onOpenBattle(campaignBattle);
      return;
    }
    const progress=advanceTrial(trial,id);
    if(progress.advanced&&progress.completedStep){
      const stage=progress.completedStep;
      if(onQuestXp("trial-"+stage.id,stage.xp)&&saveTrial(character.id,progress.progress)){
        setTrial(progress.progress);
        setTrialNotice("Objetivo concluído: "+stage.title+" · +"+stage.xp+" XP. "
          +(progress.progress.completed?"OPERAÇÃO CONCLUÍDA!":"Próxima tarefa liberada."));
        audioDirector.effect("victory");
      }else{
        setTrialNotice("Não foi possível salvar a etapa. Confira o armazenamento do dispositivo.");
      }
    }
    audioDirector.effect(id.startsWith("enter-")||id==="exit-interior"?"door":id.startsWith("terminal")||id.includes("console")?"terminal":"interact");
    if(id==="enter-city-transit"){
      if(!hasSewerEvidence(sewer)&&!v09.reported){
        say([{speaker:"CENTRAL DE TRANSPORTE",role:"ACESSO RESTRITO",portrait:"▤",
          text:"Recupere primeiro o manifesto V-09 na Câmara de Recalque 04. A credencial desbloqueia o transporte entre os distritos."}]);
        return;
      }
      setTransitOpen(true);return;
    }
    if(id==="enter-ferrugem"){
      if(!hasSewerEvidence(sewer)&&!v09.reported){
        say([{speaker:"TRANSPORTE INDUSTRIAL",role:"CREDENCIAL DE ACESSO",portrait:"▤",
          text:"Acesso à zona de Ferrugem exige o manifesto de manutenção V-09. Complete a investigação do esgoto e retorne."}]);
        return;
      }
      const progress=startFerrugem(ferrugem);
      if(progress!==ferrugem&&!saveFerrugem(character.id,progress)){
        setFerrugemNotice("Não foi possível iniciar o capítulo industrial: armazenamento indisponível.");
        return;
      }
      if(progress!==ferrugem)setFerrugem(progress);
      setFerrugemDecisionPending(false);
      setHubOpen(false);setInterior("ferrugem");
      return;
    }
    if(id==="ferrugem-exit"){
      saveWorldLocation(character.id,{x:36,y:22});
      setFerrugemDecisionPending(false);
      setInterior(null);
      return;
    }
    if(id==="ferrugem-salvage"){
      const collected=onCollectDistrictCache("ferrugem");
      if(collected){audioDirector.effect("machine");onQuestXp("discovery-ferrugem",12);}
      say([{speaker:"ARQUIVO DE REFUGO",role:"RECUPERAÇÃO DA SIDERÚRGICA",
        portrait:"▤",text:collected?
          "Um microatuador da linha de montagem estava escondido na caixa lacrada. Material recuperado e +12 XP.":
          "A caixa já foi esvaziada ou o inventário não pôde ser salvo."}]);
      return;
    }
    if(isFerrugemActor(id)){
      const stage=currentFerrugemStep(ferrugem);
      const actor=FERRUGEM_ACTORS.find(a=>a.id===id);
      if(ferrugem.completed){
        say([{speaker:actor?.title??"ARQUIVO INDUSTRIAL",role:"FERRUGEM · CAPÍTULO CONCLUÍDO",
          portrait:"▤",text:ferrugemObjective(ferrugem)}]);
        return;
      }
      if(stage?.id==="decisao"&&id==="ferrugem-foreman"){
        setFerrugemDecisionPending(true);
        say([{speaker:"Rosa",role:"OPERADORA DA SIDERÚRGICA",portrait:"R",
          text:stage.message}]);
        return;
      }
      registerFerrugemEvent(id);
      return;
    }
    if (id === "enter-clinic") {
      setInterior("clinic");
      return;
    }
    if (id === "enter-workshop") {
      setInterior("workshop");
      return;
    }
    if (id === "enter-canal-gallery") {
      setInterior("canal");
      return;
    }
    if(id==="enter-sewer-drain"){
      setHubOpen(false);
      setReturnFromDeep(false);
      setInterior("sewer-drain");
      return;
    }
    if(id==="enter-sewer-deep"){
      if(!hasSewerEvidence(sewer)){
        say([{speaker:"ESCADA DA ESTAÇÃO SUL",role:"SAÍDA DE EMERGÊNCIA",portrait:"▤",
          text:"A escada de manutenção está bloqueada pelo sistema subterrâneo. Entre pela Galeria de Drenagem Sul, próxima à subestação, e recupere o manifesto V-09."}]);
        return;
      }
      setHubOpen(false);
      setReturnFromDeep(false);
      setInterior("sewer-deep");
      return;
    }
    if(id==="sewer-exit-surface"){
      saveWorldLocation(character.id,{x:33,y:20});
      setReturnFromDeep(false);
      setInterior(null);
      return;
    }
    if(id==="sewer-exit-deep"){
      setReturnFromDeep(true);
      setInterior("sewer-drain");
      return;
    }
    if(id==="sewer-exit-surface-deep"){
      if(!hasSewerEvidence(sewer)){
        say([{speaker:"ESCADA DE EMERGÊNCIA",role:"CÂMARA DE RECALQUE 04",portrait:"▤",
          text:"O elevador de manutenção não responde sem o manifesto V-09. Recupere os dados no terminal da câmara, ou retorne à galeria superior."}]);
        return;
      }
      saveWorldLocation(character.id,{x:34,y:29});
      setReturnFromDeep(false);
      setInterior(null);
      return;
    }
    if(id==="sewer-relay"){
      say([{speaker:"REPETIDOR CLANDESTINO",role:"REDE DE COMUNICAÇÕES",portrait:"▤",
        text:"SINAL FRAGMENTADO: transmissões da cooperativa foram replicadas por uma estação não registrada. A assinatura técnica parece ter sido disfarçada para se passar por um equipamento do canal."}]);
      return;
    }
    const sewerEvents:readonly SewerEvent[]=["sewer-track","sewer-pump",
      "sewer-gate","sewer-manifest","sewer-sample"];
    if(sewerEvents.some(event=>event===id)){
      const event=id as SewerEvent;
      const result=applySewerEvent(sewer,event);
      if(result.changed&&!saveSewer(character.id,result.state)){
        setSewerNotice("Não foi possível salvar o progresso do esgoto. Verifique o armazenamento do Android.");
        say([{speaker:"REGISTRO LOCAL",role:"FALHA DE SALVAMENTO",portrait:"!",
          text:"A operação não pôde ser registrada. Libere espaço e repita o acesso antes de abandonar a área."}]);
        return;
      }
      if(result.changed){
        setSewer(result.state);
        setSewerNotice("Evidência registrada. "+sewerStatus(result.state));
        audioDirector.effect("terminal");
      }
      say([{speaker:event==="sewer-gate"?"COMPORTA 04":event==="sewer-sample"?"CONTÊINER V-09":
        event==="sewer-track"?"REGISTRO DE ROTA":event==="sewer-pump"?"ESTAÇÃO HIDRÁULICA":
        "ARQUIVO DA CÂMARA 04",
        role:result.allowed?"INVESTIGAÇÃO SUBTERRÂNEA":"ACESSO BLOQUEADO",
        portrait:"▤",text:result.message}]);
      if(event==="sewer-gate"&&result.allowed){
        setHubOpen(false);
        setReturnFromDeep(false);
        setInterior("sewer-deep");
      }
      return;
    }
    if (id === "exit-interior") {
      setInterior(null);
      return;
    }

    if(id==="feira-memoria"){
      const discovery=DISCOVERY_REWARDS.baixada;
      const collected=onCollectDistrictCache("baixada");
      if(collected){audioDirector.effect("archive");onQuestXp("discovery-baixada",discovery.xp);}
      say([{speaker:"ARQUIVO DE MEMÓRIAS",role:"REDE AUTÔNOMA · HISTÓRIAS DA BAIXADA",
        portrait:"▤",text:collected?
          discovery.story+" +"+discovery.xp+" XP e arquivo recuperado.":
          "Os registros já foram recolhidos ou não foi possível gravar o inventário."}]);
      return;
    }
    if(isMarketActor(id)){
      const node=getMarketConversation(id,character.classId,market,v09.reported,character.originId,reputation);
      say([{speaker:node.speaker,role:node.role,portrait:node.portrait,
        text:node.text+(id==="feira-corretor"&&favors.honor>=2?
          " Sua reputação de ajuda aos moradores já chegou ao Mercado.":""),
        choices:[...node.choices,...favorChoicesFor(id)]}]);
      return;
    }
    if(isPatioCitizen(id)){
      if(v09.defeated && id==="lia" && markV09Reported(character.id)){
        addClue("report");
        say([{speaker:"Lia",role:"OPERADORA DAS BOMBAS",portrait:"L",
          text:"Os registros estavam com a unidade. Agora podemos provar que a autorização não veio da cooperativa. O pessoal do Pátio vai manter uma cópia fora da rede oficial. Você nos deu tempo para agir."}]);
        return;
      }
      const node=getPatioConversation(id,character.originId,v09.defeated);
      say([{speaker:node.speaker,role:node.role,portrait:node.portrait,text:node.text,choices:[...node.choices,...favorChoicesFor(id)]}]);
      return;
    }
    if(id==="patio-console"){
      if(mission.step<3){
        say([{speaker:"CONSOLE DE TRIAGEM",role:"REDE DO PÁTIO",portrait:"▤",
          text:"Registro protegido. Consulte a clínica e recupere a referência V-09 antes de abrir o histórico do Pátio."}]);
      }else if(!hasSewerEvidence(sewer)&&!v09.defeated){
        say([{speaker:"CONSOLE DE TRIAGEM",role:"REDE DO PÁTIO",portrait:"▤",
          text:"A cooperativa precisa de uma prova física da rota V-09. Desça à Galeria de Drenagem Sul, religue a bomba, abra a comporta e recupere o manifesto na Câmara de Recalque 04."}]);
      }else{
        addClue("patio");
        say([{speaker:"CONSOLE DE TRIAGEM",role:"REDE DO PÁTIO",portrait:"▤",
          text:v09.defeated ? "Registros recuperados. A cooperativa reabriu a conexão de manutenção com a Galeria do Canal."
            :"LOG V-09: transferência interceptada por unidade de vigilância não cadastrada na cooperativa. O sistema aponta uma credencial experimental, mas sua origem é inconclusiva. A unidade ainda bloqueia o acesso."}]);
      }
      return;
    }
    if(id==="patio-sentinel"){
      if(v09.defeated){
        say([{speaker:"UNIDADE V-09",role:"SISTEMA DESATIVADO",portrait:"✕",text:"A unidade não responde. O registro do encontro permanece associado a este protagonista."}]);return;
      }
      if(mission.step<3 || !hasSewerEvidence(sewer) || !mission.clues.includes("patio")){
        say([{speaker:"UNIDADE V-09",role:"VIGILÂNCIA NÃO AUTORIZADA",portrait:"!",text:"IDENTIFICAÇÃO PENDENTE. Recupere o manifesto V-09 no esgoto profundo, depois consulte o console do Pátio."}]);return;
      }
      onOpenBattle("v09");
      return;
    }

    if (id === "dra-amara") {
      if (mission.step === 0) {
        setMission((current) => ({ ...current, step: 1 }));
        sayClinic([
          {
            speaker: "Dra. Amara Solis",
            role: "MÉDICA COMUNITÁRIA",
            portrait: "A",
            text: "Uma pessoa procurou atendimento por causa de um implante defeituoso e desapareceu pouco depois. O registro de entrada continua aqui, mas o nome foi apagado.",
          },
          {
            speaker: "Dra. Amara Solis",
            role: "MÉDICA COMUNITÁRIA",
            portrait: "A",
            text: "O terminal da recepção guarda uma cópia local do histórico. Procure a ocorrência V-09. Preciso saber para onde essa pessoa foi encaminhada.",
          },
        ]);
      } else if (mission.step === 1) {
        sayClinic([
          {
            speaker: "Dra. Amara Solis",
            role: "MÉDICA COMUNITÁRIA",
            portrait: "A",
            text: "O terminal fica próximo à recepção. Consulte o histórico de atendimentos e procure a ocorrência V-09. Não confio mais nos registros centrais.",
          },
        ]);
      } else if (mission.step === 2) {
        setMission((current) => ({ ...current, step: 3 }));
        sayClinic([
          {
            speaker: "Dra. Amara Solis",
            role: "MÉDICA COMUNITÁRIA",
            portrait: "A",
            text: "V-09 não é o nome da pessoa. É um código de transferência. O registro indica que alguém autorizou o envio para uma rota técnica ligada ao canal.",
          },
          {
            speaker: "Dra. Amara Solis",
            role: "MÉDICA COMUNITÁRIA",
            portrait: "A",
            text: "Não reconheço essa autorização e ela não deveria ter sido emitida pela clínica. A entrada de esgoto junto à Subestação Sul, no extremo leste do Pátio do Reúso, leva à Galeria de Drenagem. Siga até a Câmara de Recalque 04: ela pode guardar o restante do trajeto. Obrigada por não deixar esse registro desaparecer.",
          },
        ]);
      } else {
        sayClinic([
          {
            speaker: "Dra. Amara Solis",
            role: "MÉDICA COMUNITÁRIA",
            portrait: "A",
            text: "Guarde a referência V-09. A escada de esgoto próxima à Subestação Sul leva à Galeria de Drenagem; os manifestos antigos ficam na Câmara de Recalque 04.",
          },
        ]);
      }
      return;
    }

    if (id === "terminal-clinica") {
      if (mission.step === 1) {
        setMission((current) => ({
          ...current,
          step: 2,
          clues: current.clues.includes("canal")
            ? current.clues
            : [...current.clues, "canal"],
        }));
        say([
          {
            speaker: "TERMINAL DA CLÍNICA",
            role: "ARQUIVO LOCAL · ACESSO RESTRITO",
            portrait: "▤",
            text: "REGISTRO V-09 // Entrada confirmada. Identificação civil: campo removido. Diagnóstico: falha recorrente em implante neural. Atendimento encerrado por transferência externa.",
          },
          {
            speaker: "TERMINAL DA CLÍNICA",
            role: "ARQUIVO LOCAL · ACESSO RESTRITO",
            portrait: "▤",
            text: "Destino: rota técnica do Canal Sul. Autorização: credencial não reconhecida. O histórico central foi sobrescrito, mas a cópia local preservou o código da ocorrência.",
          },
        ]);
      } else {
        say([
          {
            speaker: "TERMINAL DA CLÍNICA",
            role: "ARQUIVO LOCAL",
            portrait: "▤",
            text:
              mission.step === 0
                ? "O histórico de atendimentos está parcialmente bloqueado. A Dra. Amara pode autorizar a consulta."
                : "A cópia local da ocorrência V-09 foi preservada. Os registros apontam para uma rota técnica do Canal Sul.",
          },
        ]);
      }
      return;
    }

    if (id === "vendedor") {
      addClue("nilo");
      onGrantQuestItem("conector_reuso");
      say([
        {
          speaker: "Nilo",
          role: "MECÂNICO / VENDEDOR",
          portrait: "N",
          text: "Encontrei um conector com marcação de manutenção do canal. Pode ficar com a peça; talvez ajude a entender o que aconteceu. Não é equipamento de oficina comum. Saldo da oficina: "+favors.credits+" créditos.",
          choices:[...favorChoicesFor("vendedor"),...[
            ["materiais","Componentes e fabricação"],
            ["medicamentos","Curativos e baterias"],
            ["equipamentos","Armas e proteção"],
          ].map(([code,label])=>({
            id:"nilo-open-"+code,label:"Ver "+label,reply:"Abrir seção do catálogo."}))],
        },
      ]);
      return;
    }

    if (id === "moradora") {
      addClue("joana");
      say([
        {
          speaker: "Joana",
          role: "MORADORA DA BAIXADA",
          portrait: "J",
          text: "Teve gente perguntando por implantes usados e levando caixas sem identificação. Aconteceu perto da passagem do canal. Depois disso, ninguém quis falar sobre o assunto.",
          choices:[...favorChoicesFor("moradora")],
        },
      ]);
      return;
    }

    if (id === "saira") {
      addClue("saira");
      say([
        {
          speaker: "Saira",
          role: "VENDEDORA DO MERCADO",
          portrait: "S",
          text: "Aqui chega de tudo, mas algumas caixas aparecem sem origem e sem nota. Eu não faço pergunta quando não preciso. Só não confunda silêncio com falta de memória.",
        },
      ]);
      return;
    }

    if (id === "terminal-canal") {
      addClue("canal");
      say([
        {
          speaker: "TERMINAL PÚBLICO DO CANAL",
          role: "SERVIÇOS DO DISTRITO",
          portrait: "▤",
          text: "AVISO DE MANUTENÇÃO: sequência não catalogada detectada no Canal Sul. O acesso ao nível -01 está no Pátio Sul, ao lado da Subestação. Os registros restantes exigem vistoria na Galeria de Drenagem.",
        },
      ]);
      return;
    }

    if (id === "teo") {
      addClue("teo");
      say([
        {
          speaker: "Téo",
          role: "ENTREGADOR DO CANAL",
          portrait: "T",
          text: "Vi uma equipe atravessar o canal num horário que não aparecia nos avisos. O caminhão parou na Subestação Sul, do outro lado do Pátio. Há uma escada de manutenção ali; se ainda procura a rota V-09, comece por ela.",
          choices:[...favorChoicesFor("teo")],
        },
      ]);
      return;
    }

    if (id === "terminal-galeria") {
      addClue("gallery");
      say([
        {
          speaker: "QUADRO DE MANUTENÇÃO",
          role: "REDE HIDRÁULICA · CANAL SUL",
          portrait: "▤",
          text: "REGISTRO DE ROTA: transferência V-09 encaminhada por corredor técnico secundário. A credencial responsável não pertence à equipe local. Último sinal antes da perda de conexão: entrada da Galeria de Drenagem Sul no Pátio do Reúso.",
        },
      ]);
      return;
    }

    say([
      {
        speaker: "REGISTRO LOCAL",
        role: "NOVA ARCÁDIA",
        portrait: "·",
        text: "Não há novas informações disponíveis neste ponto.",
      },
    ]);
  };

  const selectAnswer=(choice:ConversationOption)=>{
    const calibration=/^calibrate:([a-z0-9-]+):([0-2])$/.exec(choice.id);
    if(calibration){
      const room=calibration[1],answer=Number(calibration[2]);
      if(!isContractId(room)||interior!==room){
        setDialogue(null);return;
      }
      const puzzle=calibrationPuzzle(room);
      const task=repairRecoveryEquipment(recovery,councils,room,"sistema");
      if(!puzzle||!task.ok){
        say([{speaker:INNER_BLUEPRINTS[room].guide,role:"CIRCUITO NÃO DISPONÍVEL",
          portrait:"!",text:task.message}]);return;
      }
      if(!correctCalibration(room,answer)){
        say([{speaker:INNER_BLUEPRINTS[room].guide,role:"CALIBRAÇÃO INSEGURA · TENTE OUTRA OPÇÃO",
          portrait:"!",text:puzzle.hint+"\n\n"+puzzle.prompt,
          choices:puzzle.options.map((option,index)=>({
            id:"calibrate:"+room+":"+index,label:option,reply:option,
          }))}]);return;
      }
      if(!saveRecovery(character.id,task.state)){
        say([{speaker:"ARQUIVO LOCAL",role:"MANUTENÇÃO NÃO SALVA",portrait:"!",
          text:"Sem espaço para registrar o reparo. Nenhum avanço ou XP foi concedido. "+
            "Libere armazenamento e tente novamente."}]);return;
      }
      setRecovery(task.state);
      onQuestXp("recovery-repair-"+room,task.xp);
      audioDirector.effect("machine");
      setCityNotice("OPERAÇÃO RETOMADA · "+INNER_BLUEPRINTS[room].title+
        " reparado · +"+task.xp+" XP.");
      say([{speaker:INNER_BLUEPRINTS[room].guide,role:"CALIBRAÇÃO CONFIRMADA",
        portrait:"⚙",text:puzzle.explanation+"\n\n"+task.message+
          " Recompensa única: "+task.xp+" XP."}]);
      return;
    }
    const recoveryChoice=/^recovery:([a-z0-9-]+):([a-z]+)$/.exec(choice.id);
    if(recoveryChoice){
      const region=recoveryChoice[1],method=recoveryChoice[2];
      if(!isCouncilId(region)||!isRecoveryMethod(method)||
         !isContractId(interior)||districtOfRoom(interior)!==region){
        setDialogue(null);return;
      }
      const result=resolveRecovery(recovery,councils,region,method);
      if(!result.ok){
        say([{speaker:RECOVERY_LINES[region].title,role:"OBRAS PENDENTES",
          portrait:"!",text:result.message}]);return;
      }
      if(!saveRecovery(character.id,result.state)){
        say([{speaker:"ARQUIVO LOCAL",role:"RECONSTRUÇÃO NÃO SALVA",
          portrait:"!",text:"Libere armazenamento e tente novamente. A decisão não foi aplicada."}]);
        return;
      }
      setRecovery(result.state);
      onQuestXp("recovery-final-"+region,result.xp);
      audioDirector.effect("archive");
      setCityNotice("RECONSTRUÇÃO CONCLUÍDA · "+RECOVERY_LINES[region].title+
        " · +"+result.xp+" XP.");
      say([{speaker:DISTRICT_COUNCILS[region].guide,
        role:"RETOMADA · ACORDO DE GESTÃO",
        portrait:"◆",text:result.message+"\n\nA infraestrutura recuperada afeta a "+
        "relação entre facções e oferece apoio tático regional aos próximos confrontos."}]);
      return;
    }
    const defend=/^council-defense:([a-z0-9-]+)$/.exec(choice.id);
    if(defend){
      const region=defend[1];
      if(!isCouncilId(region)||!isContractId(interior)||
         districtOfRoom(interior)!==region||
         !councilDefenseAvailable(councils,region)){
        setDialogue(null);return;
      }
      setDialogue(null);
      setCityNotice("Defesa do Conselho · "+COUNCIL_DEFENSES[region].title+
        " · "+COUNCIL_DEFENSES[region].waves+" ondas.");
      onOpenBattle(("council-"+region) as EncounterId);
      return;
    }
    const councilAnswer=/^council:([a-z0-9-]+):([a-z]+)$/.exec(choice.id);
    if(councilAnswer){
      const region=councilAnswer[1],method=councilAnswer[2];
      if(!isCouncilId(region)||!isCouncilMethod(method)||!isContractId(interior)||
         districtOfRoom(interior)!==region){setDialogue(null);return;}
      const result=resolveCouncil(councils,contracts,region,method);
      if(!result.ok){
        say([{speaker:DISTRICT_COUNCILS[region].guide,role:"AUDIÊNCIA NÃO CONCLUÍDA",
          portrait:"!",text:result.message}]);return;
      }
      if(!saveCouncils(character.id,result.state)){
        say([{speaker:"ARQUIVO LOCAL",role:"DECISÃO NÃO SALVA",portrait:"!",
          text:"Não foi possível registrar o conselho. Libere espaço e tente novamente."}]);return;
      }
      setCouncils(result.state);
      onQuestXp("district-council-"+region,result.xp);
      setCityNotice("Conselho de "+DISTRICT_COUNCILS[region].title+
        " · +"+result.xp+" XP.");
      audioDirector.effect("archive");
      say([{speaker:DISTRICT_COUNCILS[region].guide,role:"DELIBERAÇÃO DISTRITAL REGISTRADA",
        portrait:"◆",text:result.message+"\n\nSua decisão altera a pressão ambiental, "
          +"a atitude das facções e as conversas com contatos locais. "
          +"Fica registrada no salvamento do protagonista.\n\n"+
          COUNCIL_DEFENSES[region].briefing,
          choices:[{id:"council-defense:"+region,
            label:"Defender a decisão · combate tático",
            reply:"Enfrentar "+COUNCIL_DEFENSES[region].waves+" ondas hostis."}]}]);
      return;
    }
    const forensic=/^forensic:([a-z0-9-]+):([0-2])$/.exec(choice.id);
    if(forensic){
      const id=forensic[1];
      if(!isContractId(id)||interior!==id){setDialogue(null);return;}
      const result=solveForensicCase(contracts,id,Number(forensic[2]));
      if(!result.ok){
        if(!(contracts.analysed??[]).includes(id))
          openForensicQuestion(id,result.message+"\n\n");
        else say([{speaker:INNER_CONTRACTS[id].guide,role:"PARECER REGISTRADO",
          portrait:"▤",text:result.message}]);
        return;
      }
      if(!saveContracts(character.id,result.state)){
        say([{speaker:"ARQUIVO LOCAL",role:"PARECER NÃO SALVO",portrait:"!",
          text:"Falha ao persistir o parecer. Libere espaço e tente novamente."}]);return;
      }
      setContracts(result.state);
      onQuestXp("inner-forensic-"+id,result.xp);
      setCityNotice("Parecer forense aprovado em "+INNER_BLUEPRINTS[id].title+
        " · +"+result.xp+" XP.");
      audioDirector.effect("archive");
      const district=districtOfRoom(id);
      if(councilUnlocked(district,result.state)&&!councils.choices[district]){
        openCouncilQuestion(district,result.message+"\n\nParecer registrado: +"+
          result.xp+" XP. Os quatro dossiês deste distrito foram analisados.\n"+
          "O conselho pode agora decidir o destino dos recursos.\n\n");
      }else say([{speaker:INNER_CONTRACTS[id].guide,role:"PARECER FORENSE HOMOLOGADO",
        portrait:"▤",text:result.message+"\n\nRecompensa única: "+result.xp+
        " XP. Os registros permanecem no dossiê deste protagonista."}]);
      return;
    }
    if(choice.id.startsWith("ops-approach-")){
      const [encounter,rawMode]=choice.id.slice("ops-approach-".length).split(":");
      const active=currentOperation(operations);
      if(!active||active.kind!=="combat"||!active.encounter||active.encounter!==encounter||
        (rawMode!=="stealth"&&rawMode!=="assault"))return;
      const result=planStealth(stealth,active.encounter,rawMode as StealthMode,{
        classId:character.classId??"solo",level:character.level,
        cyberware:inventory.cyberware??[],party,cisma,
      });
      if(!result.ok)return;
      if(!saveStealth(character.id,result.state)){
        say([{speaker:"ARQUIVO LOCAL",role:"PLANO NÃO SALVO",portrait:"!",
          text:"Não foi possível registrar o plano de infiltração. Libere espaço e escolha novamente."}]);
        return;
      }
      setStealth(result.state);
      setCityNotice(result.message);
      setDialogue(null);
      onOpenBattle(active.encounter);
      return;
    }
    const operationChoice=OPERATIONS_ENDINGS.find(option=>choice.id==="cisma-operations-"+option.id);
    if(operationChoice){
      const result=advanceOperation(operations,"feira-archive",operationChoice.id);
      if(!result.advanced||!result.stage)return;
      if(!saveOperations(character.id,result.progress)){
        say([{speaker:"ARQUIVO LOCAL",role:"FALHA DE SALVAMENTO",portrait:"!",
          text:"O acordo final não foi salvo. Libere espaço e repita a votação."}]);return;
      }
      setOperations(result.progress);
      onQuestXp("cisma-operation-"+result.stage.id,result.stage.xp);
      setCityNotice("O Cisma de Éden · Fim do Ato IV: "+operationChoice.title);
      audioDirector.effect("eden");
      say([{speaker:"ASSEMBLEIA DE NOVA ARCÁDIA",role:"FIM DA CAMPANHA 2.0",
        portrait:"▤",text:operationChoice.world+
        "\n\nO percurso foi registrado. Você pode continuar explorando a cidade, concluir favores e verificar as consequências nos distritos."}]);
      return;
    }
    const cismaChoice=CISMA_OUTCOMES.find(option=>choice.id==="cisma-"+option.id);
    if(cismaChoice){
      const result=advanceCisma(cisma,"feira-archive",cismaChoice.id,character.classId??undefined);
      if(!result.advanced||!result.step)return;
      if(!saveCisma(character.id,result.progress)){
        say([{speaker:"ARQUIVO LOCAL",role:"FALHA DE SALVAMENTO",portrait:"!",
          text:"A deliberação da 2.0 não foi salva. Libere espaço e repita a decisão."}]);return;
      }
      setCisma(result.progress);
      onQuestXp("cisma-"+result.step.id,result.step.xp);
      setCityNotice("O Cisma de Éden concluído: "+cismaChoice.title+
        " · exposição "+result.progress.exposure+"/5.");
      audioDirector.effect("eden");
      say([{speaker:"ASSEMBLEIA DA BAIXADA",role:"O CISMA DE ÉDEN · RESULTADO",
        portrait:"▤",text:cismaChoice.consequence+
        "\n\nAs decisões agora alteram as respostas políticas e a vigilância ambiental nos sete distritos."}]);
      return;
    }
    const edenChoice=EDEN_ENDING_CHOICES.find(option=>choice.id==="eden-"+option.id);
    if(edenChoice){
      const ending=edenChoice.id;
      const result=advanceEden(eden,"feira-archive",ending);
      if(!result.advanced||!result.step)return;
      if(!saveEden(character.id,result.state)){
        say([{speaker:"REGISTRO LOCAL",role:"FALHA DE SALVAMENTO",portrait:"!",
          text:"A decisão não foi salva. Libere espaço e tente novamente."}]);return;
      }
      setEden(result.state);
      audioDirector.effect("eden");
      onQuestXp("eden-"+result.step.id,result.step.xp);
      onSyncFactionAids();
      setCityNotice("Desfecho registrado: "+edenChoice.title+". O pós-jogo está disponível.");
      setDialogue(null);
      setEpilogueOpen(true);
      return;
    }
    if(choice.id.startsWith("nilo-open-")){
      const category=choice.id.slice("nilo-open-".length);
      const offers=NILO_SHOP.filter(offer=>{
        const item=ITEM_CATALOG[offer.item];
        const group=item.category==="material"?"materiais":item.category==="consumable"?"medicamentos":"equipamentos";
        return group===category&&shopOfferUnlocked(offer,favors,reputation);
      });
      say([{speaker:"Nilo",role:"CATÁLOGO DA OFICINA",portrait:"N",
        text:"Peças disponíveis para entrega local. Saldo: "+favors.credits+" créditos. Escolha uma remessa.",
        choices:[...offers.map(offer=>({
          id:"nilo-buy-"+offer.item,label:offer.label+" · "+offer.price+" créditos",
          reply:"Pedido de compra da oficina.",shopAction:offer.item})),
          {id:"nilo-back",label:"Voltar às conversas",reply:"Retornar à oficina."}]}]);
      return;
    }
    if(choice.id==="nilo-back"){handleInteract("vendedor");return;}
    if(choice.favorAction){actOnFavor(choice.favorAction);return;}
    if(choice.shopAction){
      const result=onBuyWithCredits(choice.shopAction as ItemId);
      if(result.ok)setFavors(readFavors(character.id));
      setFavorNotice(result.message);
      say([{speaker:"Nilo",role:"COMÉRCIO DE PEÇAS",portrait:"N",text:result.message}]);
      return;
    }
    if(choice.id==="clinic-treatment"){
      performClinicTreatment();
      return;
    }
    if(choice.marketAction){
      const result=applyMarketAction(market,choice.marketAction,character.classId,v09.reported,
        statRank(character,"influencia"),reputation);
      if(result.applied){
        if(!saveMarket(character.id,result.state)){
          say([{speaker:"REDE COMUNITÁRIA",role:"FALHA DE SALVAMENTO",portrait:"!",
            text:"O acordo não pôde ser registrado. Libere espaço no aparelho e tente novamente."}]);
          return;
        }
        setMarket(result.state);
        if(result.clue)addClue(result.clue);
        if(!onSyncFactionAids())setFavorNotice("Acordo registrado. O suprimento será entregue após sincronizar o inventário.");
      }else{
        say([{speaker:"REDE COMUNITÁRIA",role:"ACESSO INDISPONÍVEL",portrait:"!",
          text:"As relações ou as provas necessárias para esse contato ainda não estão disponíveis."}]);
        return;
      }
    }
    if(choice.clue)addClue(choice.clue);
    const current=dialogue?.pages[dialogue.index];
    if(!current)return;
    audioDirector.effect("interact");
    say([{speaker:current.speaker,role:current.role,portrait:current.portrait,text:choice.reply}]);
  };
  const currentDialogue = dialogue?.pages[dialogue.index] ?? null;
  const sceneTitle = isInnerId(interior)?INNER_BLUEPRINTS[interior].title+" · Nova Arcádia"
    : isDistrictId(interior) ? getDistrict(interior).name+" · Nova Arcádia"
    : interior === "ferrugem" ? "Ferrugem · Distrito Industrial"
    : interior === "sewer-drain" ? "Galeria de Drenagem Sul"
    : interior === "sewer-deep" ? "Câmara de Recalque 04"
    : interior === "clinic"
    ? "Clínica comunitária"
    : interior === "workshop"
      ? "Oficina do Nilo"
      : interior === "canal"
        ? "Galeria do Canal"
        : getSectorById(sectorId).name;
  const sceneSubtitle = isInnerId(interior)?INNER_BLUEPRINTS[interior].subtitle
    : isDistrictId(interior) ? getDistrict(interior).subtitle
    : interior === "ferrugem" ? "SIDERÚRGICA · REDE INDUSTRIAL · PROJETO ÉDEN"
    : interior === "sewer-drain" ? "NÍVEL -01 · GALERIA HIDRÁULICA"
    : interior === "sewer-deep" ? "NÍVEL -02 · ESGOTO PROFUNDO"
    : interior === "clinic"
    ? "RECEPÇÃO / TRIAGEM"
    : interior === "workshop"
      ? "REPAROS / COMÉRCIO INFORMAL"
      : interior === "canal"
        ? "ACESSO TÉCNICO / CANAL SUL"
        : getSectorById(sectorId).description.toUpperCase();

  return (
    <main className="exploration-shell">
      <header className="explore-topbar">
        <div className="district-brand">
          <span className="eyebrow">NOVA ARCÁDIA · DISTRITO POPULAR</span>
          <h1>{sceneTitle}</h1>
          <span>{sceneSubtitle}</span>
        </div>
        <div className="explore-header-actions">
          <span className="na-explore-health" aria-label={"Vida: "+currentHp+" de "+maxHp}>
            VIDA <strong>{currentHp}/{maxHp}</strong>
          </span>
          <div className="district-status">
            <span className="signal-dot" />
            <strong>REDE LOCAL</strong>
            <span>{getSectorById(sectorId).type.toUpperCase()} · {market.heat>2?"ATENÇÃO ELEVADA":"REDE LOCAL"}</span>
          </div>
          <button type="button" className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Abrir menu do protagonista">
            <span className="menu-trigger-mark" aria-hidden="true">≡</span>
            <span className="menu-trigger-copy"><small>ARQUIVO</small><strong>PERSONAGEM</strong></span>
            <span className="menu-trigger-arrow" aria-hidden="true">›</span>
          </button>
        </div>
      </header>

      {showLevelNotice&&<div className="na-level-up-alert" role="status">
        <strong>{progressNotice}</strong>
        <button type="button" onClick={()=>{
          setDismissedLevelNotice(progressNotice);
          setMenuStartSection("progression");
          setMenuOpen(true);
        }}>Evoluir agora</button>
        <button type="button" aria-label="Dispensar aviso de nível" onClick={()=>
          setDismissedLevelNotice(progressNotice)}>×</button>
      </div>}
      <section className="explorer-character-strip">
        <div className="explorer-avatar" aria-hidden="true">
          {character.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="explorer-character-data">
          <span className="eyebrow">PROTAGONISTA · NÍVEL {character.level}</span>
          <strong>{character.name}</strong>
          <small>{origin.name} · {isInnerId(interior)?INNER_BLUEPRINTS[interior].title:
            isDistrictId(interior)?getDistrict(interior).name:interior==="ferrugem"?"Ferrugem":getSectorById(sectorId).name}</small>
        </div>
        <div className="district-clock">
          <span>18:40</span>
          <small>CHUVA FRACA</small>
        </div>
      </section>

      <section className="district-scene-section">
        <div className="district-scene-heading">
          <span>{isInnerId(interior)?"INTERIOR EXPLORÁVEL · "+INNER_BLUEPRINTS[interior].title.toUpperCase():isDistrictId(interior)?"DISTRITO EXPLORÁVEL":interior==="ferrugem"?"DISTRITO INDUSTRIAL":interior?"ÁREA INTERNA":"EXPLORAÇÃO ISOMÉTRICA"}</span>
          <span>TOQUE PARA SE MOVER</span>
        </div>
        {interior ? (
          <SceneRecovery name="região explorável"><Suspense fallback={<div className="baixada-world na-world-host" role="status">
            Preparando a região selecionada…
          </div>}>
            <InteriorWorld
            interior={interior}
            characterId={character.id}
            districtTarget={isDistrictId(interior)?districtCurrentStep(interior,cityChapters[interior])?.slot??null:null}
            originId={character.originId}
            appearance={appearance}
            onInteract={handleInteract}
            sewerProgress={sewer}
            ferrugemTargetId={currentFerrugemStep(ferrugem)?.actor??null}
            returnFromDeep={returnFromDeep}
            />
          </Suspense></SceneRecovery>
        ) : (
          <BaixadaWorld originId={character.originId} appearance={appearance} characterId={character.id}
            objectiveActorId={currentWaypoint?.actorId??null}
            onSectorChange={setSectorId} onNearbyAccess={setNearSewerAccess} onInteract={handleInteract} />
        )}
        <div className="world-instructions">
          <span className="instruction-glyph">⌖</span>
          <span>
            {interior
              ? "Toque no chão para caminhar. Aproxime-se de pessoas e terminais para interagir."
              : "Toque em um ponto livre para caminhar. Aproxime-se dos moradores, acessos e terminais."}
          </span>
        </div>
        {interior && (
          <button type="button" className="area-return" onClick={()=>{
            if(interior==="sewer-deep"){
              setReturnFromDeep(true);setInterior("sewer-drain");
            }else{
              if(isDistrictId(interior))saveWorldLocation(character.id,{x:36,y:26});
              if(isInnerId(interior)){
                audioDirector.effect("door");setInterior(INNER_BLUEPRINTS[interior].parent);return;
              }
              if(interior==="ferrugem")saveWorldLocation(character.id,{x:36,y:22});
              if(interior==="sewer-drain")saveWorldLocation(character.id,{x:33,y:20});
              setReturnFromDeep(false);setInterior(null);
            }
          }}>
            {interior==="sewer-deep"?"← RETORNAR À GALERIA":isInnerId(interior)?
              "← RETORNAR AO DISTRITO":"← RETORNAR À BAIXADA"}
          </button>
        )}
        {isContractId(interior)&&
          <button type="button" className="area-return" onClick={()=>setDossierOpen(true)}>
            {readPerimeter(character.id).completed[interior]&&
             !readVigil(character.id).completed[interior]?
              "◈ MISSÃO: OPERAÇÃO VIGÍLIA — RESGATE":
             readVigil(character.id).completed[interior]&&
             !readShelter(character.id).completed[interior]?
              "◈ MISSÃO: OPERAÇÃO REFÚGIO — PROTEÇÃO CIVIL":
             readShelter(character.id).completed[interior]&&
             !readNexus(character.id).completed[interior]?
              "◈ MISSÃO: OPERAÇÃO NEXO — REDE ÉDEN":
              "◈ ABRIR MISSÕES E ARQUIVO DO DISTRITO"}
          </button>}
        {interior==="clinic"&&<section className="na-clinic-quick-treatment"
          aria-label="Atendimento médico da Clínica Comunitária">
          <span>✚ CLÍNICA COMUNITÁRIA · TRIAGEM</span>
          <strong>Vida atual: {currentHp}/{maxHp}</strong>
          <button type="button" onClick={performClinicTreatment}
            disabled={currentHp>=maxHp}
            aria-label={currentHp>=maxHp?"Vida completa, tratamento indisponível":
              "Receber tratamento e recuperar "+Math.max(0,maxHp-currentHp)+" pontos de Vida"}>
            {currentHp>=maxHp?"✓ FERIMENTOS ESTABILIZADOS":
              "✚ RECEBER TRATAMENTO · +"+Math.max(0,maxHp-currentHp)+" PV"}
          </button>
        </section>}
      </section>
      {dossierOpen&&isInnerId(interior)&&
        <Suspense fallback={<div className="na-world-startup">Abrindo registros...</div>}>
          <DossierGallery room={interior} characterId={character.id}
             onQuestXp={onQuestXp} onClose={()=>setDossierOpen(false)}/>
        </Suspense>}
      {/* Um único HUD de objetivo por área: o painel principal já cobre os
          seis distritos; o lembrete extra existe apenas no esgoto labiríntico. */}
      {(interior==="sewer-drain"||interior==="sewer-deep")&&<button type="button"
        className="na-sewer-objective-hint" onClick={()=>setHubOpen(true)}
        aria-label="Abrir objetivos da investigação subterrânea">
        <span>◈ OBJETIVO SUBTERRÂNEO · TOQUE PARA DETALHES</span>
        <strong>{sewerNextObjective(sewer)}</strong>
      </button>}
      {!interior&&nearSewerAccess&&<button type="button"
        className="na-sewer-quick-access"
        aria-label={nearSewerAccess==="enter-city-transit"?"Abrir transporte entre distritos":nearSewerAccess==="enter-ferrugem"?"Viajar ao Distrito Ferrugem":
          nearSewerAccess==="enter-sewer-drain"?"Entrar na Galeria de Drenagem Sul":
          "Entrar na Câmara de Recalque 04"}
        onClick={()=>handleInteract(nearSewerAccess)}>
        <strong>{nearSewerAccess==="enter-city-transit"?"→ TRANSPORTE INTERDISTRITAL":nearSewerAccess==="enter-ferrugem"?"→ TRANSPORTE PARA FERRUGEM":
          nearSewerAccess==="enter-sewer-drain"?
          "↓ ENTRAR NA GALERIA DE DRENAGEM":"↓ ACESSO À CÂMARA 04"}</strong>
        <small>{nearSewerAccess==="enter-city-transit"?"Explore Áurea, Subsolo, Setor Zero, Prisma e Periferia":nearSewerAccess==="enter-ferrugem"?"Terminal de transporte próximo":"Escada próxima · toque para descer"}</small>
      </button>}

      {interiorPicker&&<div className="na-transit-shade">
        <section className="na-transit-panel" role="dialog" aria-modal="true"
          aria-label="Explorar os interiores do distrito">
          <div className="na-transit-head">
            <div>
              <span>EXPANSÃO 2.0 · LOCAIS ACESSÍVEIS</span>
              <h2>{sceneLabel(interiorPicker)} · Interiores</h2>
            </div>
            <button type="button" onClick={()=>setInteriorPicker(null)}>Fechar ×</button>
          </div>
          <p>Escolha uma localização. Cada uma tem geometria isométrica,
             objetos examináveis, recompensa própria e registro no inventário.</p>
          <div className="na-transit-grid">
            {INNER_IDS.filter(area=>
              INNER_BLUEPRINTS[area].parent===(interiorPicker==="baixada"?null:interiorPicker))
              .map(area=>{
                const room=INNER_BLUEPRINTS[area];
                const expanded=!["baixada-community","ferrugem-foundry",
                  "aurea-archive","subsolo-hideout","setor-zero-lab",
                  "prisma-backstage","periferia-waterworks"].includes(area);
                const locked=expanded&&interiorPicker==="baixada"&&!v09.defeated;
                return <button key={area} type="button" disabled={locked} onClick={()=>{
                  setInteriorPicker(null);setHubOpen(false);setInterior(area);
                  audioDirector.effect("door");
                }}>
                  <strong>{room.title.toUpperCase()}</strong>
                  <small>{locked?"Libera após a sentinela V-09":room.subtitle}</small>
                </button>;
              })}
          </div>
        </section>
      </div>}
      {transitOpen&&<div className="na-transit-shade">
        <section className="na-transit-panel" role="dialog" aria-modal="true"
          aria-label="Central de Transporte Nova Arcádia">
          <div className="na-transit-head">
            <div><span>REDE DE TRANSPORTE · PROJETO ÉDEN</span><h2>Escolha um distrito</h2></div>
            <button type="button" onClick={()=>setTransitOpen(false)}>Fechar ×</button>
          </div>
          <p>A credencial V-09 permite acessar as seis zonas exteriores. Cada região possui
            suas próprias pistas, encontros, recompensas e áudio ambiente.</p>
          <div className="na-transit-grid">
            <button type="button" onClick={()=>enterTransit("ferrugem")}>
              <strong>FERRUGEM</strong><small>Fábricas, cooperativa e engenharia</small>
            </button>
            {DISTRICTS.map(d=><button type="button" key={d.id} onClick={()=>enterTransit(d.id)}>
              <strong>{d.name.toUpperCase()}</strong><small>{d.intro}</small>
            </button>)}
          </div>
          {cityNotice&&<small role="status">{cityNotice}</small>}
        </section>
      </div>}
      <aside className={"na-mission-hub na-quest-hud"+(hubOpen?" expanded":" collapsed")}
        aria-label="Objetivo ativo e quadro de favores">
        <button className="na-hub-toggle" type="button" onClick={()=>setHubOpen(open=>!open)}
          aria-expanded={hubOpen} aria-controls="na-mission-details">
          <span aria-hidden="true">◈</span>
          <strong>{hubOpen?"MISSÕES · NOVA ARCÁDIA":"OBJETIVO ATIVO"}</strong>
          <span aria-hidden="true">{hubOpen?"×":"+"}</span>
        </button>
        {!hubOpen&&<div className="na-quest-peek">
          <strong>{operations.started?operationsObjective(operations):
            cisma.started?cismaObjective(cisma):
            isDistrictId(interior)?districtObjective(interior,cityChapters[interior]):
            interior==="ferrugem"?ferrugemObjective(ferrugem):
            eden.started?edenObjective(eden):
            trial.started&&!trial.completed?currentTrialStep(trial)?.objective:
            objective}</strong>
          {currentWaypoint&&<small className="na-quest-next-stop">
            ⌖ PRÓXIMA PARADA · {currentWaypoint.label}
          </small>}
          {favors.ready.some(id=>!favors.claimed.includes(id))&&
            <small>◆ Favor concluído · procure o contato</small>}
        </div>}
        {hubOpen&&<div id="na-mission-details" className="na-mission-details na-quest-details">
          <div className="na-quest-tabs" role="tablist" aria-label="Aba de missões">
            <button type="button" role="tab" aria-selected={hubTab==="mission"}
              onClick={()=>setHubTab("mission")}>Principal</button>
            <button type="button" role="tab" aria-selected={hubTab==="favors"}
              onClick={()=>setHubTab("favors")}>Favores {favors.accepted.filter(id=>!favors.claimed.includes(id)).length}</button>
            <button type="button" role="tab" aria-selected={hubTab==="city"}
              onClick={()=>setHubTab("city")}>Cidade</button>
          </div>
          {hubTab==="mission"?<div className="na-quest-tab-content" role="tabpanel">
            <span className="na-quest-kicker">ETAPA ATUAL · SEM REVELAR PRÓXIMOS CAPÍTULOS</span>
            <h3>{operations.started?"O Cisma de Éden · Ato "+(currentOperation(operations)?.act??4):
              cisma.started?"O Cisma de Éden · Ato I":
              isDistrictId(interior)?getDistrict(interior).name:
              interior==="ferrugem"?"Ecos de Ferrugem":
              eden.started?"Ecos da Cidade · Projeto Éden":
              trial.started&&!trial.completed?"Operação Circuito Fantasma":
              mission.step<3?"O nome que sumiu":
              !v09.reported?"Investigação V-09":"Rastros do Éden"}</h3>
            <p>{operations.started?operationsObjective(operations):
              cisma.started?cismaObjective(cisma):
              isDistrictId(interior)?districtObjective(interior,cityChapters[interior]):
              interior==="ferrugem"?ferrugemObjective(ferrugem):
              eden.started?edenObjective(eden):
              trial.started&&!trial.completed?currentTrialStep(trial)?.objective:
              objective}</p>
            {currentWaypoint&&<small className="na-quest-next-stop">
              ⌖ PRÓXIMA PARADA · {currentWaypoint.label}
            </small>}
            {operations.started&&!operations.completed&&<small>
              Operações · Ato {currentOperation(operations)?.act} · etapa {operations.step+1} de {OPERATIONS_STAGES.length}
              {" · "}2 confrontos do clímax em etapas separadas</small>}
            {operations.completed&&<small>
              CAMPANHA 2.0 CONCLUÍDA · {OPERATIONS_ENDINGS.find(option=>option.id===operations.ending)?.title}
            </small>}
            {cisma.completed&&!operations.started&&<button type="button"
              className="na-quest-primary" onClick={()=>{
                const started=startOperations(operations,cisma);
                if(!saveOperations(character.id,started)){
                  setCityNotice("Não foi possível salvar o início das operações da expansão.");return;
                }
                setOperations(started);
                setCityNotice("Ato II liberado: encontre Rosa em Ferrugem.");
              }}>Iniciar Atos II–IV · Guerra Invisível</button>}
            {cisma.started&&!cisma.completed&&<small>Versão 2.0 · etapa {cisma.step+1} de {CISMA_STEPS.length}
              {" · "}Abordagem: {cisma.method?CISMA_CLASS_METHODS[cisma.method].label:"a definir"}
              {" · "}Exposição: {cisma.exposure}/5</small>}
            {cisma.completed&&<small>O Cisma de Éden concluído ·
              {CISMA_OUTCOMES.find(option=>option.id===cisma.ending)?.title}
              {" · "}Exposição final {cisma.exposure}/5</small>}
            {eden.completed&&!cisma.started&&<button type="button"
              className="na-quest-primary" onClick={()=>{
                const started=beginCisma(cisma,eden.completed);
                if(!saveCisma(character.id,started)){
                  setCityNotice("Não foi possível salvar o começo da expansão 2.0.");return;
                }
                setCisma(started);
                setCityNotice("O Cisma de Éden começou. Investigue o novo caso com a Dra. Amara.");
              }}>Iniciar expansão 2.0 · O Cisma de Éden</button>}
            {eden.started&&!eden.completed&&<small>Capítulo Éden · etapa {eden.step+1} de {EDEN_STEPS.length}</small>}
            {eden.completed&&<button className="na-quest-primary" type="button"
              onClick={()=>setEpilogueOpen(true)}>Ver desfecho, epílogo e créditos</button>}
            {trial.started&&!trial.completed&&<small>
              Etapa {trial.step+1} de {TRIAL_STEPS.length} · {currentTrialStep(trial)?.sector}</small>}
            {trial.completed&&!eden.started&&v09.reported&&
              <button className="na-quest-primary" type="button" onClick={()=>{
                const opened=startEden(eden,trial.completed,v09.reported);
                if(saveEden(character.id,opened)){
                  setEden(opened);setCityNotice("Novo capítulo liberado: Ecos da Cidade.");
                }else setCityNotice("Não foi possível registrar o capítulo Éden.");
              }}>Iniciar Ecos da Cidade · Projeto Éden</button>}
            {mission.step>=3&&!trial.started&&!trial.completed&&
              <button className="na-quest-primary" type="button" onClick={()=>{
                const started=startTrial(trial);
                if(saveTrial(character.id,started)){
                  setTrial(started);setTrialNotice("Operação iniciada. Dirija-se à clínica.");
                }else setTrialNotice("Não foi possível salvar a operação.");
              }}>Iniciar Operação Circuito Fantasma</button>}
            {[trialNotice,sewerNotice,cityNotice,ferrugemNotice].filter(Boolean).slice(-1).map(text=>
              <small key={text} className="na-quest-notice" role="status">{text}</small>)}
            <button className="na-quest-secondary" type="button" onClick={openQuestJournal}>
              Abrir diário completo ↗</button>
          </div>:hubTab==="favors"?<div className="na-quest-tab-content na-favor-board" role="tabpanel">
            <div className="na-favor-wallet"><span>CRÉDITOS <strong>{favors.credits}</strong></span>
              <span>HONRA <strong>{favors.honor}</strong></span></div>
            <div className="na-faction-mini" aria-label="Relações com as facções">
              {(["helix","movimento_livre","mercado_cinzento","consorcio_civico"] as const).map(id=>
                <span key={id} title={FACTION_NAMES[id]+" · "+factionStanding(reputation.factions[id])}>
                  {id==="helix"?"HELIX":id==="movimento_livre"?"LIVRE":id==="mercado_cinzento"?"CINZENTO":"CÍVICO"}
                  <strong>{reputation.factions[id]>0?"+":""}{reputation.factions[id]}</strong>
                </span>)}
            </div>
            <span className="na-quest-kicker">FAVORES DISPONÍVEIS AGORA · {unlockedFavors.length}</span>
            {unlockedFavors.filter(f=>favorStatus(favors,f.id)!=="claimed").length===0?
              <p className="na-favor-empty">Ainda não há pedidos pendentes. Conheça os moradores e avance na investigação.</p>:
              unlockedFavors.filter(f=>favorStatus(favors,f.id)!=="claimed").map(f=>{
                const status=favorStatus(favors,f.id);
                return <article className="na-favor-row" key={f.id}>
                  <div><strong>{f.title}</strong><small>{f.contact}</small></div>
                  <p>{status==="offered"?f.synopsis:f.objective}</p>
                  <small>+{f.reward.xp} XP · {f.reward.credits} créditos ·
                    {" "}{f.reward.honor} Honra · {f.reward.amount} item(ns)</small>
                  {status==="offered"?<button type="button" onClick={()=>actOnFavor("accept:"+f.id)}>
                    Aceitar favor</button>:status==="ready"?
                    <strong className="na-favor-ready">✓ Pronto · entregar a {f.contact}</strong>:
                    <span className="na-favor-active">Em andamento</span>}
                </article>;
              })}
            {favorNotice&&<small className="na-quest-notice" role="status">{favorNotice}</small>}
            <button className="na-quest-secondary" type="button" onClick={openQuestJournal}>
              Histórico e recompensas no diário ↗</button>
          </div>:<div className="na-quest-tab-content na-favor-board na-urban-board" role="tabpanel">
            <span className="na-quest-kicker">OCORRÊNCIAS LOCAIS · {sceneLabel(cityArea).toUpperCase()}</span>
            {isInnerId(interior)&&isContractId(interior)&&
              <article className="na-favor-row" aria-label="Contrato da região">
                <strong>{INNER_CONTRACTS[interior].title}</strong>
                <p>{contractObjective(interior,contracts,inventory)}</p>
                <small>{contracts.completed.length}/28 dossiês concluídos ·
                  três provas físicas por interior</small>
              </article>}
            {isContractId(interior)&&readVigil(character.id).completed[interior]&&
             <article className="na-favor-row" aria-label="Progressão após o resgate">
              <strong>{readNexus(character.id).completed[interior]?
                "ÉDEN · REDE LOCAL CONSOLIDADA":
                readShelter(character.id).completed[interior]?
                "OPERAÇÃO NEXO · DESAFIO DO ÉDEN":
                "OPERAÇÃO REFÚGIO · PROTEÇÃO DOS CIVIS"}</strong>
              <p>{readNexus(character.id).completed[interior]?
                "Seis relés foram liberados, e a política local está registrada no arquivo.":
                readShelter(character.id).completed[interior]?
                "O abrigo foi estabilizado. Entre no arquivo e selecione Nexo para acessar seis relés.":
                "Após o resgate, civis precisam de suprimentos e cinco postos de assistência."}</p>
              <button type="button" className="na-quest-secondary" onClick={()=>{
                setDossierOpen(true);setHubOpen(false);
              }}>Abrir a próxima operação</button>
             </article>}
            {isCouncilId(cityArea)&&<article className="na-favor-row"
              aria-label="Conselho distrital e decisões persistentes">
              <strong>CONSELHO DISTRITAL · {DISTRICT_COUNCILS[cityArea].title}</strong>
              <p>{councilObjective(cityArea,contracts,councils)}</p>
              <small>{councils.choices[cityArea]?
                councilLocalImpact?.pressure===-1?"Proteção local reforçada · vigilância reduzida":
                councilLocalImpact?.pressure===1?"Controle reforçado · pressão aumentada":
                "Fiscalização equilibrada · pressão estável":
                "Investigue as quatro áreas e retorne ao contato"}
              </small>
            </article>}
            {isCouncilId(cityArea)&&<article className="na-favor-row"
              aria-label="Operação Retomada · 21 serviços técnicos distritais">
              <strong>OPERAÇÃO RETOMADA · {RECOVERY_LINES[cityArea].title}</strong>
              <p>{recoveryObjective(recovery,councils,cityArea)}</p>
              <small>{(recovery.repairs[cityArea]??[]).length}/3 máquinas recuperadas ·
                {recovery.outcomes[cityArea]?" decisão final registrada":
                 " gestão ainda pendente"}</small>
            </article>}
            {operationsImpact&&<article className="na-favor-row" aria-label="Repercussão da conclusão da campanha 2.0">
              <strong>DEPOIS DO CISMA · {operationsImpact.title}</strong>
              <p>{operationsImpact.message}</p>
              <small>{OPERATIONS_ENDINGS.find(option=>option.id===operations.ending)?.title}</small>
            </article>}
            {cismaImpact&&<article className="na-favor-row" aria-label="Consequência da expansão 2.0 na região">
              <strong>O CISMA DE ÉDEN · {cismaImpact.label}</strong>
              <p>{cismaImpact.description}</p>
              <small>Decisão final: {CISMA_OUTCOMES.find(option=>option.id===cisma.ending)?.title}
                {" · "}{cismaImpact.pressure>0?"Vigilância reforçada":
                  cismaImpact.pressure<0?"Vigilância reduzida":"Pressão monitorada"}</small>
            </article>}
            {postgameImpact&&<article className="na-favor-row" aria-label="Consequência do desfecho nesta região">
              <strong>DEPOIS DE ÉDEN · {postgameImpact.label}</strong>
              <p>{postgameImpact.consequence}</p>
              <small>{postgameImpact.pressure>0?"Vigilância aumentada":
                postgameImpact.pressure<0?"Vigilância reduzida":"Vigilância preservada"} ·
                reatividade sonora aplicada</small>
            </article>}
            {!v09.defeated?<p className="na-favor-empty">Investigue a sentinela V-09 para acessar as redes comunitárias de ocorrências.</p>:
              urbanCase?<article className="na-favor-row na-urban-case">
                <div><strong>{urbanCase.title}</strong><small>{urbanCase.contact}</small></div>
                <p>{urbanCase.situation}</p>
                <small>{urbanCase.xp} XP · relações políticas e vigilância afetadas</small>
                {!urban.evidence?.includes(urbanCase.id)?
                  <p className="na-favor-active">ETAPA 1/2 · {urbanActor(urbanCase).objective}. Toque no personagem ou terminal.</p>:
                  urbanFollowupNeeded(urban,urbanCase)?
                    <p className="na-favor-active">ETAPA 2/2 · {urbanFollowupActor(urbanCase).objective}. Volte ao mapa, confirme a prova e decida.</p>:
                  urbanCase.choices.map(option=><button type="button" key={option.id}
                    onClick={()=>resolveUrban(option.id)}>{option.label}</button>)}
              </article>:<p className="na-favor-empty">Ocorrências resolvidas nesta região. Outros distritos têm novos conflitos.</p>}
            {urbanNotice&&<small role="status" className="na-quest-notice">{urbanNotice}</small>}
            {URBAN_CASES.some(e=>e.district===cityArea&&urban.choices[e.id])&&
               <details className="na-urban-repercussions">
                 <summary>Repercussões locais · mudanças registradas</summary>
                 {URBAN_CASES.filter(e=>e.district===cityArea&&urban.choices[e.id]).map(e=>{
                   const selected=e.choices.find(c=>c.id===urban.choices[e.id]);
                   return <article key={e.id} className="na-favor-row">
                     <strong>{e.title}</strong>
                     <p>{selected?.result}</p>
                     <small>{selected?.pressure&&selected.pressure>0?"Vigilância regional intensificada":
                       selected?.pressure&&selected.pressure<0?"Vigilância regional reduzida":
                       "Tensão regional mantida"} · reputação e apoios aplicados</small>
                   </article>;
                 })}
               </details>}
             <small className="na-quest-kicker">DECISÕES REGISTRADAS: {Object.keys(urban.choices).length} / 21</small>
          </div>}
        </div>}
      </aside>
      <div className="exploration-footer-actions single-action">
        <button type="button" className="explore-secondary" onClick={() => onOpenBattle("test")}>
          Arena tática de teste
        </button>
      </div>

      {menuOpen && (
        <CharacterMenu
          initialSection={menuStartSection}
          character={character}
          appearance={appearance}
          onChangeAppearance={onChangeAppearance}
          onChooseClass={onChooseClass}
          onPurchaseAttribute={onPurchaseAttribute}
          onPurchaseSkill={onPurchaseSkill}
          originName={origin.name}
          originDescription={origin.description}
          originProfile={getOriginGameplay(character.originId)}
          missionStep={mission.step}
          missionObjective={objective}
          favors={favors}
          favorContext={favorContext}
          reputation={reputation}
          edenProgress={eden}
          sewerProgress={sewer}
          ferrugemProgress={ferrugem}
          clues={mission.clues.map((id) => ({ id, text: CLUE_LABELS[id] ?? "Pista registrada." }))}
          sceneTitle={sceneTitle}
          sceneSubtitle={sceneSubtitle}
          onClose={() => setMenuOpen(false)}
          onReturnToTitle={onReturnToTitle}
          onOpenTestArena={() => onOpenBattle("test")}
          inventory={inventory}
          onToggleEquipment={onToggleEquipment}
          onCraft={onCraft}
          onInstallCyberware={id=>canOperateCyberware?onInstallCyberware(id):
            "A instalação exige atendimento presencial na clínica ou na oficina do Nilo."}
          onRemoveCyberware={id=>canOperateCyberware?onRemoveCyberware(id):
            "Remoção exige clínica ou oficina do Nilo."}
          canOperateCyberware={canOperateCyberware}
          party={party}
          availableCompanions={atCompanionContacts}
          onRecruitCompanion={id=>{
            const result=recruitCompanion(party,id,atCompanionContacts.includes(id));
            if(!result.ok)return result.message;
            if(!saveParty(character.id,result.state))return "Não foi possível salvar este recrutamento.";
            setParty(result.state);setPartyNotice(result.message);return result.message;
          }}
          onToggleCompanion={id=>{
            const result=toggleCompanion(party,id);
            if(!result.ok)return result.message;
            if(!saveParty(character.id,result.state))return "Não foi possível gravar a equipe.";
            setParty(result.state);setPartyNotice(result.message);return result.message;
          }}
          partyNotice={partyNotice}
        />
      )}

      {epilogueOpen&&epilogue&&<div className="na-epilogue-overlay">
        <section className="na-epilogue-panel" role="dialog" aria-modal="true"
          aria-labelledby="na-epilogue-title">
          <span className="na-epilogue-kicker">NOVA ARCÁDIA · DEPOIS DO ALGORITMO</span>
          <h2 id="na-epilogue-title">{epilogue.title}</h2>
          <p>{epilogue.lead}</p>
          <p>{epilogue.world}</p>
          <p>{epilogue.decisions}</p>
          <h3>A cidade depois da decisão</h3>
          <ul>{epilogue.impacts.map(impact=><li key={impact.district}>
            <strong>{sceneLabel(impact.district)} · {impact.label}</strong>
            <p>{impact.consequence}</p>
          </li>)}</ul>
          <details><summary>Créditos e agradecimentos</summary>
            {epilogue.credits.map(line=><p key={line}>{line}</p>)}
          </details>
          <button type="button" className="na-epilogue-return"
            onClick={()=>setEpilogueOpen(false)}>Retornar à cidade · pós-jogo</button>
        </section>
      </div>}

      {currentDialogue && (
       <NpcDialoguePanel key={dialogue?.index} page={currentDialogue}
        pageIndex={dialogue?.index??0} totalPages={dialogue?.pages.length??1} pages={dialogue?.pages}
        onClose={()=>setDialogue(null)}
        onNext={()=>{
          setDialogue(current=>{
            if(!current||current.index+1>=current.pages.length)return null;
            return {...current,index:current.index+1};
          });
        }} onAnswer={selectAnswer}>
        {cityDecision&&currentDialogue.speaker===getDistrict(cityDecision).guideName&&
         districtCurrentStep(cityDecision,cityChapters[cityDecision])?.id==="escolha"&&
         <div className="na-ferrugem-choices" role="group" aria-label="Destino do dossiê comunitário">
          <button type="button" onClick={()=>{
            const district=cityDecision;setCityDecision(null);
            registerCityEvent(district,"district-"+district+"-guide","divulgar");
          }}>Divulgar as provas agora</button>
          <button type="button" onClick={()=>{
            const district=cityDecision;setCityDecision(null);
            registerCityEvent(district,"district-"+district+"-guide","resguardar");
          }}>Resguardar as testemunhas</button>
         </div>}
        {ferrugemDecisionPending&&currentDialogue.speaker==="Rosa"&&
         currentFerrugemStep(ferrugem)?.id==="decisao"&&
         <div className="na-ferrugem-choices" role="group" aria-label="Destino das provas de Ferrugem">
          <button type="button" onClick={()=>{
            setFerrugemDecisionPending(false);
            registerFerrugemEvent("ferrugem-foreman","publicar");
          }}>Publicar as provas agora</button>
          <button type="button" onClick={()=>{
            setFerrugemDecisionPending(false);
            registerFerrugemEvent("ferrugem-foreman","proteger");
          }}>Proteger as testemunhas primeiro</button>
         </div>}
       </NpcDialoguePanel>
      )}
    </main>
  );
}
