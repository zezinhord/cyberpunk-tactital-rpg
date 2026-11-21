import {useEffect,useMemo,useState} from "react";
import {readArchiveProgress,saveArchiveProgress,markArchivePage,archiveReadCount,
 type ArchiveProgress} from "../game/story/archive-progress.ts";
import {isContractId} from "../game/story/inner-contracts.ts";
import type {ExpansionInnerId} from "../game/districts/expansion-interiors.ts";
import {readRecovery} from "../game/story/recovery-network.ts";
import {answerSimulation,problemsForRoom,readSimulations,saveSimulations,
 simulationUnlocked,simulationPhase,SIMULATION_PHASES,SIMULATION_FRAMES_PER_PHASE,
 type SimulationProgress} from "../game/story/field-simulations.ts";
import {packForRoom,packAssetUrl} from "../game/assets/native-pack-manager.ts";
import {readPerimeter,savePerimeter,perimeterUnlocked,
 layoutForRoom,startPerimeter,movePerimeter,answerPerimeter,
 currentRoute,routeGoal,routeBrief,routeFrame,PERIMETER_STAGES,
 type PerimeterState,type RouteMode} from "../game/story/perimeter-routes.ts";
import "../dossier-gallery.css";

interface Props{room:string;characterId:string;onClose:()=>void;
 onQuestXp:(eventId:string,amount:number)=>boolean}
