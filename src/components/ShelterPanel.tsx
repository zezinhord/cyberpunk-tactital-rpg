import {useState} from "react";
import type {ExpansionInnerId} from "../game/districts/expansion-interiors.ts";
import type {VigilProgress} from "../game/story/vigil-escorts.ts";
import {SHELTER_STEPS,shelterMap,shelterTask,activeShelter,planShelterRoute,
 startShelter,moveShelter,supplyShelter,decideShelter,saveShelter,shelterFrame,
 type ShelterState,type ShelterPace,type ShelterResult} from "../game/story/shelter-network.ts";
interface Props{
 room:ExpansionInnerId;characterId:string;vigil:VigilProgress;state:ShelterState;
 onUpdate:(state:ShelterState,index:number,xp:number)=>void;
}
/** Lightweight in-game logistical mission. All commands are deterministic,
 * saved before the parent UI advances, and playable without external artwork.
 */
export default function ShelterPanel({room,characterId,vigil,state,onUpdate}:Props){
 const [pace,setPace]=useState<ShelterPace>("equilibrado");
 const [notice,setNotice]=useState("");
 const run=activeShelter(state,room),completed=state.completed[room];
 const map=shelterMap(room);
 const plan=run?planShelterRoute(room,run):null;
 const atGoal=Boolean(run&&plan&&run.x===plan.goal.x&&run.y===plan.goal.y);
 const task=run&&atGoal?shelterTask(room,run.stage):null;
 const apply=(result:ShelterResult)=>{
  if(!result.ok){setNotice(result.message);return;}
  if(!saveShelter(characterId,result.state)){
   setNotice("Falha ao salvar o turno. Libere espaço antes de continuar.");return;
  }
  setNotice(result.message);
  const next=activeShelter(result.state,room);
  onUpdate(result.state,next?shelterFrame(next.stage,next.turn):19,result.xp);
 };
 return <div className="na-perimeter-hud na-vigil-hud" data-story="shelter-v20">
   <strong>OPERAÇÃO REFÚGIO {completed?"· ASSISTÊNCIA ESTABILIZADA":""}</strong>
   {run?<div className="na-perimeter-data">
     <span>POSTOS {run.stage}/{SHELTER_STEPS}</span>
     <span>INSUMOS {run.supplies}/9</span>
     <span>MORAL {run.morale}/10</span>
     <span>SEGURANÇA {run.security}/10</span>
   </div>:<p>{completed?
     "A rede civil funciona sob gestão "+completed.doctrine+". "+
     completed.xp+" XP conquistados, sem repetição.":
     "Cinco postos de assistência exigem deslocamento, suprimentos e decisões políticas."}</p>}
   {run&&<div className="na-perimeter-modes">
    {(["cauteloso","equilibrado","urgente"] as const).map(kind=>
      <button type="button" key={kind} aria-pressed={pace===kind}
       onClick={()=>setPace(kind)}>{kind==="cauteloso"?"Cauteloso":
        kind==="urgente"?"Urgente":"Equilibrado"}</button>)}
   </div>}
   {run&&<div className="na-perimeter-grid" role="group"
      aria-label="Mapa interativo de proteção civil em 8 por 8 casas">
     {Array.from({length:64},(_,i)=>{
       const x=i%8,y=Math.floor(i/8),k=x+","+y;
       const wall=map.blocked.has(k),hazard=map.hazards.has(k);
       const player=run.x===x&&run.y===y;
       const target=plan?.goal.x===x&&plan.goal.y===y;
       const suggested=plan?.steps[0]?.x===x&&plan.steps[0]?.y===y;
       const adjacent=Math.abs(x-run.x)+Math.abs(y-run.y)===1;
       return <button type="button" key={k} disabled={wall||!adjacent}
        className={"na-route-cell"+(player?" player":"")+
         (target?" goal":"")+(suggested?" suggested":"")+
         (hazard?" hazard":"")+(wall?" blocked":"")}
        aria-label={player?"Equipe":wall?"Barreira":target?"Posto de assistência":
         hazard?"Passagem de risco":"Passagem livre"}
        onClick={()=>apply(moveShelter(state,room,x,y,pace))}>
         {player?"◆":wall?"■":target?"◎":hazard?"!":"·"}
       </button>;
     })}
   </div>}
   {run&&plan&&<p className="na-vigil-guidance" aria-live="polite">
     ROTA ASSISTENCIAL · {plan.steps.length} casas · risco {plan.risk}
     {plan.steps[0]?" · próximo passo ("+(plan.steps[0].x+1)+", "+
       (plan.steps[0].y+1)+")":" · posto alcançado"}
   </p>}
   {run&&<div className="na-vigil-actions">
     <button type="button" disabled={run.supplies>=9}
      onClick={()=>apply(supplyShelter(state,room))}>
       ⟳ Buscar suprimentos (+4 insumos, −1 moral)
     </button>
   </div>}
   {task&&run&&<section className="na-simulation-puzzle"
     aria-label="Escolha de reconstrução">
     <strong>INTERVENÇÃO {run.stage+1}/5 · {task.title}</strong>
     <p>{task.brief}</p>
     <div className="na-simulation-answers">
       {task.choices.map((choice,i)=>
        <button type="button" key={choice.label}
         disabled={run.supplies<choice.cost}
         onClick={()=>apply(decideShelter(state,room,i))}>
         {String.fromCharCode(65+i)} · {choice.label} ({choice.cost} insumos)
        </button>)}
     </div>
   </section>}
   {!run&&!completed&&<button type="button" className="na-route-start"
    onClick={()=>apply(startShelter(state,vigil,room))}>Iniciar proteção civil</button>}
   {notice&&<p className="na-simulation-feedback" aria-live="polite">{notice}</p>}
 </div>;
}
