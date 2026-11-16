import {useEffect,useMemo,useState} from "react";
import type {PlayerCharacter} from "../game/character/types";
import {getOriginById} from "../game/character";
import {getClassById} from "../game/classes/registry";
import type {TestAppearance} from "../game/test-arena/appearance";
import {getPlayerLiteSpriteUrl} from "../game/baixada/lite-art-assets";
import {OPENING_PANELS,openingLines} from "../game/story/opening";
import {audioDirector} from "../audio/director";

interface Props{
 character:PlayerCharacter;
 appearance:TestAppearance;
 onFinish:()=>void;
 error?:string;
}
function reducedMotionPreference():boolean{
 try{return window.matchMedia("(prefers-reduced-motion: reduce)").matches||
  globalThis.localStorage?.getItem("cyberpunk-tactical-rpg.settings.reduce-motion.v1")==="true";
 }catch{return false;}
}
/** Arte em camadas locais, sem rede/vídeos/WebGL e sem alterar o mundo. */
function SceneArtwork({visual,character,appearance,reducedMotion}:{
 visual:(typeof OPENING_PANELS)[number]["visual"];
 character:PlayerCharacter;appearance:TestAppearance;reducedMotion:boolean;
}){
 const origin=getOriginById(character.originId).name;
 const profession=character.classId?getClassById(character.classId).name:"Habitante";
 return <div className={"na-opening-art visual-"+visual+(reducedMotion?" reduced":"")}
   data-opening-visual={visual} aria-hidden="true">
    <div className="na-opening-glow"/>
    {(visual==="skyline"||visual==="aurea"||visual==="baixada")&&<>
     <div className="na-opening-sun"/>
     <div className="na-opening-horizon far"><i/><i/><i/><i/><i/><i/><i/></div>
     <div className="na-opening-horizon near"><i/><i/><i/><i/><i/><i/></div>
     <div className="na-opening-rail"/>
     <div className="na-opening-weather"/>
     <div className="na-opening-drone"/>
    </>}
    {visual==="aurea"&&<div className="na-opening-gate">
      <span>HELIX / ÁUREA</span><i/><i/><i/>
     </div>}
    {visual==="baixada"&&<>
     <div className="na-opening-stall"><i/><i/><i/><span>OFICINA · MERCADO</span></div>
     <div className="na-opening-wires"><i/><i/><i/></div>
    </>}
    {(visual==="eden"||visual==="interference")&&<>
      <div className="na-opening-network"/>
      <div className="na-opening-eden-symbol"><span>É</span><small>EDEN / REDE CENTRAL</small></div>
      <div className="na-opening-network-label">{visual==="eden"?
        "PROTOCOLOS AUTÔNOMOS · ACESSO RESTRITO":"ARQUIVO EXTERNO · INTEGRIDADE INDETERMINADA"}</div>
      {visual==="interference"&&<div className="na-opening-interference">
        <strong>ANOMALIA // NÃO CATALOGADA</strong><i/><i/><i/>
      </div>}
    </>}
    {visual==="records"&&<>
     <div className="na-opening-document">
      <small>ARQUIVO LOCAL · ACESSO 04</small><strong>TRANSFERÊNCIA V-09</strong>
      <i/><i/><i/><i/><span>IDENTIDADE: [ SUPRIMIDA ]</span>
     </div>
     <div className="na-opening-archive-mark">REGISTRO RECUPERADO // CÓPIA LOCAL</div>
    </>}
    {visual==="operative"&&<>
     <div className="na-opening-character-sprite" style={{
       backgroundImage:'url("'+getPlayerLiteSpriteUrl(character.originId,appearance)+'")',
     }}/>
     <div className="na-opening-id-card">
      <small>IDENTIDADE REGISTRADA</small><strong>{character.name}</strong>
      <span>{origin}</span><span>{profession}</span>
      <span>{appearance==="masculine"?"APRESENTAÇÃO MASCULINA":"APRESENTAÇÃO FEMININA"}</span>
     </div>
    </>}
    {visual==="canal"&&<>
     <div className="na-opening-tunnel-ring outer"/>
     <div className="na-opening-tunnel-ring inner"/>
     <div className="na-opening-canal-door"><strong>V-09</strong><span>ACESSO TÉCNICO</span></div>
     <div className="na-opening-sewer-flow"/>
     <div className="na-opening-clinic"><span>CLÍNICA COMUNITÁRIA</span><i/><i/></div>
    </>}
    <div className="na-opening-scene-id">NOVA ARCÁDIA // {visual.toUpperCase()}</div>
 </div>;
}

