import type { GameState } from "../game/types";
import type { TurnManager } from "../game/TurnManager";
import { SPECIAL_IDS, SPECIALS } from "../game/abilities/catalog";
import { audioDirector } from "../audio/director";

export default function AbilityBar({ state, manager }: { state: GameState; manager: TurnManager }) {
  return (
    <section className="arena-ability-bar" aria-label="Habilidades comuns e exclusivas da classe">
      <div className="arena-energy">
        <div><span>ENERGIA CIBERNÉTICA</span><strong>{state.energy} / {state.maxEnergy}</strong></div>
        <div className="arena-energy-track" role="progressbar" aria-label="Energia atual"
          aria-valuemin={0} aria-valuemax={state.maxEnergy} aria-valuenow={state.energy}>
          <span style={{ width: `${Math.round(100 * state.energy / state.maxEnergy)}%` }} />
        </div>
        <small>+2 energia ao começar cada turno</small>
      </div>
      {manager.getClassAbilities().length>0&&<section className="arena-class-group" aria-label="Habilidade exclusiva da classe">
        <span className="arena-class-kicker">PODER EXCLUSIVO · CLASSE</span>
        <div className="arena-specials">
        {manager.getClassAbilities().map(skill=>{
          const availability=manager.getClassAvailability(skill.id);
          const cooldown=state.classCooldowns[skill.id]??0;
          const status=cooldown>0?"RECARGA "+cooldown:
            availability.available?"PRONTA":availability.reason;
          return <button type="button" key={skill.id}
            className={"arena-special class-exclusive "+(availability.available?"ready":"unavailable")}
            aria-disabled={!availability.available}
            aria-label={skill.name+". "+skill.description+". Custo "+skill.cost+" energia. "+status}
            title={availability.available?skill.description:availability.reason}
            onClick={()=>{if(availability.available)audioDirector.effect("tech");manager.activateClassAbility(skill.id);}}>
            <strong>{skill.name}</strong>
            <span className="arena-class-description">{skill.description}</span>
            <span className="arena-special-bottom">
              <small>{skill.cost} EN · ALC {skill.range}</small><small>{status}</small>
            </span>
          </button>;
        })}
        </div>
      </section>}
      <div className="arena-class-kicker">HABILIDADES COMUNS · OPERATIVO</div>
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
              onClick={() => { audioDirector.effect("tech"); manager.activateSpecial(id); }}>
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
        {state.classGuardTurns>0 && <span>◈ Proteção da classe: {state.classGuardTurns} ação(ões)</span>}
        {state.classEnemyArmorTurns>0&&<span>◇ Defesa inimiga exposta: {state.classEnemyArmorTurns}</span>}
        {state.classEnemyAttackTurns>0&&<span>▹ Ataque hostil contido: {state.classEnemyAttackTurns}</span>}
        {state.classNextDamageBonus>0&&<span>✦ Próximo ataque: +{state.classNextDamageBonus} dano</span>}
      </div>
    </section>
  );
}
