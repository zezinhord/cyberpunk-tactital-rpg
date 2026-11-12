import type { GameState } from "../game/types";
import type { TurnManager } from "../game/TurnManager";
import { SPECIAL_IDS, SPECIALS } from "../game/abilities/catalog";

export default function AbilityBar({ state, manager }: { state: GameState; manager: TurnManager }) {
  return (
    <section className="arena-ability-bar" aria-label="Habilidades especiais do Operativo de Campo">
      <div className="arena-energy">
        <div><span>ENERGIA CIBERNÉTICA</span><strong>{state.energy} / {state.maxEnergy}</strong></div>
        <div className="arena-energy-track" role="progressbar" aria-label="Energia atual"
          aria-valuemin={0} aria-valuemax={state.maxEnergy} aria-valuenow={state.energy}>
          <span style={{ width: `${Math.round(100 * state.energy / state.maxEnergy)}%` }} />
        </div>
        <small>+2 energia ao começar cada turno</small>
      </div>
      <div className="arena-specials">
        {SPECIAL_IDS.map((id, index) => {
          const definition = SPECIALS[id];
          const availability = manager.getSpecialAvailability(id);
          const cooldown = state.cooldowns[id];
          const status = cooldown > 0 ? `RECARGA ${cooldown}` : state.energy < definition.cost ? "SEM ENERGIA"
            : availability.available ? "PRONTA" : "INDISPONÍVEL";
          return (
            <button type="button" className={availability.available ? "arena-special ready" : "arena-special unavailable"}
              key={id} aria-disabled={!availability.available}
              title={availability.available ? definition.description : availability.reason}
              aria-label={definition.name + ". Custo " + definition.cost + ". " + (availability.available ? "Disponível" : availability.reason)}
              onClick={() => manager.activateSpecial(id)}>
              <span className="arena-special-index">{String(index + 1).padStart(2,"0")}</span>
              <strong>{definition.name}</strong>
              <span className="arena-special-bottom"><small>{definition.cost} EN</small><small>{status}</small></span>
            </button>
          );
        })}
      </div>
      <div className="arena-effects">
        {state.barrierTurns > 0 && <span>◈ Barreira: {state.barrierTurns} ação(ões)</span>}
        {state.enemyJamTurns > 0 && <span>⚡ Sentinela bloqueada: {state.enemyJamTurns}</span>}
      </div>
    </section>
  );
}
