import { useEffect, useMemo, useState } from "react";
import Battlefield from "./components/Battlefield";
import AbilityBar from "./components/AbilityBar";
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
import ExplorationScreen from "./screens/ExplorationScreen";
import TitleScreen from "./screens/TitleScreen";
import {
  createStartingInventory, loadInventory, saveInventory,
  toggleEquipment, consumeItem, getEquipmentBonuses, grantItem, ITEM_CATALOG,
} from "./game/inventory";
import type { ItemId, InventoryState } from "./game/inventory";
import { getPlayerSpriteUrl } from "./game/baixada/sprites";
import ClassSelection from "./components/ClassSelection";
import {getClassById,type ClassId} from "./game/classes/registry";
import { audioDirector } from "./audio/director";
import { markV09Defeated,grantV09Experience } from "./game/story/v09";
import {listCharacterSlots,loadCharacterSlot,removeCharacterSlot,hasSlotCapacity} from "./game/character/slots";
import {exportCharacterBackup,importCharacterBackup} from "./game/character/backup";
import {loadHealth,saveHealth,healAtClinic} from "./game/combat/health";
import {combatProgression,gainExperience,purchaseAttribute,purchaseSkill,
  type StatId} from "./game/progression/tree";
import {advanceTrialBattle,isTrialEncounter,readTrial,saveTrial,reconcileTrial} from "./game/story/field-test";

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
  const [slots,setSlots]=useState<PlayerCharacter[]>(()=>listCharacterSlots());
  const [screen, setScreen] = useState<"title" | "creation" | "resume" | "introduction" | "exploration" | "battle">("title");
  const [battleReset, setBattleReset] = useState(0);
  const [battleMode, setBattleMode] = useState<EncounterId>("test");
  useEffect(()=>{audioDirector.setScene(screen==="battle"?"battle":screen==="exploration"?"exploration":screen==="title"?"menu":"story");},[screen]);
  const [appearance, setAppearance] = useState<TestAppearance>(() => loadTestAppearance(loadCharacter()?.id ?? ""));
  const chooseAppearance = (choice: TestAppearance) => {
    setAppearance(choice);
    if (character) saveTestAppearance(character.id, choice);
  };
  const [inventory, setInventory] = useState<InventoryState>(() => loadInventory(loadCharacter()?.id ?? ""));
  const bonuses = useMemo(() => getEquipmentBonuses(inventory), [inventory.equipped.weapon, inventory.equipped.armor]);
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
  const maximumHp=18+(originProfile?.maxHpBonus??0)+progressionBonuses.hp;
  const manager = useMemo(() => new TurnManager({ playerName: character?.name, originProfile, equipmentBonuses: bonuses, characterLevel: character?.level, originId: character?.originId, classId: character?.classId, characterAbilities:character?.abilities,
    currentHp:loadHealth(character?.id??"",maximumHp),
    progressionBonuses:combatProgression(character),encounterId:battleMode }), [character?.id, battleReset, battleMode, originProfile, bonuses]);
  const [state, setState] = useState<GameState>(() => manager.getState());
  const player = getUnit(state, "runner");
  const enemy = getUnit(state, "drone");
  const canAttack = manager.canAttack();
  const victory = Boolean(enemy && enemy.hp <= 0);

  useEffect(() => {
    setState(manager.getState());
    return manager.subscribe((next)=>{
      setState(next);
      if(screen==="battle"&&character?.id){
        const unit=next.units.find(u=>u.id==="runner");
        if(unit){
          saveHealth(character.id,unit.hp,unit.maxHp);
          setHealthValue(Math.max(1,unit.hp));
        }
      }
    });
  }, [manager,screen,character?.id]);

  const beginBattle = (mode: EncounterId = "test") => {
    setBattleMode(mode);
    setBattleReset((n)=>n+1);
    setScreen("battle");
  };
  const grantTrialXp=(eventId:string,amount:number):boolean=>{
    if(!character)return false;
    if(character.questRewards.includes(eventId))return true;
    const next=gainExperience(character,amount);
    const updated={...next.character,questRewards:[...character.questRewards,eventId]};
    if(!saveCharacter(updated)){setSaveMessage("Erro ao gravar XP. Verifique o espaço disponível.");return false;}
    setCharacter(updated);
    setSlots(listCharacterSlots());
    setSaveMessage(next.levelsGained>0
      ? "SUBIU DE NÍVEL! Nível "+updated.level+" · Abra a Árvore na Central do Personagem."
      : "+"+amount+" XP pela Operação Circuito Fantasma.");
    return true;
  };
  const buyAttribute=(id:StatId):string=>{
    if(!character)return "Nenhum personagem ativo.";
    const purchase=purchaseAttribute(character,id);
    if(!purchase.ok)return purchase.message;
    if(!saveCharacter(purchase.character))return "Falha ao salvar o atributo.";
    setCharacter(purchase.character);
    setSlots(listCharacterSlots());
    const hp=18+getOriginGameplay(character.originId).maxHpBonus+combatProgression(purchase.character).hp;
    setHealthValue(loadHealth(character.id,hp));
    return purchase.message;
  };
  const buySkill=(id:string):string=>{
    if(!character)return "Nenhum personagem ativo.";
    const purchase=purchaseSkill(character,id);
    if(!purchase.ok)return purchase.message;
    if(!saveCharacter(purchase.character))return "Falha ao salvar a habilidade.";
    setCharacter(purchase.character);
    setSlots(listCharacterSlots());
    return purchase.message;
  };

  useEffect(()=>{
    if(screen!=="battle" || !character || !state.combatComplete)return;
    const enemyDefeated=state.units.find(u=>u.id==="drone")?.hp===0;
    if(enemyDefeated && isTrialEncounter(state.encounterId)){
      const stored=readTrial(character.id);
      const progress=reconcileTrial(stored,character.questRewards);
      const next=advanceTrialBattle(progress,state.encounterId);
      if(next.advanced&&next.completedStep){
        const key="trial-"+next.completedStep.id;
        if(grantTrialXp(key,next.completedStep.xp)){
          saveTrial(character.id,next.progress);
          audioDirector.effect("victory");
        }
      }
      return;
    }
    if(state.encounterId!=="v09")return;
    const defeated=state.units.find(u=>u.id==="drone")?.hp===0;
    if(!defeated)return;
    const reward=grantV09Experience(character);
    if(!reward.awarded){
      // Em caso de encerramento entre as duas gravações, a recompensa
      // atômica no personagem permite restaurar o marco narrativo.
      markV09Defeated(character.id);
      return;
    }
    // XP e marcador de recompensa pertencem a UM registro local. A história
    // só é marcada após a persistência da recompensa; nunca o inverso.
    if(saveCharacter(reward.character)){
      markV09Defeated(character.id);
      setCharacter(reward.character);
      setSlots(listCharacterSlots());
      if(reward.character.level>character.level)
        setSaveMessage("Nível "+reward.character.level+"! Pontos disponíveis na árvore de evolução.");
      audioDirector.effect("victory");
    }else{
      setSaveMessage("Falha ao salvar recompensa V-09. Libere espaço no aparelho.");
    }
  },[screen,character,state]);

  const assignExistingClass=(classId:ClassId)=>{
    if(!character || character.classId)return;
    const updated=assignCharacterClass(character,classId);
    if(updated===character)return;
    setCharacter(updated);
    const saved=saveCharacter(updated);
    if(saved)setSlots(listCharacterSlots());
    setSaveMessage(saved?"Classe registrada no salvamento local":"Não foi possível salvar a classe");
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
    setScreen(selected.introductionCompleted?"exploration":"introduction");
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
    const max=18+getOriginGameplay(character.originId).maxHpBonus+combatProgression(character).hp;
    const current=loadHealth(character.id,max);
    if(!healAtClinic(character.id,max))return 0;
    setHealthValue(max);
    return Math.max(0,max-current);
  };

  const handleUseMedkit = () => {
    if (inventory.quantities.curativo_campo < 1) return;
    if (manager.useMedicalSupply(ITEM_CATALOG.curativo_campo.healAmount ?? 0)) {
      setInventory((current) => consumeItem(current, "curativo_campo"));
    }
  };

  if (screen === "title") {
    return <TitleScreen character={character} slots={slots} onLoadSlot={handleLoadSlot}
      onDeleteSlot={handleDeleteSlot} onExport={handleExport} onImport={handleImport}
      saveNotice={saveMessage}
      onContinue={() => setScreen(character?.introductionCompleted ? "exploration" : "introduction")} onNew={startNewCharacter} />;
  }
  if (screen === "creation") {
    return <CreationScreen initialName="" initialOrigin="corporativo" onCreate={handleCreate} onBackToSaved={cancelNewCharacter} />;
  }
  if (screen === "resume" && character) {
    return <ResumeScreen character={character} onContinue={() => setScreen(character.introductionCompleted ? "exploration" : "introduction")} onNew={startNewCharacter} />;
  }
  if (screen === "introduction" && character) {
    return <IntroductionScreen character={character} onContinue={finishIntroduction} />;
  }
  if (!character || !originProfile) {
    return <CreationScreen initialName="" initialOrigin="corporativo" onCreate={handleCreate} onBackToSaved={cancelNewCharacter} />;
  }

  if (screen === "exploration") {
    return (
      <ExplorationScreen
        character={character}
        appearance={appearance}
        onChangeAppearance={chooseAppearance}
        onChooseClass={assignExistingClass}
        onPurchaseAttribute={buyAttribute}
        onPurchaseSkill={buySkill}
        onQuestXp={grantTrialXp}
        onOpenBattle={beginBattle}
        onTreatAtClinic={treatAtClinic}
        currentHp={healthValue}
        maxHp={maximumHp}
        onReturnToTitle={() => setScreen("title")}
        inventory={inventory}
        onToggleEquipment={(id: ItemId) => setInventory((current) => toggleEquipment(current, id))}
        onGrantQuestItem={(id: ItemId) => setInventory((current) => current.quantities[id] > 0 ? current : grantItem(current, id))}
      />
    );
  }

  const origin = getOriginById(character.originId);
  return (
    <main className="app-shell game-shell arena-v030">
      <header className="topbar arena-head">
        <div className="mission">
          <h1>{battleMode==="v09"?"Pátio do Reúso · Encontro V-09":
            isTrialEncounter(battleMode)?"Operação Circuito Fantasma · Interceptação":
            "Limbo de Teste · Personagens e Habilidades"}</h1>
          <p>{battleMode==="v09"?"MISSÃO PRINCIPAL · O NOME QUE SUMIU":
            isTrialEncounter(battleMode)?"CAMPANHA TÁTICA · "+state.wave+" / "+state.totalWaves+" ONDAS":
            "Operativo de Campo // módulo experimental 0.3.0"}</p>
        </div>
        <div className="turn">
          <span className="turn-pill" data-side={state.activeSide}>
            {state.combatComplete ? (victory ? "Vitória" : "Derrota") : state.activeSide === "player" ? "Seu turno" : "Turno hostil"}
          </span>
          <span>Rodada {state.round}</span>
        </div>
      </header>
      <section className="arena-field" aria-label="Arena e visualização de personagens">
        <div className="arena-presentation">
          <strong>{character.name} · {origin.name} · {character.classId?getClassById(character.classId).name:"Sem classe"}</strong>
          <div className="arena-appearance-group" role="group" aria-label="Apresentação visual do Operativo de Campo">
            <button type="button" aria-pressed={appearance === "masculine"} onClick={() => chooseAppearance("masculine")}>Masculina</button>
            <button type="button" aria-pressed={appearance === "feminine"} onClick={() => chooseAppearance("feminine")}>Feminina</button>
          </div>
        </div>
        <section className="battle-panel" aria-label="Combate tático isométrico">
          <div className="map-label"><span>{battleMode==="v09"?"UNIDADE HOSTIL · V-09":
             isTrialEncounter(battleMode)?"ONDA "+state.wave+" DE "+state.totalWaves+" · 8 × 8":"SIMULAÇÃO 01 · 8 × 8"}</span><span>TERMINAL ÂMBAR: +3 EN (1 USO)</span></div>
          <Battlefield manager={manager} appearance={appearance} originId={character.originId} />
          <p className="board-hint">{getHint(state, canAttack)}</p>
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
          <div className="arena-powers-fixed" aria-label="Habilidades permanentes da classe">
            {manager.getClassAbilities().length ? manager.getClassAbilities().map(skill=>{
              const check=manager.getClassAvailability(skill.id);
              return <button type="button" key={skill.id} aria-disabled={!check.available}
                aria-label={skill.name+": "+(check.available?"pronta":check.reason)}
                title={skill.description}
                onClick={()=>manager.activateClassAbility(skill.id)}>
                <strong>{skill.name}</strong>
                <small>{check.available?skill.cost+" EN · PRONTA":check.reason}</small>
              </button>;
            }) : <span className="arena-quick-empty">Sem poder de classe desbloqueado · selecione uma classe na Central</span>}
          </div>
          {state.combatComplete && <div className={`result-banner ${victory ? "victory" : "defeat"}`}>{victory ? (battleMode==="v09" ? "V-09 neutralizada · registros recuperados"
              : isTrialEncounter(battleMode)?"Interceptação vencida · campanha continua"
              :"Sentinela neutralizada") : "Operativo incapacitado"}</div>}
          <div className="economy">
            <div className="eco move">Mover<span className="pips" aria-hidden="true">{Array.from({ length: state.movementPerTurn }, (_, index) => <i key={index} className={index < state.movementRemaining ? "on" : undefined} />)}</span><b>{state.movementRemaining}/{state.movementPerTurn}</b></div>
            <ActionChip label="Principal" ready={state.mainActionAvailable} />
            <ActionChip label="Bônus" ready={state.bonusActionAvailable} />
          </div>
          <div className="actions">
            <button type="button" className="end-turn-button" disabled={state.activeSide !== "player" || state.combatComplete || !state.bonusActionAvailable || !player || player.hp >= player.maxHp || inventory.quantities.curativo_campo < 1} onClick={handleUseMedkit}>Curativo ({inventory.quantities.curativo_campo})</button>
            <button type="button" className="end-turn-button" onClick={() => { buzz(); manager.endPlayerTurn(); }} disabled={state.activeSide !== "player" || state.combatComplete}>Encerrar turno</button>
            <button type="button" className="attack-button" onClick={() => { buzz(20); manager.attack(); }} disabled={!canAttack}>Ataque básico</button>
          </div>
          <div className="secondary-actions">{battleMode==="test" && <button type="button" onClick={() => setBattleReset((value) => value + 1)}>Reiniciar arena</button>}<button type="button" onClick={() => setScreen("exploration")}>Voltar à Baixada</button></div>
        </section>

      </aside>
    </main>
  );
}
