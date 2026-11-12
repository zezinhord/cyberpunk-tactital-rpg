import { useEffect, useMemo, useState } from "react";
import Battlefield from "./components/Battlefield";
import AbilityBar from "./components/AbilityBar";
import { loadTestAppearance, saveTestAppearance } from "./game/test-arena/appearance";
import type { TestAppearance } from "./game/test-arena/appearance";
import { TurnManager } from "./game/TurnManager";
import type { GameState, Unit } from "./game/types";
import {
  createPlayerCharacter,
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
  createStartingInventory, loadInventory, saveInventory, deleteInventory,
  toggleEquipment, consumeItem, getEquipmentBonuses, grantItem, ITEM_CATALOG,
} from "./game/inventory";
import type { ItemId, InventoryState } from "./game/inventory";
import { getPlayerSpriteUrl } from "./game/baixada/sprites";
import { audioDirector } from "./audio/director";
import { markV09Defeated } from "./game/story/v09";

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
  if (state.combatComplete) return "Combate de teste encerrado";
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
  onCreate: (name: string, originId: OriginId, appearance: TestAppearance) => void;
  onBackToSaved?: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [originId, setOriginId] = useState<OriginId>(initialOrigin);
  const [presentation, setPresentation] = useState<TestAppearance>("masculine");
  const selected = getOriginById(originId);
  const profile = getOriginGameplay(originId);
  const canCreate = name.trim().length >= 2;

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

        <button className="primary-button" type="button" disabled={!canCreate} onClick={() => onCreate(name, originId, presentation)}>Criar protagonista <span>→</span></button>
        {!canCreate && <p className="validation-note">O nome precisa ter pelo menos 2 caracteres.</p>}
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
        <p>{origin.name}</p>
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
  const [screen, setScreen] = useState<"title" | "creation" | "resume" | "introduction" | "exploration" | "battle">("title");
  const [battleReset, setBattleReset] = useState(0);
  const [battleMode, setBattleMode] = useState<"test" | "v09">("test");
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

  const originProfile = useMemo(() => character ? getOriginGameplay(character.originId) : undefined, [character?.originId]);
  const manager = useMemo(() => new TurnManager({ playerName: character?.name, originProfile, equipmentBonuses: bonuses, characterLevel: character?.level, originId: character?.originId, classId: character?.classId, characterAbilities:character?.abilities, encounterId:battleMode }), [character?.id, character?.level, character?.originId, character?.classId,character?.abilities, battleReset, battleMode, originProfile, bonuses]);
  const [state, setState] = useState<GameState>(() => manager.getState());
  const player = getUnit(state, "runner");
  const enemy = getUnit(state, "drone");
  const canAttack = manager.canAttack();
  const victory = Boolean(enemy && enemy.hp <= 0);

  useEffect(() => {
    setState(manager.getState());
    return manager.subscribe(setState);
  }, [manager]);

  const beginBattle = (mode: "test" | "v09" = "test") => {
    setBattleMode(mode);
    setBattleReset((n)=>n+1);
    setScreen("battle");
  };
  useEffect(()=>{
    if(screen!=="battle" || !character || state.encounterId!=="v09" || !state.combatComplete)return;
    const defeated=state.units.find(u=>u.id==="drone")?.hp===0;
    if(defeated && markV09Defeated(character.id)){
      const next={...character,experience:character.experience+15,updatedAt:new Date().toISOString()};
      setCharacter(next);saveCharacter(next);
      audioDirector.effect("victory");
    }
  },[screen,character,state]);

  const handleCreate = (name: string, originId: OriginId, presentation: TestAppearance) => {
    const previousCharacter = loadCharacter();
    const nextCharacter = createPlayerCharacter(name, originId);
    const saved = saveCharacter(nextCharacter);
    if (saved && previousCharacter && previousCharacter.id !== nextCharacter.id) {
      deleteInventory(previousCharacter.id);
    }
    setCharacter(nextCharacter);
    setAppearance(presentation);
    saveTestAppearance(nextCharacter.id, presentation);
    setInventory(createStartingInventory(nextCharacter.id));
    setSaveMessage(saved ? "Personagem salvo neste dispositivo" : "Não foi possível salvar neste dispositivo");
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
    // A criação não apaga o último save: permite voltar ao título com segurança.
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

  const handleUseMedkit = () => {
    if (inventory.quantities.curativo_campo < 1) return;
    if (manager.useMedicalSupply(ITEM_CATALOG.curativo_campo.healAmount ?? 0)) {
      setInventory((current) => consumeItem(current, "curativo_campo"));
    }
  };

  if (screen === "title") {
    return <TitleScreen character={character} onContinue={() => setScreen(character?.introductionCompleted ? "exploration" : "introduction")} onNew={startNewCharacter} />;
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
        onOpenBattle={beginBattle}
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
          <h1>{battleMode==="v09" ? "Pátio do Reúso · Encontro V-09" : "Limbo de Teste · Personagens e Habilidades"}</h1>
          <p>{battleMode==="v09" ? "MISSÃO PRINCIPAL · O NOME QUE SUMIU" : "Operativo de Campo // módulo experimental 0.3.0"}</p>
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
          <strong>{character.name} · {origin.name}</strong>
          <div className="arena-appearance-group" role="group" aria-label="Apresentação visual do Operativo de Campo">
            <button type="button" aria-pressed={appearance === "masculine"} onClick={() => chooseAppearance("masculine")}>Masculina</button>
            <button type="button" aria-pressed={appearance === "feminine"} onClick={() => chooseAppearance("feminine")}>Feminina</button>
          </div>
        </div>
        <section className="battle-panel" aria-label="Combate tático isométrico">
          <div className="map-label"><span>{battleMode==="v09" ? "UNIDADE HOSTIL · V-09" : "SIMULAÇÃO 01 · 8 × 8"}</span><span>TERMINAL ÂMBAR: +3 EN (1 USO)</span></div>
          <Battlefield manager={manager} appearance={appearance} />
          <p className="board-hint">{getHint(state, canAttack)}</p>
        </section>
      </section>
      <aside className="arena-console" aria-label="Painel de combate e habilidades">
        <div className="arena-console-scroll" aria-label="Informações e habilidades">
        <section className="units" aria-label="Unidades em combate">
          <UnitCard unit={player} role="Protagonista" accent="cyan" />
          <UnitCard unit={enemy} role="Sentinela" accent="pink" />
        </section>
        <AbilityBar state={state} manager={manager} />
        <p className="combat-message" role="status">{state.message}</p>
        <section className="origin-power-panel">
          <div className="power-heading"><div><span className="eyebrow">VANTAGEM DE ORIGEM</span><strong>{originProfile.passiveDescription}</strong><small>{originProfile.passiveEffect}</small></div><span className="passive-tag">PASSIVA</span></div>
          <div className="power-action"><div><span className="eyebrow">HABILIDADE ÚNICA · 1 USO</span><strong>{originProfile.abilityName}</strong><small>{originProfile.abilityDescription}</small></div><button type="button" className="ability-button" disabled={!state.originAbilityAvailable || state.activeSide !== "player" || state.combatComplete} onClick={() => { buzz(18); manager.activateOriginAbility(); }}>{state.originAbilityAvailable ? "Usar" : "Usada"}</button></div>
        </section>
        <details className="log-panel">
          <summary>Registro do teste <span>{state.log.length}</span></summary>
          <p className="objective">{battleMode==="v09" ? "A unidade interceptou os registros V-09. Sua derrota terá consequências persistentes para a cooperativa." : "Use movimento por toque, ataque básico, 3 habilidades e o terminal de recarga. Este ambiente não é um distrito da campanha."}</p>
          <ol className="log-list">{state.log.slice(-8).reverse().map((entry,index) => <li key={index}>{entry}</li>)}</ol>
          <p className="build-note">{saveMessage}</p>
        </details>
        </div>
        <section className="control-sheet" aria-label="Comandos do turno">
          {state.combatComplete && <div className={`result-banner ${victory ? "victory" : "defeat"}`}>{victory ? (battleMode==="v09" ? "V-09 neutralizada · registros recuperados" : "Sentinela neutralizada") : "Operativo incapacitado"}</div>}
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