export default function OpeningCutscene({character,appearance,onFinish,error}:Props){
 const [index,setIndex]=useState(0);
 const [visible,setVisible]=useState(0);
 const [autoPlay,setAutoPlay]=useState(false);
 const [reducedMotion]=useState(reducedMotionPreference);
 const panel=OPENING_PANELS[index]??OPENING_PANELS[0]!;
 const fullText=useMemo(()=>openingLines(panel,character).join("\n\n"),[panel,character]);
 useEffect(()=>{
  if(reducedMotion){setVisible(fullText.length);return;}
  setVisible(0);
  const interval=window.setInterval(()=>setVisible(current=>{
    if(current>=fullText.length){window.clearInterval(interval);return fullText.length;}
    return Math.min(fullText.length,current+2);
  }),25);
  return ()=>window.clearInterval(interval);
 },[index,fullText,reducedMotion]);
 useEffect(()=>{
  if(!autoPlay||visible<fullText.length)return;
  const timeout=window.setTimeout(()=>{
   if(index===OPENING_PANELS.length-1)onFinish();
   else setIndex(value=>Math.min(value+1,OPENING_PANELS.length-1));
  },reducedMotion?5200:3800);
  return ()=>window.clearTimeout(timeout);
 },[autoPlay,visible,fullText.length,index,reducedMotion,onFinish]);
 const advance=()=>{
  audioDirector.effect("terminal");
  if(visible<fullText.length){setVisible(fullText.length);return;}
  if(index>=OPENING_PANELS.length-1)onFinish();
  else setIndex(value=>value+1);
 };
 return <main className="na-opening-screen" aria-label="Prólogo cinematográfico de Nova Arcádia">
  <header className="na-opening-top">
   <span>TRANSMISSÃO DE BOAS-VINDAS <b> / NÚCLEO NARRATIVO</b></span>
   <div className="na-opening-top-controls">
    <button type="button" className="na-opening-autoplay" aria-pressed={autoPlay}
     onClick={()=>setAutoPlay(value=>!value)}>{autoPlay?"Automático: ligado":"Modo automático"}</button>
    <button type="button" onClick={onFinish} aria-label="Pular apresentação e continuar">
     Pular apresentação <span aria-hidden="true">↗</span></button>
   </div>
  </header>
  <section className="na-opening-layout" key={panel.id}>
   <SceneArtwork visual={panel.visual} character={character} appearance={appearance}
    reducedMotion={reducedMotion}/>
   <article className="na-opening-narrative">
    <p className="na-opening-chapter">{panel.label}</p>
    <h1>{panel.title}</h1>
    <p className="na-opening-typed" aria-live="off" aria-label={fullText}>
      {fullText.slice(0,visible)}
      {visible<fullText.length&&<span className="na-opening-caret" aria-hidden="true">▍</span>}
    </p>
    {error&&<p className="na-opening-error" role="alert">{error}</p>}
    <p className="na-opening-prompt">{visible<fullText.length?
       "Toque em avançar para revelar toda a fala.":"Toque para continuar a história."}</p>
   </article>
  </section>
  <footer className="na-opening-footer">
    <div className="na-opening-progress" role="progressbar" aria-label="Progresso do prólogo"
      aria-valuemin={0} aria-valuemax={OPENING_PANELS.length} aria-valuenow={index+1}>
      {OPENING_PANELS.map((scene,i)=><i key={scene.id} className={i<=index?"active":""}/>)}
      <small>{String(index+1).padStart(2,"0")} / {String(OPENING_PANELS.length).padStart(2,"0")}</small>
    </div>
    <button type="button" className="na-opening-next" onClick={advance}>
      {visible<fullText.length?"Revelar texto":index===OPENING_PANELS.length-1?
       "Seguir para a sua origem":"Próxima cena"}<span aria-hidden="true">→</span>
    </button>
  </footer>
 </main>;
}
