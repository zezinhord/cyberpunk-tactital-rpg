import {useEffect,useMemo,useState} from "react";
import type {PlayerCharacter} from "../game/character/types";
import {getOriginById} from "../game/character";
import {getClassById} from "../game/classes/registry";
import {OPENING_PANELS,openingLines} from "../game/story/opening";
import {audioDirector} from "../audio/director";

interface Props {
 character:PlayerCharacter;
 onFinish:()=>void;
 error?:string;
}

function reducedMotionPreference():boolean{
 try{
   return window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
     globalThis.localStorage?.getItem("cyberpunk-tactical-rpg.settings.reduce-motion.v1")==="true";
 }catch{return false;}
}

/** Cenários 100% estáticos em CSS: telas legíveis sem vídeos, rede ou WebGL extra. */
function SceneArtwork({visual,character}:{
 visual:(typeof OPENING_PANELS)[number]["visual"];character:PlayerCharacter;
}){
 const origin=getOriginById(character.originId).name;
 const className=character.classId?getClassById(character.classId).name:"Habitante";
 return <div className={"na-opening-art visual-"+visual} aria-hidden="true">
    <div className="na-opening-glow" />
    {(visual==="skyline"||visual==="districts")&&<>
      <div className="na-opening-sun"/>
      <div className="na-opening-horizon far"><i/><i/><i/><i/><i/><i/><i/></div>
      <div className="na-opening-horizon near"><i/><i/><i/><i/><i/><i/></div>
      <div className="na-opening-rail"/>
    </>}
    {visual==="eden"&&<>
      <div className="na-opening-network"/>
      <div className="na-opening-eden-symbol"><span>É</span><small>EDEN / REDE CENTRAL</small></div>
      <div className="na-opening-network-label">PROTOCOLOS AUTÔNOMOS · ACESSO RESTRITO</div>
    </>}
    {visual==="records"&&<>
      <div className="na-opening-document">
        <small>ARQUIVO LOCAL · ACESSO 04</small><strong>TRANSFERÊNCIA V-09</strong>
        <i/><i/><i/><i/>
        <span>IDENTIDADE: [ SUPRIMIDA ]</span>
      </div>
      <div className="na-opening-archive-mark">REGISTRO RECUPERADO // CÓPIA LOCAL</div>
    </>}
    {visual==="operative"&&<>
      <div className="na-opening-operative">
        <div className="na-opening-operative-head"/>
        <div className="na-opening-operative-body"/>
        <div className="na-opening-operative-visor"/>
      </div>
      <div className="na-opening-id-card">
        <small>IDENTIDADE REGISTRADA</small><strong>{character.name}</strong>
        <span>{origin}</span><span>{className}</span>
      </div>
    </>}
    {visual==="canal"&&<>
      <div className="na-opening-tunnel-ring outer"/>
      <div className="na-opening-tunnel-ring inner"/>
      <div className="na-opening-canal-door"><strong>V-09</strong><span>ACESSO TÉCNICO</span></div>
      <div className="na-opening-sewer-flow"/>
    </>}
    <div className="na-opening-scene-id">NOVA ARCÁDIA // {visual.toUpperCase()}</div>
  </div>;
}

export default function OpeningCutscene({character,onFinish,error}:Props){
 const [index,setIndex]=useState(0);
 const [visible,setVisible]=useState(0);
 const [reducedMotion]=useState(reducedMotionPreference);
 const panel=OPENING_PANELS[index]??OPENING_PANELS[0]!;
 const fullText=useMemo(()=>openingLines(panel,character).join("\n\n"),[panel,character]);
 useEffect(()=>{
   if(reducedMotion){setVisible(fullText.length);return;}
   setVisible(0);
   const interval=window.setInterval(()=>{
     setVisible(current=>{
       if(current>=fullText.length){window.clearInterval(interval);return fullText.length;}
       return Math.min(fullText.length,current+2);
     });
   },25);
   return ()=>window.clearInterval(interval);
 },[index,fullText,reducedMotion]);
 const advance=()=>{
   audioDirector.effect("terminal");
   if(visible<fullText.length){setVisible(fullText.length);return;}
   if(index>=OPENING_PANELS.length-1)onFinish();
   else setIndex(value=>value+1);
 };
 return <main className="na-opening-screen" aria-label="Prólogo cinematográfico de Nova Arcádia">
   <header className="na-opening-top">
     <span>TRANSMISSÃO DE BOAS-VINDAS <b> / NÚCLEO NARRATIVO</b></span>
     <button type="button" onClick={onFinish} aria-label="Pular apresentação e continuar">Pular apresentação <span aria-hidden="true">↗</span></button>
   </header>
   <section className="na-opening-layout">
     <SceneArtwork key={panel.id} visual={panel.visual} character={character}/>
     <article className="na-opening-narrative">
       <p className="na-opening-chapter">{panel.label}</p>
       <h1>{panel.title}</h1>
       <p className="na-opening-typed" aria-live="off" aria-label={fullText}>
         {fullText.slice(0,visible)}{visible<fullText.length&&<span className="na-opening-caret" aria-hidden="true">▍</span>}
       </p>
       {error&&<p className="na-opening-error" role="alert">{error}</p>}
       <p className="na-opening-prompt">{visible<fullText.length?
         "Toque em avançar para revelar o texto inteiro.":"Toque para continuar a história."}</p>
     </article>
   </section>
   <footer className="na-opening-footer">
     <div className="na-opening-progress" role="progressbar" aria-label="Progresso do prólogo"
       aria-valuemin={0} aria-valuemax={OPENING_PANELS.length} aria-valuenow={index+1}>
       {OPENING_PANELS.map((scene,i)=><i key={scene.id} className={i<=index?"active":""}/>)}
       <small>{String(index+1).padStart(2,"0")} / {String(OPENING_PANELS.length).padStart(2,"0")}</small>
     </div>
     <button type="button" className="na-opening-next" onClick={advance}>
       {visible<fullText.length?"Revelar texto":index===OPENING_PANELS.length-1?"Seguir para a sua origem":"Próxima cena"}
       <span aria-hidden="true">→</span>
     </button>
   </footer>
 </main>;
}
