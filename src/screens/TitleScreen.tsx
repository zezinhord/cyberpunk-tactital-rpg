import { useEffect, useState } from "react";
import AudioControls from "../components/AudioControls";
import type { PlayerCharacter } from "../game/character";
import { getOriginById } from "../game/character";

interface Props {
  character: PlayerCharacter | null;
  onContinue: () => void;
  onNew: () => void;
}

type Panel = "none" | "load" | "settings" | "credits" | "confirm";
const MOTION_KEY = "cyberpunk-tactical-rpg.settings.reduce-motion.v1";

function readMotionPreference(): boolean {
  try { return globalThis.localStorage?.getItem(MOTION_KEY) === "true"; }
  catch { return false; }
}

export default function TitleScreen({ character, onContinue, onNew }: Props) {
  const [panel, setPanel] = useState<Panel>("none");
  const [reduceMotion, setReduceMotion] = useState(readMotionPreference);
  const origin = character ? getOriginById(character.originId) : null;

  useEffect(() => {
    document.documentElement.classList.toggle("na-reduce-motion", reduceMotion);
    try { globalThis.localStorage?.setItem(MOTION_KEY, String(reduceMotion)); }
    catch { /* Preferências permanecem locais à sessão se o armazenamento falhar. */ }
  }, [reduceMotion]);

  return (
    <main className="na-title" aria-label="Menu inicial de Nova Arcádia">
      <div className="na-title-art" aria-hidden="true">
        <div className="na-title-sun" />
        <div className="na-title-skyline distant" />
        <div className="na-title-skyline middle" />
        <div className="na-title-skyline near" />
        <div className="na-title-rail" />
        <img className="na-title-palm" src="/assets/baixada/palm-tree.svg" alt="" />
        <img className="na-title-stall" src="/assets/baixada/market-stall.svg" alt="" />
        <div className="na-title-vignette" />
      </div>

      <section className="na-title-content">
        <header className="na-title-brand">
          <span className="na-title-district">SINAL ABERTO // CIDADE DE NOVA ARCÁDIA</span>
          <h1>NOVA <span>ARCÁDIA</span></h1>
          <p>O sofrimento pode ser medido. A liberdade, não.</p>
        </header>
        <div className="na-title-menu">
          <span className="na-title-menu-label">SELECIONE UM DESTINO</span>
          <button type="button" className="na-title-option featured" onClick={onContinue} disabled={!character}>
            <span className="na-title-option-index">01</span><strong>Continuar</strong><span aria-hidden="true">↗</span>
          </button>
          <button type="button" className="na-title-option" onClick={() => character ? setPanel("confirm") : onNew()}>
            <span className="na-title-option-index">02</span><strong>Novo jogo</strong><span aria-hidden="true">↗</span>
          </button>
          <button type="button" className="na-title-option" onClick={() => setPanel("load")} disabled={!character}>
            <span className="na-title-option-index">03</span><strong>Carregar jogo</strong><span aria-hidden="true">↗</span>
          </button>
          <button type="button" className="na-title-option" onClick={() => setPanel("settings")}>
            <span className="na-title-option-index">04</span><strong>Configurações</strong><span aria-hidden="true">↗</span>
          </button>
          <button type="button" className="na-title-option" onClick={() => setPanel("credits")}>
            <span className="na-title-option-index">05</span><strong>Créditos</strong><span aria-hidden="true">↗</span>
          </button>
          {!character && <p className="na-title-help">Nenhum protagonista salvo neste aparelho. Comece em Novo jogo.</p>}
        </div>
        <footer className="na-title-foot">
          <span>PROJETO ÉDEN // TRANSMISSÃO 01</span>
          <span>RPG TÁTICO · PROTÓTIPO JOGÁVEL</span>
        </footer>
      </section>

      {panel !== "none" && (
        <div className="na-title-modal-scrim">
          <section className="na-title-modal" role="dialog" aria-modal="true" aria-labelledby="na-title-dialog-title">
            <div className="na-title-modal-heading">
              <span>TERMINAL // NOVA ARCÁDIA</span>
              <button type="button" onClick={() => setPanel("none")} aria-label="Fechar painel">✕</button>
            </div>
            {panel === "confirm" && (
              <>
                <h2 id="na-title-dialog-title">Iniciar nova história?</h2>
                <p>Seu protagonista atual continuará salvo até você terminar a criação do novo personagem. Ao criar e salvar o novo, o registro anterior será substituído.</p>
                <div className="na-modal-actions">
                  <button type="button" className="na-modal-secondary" onClick={() => setPanel("none")}>Cancelar</button>
                  <button type="button" className="na-modal-primary" onClick={onNew}>Criar novo protagonista</button>
                </div>
              </>
            )}
            {panel === "load" && character && (
              <>
                <h2 id="na-title-dialog-title">Carregar jogo</h2>
                <p>Existe um único espaço de salvamento local nesta versão. Nenhum progresso foi substituído.</p>
                <article className="na-title-save">
                  <span>SLOT 01 // ARMAZENAMENTO LOCAL</span>
                  <strong>{character.name}</strong>
                  <small>{origin?.name} · Nível {character.level}</small>
                  <small>Atualizado: {new Date(character.updatedAt).toLocaleString("pt-BR")}</small>
                </article>
                <button type="button" className="na-modal-primary" onClick={onContinue}>Carregar protagonista</button>
              </>
            )}
            {panel === "settings" && (
              <>
                <h2 id="na-title-dialog-title">Configurações</h2>
                <p>Preferências disponíveis nesta versão. A orientação é horizontal e o controle de exploração permanece por toque.</p>
                <label className="na-title-setting">
                  <span><strong>Reduzir movimento da interface</strong><small>Desativa transições e animações decorativas.</small></span>
                  <input type="checkbox" checked={reduceMotion} onChange={(event) => setReduceMotion(event.target.checked)} />
                </label>
                <AudioControls />
                <p className="na-title-modal-note">Qualidade gráfica avançada ainda não está disponível.</p>
              </>
            )}
            {panel === "credits" && (
              <>
                <h2 id="na-title-dialog-title">Créditos</h2>
                <p>Nova Arcádia é um RPG tático cyberpunk tropical em desenvolvimento independente.</p>
                <div className="na-title-credits">
                  <span>UNIVERSO</span><strong>Nova Arcádia · Projeto Éden</strong>
                  <span>TECNOLOGIAS</span><strong>React · TypeScript · Phaser · Capacitor</strong>
                  <span>DESENVOLVIMENTO</span><strong>Projeto em evolução · build de testes</strong>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
