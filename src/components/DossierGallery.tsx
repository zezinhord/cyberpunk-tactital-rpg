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
import {countEvacuated,
 readVigil,saveVigil,vigilUnlocked,mapForVigil,
 vigilGuards,vigilRun,planVigilMission,startVigil,moveVigil,rescueVigil,
 divertVigil,reorganizeVigil,
 type VigilProgress,type VigilApproach,type VigilResult,type VigilRun}
 from "../game/story/vigil-escorts.ts";
import ShelterPanel from "./ShelterPanel.tsx";
import {readShelter,shelterUnlocked,activeShelter,shelterFrame,type ShelterState} from "../game/story/shelter-network.ts";
import "../dossier-gallery.css";

/** Changing a 2880×1620 picture on every tap exhausts low-RAM Android GPU
 * image caches. Keep an active rescue plate for four turns or until a civilian
 * group actually changes, then release the old image in one React update. */
const rescuePlate=(run:VigilRun|null):number=>run?
 Math.min(15,Math.min(3,countEvacuated(run.rescued))*4+
  (Math.floor(run.turn/4)%4)):0;
interface Props{room:string;characterId:string;onClose:()=>void;
 onQuestXp:(eventId:string,amount:number)=>boolean}
export default function DossierGallery({room,characterId,onClose,onQuestXp}:Props){
 const [progress,setProgress]=useState<ArchiveProgress>(()=>readArchiveProgress(characterId));
 const [mode,setMode]=useState<"dossier"|"cutscene"|"spritesheet"|"route"|"evac"|"shelter">("dossier");
 const [vigil,setVigil]=useState<VigilProgress>(()=>readVigil(characterId));
 const [shelter,setShelter]=useState<ShelterState>(()=>readShelter(characterId));
 const [vigilNotice,setVigilNotice]=useState("");
 const [vigilApproach,setVigilApproach]=useState<VigilApproach>("normal");
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
 const vigilAvailable=simulationRoom?vigilUnlocked(perimeter,simulationRoom):false;
 const shelterAvailable=simulationRoom?shelterUnlocked(vigil,simulationRoom):false;
 const shelterRun=simulationRoom?activeShelter(shelter,simulationRoom):null;
 const shelterDone=simulationRoom?shelter.completed[simulationRoom]:null;
 const evacRun=simulationRoom?vigilRun(vigil,simulationRoom):null;
 const evacMap=simulationRoom?mapForVigil(simulationRoom):null;
 const evacEnd=simulationRoom?vigil.completed[simulationRoom]:null;
 const evacGuards=simulationRoom&&evacRun?vigilGuards(simulationRoom,evacRun.turn):[];
 const evacPlan=simulationRoom&&evacRun?
   planVigilMission(simulationRoom,evacRun,vigilApproach):null;
 const evacNext=evacPlan?.steps[0]??null;
 const evacAtGroup=Boolean(evacRun&&evacMap&&evacMap.groups.some((p,i)=>
    p.x===evacRun.x&&p.y===evacRun.y&&(evacRun.rescued&(1<<i))===0));
 const commitVigil=(result:VigilResult)=>{
   if(!result.ok){setVigilNotice(result.message);return;}
   if(!saveVigil(characterId,result.state)){
     setVigilNotice("Não foi possível salvar o turno. Libere espaço e tente novamente.");
     return;
   }
   setVigil(result.state);setVigilNotice(result.message);
   const next=simulationRoom?vigilRun(result.state,simulationRoom):null;
   const prior=simulationRoom?vigilRun(vigil,simulationRoom):null;
   if(next&&(!prior||countEvacuated(next.rescued)!==countEvacuated(prior.rescued)||
     Math.floor(next.turn/4)!==Math.floor(prior.turn/4)))
      setIndex(rescuePlate(next));
   else if(result.xp>0)setIndex(15);
   if(result.xp>0&&simulationRoom)
     onQuestXp("vigil-"+simulationRoom,result.xp);
   setImageError(false);setZoom(false);
 };
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
   .filter(a=>a.room===room&&(a.kind===mode))
   .sort((a,b)=>a.path.localeCompare(b.path));
 },[room,mode]);
 const [index,setIndex]=useState(0);
 const [zoom,setZoom]=useState(false);
 const [imageError,setImageError]=useState(false);
 const current=pages[index];
 const maxIndex=mode==="shelter"&&!shelterDone?shelterFrame(shelterRun?.stage??0,shelterRun?.turn??0):
  mode==="evac"&&!evacEnd?rescuePlate(evacRun):
   mode==="route"&&!patrolCompleted?
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
           mode==="route"?"OPERAÇÃO LIMIAR · PATRULHA INTERATIVA":
           mode==="shelter"?"OPERAÇÃO REFÚGIO · RECONSTRUÇÃO CIVIL":
          "OPERAÇÃO VIGÍLIA · RESGATE E ESCOLTA"} · NOVA ARCÁDIA 2.0</small>
         <strong>{room.replaceAll("-"," ").toUpperCase()}</strong>
         <span>{pages.length?index+1:0} / {pages.length} {mode==="dossier"?
           "PRANCHAS · "+read+" LIDAS":mode==="cutscene"?
           "CENAS ILUSTRADAS":mode==="spritesheet"?
           "QUADROS · FASE "+Math.min(6,solved+1)+"/6":
           mode==="route"?"PLANTA · POSTO "+(patrol?.stage??0)+"/5":
          mode==="shelter"?"ABRIGO · POSTOS "+(shelterRun?.stage??(shelterDone?5:0))+"/5":
           "ESCOLTA · "+(evacRun?countEvacuated(evacRun.rescued):evacEnd?4:0)+
           "/4 CIVIS"}</span>
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
       <button type="button" aria-pressed={mode==="evac"} disabled={!vigilAvailable}
         title={vigilAvailable?"Iniciar resgate de quatro grupos de civis":
           "Conclua a patrulha Limiar deste local para abrir o resgate"}
         onClick={()=>{
           setMode("evac");setIndex(rescuePlate(evacRun));
           setZoom(false);setImageError(false);setVigilNotice("");
         }}>Vigília · escolta 8×8</button>
      <button type="button" aria-pressed={mode==="shelter"} disabled={!shelterAvailable}
        title={shelterAvailable?"Assista os civis após a evacuação":"Conclua a Vigília para liberar"}
        onClick={()=>{
          setMode("shelter");setIndex(shelterFrame(shelterRun?.stage??0,shelterRun?.turn??0));
          setZoom(false);setImageError(false);
        }}>Refúgio · 5 postos</button>
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
       {mode==="evac"&&evacMap&&<div className="na-perimeter-hud na-vigil-hud">
         <strong>OPERAÇÃO VIGÍLIA {evacEnd?"· RESGATE CONCLUÍDO":""}</strong>
         {evacRun?<div className="na-perimeter-data">
           <span>CIVIS {countEvacuated(evacRun.rescued)}/4</span>
           <span>ALERTA {evacRun.alert}/6</span>
           <span>ENERGIA {evacRun.energy}/8</span>
           <span>INCIDENTES {evacRun.incidents}</span>
         </div>:<p>{evacEnd?
           "Quatro grupos protegidos; missão registrada no histórico deste personagem.":
           "Extraia quatro grupos civis. Os vigias mudam de posição a cada ação."}</p>}
         {evacRun&&<div className="na-perimeter-modes">
           {(["normal","furtivo","corrida"] as const).map(kind=>
             <button type="button" key={kind} aria-pressed={vigilApproach===kind}
               onClick={()=>setVigilApproach(kind)}>{kind==="normal"?"Normal":
                kind==="furtivo"?"Furtivo":"Corrida"}</button>)}
         </div>}
         {evacRun&&<div className="na-perimeter-grid" role="group"
           aria-label="Mapa de extração 8 por 8 com civis e patrulhas móveis">
           {Array.from({length:64},(_,i)=>{
             const x=i%8,y=Math.floor(i/8);
             const wall=evacMap.blocked.has(x+","+y);
             const guard=evacGuards.some(p=>p.x===x&&p.y===y);
             const citizen=evacMap.groups.findIndex(p=>p.x===x&&p.y===y);
             const waiting=citizen>=0&&(evacRun.rescued&(1<<citizen))===0;
             const operator=x===evacRun.x&&y===evacRun.y;
             const suggested=x===evacNext?.x&&y===evacNext?.y;
             const exit=x===evacMap.exit.x&&y===evacMap.exit.y;
             const hazard=evacMap.hotspots.has(x+","+y);
             const distance=Math.abs(x-evacRun.x)+Math.abs(y-evacRun.y);
             const reachable=distance===1||(vigilApproach==="corrida"&&distance===2&&
               (x===evacRun.x||y===evacRun.y));
             return <button type="button" key={i}
               disabled={wall||!reachable}
               className={"na-route-cell"+(operator?" player":"")+
                (exit?" goal":"")+(waiting?" civilian":"")+
                (guard?" guard":"")+(suggested?" suggested":"")+
                (hazard?" hazard":"")+(wall?" blocked":"")}
               aria-label={operator?"Protagonista":wall?"Barreira":waiting?
                "Civis aguardando resgate":guard?"Sentinela móvel":exit?
                "Ponto de extração":hazard?"Zona de vigilância":"Corredor livre"}
               onClick={()=>commitVigil(moveVigil(vigil,simulationRoom!,
                 x,y,vigilApproach))}>{operator?"◆":waiting?"◈":guard?"✣":
                 wall?"■":exit?"◎":hazard?"!":"·"}</button>;
           })}
         </div>}
         {evacRun&&evacPlan&&<p className="na-vigil-guidance" aria-live="polite">
           ROTA DE RESGATE OTIMIZADA · {evacPlan.objectives.length-1} grupos restantes · {evacPlan.turns} turno(s) ·
           {evacPlan.estimatedEnergy} energia estimada ·
           risco {evacPlan.estimatedExposure}
           {evacNext?" · próxima casa ("+(evacNext.x+1)+", "+(evacNext.y+1)+")":""}
         </p>}
         {evacRun&&<div className="na-vigil-actions">
           <button type="button" disabled={!evacAtGroup||evacRun.energy===0}
             onClick={()=>commitVigil(rescueVigil(vigil,simulationRoom!))}>
             ◈ Socorrer grupo
           </button>
           <button type="button" disabled={evacRun.energy<2}
             onClick={()=>commitVigil(divertVigil(vigil,simulationRoom!))}>
             ◇ Distrair vigias
           </button>
           <button type="button" disabled={evacRun.energy>=8}
             onClick={()=>commitVigil(reorganizeVigil(vigil,simulationRoom!))}>
             ⟳ Reorganizar
           </button>
         </div>}
         {!evacRun&&!evacEnd&&<button type="button" className="na-route-start"
           onClick={()=>commitVigil(startVigil(vigil,perimeter,simulationRoom!))}>
           Iniciar resgate
         </button>}
       </div>}
       {mode==="shelter"&&simulationRoom&&<ShelterPanel
         room={simulationRoom} characterId={characterId} vigil={vigil}
         state={shelter} onUpdate={(newState,frame,xp)=>{
           setShelter(newState);setIndex(frame);setZoom(false);setImageError(false);
           if(xp>0)onQuestXp("shelter-"+simulationRoom,xp);
         }}/>}
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
       {mode==="evac"&&vigilNotice&&<p className="na-simulation-feedback">
         {vigilNotice}</p>}
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
         setZoom(false);setImageError(false);}} disabled={index===0||(mode==="route"&&!patrolCompleted)||(mode==="evac"&&!evacEnd)||(mode==="shelter"&&!shelterDone)}>Anterior</button>
       <button type="button" onClick={()=>setZoom(v=>!v)} disabled={!src||imageError}
         aria-pressed={zoom}>{zoom?"Enquadrar":"Ampliar"}</button>
       <button type="button" onClick={()=>{setIndex(v=>Math.min(maxIndex,v+1));
         setZoom(false);setImageError(false);}} disabled={index>=maxIndex||(mode==="route"&&!patrolCompleted)||(mode==="evac"&&!evacEnd)||(mode==="shelter"&&!shelterDone)}>Próxima</button>
     </footer>
   </div>
 </div>;
}
