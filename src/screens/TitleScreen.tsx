import { useEffect, useState } from "react";
import AudioControls from "../components/AudioControls";
import type { PlayerCharacter } from "../game/character";
import { getOriginById } from "../game/character";
import {getClassById} from "../game/classes/registry";
import {MAX_CHARACTER_SLOTS} from "../game/character/slots";

interface Props {
  character: PlayerCharacter | null;
  slots: readonly PlayerCharacter[];
  onContinue: () => void;
  onNew: () => void;
  onLoadSlot: (id:string)=>void;
  onDeleteSlot: (id:string)=>void;
  onExport: (id:string)=>Promise<string>;
  onImport: (file:File)=>Promise<string>;
  saveNotice: string;
}

type Panel = "none" | "load" | "settings" | "credits" | "confirm";
const MOTION_KEY = "cyberpunk-tactical-rpg.settings.reduce-motion.v1";

function readMotionPreference(): boolean {
  try { return globalThis.localStorage?.getItem(MOTION_KEY) === "true"; }
  catch { return false; }
}

export default function TitleScreen({
  character,slots,onContinue,onNew,onLoadSlot,onDeleteSlot,onExport,onImport,saveNotice,
}: Props) {
  const [panel, setPanel] = useState<Panel>("none");
  const [notice,setNotice]=useState("");
  const [importing,setImporting]=useState(false);
  const [reduceMotion, setReduceMotion] = useState(readMotionPreference);

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
          <button type="button" className="na-title-option" onClick={() => character ? setPanel("confirm") : onNew()} disabled={slots.length>=MAX_CHARACTER_SLOTS}>
            <span className="na-title-option-index">02</span><strong>Novo jogo</strong><span aria-hidden="true">↗</span>
          </button>
          <button type="button" className="na-title-option" onClick={() => setPanel("load")}>
            <span className="na-title-option-index">03</span><strong>Carregar jogo</strong><span aria-hidden="true">↗</span>
          </button>
          <button type="button" className="na-title-option" onClick={() => setPanel("settings")}>
            <span className="na-title-option-index">04</span><strong>Configurações</strong><span aria-hidden="true">↗</span>
          </button>
          <button type="button" className="na-title-option" onClick={() => setPanel("credits")}>
            <span className="na-title-option-index">05</span><strong>Créditos</strong><span aria-hidden="true">↗</span>
          </button>
          {slots.length>=MAX_CHARACTER_SLOTS&&<p className="na-title-help">Slots completos: exporte um backup e exclua um personagem para criar outro.</p>}
          {!character && <p className="na-title-help">Nenhum protagonista ativo. Carregue um backup ou comece em Novo jogo.</p>}
        </div>
        <footer className="na-title-foot">
          <span>PROJETO ÉDEN // TRANSMISSÃO 01</span>
          <span>RPG TÁTICO · PRÉVIA PÚBLICA 0.6.9 RC1</span>
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
                <p>O novo protagonista ocupará outro slot. O anterior, seu inventário, sua missão e suas escolhas permanecerão disponíveis em Carregar jogo.</p>
                <div className="na-modal-actions">
                  <button type="button" className="na-modal-secondary" onClick={() => setPanel("none")}>Cancelar</button>
                  <button type="button" className="na-modal-primary" onClick={onNew}>Criar novo protagonista</button>
                </div>
              </>
            )}
            {panel === "load" && (
              <>
                <h2 id="na-title-dialog-title">Personagens e backups</h2>
                <p>{slots.length} de {MAX_CHARACTER_SLOTS} slots utilizados. Cada protagonista mantém seus próprios itens, missão e Vida.</p>
                <div className="save-slot-list" role="list">
                  {slots.length===0&&<p>Nenhum slot salvo. Crie um personagem ou importe um arquivo JSON.</p>}
                  {slots.map(slot=><article className="save-slot-entry" role="listitem" key={slot.id}>
                    <div>
                      <strong>{slot.name}</strong>
                      <small>{getOriginById(slot.originId).name} · {slot.classId?getClassById(slot.classId).name:"Classe pendente"} · Nível {slot.level}</small>
                      <small>{slot.id===character?.id?"ATIVO · ":""}Atualizado {new Date(slot.updatedAt).toLocaleDateString("pt-BR")}</small>
                    </div>
                    <div className="save-slot-actions">
                      <button type="button" onClick={()=>onLoadSlot(slot.id)}>Jogar</button>
                      <button type="button" onClick={async()=>setNotice(await onExport(slot.id))}>Exportar</button>
                      <button type="button" className="slot-delete" onClick={()=>onDeleteSlot(slot.id)}>Excluir</button>
                    </div>
                  </article>)}
                </div>
                <label className="backup-import-label">
                  <span>Restaurar backup JSON do aparelho</span>
                  <input type="file" accept=".json,application/json" disabled={importing}
                    onChange={async(e)=>{
                      const input=e.currentTarget;
                      const file=input.files?.[0];if(!file)return;
                      setImporting(true);
                      try{setNotice(await onImport(file));}
                      finally{setImporting(false);input.value="";}
                    }}/>
                </label>
                <p className="na-title-modal-note" role="status">{notice||saveNotice}</p>
                <p className="na-title-modal-note">Exportar antes de reinstalar ou limpar dados. Arquivos de backup ficam sob seu controle.</p>
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
