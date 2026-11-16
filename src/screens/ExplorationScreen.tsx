import {lazy,Suspense,useEffect,useState} from "react";
import NpcDialoguePanel from "../components/NpcDialoguePanel";
import "../dialogue-cinematic.css";
import BaixadaWorld from "../components/BaixadaWorld";
// Carrega Phaser apenas quando o protagonista entra num interior/distrito.
 // A Baixada Android funciona com Canvas 2D sem o peso do motor Phaser.
 const InteriorWorld=lazy(()=>import("../components/InteriorWorld"));
import SceneRecovery from "../components/SceneRecovery";
import { getOriginById, getOriginGameplay } from "../game/character";
import CharacterMenu from "../components/CharacterMenu";
import type { InventoryState, ItemId } from "../game/inventory";
import type {RecipeId} from "../game/crafting";
import type { PlayerCharacter } from "../game/character";
import type { InteriorId } from "../game/baixada/InteriorScene";
import type { TestAppearance } from "../game/test-arena/appearance";
import { audioDirector } from "../audio/director";
import {isAndroidDevice} from "../game/performance";
import {FAVORS,NILO_SHOP,readFavors,saveFavors,acceptFavor,recordFavorActivity,
  favorUnlocked,visibleFavors,favorStatus,type FavorId} from "../game/story/favors";
import type {ClassId} from "../game/classes/registry";
import type {EncounterId} from "../game/types";
import {statRank,type StatId} from "../game/progression/tree";
import {ESTIMATED_MINUTES,TRIAL_STEPS,readTrial,saveTrial,startTrial,
 currentTrialStep,trialCombatForActor,advanceTrial,reconcileTrial} from "../game/story/field-test";
import { isPatioCitizen, getPatioConversation, type ConversationOption } from "../game/dialogues/patio";
import { readV09,markV09Reported } from "../game/story/v09";
import { MARKET_CLUE_TEXT,applyMarketAction,getMarketConversation,isMarketActor,readMarket,saveMarket } from "../game/story/market";
import { getSectorById,sectorAt,type SectorId } from "../game/baixada/layout";
import {loadWorldLocation,saveWorldLocation} from "../game/baixada/location";
import {loadWorldArea,saveWorldArea} from "../game/baixada/world-area";
import {readSewer,saveSewer,sewerNextObjective,sewerStatus,applySewerEvent,
 hasSewerEvidence,type SewerEvent} from "../game/story/sewer-v09";
import {FERRUGEM_ACTORS,isFerrugemActor} from "../game/ferrugem/layout";
import {FERRUGEM_STEPS,readFerrugem,saveFerrugem,startFerrugem,advanceFerrugem,
 currentFerrugemStep,ferrugemObjective,type FerrugemEnding} from "../game/ferrugem/story";
