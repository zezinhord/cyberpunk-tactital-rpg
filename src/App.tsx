import { useEffect, useMemo, useState } from "react";
import Battlefield from "./components/Battlefield";
import { TurnManager } from "./game/TurnManager";
import type { GameState, Unit } from "./game/types";

function getUnit(state: GameState, id: string): Unit | undefined {
  return state.units.find((unit) => unit.id === id);
}

function HealthBar({ label, unit, accent }: { label: string; unit?: Unit; accent: "cyan" | "pink" }) {
  if (!unit) return null;
  const percentage = Math.max(0, (unit.hp / unit.maxHp) * 100);

  return (
    <div className={`health-card ${accent}`}>
      <div className="health-heading">
        <span>{label}</span>
        <strong>{unit.hp}<small> / {unit.maxHp} HP</small></strong>
      </div>
      <div className="health-track">
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default function App() {
  const manager = useMemo(() => new TurnManager(), []);
  const [state, setState] = useState<GameState>(() => manager.getState());
  const player = getUnit(state, "runner");
  const enemy = getUnit(state, "drone");
  const canAttack = manager.canAttack();

  useEffect(() => manager.subscribe(setState), [manager]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">N<span>7</span></div>
        <div className="brand-copy">
          <strong>NEON<span>TACTICS</span></strong>
          <small>PROTOCOLO DE COMBATE // BUILD 0.1</small>
        </div>
        <div className="connection-status"><i /> OFFLINE READY</div>
      </header>

      <section className="mission-heading">
        <div className="eyebrow"><span /> SETOR 07 <b>/</b> ZONA INDUSTRIAL</div>
        <h1>LINHA DE <em>FUGA</em></h1>
        <p>Neutralize a unidade sentinela e abra caminho até a extração.</p>
      </section>

      <section className="combat-layout" aria-label="Combate tático">
        <div className="battle-panel">
          <div className="panel-heading">
            <span>CAMPO TÁTICO</span>
            <span className="round-label">RODADA {String(state.round).padStart(2, "0")}</span>
          </div>
          <Battlefield manager={manager} />
          <div className="map-legend">
            <span><i className="legend-player" /> OPERATIVO</span>
            <span><i className="legend-enemy" /> HOSTIL</span>
            <span><i className="legend-wall" /> OBSTÁCULO</span>
          </div>
          <div className="movement-hint">TOQUE EM UMA CÉLULA VERDE PARA MOVIMENTAR</div>
        </div>

        <aside className="status-panel">
          <div className="panel-heading"><span>UNIDADES</span><span className="live-tag">AO VIVO</span></div>
          <HealthBar label="Vesper // Operativo" unit={player} accent="cyan" />
          <HealthBar label="Sentinela-07 // Drone" unit={enemy} accent="pink" />

          <div className="turn-card">
            <div className="turn-card-label">FASE ATUAL</div>
            <strong>{state.activeSide === "player" ? "SEU TURNO" : "TURNO HOSTIL"}</strong>
            <div className="resource-row">
              <span>MOVIMENTO</span>
              <b>{state.movementRemaining} <small>/ 6</small></b>
            </div>
            <div className="resource-row">
              <span>AÇÃO PRINCIPAL</span>
              <b className={state.mainActionAvailable ? "available" : "spent"}>
                {state.mainActionAvailable ? "DISPONÍVEL" : "UTILIZADA"}
              </b>
            </div>
            <div className="resource-row">
              <span>AÇÃO BÔNUS</span>
              <b className={state.bonusActionAvailable ? "available" : "spent"}>
                {state.bonusActionAvailable ? "DISPONÍVEL" : "UTILIZADA"}
              </b>
            </div>
          </div>

          <div className="combat-message" role="status">
            <span className="message-icon">!</span>
            <p>{state.message}</p>
          </div>

          <div className="action-buttons">
            <button className="attack-button" onClick={() => manager.attack()} disabled={!canAttack}>
              <span>✦</span> ATAQUE CORPO A CORPO
            </button>
            <button
              className="end-turn-button"
              onClick={() => manager.endPlayerTurn()}
              disabled={state.activeSide !== "player" || state.combatComplete}
            >
              ENCERRAR TURNO <span>↗</span>
            </button>
          </div>
          {state.combatComplete && (
            <div className={`result-banner ${enemy && enemy.hp <= 0 ? "victory" : "defeat"}`}>
              {enemy && enemy.hp <= 0 ? "OBJETIVO CONCLUÍDO" : "OPERATIVO INCAPACITADO"}
            </div>
          )}
        </aside>
      </section>

      <section className="log-panel">
        <div className="panel-heading"><span>REGISTRO DE COMBATE</span><span className="log-count">{state.log.length.toString().padStart(2, "0")} EVENTOS</span></div>
        <div className="log-list">
          {state.log.slice(-4).reverse().map((entry, index) => (
            <p key={`${entry}-${index}`}><span>{String(state.log.length - index).padStart(2, "0")}</span>{entry}</p>
          ))}
        </div>
      </section>

      <footer className="footer-note">SIMULAÇÃO LOCAL // PROTÓTIPO DE MECÂNICAS // DADOS NÃO PERSISTIDOS</footer>
    </main>
  );
}
