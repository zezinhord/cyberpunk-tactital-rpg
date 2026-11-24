import {useState} from "react";
import type {ExpansionInnerId} from "../game/districts/expansion-interiors.ts";
import type {ShelterState} from "../game/story/shelter-network.ts";
import {NEXUS_NODES,activeNexus,readNexus,saveNexus,startNexus,moveNexus,
 nexusMap,nexusGuards,planNexusRoute,nexusQuestion,syncNexus,jamNexus,
 rechargeNexus,nexusFrame,type NexusMode,type NexusState,type NexusResult}
 from "../game/story/nexus-eden.ts";
interface Props{room:ExpansionInnerId;characterId:string;shelters:ShelterState;
 onUpdate:(state:NexusState,index:number,xp:number)=>void}
/** Independent turn-based infiltration rendered on the SAME live 8x8
 * isometric room coordinate system. Local state only reflects input posture;
 * mission position and outcomes are persisted before rendering each turn.
 */
export default function NexusPanel({room,characterId,shelters,onUpdate}:Props){
 const [progress,setProgress]=useState<NexusState>(()=>readNexus(characterId));
 const [mode,setMode]=useState<NexusMode>("silencioso");
 const [notice,setNotice]=useState("");
 const run=activeNexus(progress,room),completed=progress.completed[room];
 const map=nexusMap(room),route=run?planNexusRoute(room,run):null;
 const guards=run?nexusGuards(room,run.turn):[];
 const atTarget=Boolean(run&&route&&run.x===route.goal.x&&run.y===route.goal.y);
 const question=run&&atTarget?nexusQuestion(room,run.stage):null;
 const apply=(result:NexusResult)=>{
  if(!result.ok){setNotice(result.message);return;}
  if(!saveNexus(characterId,result.state)){
   setNotice("Armazenamento cheio: o turno não foi aplicado. Faça backup e libere espaço.");return;
  }
  setProgress(result.state);setNotice(result.message);
  const next=activeNexus(result.state,room);
  onUpdate(result.state,next?nexusFrame(next):23,result.xp);
 };
 return <div className="na-perimeter-hud na-vigil-hud na-nexus-hud" data-story="nexus-eden-v20">
  <strong>OPERAÇÃO NEXO {completed?"· REDE LIBERADA":""}</strong>
  {run?<div className="na-perimeter-data">
    <span>RELÉS {run.stage}/{NEXUS_NODES}</span>
    <span>ENERGIA {run.energy}/9</span>
    <span>RASTREIO {run.trace}/8</span>
    <span>CONTRA-INVASÕES {run.breaches}</span>
  </div>:<p>{completed?"Seis nós libertados. Política adotada: "+completed.doctrine+
   ". Recompensa única: +"+completed.xp+" XP.":
   "A rede Éden alterou serviços civis. Invada seis relés, proteja testemunhas e decida sua governança."}</p>}
  {run&&<div className="na-perimeter-modes">
   {(["silencioso","normal","investida"] as const).map(choice=>
    <button type="button" key={choice} aria-pressed={mode===choice}
     onClick={()=>setMode(choice)}>{choice==="silencioso"?"Furtivo":
      choice==="investida"?"Investida":"Normal"}</button>)}
  </div>}
  {run&&<div className="na-perimeter-grid" role="group"
    aria-label="Operação Éden: rede 8 por 8, nós de invasão e vigias">
   {Array.from({length:64},(_,i)=>{
    const x=i%8,y=Math.floor(i/8),k=x+","+y;
    const blocked=map.blocked.has(k);
    const scanner=map.scanners.has(k);
    const player=run.x===x&&run.y===y;
    const guard=guards.some(p=>p.x===x&&p.y===y);
    const relay=route?.goal.x===x&&route.goal.y===y;
    const suggested=route?.steps[0]?.x===x&&route.steps[0]?.y===y;
    const steps=Math.abs(run.x-x)+Math.abs(run.y-y);
    const reachable=steps===1||(mode==="investida"&&steps===2&&
     (x===run.x||y===run.y));
    return <button type="button" key={k} disabled={blocked||!reachable}
     className={"na-route-cell"+(player?" player":"")+
      (relay?" goal":"")+(guard?" guard":"")+(scanner?" hazard":"")+
      (suggested?" suggested":"")+(blocked?" blocked":"")}
     aria-label={player?"Protagonista":blocked?"Obstáculo":relay?"Relé do Éden":
      guard?"Vigia móvel":scanner?"Scanner de rastreio":"Corredor"}
     onClick={()=>apply(moveNexus(progress,room,x,y,mode))}>
     {player?"◆":blocked?"■":relay?"◎":guard?"✣":scanner?"!":"·"}
    </button>;
   })}
  </div>}
  {run&&route&&<p className="na-vigil-guidance" aria-live="polite">
   ROTA VERIFICADA · {route.steps.length} passos · ameaça prevista {route.risk}
   {route.steps[0]?" · próxima casa ("+(route.steps[0].x+1)+", "+
    (route.steps[0].y+1)+")":" · terminal alcançado"}
  </p>}
  {run&&<div className="na-vigil-actions">
   <button type="button" disabled={run.energy>=9}
    onClick={()=>apply(rechargeNexus(progress,room))}>
    ⟳ Recarregar +3 EN
   </button>
   <button type="button" disabled={run.energy<2}
    onClick={()=>apply(jamNexus(progress,room))}>
    ◇ Bloquear scanner −3
   </button>
  </div>}
  {question&&run&&<section className="na-simulation-puzzle"
      aria-label="Decisão de rede do Éden">
    <strong>RELÉ {run.stage+1}/{NEXUS_NODES} · {question.title}</strong>
    <p>{question.brief}</p>
    <div className="na-simulation-answers">
     {question.options.map((answer,i)=>
      <button type="button" key={answer} disabled={run.energy<[2,1,3][i]!}
       onClick={()=>apply(syncNexus(progress,room,i))}>
       {String.fromCharCode(65+i)} · {answer} ({[2,1,3][i]} EN)
      </button>)}
    </div>
  </section>}
  {!run&&!completed&&<button type="button" className="na-route-start"
   onClick={()=>apply(startNexus(progress,shelters,room))}>
   Iniciar infiltração do Éden
  </button>}
  {notice&&<p className="na-simulation-feedback" aria-live="polite">{notice}</p>}
 </div>;
}