import {DISTRICTS,isDistrictId,getDistrict,actorFromId,type DistrictId} from "../game/districts/catalog";
import {CHAPTERS,readDistrictProgress,saveDistrictProgress,beginDistrict,
 districtCurrentStep,districtObjective,advanceDistrict,type ChapterProgress,
 type DistrictEnding} from "../game/districts/progress";

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
  onCraft:(id:RecipeId)=>string;
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
  onCraft,
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
  const [hubTab,setHubTab]=useState<"mission"|"favors">("mission");
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
  const [trialNotice,setTrialNotice]=useState("");
  const [sectorId,setSectorId]=useState<SectorId>(()=>sectorAt(loadWorldLocation(character.id)));
  useEffect(()=>{
    audioDirector.setDistrict(isDistrictId(interior)?interior:interior==="ferrugem"?"ferrugem":"baixada");
    audioDirector.setScene(interior?"interior":"exploration");
  },[interior]);

  useEffect(() => {
    saveMission(character.id, mission);
  }, [character.id, mission]);
  useEffect(()=>{saveMarket(character.id,market);},[character.id,market]);

  const say = (pages: DialoguePage[]) => setDialogue({ pages, index: 0 });
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
  const favorContext={missionStep:mission.step,v09Defeated:v09.defeated};
  const unlockedFavors=visibleFavors(favorContext);
  const favorChoicesFor=(actor:string):ConversationOption[]=>unlockedFavors
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
    const activity=recordFavorActivity(favors,id);
    if(activity.ready.length){
      if(saveFavors(character.id,activity.state)){
        setFavors(activity.state);
        const names=activity.ready.map(fid=>FAVORS.find(f=>f.id===fid)?.title).filter(Boolean);
        setFavorNotice("Favor pronto para entregar: "+names.join(", ")+".");
      }else setFavorNotice("Falha ao registrar o favor. Libere espaço e tente novamente.");
    }
    const cityActor=actorFromId(id);
    if(cityActor){
      const {district,slot}=cityActor;
      if(slot==="exit"){
        setCityDecision(null);saveWorldLocation(character.id,{x:36,y:26});
        setInterior(null);return;
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

    if(isMarketActor(id)){
      const node=getMarketConversation(id,character.classId,market,v09.reported,character.originId);
      say([{speaker:node.speaker,role:node.role,portrait:node.portrait,
        text:node.text,choices:[...node.choices,...favorChoicesFor(id)]}]);
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
          choices:[...favorChoicesFor("vendedor"),...NILO_SHOP.map(offer=>({
            id:"nilo-buy-"+offer.item,label:"Comprar "+offer.label+" · "+offer.price+" créditos",
            reply:"Pedido de compra da oficina.",shopAction:offer.item}))],
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
        statRank(character,"influencia"));
      if(result.applied){
        setMarket(result.state);
        if(result.clue)addClue(result.clue);
      }
    }
    if(choice.clue)addClue(choice.clue);
    const current=dialogue?.pages[dialogue.index];
    if(!current)return;
    audioDirector.effect("interact");
    say([{speaker:current.speaker,role:current.role,portrait:current.portrait,text:choice.reply}]);
  };
  const currentDialogue = dialogue?.pages[dialogue.index] ?? null;
  const sceneTitle = isDistrictId(interior) ? getDistrict(interior).name+" · Nova Arcádia"
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
  const sceneSubtitle = isDistrictId(interior) ? getDistrict(interior).subtitle
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
          <small>{origin.name} · {isDistrictId(interior)?getDistrict(interior).name:interior==="ferrugem"?"Ferrugem":getSectorById(sectorId).name}</small>
        </div>
        <div className="district-clock">
          <span>18:40</span>
          <small>CHUVA FRACA</small>
        </div>
      </section>

      <section className="district-scene-section">
        <div className="district-scene-heading">
          <span>{isDistrictId(interior)?"DISTRITO EXPLORÁVEL":interior==="ferrugem"?"DISTRITO INDUSTRIAL":interior?"ÁREA INTERNA":"EXPLORAÇÃO ISOMÉTRICA"}</span>
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
              if(interior==="ferrugem")saveWorldLocation(character.id,{x:36,y:22});
              if(interior==="sewer-drain")saveWorldLocation(character.id,{x:33,y:20});
              setReturnFromDeep(false);setInterior(null);
            }
          }}>
            {interior==="sewer-deep"?"← RETORNAR À GALERIA":"← RETORNAR À BAIXADA"}
          </button>
        )}
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
      {(interior==="sewer-drain"||interior==="sewer-deep"||interior==="ferrugem"||isDistrictId(interior))&&<button type="button"
        className="na-sewer-objective-hint" onClick={()=>setHubOpen(true)}
        aria-label={isDistrictId(interior)?"Abrir objetivos de "+getDistrict(interior).name:
          interior==="ferrugem"?"Abrir objetivos da missão Ferrugem":"Abrir objetivos da investigação subterrânea"}>
        <span>{isDistrictId(interior)?"◈ "+getDistrict(interior).name.toUpperCase()+" · MISSÃO ATIVA":
          interior==="ferrugem"?"◈ MISSÃO EM FERRUGEM · TOQUE PARA DETALHES":
          "◈ OBJETIVO SUBTERRÂNEO · TOQUE PARA DETALHES"}</span>
        <strong>{isDistrictId(interior)?districtObjective(interior,cityChapters[interior]):
          interior==="ferrugem"?ferrugemObjective(ferrugem):sewerNextObjective(sewer)}</strong>
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
      <aside className={"na-mission-hub"+(hubOpen?"":" collapsed")} aria-label="Próximas missões e objetivos">
        <button className="na-hub-toggle" type="button" onClick={()=>setHubOpen(open=>!open)}
          aria-expanded={hubOpen} aria-controls="na-mission-details">
          {hubOpen?"Ocultar objetivos ×":"Ver missões e objetivos +"}
        </button>
        <div id="na-mission-details" className="na-mission-details">
        <div className="na-next-step" role="status">
          <span>PRÓXIMO PASSO · {isDistrictId(interior)?"CAMPANHA "+getDistrict(interior).name.toUpperCase():interior==="ferrugem"?"ECOS DE FERRUGEM":trial.started&&!trial.completed?"OPERAÇÃO CIRCUITO FANTASMA":mission.step<3?"O NOME QUE SUMIU":!v09.reported?"INVESTIGAÇÃO V-09":"NOVO CAPÍTULO"}</span>
          <strong>{isDistrictId(interior)?districtObjective(interior,cityChapters[interior]):interior==="ferrugem"?ferrugemObjective(ferrugem):trial.started&&!trial.completed
            ? currentTrialStep(trial)?.objective
            : mission.step<3 ? objective
            : !v09.reported ? objective
            : trial.completed ? "Operação concluída. Continue explorando Nova Arcádia."
            : "Inicie a Operação Circuito Fantasma no painel abaixo."}</strong>
          {trial.started&&!trial.completed&&<small>Etapa {trial.step+1} de {TRIAL_STEPS.length} · {currentTrialStep(trial)?.sector}</small>}
        </div>
      <button type="button" className="na-objective-toggle" onClick={() => setMissionOpen((value) => !value)} aria-expanded={missionOpen}>
        <span>◈ {mission.step===3?"CONSULTAR INVESTIGAÇÃO":"INVESTIGAÇÃO INICIAL"}</span><span aria-hidden="true">{missionOpen ? "−" : "+"}</span>
      </button>
      {missionOpen && <section className="mission-card" aria-label="Missão atual">
        <div className="mission-card-top">
          <div>
            <span className="eyebrow">MISSÃO PRINCIPAL · BAIXADA</span>
            <h2>O nome que sumiu</h2>
          </div>
          <span className={mission.step === 3 ? "mission-status complete" : "mission-status"}>
            {v09.reported ? "CAPÍTULO 02" : mission.step===3
              ? hasSewerEvidence(sewer)?"ESGOTO INVESTIGADO":"ROTA SUBTERRÂNEA"
              : "EM ANDAMENTO"}
          </span>
        </div>
        <p className="market-state-strip">COMUNIDADE {market.trust}/5 · ALERTA DA REDE {market.heat}/5 · PISTAS DO MERCADO {market.clues.length}</p>
        <p className="mission-summary">
          Uma pessoa desapareceu depois de procurar atendimento por causa de um implante defeituoso. O registro oficial foi apagado, mas a clínica preservou uma cópia local.
        </p>
        <div className="objective-row">
          <span className="objective-index">
            {mission.step === 3 ? "04" : String(mission.step + 1).padStart(2, "0")}
          </span>
          <strong>
            {objective}
          </strong>
        </div>
        <div className="quest-progress" aria-label={mission.step + " de 3 etapas concluídas"}>
          {([0, 1, 2] as const).map((index) => (
            <i key={index} className={mission.step > index ? "done" : undefined} />
          ))}
        </div>
        <button
          type="button"
          className="journal-toggle"
          onClick={() => setJournalOpen((open) => !open)}
          aria-expanded={journalOpen}
        >
          Registro da investigação <span>{mission.clues.length}</span>
        </button>
        {journalOpen && (
          <div className="mission-journal">
            <p><b>Etapas:</b> {mission.step} de 3 concluídas.</p>
            <p><b>Referência central:</b> ocorrência V-09.</p>
            {mission.clues.length === 0
              ? <p>Nenhuma pista adicional registrada. Converse com os moradores e examine os terminais.</p>
              : mission.clues.map((clue) => (
                  <p key={clue}><b>•</b> {CLUE_LABELS[clue]}</p>
                ))}
          </div>
        )}
      </section>}

      <section className="na-sewer-panel" aria-label="Investigação dos esgotos">
        <div className="na-sewer-heading">
          <span>◈ ROTA V-09 · EXPANSÃO SUBTERRÂNEA</span>
          <strong>{sewerStatus(sewer)}</strong>
        </div>
        <p>{mission.step<3?"Conclua a investigação na clínica para rastrear a transferência V-09.":
          v09.defeated?"O manifesto foi associado ao dossiê do Pátio.":
          sewerNextObjective(sewer)}</p>
        <div className="na-sewer-checkpoints" role="list" aria-label="Evidências da rota">
          {([
            ["Rastros",sewer.traceFound],
            ["Bombas",sewer.pumpRestored],
            ["Comporta",sewer.gateOpened],
            ["Manifesto",sewer.manifestRecovered],
          ] as const).map(([label,done])=>
            <span key={label} role="listitem" className={done?"complete":""}>{done?"✓":"○"} {label}</span>)}
        </div>
        {sewer.sampleRecovered&&<small>Prova opcional: implante adulterado recuperado.</small>}
        {sewerNotice&&<small role="status">{sewerNotice}</small>}
      </section>
      <section className="na-ferrugem-panel" aria-label="Capítulos adicionais">
        <div className="na-ferrugem-heading">
          <span>◈ CINCO NOVOS DISTRITOS · INVESTIGAÇÕES</span>
          <strong>{DISTRICTS.filter(d=>cityChapters[d.id].completed).length}/5 CONCLUÍDOS</strong>
        </div>
        {isDistrictId(interior)&&<p>{districtObjective(interior,cityChapters[interior])}</p>}
        <details>
          <summary>Consultar campanhas e locais da cidade</summary>
          {CHAPTERS.map(ch=><p key={ch.id}>
            {cityChapters[ch.id].completed?"✓":cityChapters[ch.id].started?"▶":"○"}
            {" "}{ch.title} · {getDistrict(ch.id).name} ·
            {" "}{cityChapters[ch.id].step}/{ch.steps.length} objetivos
          </p>)}
        </details>
        {cityNotice&&<small role="status">{cityNotice}</small>}
      </section>
      <section className="na-ferrugem-panel" aria-label="Capítulo Ferrugem">
        <div className="na-ferrugem-heading">
          <span>◈ CAPÍTULO 03 · ECOS DE FERRUGEM</span>
          <strong>{ferrugem.completed?"CONCLUÍDO":ferrugem.started?
            (ferrugem.step+1)+"/"+FERRUGEM_STEPS.length:"BLOQUEADO"}</strong>
        </div>
        <p>{ferrugemObjective(ferrugem)}</p>
        <small>{ferrugem.started?"A investigação começa com Rosa e atravessa os galpões da Ferrugem.":
          "Recupere o manifesto V-09 no esgoto para utilizar o transporte do Pátio Sul."}</small>
        {ferrugemNotice&&<small role="status">{ferrugemNotice}</small>}
        {ferrugem.started&&<details>
          <summary>Consultar etapas de Ferrugem</summary>
          {FERRUGEM_STEPS.map((step,index)=>
            <p key={step.id}>{index<ferrugem.step?"✓":index===ferrugem.step?"▶":"○"} {index+1}. {step.title}</p>)}
        </details>}
      </section>
      <section className="na-trial-panel" aria-label="Operação Circuito Fantasma">
        <div className="na-trial-heading">
          <div><span className="eyebrow">PRÓXIMA OPERAÇÃO · PROJETO ÉDEN</span>
            <h2>Operação Circuito Fantasma</h2></div>
          <strong>{trial.completed?"CONCLUÍDA":trial.started?"ETAPA "+Math.min(trial.step+1,TRIAL_STEPS.length)+"/"+TRIAL_STEPS.length:"NOVA · "+ESTIMATED_MINUTES+" MIN EST."}</strong>
        </div>
        {!trial.started ? <>
          <p>Uma sequência com {TRIAL_STEPS.length} objetivos e três confrontos de múltiplas ondas,
            conectando clínica, Canal, Pátio e Mercado. Investigue a manipulação dos serviços e teste combate,
            exploração, itens, diálogos e sua árvore de evolução. Duração estimada de {ESTIMATED_MINUTES} minutos,
            variável conforme sua exploração e a dificuldade.</p>
          <button type="button" onClick={()=>{
            const started=startTrial(trial);
            if(saveTrial(character.id,started)){
              setTrial(started);setTrialNotice("Missão iniciada. Dirija-se à clínica comunitária.");
            }else setTrialNotice("Não foi possível salvar o início da campanha.");
          }}>Iniciar operação de testes</button>
        </> : trial.completed ? <p>Relatório entregue. A comunidade preservou as provas da triagem;
            seu progresso, XP e novas técnicas permanecem no salvamento. A investigação sobre a autoria do sistema continua.</p>
        : <div className="na-trial-objective">
            <p><b>CAPÍTULO {currentTrialStep(trial)?.chapter} · {currentTrialStep(trial)?.title}</b>
             {" — "}{currentTrialStep(trial)?.sector}</p>
            <strong>{currentTrialStep(trial)?.objective}</strong>
            <small>{currentTrialStep(trial)?.detail}</small>
            <span>{trial.step} de {TRIAL_STEPS.length} etapas concluídas.
              {" "}Recompensa da próxima: {currentTrialStep(trial)?.xp} XP.</span>
          </div>}
        {trialNotice&&<p className="na-trial-feedback" role="status">{trialNotice}</p>}
        {trial.started&&<details className="na-trial-history"><summary>Consultar etapas da operação</summary>
          {TRIAL_STEPS.map((stage,index)=><p key={stage.id}>
            {index<trial.step?"✓":index===trial.step?"▶":"○"} {index+1}. {stage.title} · {stage.sector}
          </p>)}
        </details>}
      </section>
         </div>
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
        />
      )}

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