export default function DossierGallery({room,characterId,onClose,onQuestXp}:Props){
 const [progress,setProgress]=useState<ArchiveProgress>(()=>readArchiveProgress(characterId));
 const [mode,setMode]=useState<"dossier"|"cutscene"|"spritesheet"|"route">("dossier");
 const [perimeter,setPerimeter]=useState<PerimeterState>(()=>readPerimeter(characterId));
 const [perimeterNotice,setPerimeterNotice]=useState("");
 const [routeMode,setRouteMode]=useState<RouteMode>("normal");
 const [simulations,setSimulations]=useState<SimulationProgress>(()=>readSimulations(characterId));
 const [simulationNotice,setSimulationNotice]=useState("");
 const simulationRoom=isContractId(room)?room as ExpansionInnerId:null;
 const recovery=useMemo(()=>readRecovery(characterId),[characterId]);
 const unlocked=simulationRoom?simulationUnlocked(recovery,simulationRoom):false;
 const solved=simulationRoom?simulationPhase(simulations,simulationRoom):0;
 const finished=solved===SIMULATION_PHASES;
 const perimeterReady=simulationRoom?perimeterUnlocked(simulations,simulationRoom):false;
 const patrol=simulationRoom?currentRoute(perimeter,simulationRoom):null;
 const patrolCompleted=simulationRoom?Boolean(perimeter.completed[simulationRoom]):false;
 const routeMap=simulationRoom?layoutForRoom(simulationRoom):null;
 const target=simulationRoom&&patrol?routeGoal(simulationRoom,patrol):null;
 const atTarget=Boolean(patrol&&target&&patrol.x===target.x&&patrol.y===target.y);
 const routeQuestion=simulationRoom&&patrol&&atTarget&&
   patrol.stage<PERIMETER_STAGES?routeBrief(simulationRoom,patrol.stage):null;
 const commitRoute=(result:{ok:boolean;state:PerimeterState;message:string;xp:number})=>{
   if(!result.ok){setPerimeterNotice(result.message);return;}
   if(!savePerimeter(characterId,result.state)){
     setPerimeterNotice("Sem espaço para registrar a patrulha. O turno não avançou.");
     return;
   }
   setPerimeter(result.state);
   setPerimeterNotice(result.message);
   if(result.xp>0&&simulationRoom)onQuestXp("perimeter-"+simulationRoom,result.xp);
   const next=simulationRoom?currentRoute(result.state,simulationRoom):null;
   if(next)setIndex(routeFrame(next));
   else if(result.xp>0)setIndex(19);
   setImageError(false);setZoom(false);
 };
 const pages=useMemo(()=>{
  const pack=packForRoom(room);
  return (pack?.assets??[])
   .filter(a=>a.room===room&&a.kind===mode)
   .sort((a,b)=>a.path.localeCompare(b.path));
 },[room,mode]);
 const [index,setIndex]=useState(0);
 const [zoom,setZoom]=useState(false);
 const [imageError,setImageError]=useState(false);
 const current=pages[index];
 const maxIndex=mode==="route"&&!patrolCompleted?
   routeFrame(patrol):mode==="spritesheet"&&!finished?
   Math.min(pages.length-1,solved*SIMULATION_FRAMES_PER_PHASE+
    SIMULATION_FRAMES_PER_PHASE-1):pages.length-1;
 const checkpoint=mode==="spritesheet"&&simulationRoom&&unlocked&&!finished&&
   index===maxIndex&&maxIndex>=0?problemsForRoom(simulationRoom)[solved]:null;
 const answer=(option:number)=>{
   if(!simulationRoom||!unlocked)return;
   const result=answerSimulation(simulations,recovery,simulationRoom,solved,option);
   if(!result.ok){setSimulationNotice(result.message);return;}
   if(!saveSimulations(characterId,result.state)){
     setSimulationNotice("Não foi possível registrar a decisão no armazenamento. Nenhum XP foi creditado.");
     return;
   }
   setSimulations(result.state);
   if(result.xp>0)onQuestXp("field-simulation-"+simulationRoom,result.xp);
   setSimulationNotice(result.message+(result.xp>0?
    " Recompensa de conclusão: +"+result.xp+" XP.":""));
   setIndex(Math.min(pages.length-1,(solved+1)*SIMULATION_FRAMES_PER_PHASE));
   setZoom(false);setImageError(false);
 };
 useEffect(()=>{
   if(!current||mode!=="dossier"||!isContractId(room))return;
   const next=markArchivePage(progress,room,index);
   if(next===progress)return;
   // Page reading is an optional codex; never prevent visual browsing on low storage.
   if(saveArchiveProgress(characterId,next))setProgress(next);
 },[index,current,room,characterId,progress,mode]);
 const read=isContractId(room)?archiveReadCount(progress,room):0;
 const src=current?packAssetUrl(room,mode,
  current.path.split("/").at(-1)?.split(".")[0]):null;
 return <div className="na-dossier-overlay" role="dialog" aria-modal="true"
   aria-label="Arquivo de evidências ampliadas da expansão">
   <div className="na-dossier-window">
     <header className="na-dossier-heading">
       <div>
         <small>{mode==="dossier"?"ARQUIVO INVESTIGATIVO":
           mode==="cutscene"?"CRÔNICAS VISUAIS · 16 QUADROS":
           mode==="spritesheet"?"A CIDADE RESPONDE · SIMULAÇÃO TÁTICA":
           "OPERAÇÃO LIMIAR · PATRULHA INTERATIVA"} · NOVA ARCÁDIA 2.0</small>
         <strong>{room.replaceAll("-"," ").toUpperCase()}</strong>
         <span>{pages.length?index+1:0} / {pages.length} {mode==="dossier"?
           "PRANCHAS · "+read+" LIDAS":mode==="cutscene"?
           "CENAS ILUSTRADAS":mode==="spritesheet"?
           "QUADROS · FASE "+Math.min(6,solved+1)+"/6":
           "PLANTA · POSTO "+(patrol?.stage??0)+"/5"}</span>
       </div>
       <button type="button" onClick={onClose} aria-label="Fechar arquivo">Fechar ×</button>
     </header>
     <nav className="na-dossier-modes" aria-label="Tipo de arquivo investigativo">
       <button type="button" aria-pressed={mode==="dossier"} onClick={()=>{
         setMode("dossier");setIndex(0);setZoom(false);setImageError(false);
       }}>Documentos · 12 páginas</button>
       <button type="button" aria-pressed={mode==="cutscene"} onClick={()=>{
         setMode("cutscene");setIndex(0);setZoom(false);setImageError(false);
       }}>Cenas · 16 quadros</button>
       <button type="button" aria-pressed={mode==="spritesheet"} disabled={!unlocked}
          title={unlocked?"Operação Retomada concluída":
             "Conclua a reconstrução deste distrito para abrir a simulação"}
          onClick={()=>{
            setMode("spritesheet");setIndex(Math.min(23,solved*SIMULATION_FRAMES_PER_PHASE));
            setZoom(false);setImageError(false);setSimulationNotice("");
          }}>Simulações · 24 quadros</button>
       <button type="button" aria-pressed={mode==="route"} disabled={!perimeterReady}
         title={perimeterReady?"Iniciar operação tática pós-simulação":
          "Complete a simulação de seis fases deste local"}
         onClick={()=>{
           setMode("route");setIndex(routeFrame(patrol));setZoom(false);
           setImageError(false);setPerimeterNotice("");
         }}>Limiar · mapa 8×8</button>
     </nav>
     <div className="na-dossier-visual">
       {mode==="route"&&routeMap&&<div className="na-perimeter-hud">
         <strong>OPERAÇÃO LIMIAR {patrolCompleted?"· RESOLVIDA":""}</strong>
         {patrol?<div className="na-perimeter-data">
           <span>POSTO {patrol.stage}/5</span>
           <span>ALERTA {patrol.alarm}/5</span>
           <span>FERRAMENTAS {patrol.tools}</span>
         </div>:<p>{patrolCompleted?
           "A rota foi recuperada. Arquivo visual concluído.":
           "Navegue pelos cinco objetivos sem abandonar o corredor de evacuação."}</p>}
         {patrol&&<div className="na-perimeter-modes">
           {(["normal","careful","fast"] as const).map(kind=>
            <button type="button" key={kind} aria-pressed={routeMode===kind}
              onClick={()=>setRouteMode(kind)}>{kind==="normal"?"Normal":
                kind==="careful"?"Proteção":"Rápido"}</button>)}
         </div>}
         {patrol&&<div className="na-perimeter-grid" role="group"
            aria-label="Planta navegável em grade 8 por 8">
           {Array.from({length:64},(_,i)=>{
             const x=i%8,y=Math.floor(i/8);
             const wall=routeMap.blocked.has(x+","+y);
             const danger=routeMap.hazards.has(x+","+y);
             const player=x===patrol.x&&y===patrol.y;
             const goal=x===target?.x&&y===target?.y;
             const adjacent=Math.abs(x-patrol.x)+Math.abs(y-patrol.y)===1;
             return <button type="button" key={i} disabled={wall||!adjacent}
               className={"na-route-cell"+(player?" player":"")+
                (goal?" goal":"")+(danger?" hazard":"")+(wall?" blocked":"")}
               aria-label={player?"Operador":wall?"Parede":goal?"Próximo objetivo":
                danger?"Setor sob vigilância":"Passagem livre"}
               onClick={()=>commitRoute(movePerimeter(perimeter,simulationRoom!,
                 x,y,routeMode))}>{player?"◆":wall?"■":goal?"◎":danger?"!":"·"}</button>;
           })}
         </div>}
         {!patrol&&!patrolCompleted&&<button type="button" className="na-route-start"
           onClick={()=>commitRoute(startPerimeter(perimeter,simulations,simulationRoom!))}>
           Iniciar patrulha
         </button>}
       </div>}
       {!current||!src?
         <p>Pacote de evidências não instalado. O mapa e as missões continuam
           disponíveis sem estes arquivos.</p>:
         imageError?
         <p>Esta prancha não pôde ser carregada. O dado pode estar danificado;
            reinstale o pacote deste distrito nas Configurações.</p>:
         <img key={src} src={src} decoding="async" loading="lazy" alt={current.caption??
           "Documento investigativo de "+room}
           className={zoom?"zoom":""}
           onError={()=>setImageError(true)}/>
       }
     </div>
     <div className="na-dossier-copy" aria-live="polite">
       <p>{current?.caption??"Sem descrição disponível."}</p>
       {mode==="spritesheet"&&<p>{finished?
         "SIMULAÇÃO CONCLUÍDA · 6 decisões técnicas registradas e acessíveis no backup.":
         "A CIDADE RESPONDE · avance pelos quatro registros da fase, analise os indícios e decida como proceder."}</p>}
       {simulationNotice&&<p className="na-simulation-feedback">{simulationNotice}</p>}
       {mode==="route"&&perimeterNotice&&<p className="na-simulation-feedback">
         {perimeterNotice}</p>}
     </div>
     {routeQuestion&&simulationRoom&&mode==="route"&&<section
         className="na-simulation-puzzle" aria-label="Decisão tática da patrulha">
       <strong>POSTO {(patrol?.stage??0)+1}/5 · {routeQuestion.title}</strong>
       <p>{routeQuestion.prompt}</p>
       <div className="na-simulation-answers">
         {routeQuestion.options.map((option,j)=><button type="button" key={option}
           onClick={()=>commitRoute(answerPerimeter(perimeter,simulationRoom,j))}>
           {String.fromCharCode(65+j)} · {option}</button>)}
       </div>
     </section>}
     {checkpoint&&<section className="na-simulation-puzzle" aria-label="Decisão técnica da simulação">
       <strong>FASE {solved+1}/6 · {checkpoint.title}</strong>
       <p>{checkpoint.prompt}</p>
       <div className="na-simulation-answers">
         {checkpoint.options.map((option,j)=><button type="button" key={option}
           onClick={()=>answer(j)}>{String.fromCharCode(65+j)} · {option}</button>)}
       </div>
     </section>}
     <footer className="na-dossier-footer">
       <button type="button" onClick={()=>{setIndex(v=>Math.max(0,v-1));
         setZoom(false);setImageError(false);}} disabled={index===0||(mode==="route"&&!patrolCompleted)}>Anterior</button>
       <button type="button" onClick={()=>setZoom(v=>!v)} disabled={!src||imageError}
         aria-pressed={zoom}>{zoom?"Enquadrar":"Ampliar"}</button>
       <button type="button" onClick={()=>{setIndex(v=>Math.min(maxIndex,v+1));
         setZoom(false);setImageError(false);}} disabled={index>=maxIndex||(mode==="route"&&!patrolCompleted)}>Próxima</button>
     </footer>
   </div>
 </div>;
}
