import { useEffect, useState } from "react";
import BaixadaWorld from "../components/BaixadaWorld";
import InteriorWorld from "../components/InteriorWorld";
import { getOriginById, getOriginGameplay } from "../game/character";
import CharacterMenu from "../components/CharacterMenu";
import type { InventoryState, ItemId } from "../game/inventory";
import type { PlayerCharacter } from "../game/character";
import type { InteriorId } from "../game/baixada/InteriorScene";
import type { TestAppearance } from "../game/test-arena/appearance";
import { audioDirector } from "../audio/director";
import { isPatioCitizen, getPatioConversation, type ConversationOption } from "../game/dialogues/patio";
import { readV09,markV09Reported } from "../game/story/v09";

type MissionStep = 0 | 1 | 2 | 3;
interface MissionProgress { step: MissionStep; clues: string[] }
interface DialoguePage { speaker: string; role: string; portrait: string; text: string; choices?: readonly ConversationOption[] }
interface DialogueState { pages: DialoguePage[]; index: number }
interface Props {
  character: PlayerCharacter;
  appearance: TestAppearance;
  onChangeAppearance: (appearance: TestAppearance) => void;
  onOpenBattle: (mode?: "test" | "v09") => void;
  onReturnToTitle: () => void;
  inventory: InventoryState;
  onToggleEquipment: (id: ItemId) => void;
  onGrantQuestItem: (id: ItemId) => void;
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
  onOpenBattle,
  onReturnToTitle,
  inventory,
  onToggleEquipment,
  onGrantQuestItem,
}: Props) {
  const origin = getOriginById(character.originId);
  const [mission, setMission] = useState<MissionProgress>(() => readMission(character.id));
  const [interior, setInterior] = useState<InteriorId | null>(null);
  const [dialogue, setDialogue] = useState<DialogueState | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(()=>{audioDirector.setScene(interior?"interior":"exploration");},[interior]);

  useEffect(() => {
    saveMission(character.id, mission);
  }, [character.id, mission]);

  const say = (pages: DialoguePage[]) => setDialogue({ pages, index: 0 });
  const v09=readV09(character.id);
  const objective = mission.step<3 ? ((OBJECTIVES as readonly string[])[mission.step] ?? OBJECTIVES[0])
    : v09.reported ? "O Pátio voltou a operar. Procure a próxima pista sobre o destino da pessoa desaparecida."
    : v09.defeated ? "Retorne a Lia para entregar os registros recuperados da unidade V-09."
    : mission.clues.includes("patio") ? "Confronte a unidade de vigilância V-09 junto ao console do Pátio."
    : "Explore o Pátio do Reúso, converse com seus moradores e consulte o console V-09.";
  const addClue = (id: string) => {
    setMission((current) =>
      current.clues.includes(id)
        ? current
        : { ...current, clues: [...current.clues, id] },
    );
  };

  const handleInteract = (id: string) => {
    audioDirector.effect(id.startsWith("enter-")||id==="exit-interior"?"door":id.startsWith("terminal")||id.includes("console")?"terminal":"interact");
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
    if (id === "exit-interior") {
      setInterior(null);
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
      say([{speaker:node.speaker,role:node.role,portrait:node.portrait,text:node.text,choices:node.choices}]);
      return;
    }
    if(id==="patio-console"){
      if(mission.step<3){
        say([{speaker:"CONSOLE DE TRIAGEM",role:"REDE DO PÁTIO",portrait:"▤",
          text:"Registro protegido. Consulte a clínica e recupere a referência V-09 antes de abrir o histórico do Pátio."}]);
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
      if(mission.step<3 || !mission.clues.includes("patio")){
        say([{speaker:"UNIDADE V-09",role:"VIGILÂNCIA NÃO AUTORIZADA",portrait:"!",text:"IDENTIFICAÇÃO PENDENTE. Recupere os registros da clínica e consulte o console do Pátio."}]);return;
      }
      onOpenBattle("v09");
      return;
    }

    if (id === "dra-amara") {
      if (mission.step === 0) {
        setMission((current) => ({ ...current, step: 1 }));
        say([
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
        say([
          {
            speaker: "Dra. Amara Solis",
            role: "MÉDICA COMUNITÁRIA",
            portrait: "A",
            text: "O terminal fica próximo à recepção. Consulte o histórico de atendimentos e procure a ocorrência V-09. Não confio mais nos registros centrais.",
          },
        ]);
      } else if (mission.step === 2) {
        setMission((current) => ({ ...current, step: 3 }));
        say([
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
            text: "Não reconheço essa autorização e ela não deveria ter sido emitida pela clínica. A Galeria de Manutenção pode guardar o restante do trajeto. Obrigada por não deixar esse registro desaparecer.",
          },
        ]);
      } else {
        say([
          {
            speaker: "Dra. Amara Solis",
            role: "MÉDICA COMUNITÁRIA",
            portrait: "A",
            text: "Guarde a referência V-09. A Galeria de Manutenção pode revelar o próximo trecho da rota.",
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
          text: "Encontrei um conector com marcação de manutenção do canal. Pode ficar com a peça; talvez ajude a entender o que aconteceu. Não é equipamento de oficina comum.",
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
          text: "AVISO DE MANUTENÇÃO: sequência de serviço não catalogada detectada no Canal Sul. O acesso completo exige autenticação de equipe técnica.",
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
          text: "Eu faço entregas por essas galerias. Vi uma equipe passar por aqui numa janela de manutenção que não apareceu nos avisos. Eles entraram por uma porta de serviço e saíram sem conversar com ninguém.",
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
          text: "REGISTRO DE ROTA: transferência V-09 encaminhada por corredor técnico secundário. A credencial responsável não pertence à equipe local. Uma parte do destino foi removida do arquivo.",
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
    if(choice.clue)addClue(choice.clue);
    const current=dialogue?.pages[dialogue.index];
    if(!current)return;
    audioDirector.effect("interact");
    say([{speaker:current.speaker,role:current.role,portrait:current.portrait,text:choice.reply}]);
  };
  const currentDialogue = dialogue?.pages[dialogue.index] ?? null;
  const sceneTitle = interior === "clinic"
    ? "Clínica comunitária"
    : interior === "workshop"
      ? "Oficina do Nilo"
      : interior === "canal"
        ? "Galeria do Canal"
        : "Baixada";
  const sceneSubtitle = interior === "clinic"
    ? "RECEPÇÃO / TRIAGEM"
    : interior === "workshop"
      ? "REPAROS / COMÉRCIO INFORMAL"
      : interior === "canal"
        ? "ACESSO TÉCNICO / CANAL SUL"
        : "CANAL SUL // MERCADO DA PONTE";

  return (
    <main className="exploration-shell">
      <header className="explore-topbar">
        <div className="district-brand">
          <span className="eyebrow">NOVA ARCÁDIA · DISTRITO POPULAR</span>
          <h1>{sceneTitle}</h1>
          <span>{sceneSubtitle}</span>
        </div>
        <div className="explore-header-actions">
          <div className="district-status">
            <span className="signal-dot" />
            <strong>REDE LOCAL</strong>
            <span>SETOR 04 · BAIXADA</span>
          </div>
          <button type="button" className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Abrir menu do protagonista">
            <span className="menu-trigger-mark" aria-hidden="true">≡</span>
            <span className="menu-trigger-copy"><small>ARQUIVO</small><strong>PERSONAGEM</strong></span>
            <span className="menu-trigger-arrow" aria-hidden="true">›</span>
          </button>
        </div>
      </header>

      <section className="explorer-character-strip">
        <div className="explorer-avatar" aria-hidden="true">
          {character.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="explorer-character-data">
          <span className="eyebrow">PROTAGONISTA · NÍVEL {character.level}</span>
          <strong>{character.name}</strong>
          <small>{origin.name}</small>
        </div>
        <div className="district-clock">
          <span>18:40</span>
          <small>CHUVA FRACA</small>
        </div>
      </section>

      <section className="district-scene-section">
        <div className="district-scene-heading">
          <span>{interior ? "ÁREA INTERNA" : "EXPLORAÇÃO ISOMÉTRICA"}</span>
          <span>TOQUE PARA SE MOVER</span>
        </div>
        {interior ? (
          <InteriorWorld
            interior={interior}
            originId={character.originId}
            appearance={appearance}
            onInteract={handleInteract}
          />
        ) : (
          <BaixadaWorld originId={character.originId} appearance={appearance} characterId={character.id} onInteract={handleInteract} />
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
          <button type="button" className="area-return" onClick={() => setInterior(null)}>
            ← RETORNAR À BAIXADA
          </button>
        )}
      </section>

      <button type="button" className="na-objective-toggle" onClick={() => setMissionOpen((value) => !value)} aria-expanded={missionOpen}>
        <span>◈ {v09.reported ? "INVESTIGAÇÃO ATUALIZADA" : "OBJETIVO ATUAL"}</span><span aria-hidden="true">{missionOpen ? "−" : "+"}</span>
      </button>
      {missionOpen && <section className="mission-card" aria-label="Missão atual">
        <div className="mission-card-top">
          <div>
            <span className="eyebrow">MISSÃO PRINCIPAL · BAIXADA</span>
            <h2>O nome que sumiu</h2>
          </div>
          <span className={mission.step === 3 ? "mission-status complete" : "mission-status"}>
            {v09.reported ? "CAPÍTULO 02" : "EM ANDAMENTO"}
          </span>
        </div>
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

      <div className="exploration-footer-actions single-action">
        <button type="button" className="explore-secondary" onClick={() => onOpenBattle("test")}>
          Arena tática de teste
        </button>
      </div>

      {menuOpen && (
        <CharacterMenu
          character={character}
          appearance={appearance}
          onChangeAppearance={onChangeAppearance}
          originName={origin.name}
          originDescription={origin.description}
          originProfile={getOriginGameplay(character.originId)}
          missionStep={mission.step}
          missionObjective={objective}
          clues={mission.clues.map((id) => ({ id, text: CLUE_LABELS[id] ?? "Pista registrada." }))}
          sceneTitle={sceneTitle}
          sceneSubtitle={sceneSubtitle}
          onClose={() => setMenuOpen(false)}
          onReturnToTitle={onReturnToTitle}
          onOpenTestArena={() => onOpenBattle("test")}
          inventory={inventory}
          onToggleEquipment={onToggleEquipment}
        />
      )}

      {currentDialogue && (
        <div
          className="dialogue-scrim"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setDialogue(null);
          }}
        >
          <section
            className="dialogue-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogue-title"
          >
            <div className="dialogue-head">
              <div className="dialogue-portrait" aria-hidden="true">
                {currentDialogue.portrait}
              </div>
              <div>
                <span className="eyebrow">{currentDialogue.role}</span>
                <h2 id="dialogue-title">{currentDialogue.speaker}</h2>
              </div>
            </div>
            <p>{currentDialogue.text}</p>
            {currentDialogue.choices && <div className="dialogue-choice-list" role="group" aria-label="Respostas do protagonista">
              {currentDialogue.choices.map(choice=><button type="button" key={choice.id}
                onClick={()=>selectAnswer(choice)}>{choice.label}</button>)}
            </div>}
            <button
              type="button"
              className="dialogue-continue"
              onClick={() => {
                setDialogue((current) => {
                  if (!current || current.index + 1 >= current.pages.length) return null;
                  return { ...current, index: current.index + 1 };
                });
              }}
            >
              {dialogue && dialogue.index + 1 < dialogue.pages.length
                ? "Continuar"
                : "Fechar diálogo"}
              <span>→</span>
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
