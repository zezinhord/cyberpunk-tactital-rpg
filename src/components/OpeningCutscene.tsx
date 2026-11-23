import {useEffect,useMemo,useRef,useState,type CSSProperties} from "react";
import type {PlayerCharacter} from "../game/character/types";
import {getOriginById} from "../game/character";
import {ORIGIN_IDS,type OriginId} from "../game/character/origins.ts";
import {getClassById} from "../game/classes/registry";
import type {TestAppearance} from "../game/test-arena/appearance";
import {getPlayerLiteSpriteUrl} from "../game/baixada/lite-art-assets";
import {OPENING_PANELS,openingLines,ORIGIN_CINEMATIC_MEMORY,
  OPENING_TARGET_DURATION_MS,compileOpening} from "../game/story/opening";
import {readCinematicPreferences,saveCinematicPreferences,
  textCharacterInterval,safeShot,type CinematicPreferences} from
  "../game/story/cinematic-engine.ts";
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
function SceneArtwork({visual,character,appearance,reducedMotion,shot}:{
 visual:(typeof OPENING_PANELS)[number]["visual"];
 character:PlayerCharacter;appearance:TestAppearance;reducedMotion:boolean;
 shot:(typeof OPENING_PANELS)[number]["shot"];
}){
 const origin=getOriginById(character.originId).name;
 const profession=character.classId?getClassById(character.classId).name:"Habitante";
 const memory=ORIGIN_CINEMATIC_MEMORY[character.originId];
 const cameraStyle={
  "--na-pan-x":shot.panX+"%","--na-pan-y":shot.panY+"%",
  "--na-zoom":shot.zoom,"--na-camera-duration":shot.transitionMs+"ms"
 } as CSSProperties;
 return <div className={"na-opening-art visual-"+visual+(reducedMotion?" reduced":"")+
    (visual==="operative"?" origin-"+character.originId:"")}
   data-opening-visual={visual} data-camera-focus={shot.focus}
   data-cinematic-mood={shot.mood} style={cameraStyle} aria-hidden="true">
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
     <div className="na-opening-origin-atmosphere"><span>{memory.motif}</span>
       <i/><i/><i/></div>
     <div className="na-opening-character-sprite" style={{
       backgroundImage:'url("'+getPlayerLiteSpriteUrl(character.originId,appearance)+'")',
     }}/>
     <div className="na-opening-id-card">
      <small>IDENTIDADE REGISTRADA</small><strong>{character.name}</strong>
      <span>{origin}</span><span>{profession}</span><span>{memory.location}</span>
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
 const [previewOrigin,setPreviewOrigin]=useState<OriginId|null>(null);
 const previewCharacter=import.meta.env.DEV&&previewOrigin?
   {...character,originId:previewOrigin}:character;
 const [settings,setSettings]=useState<CinematicPreferences>(readCinematicPreferences);
 const [confirmSkip,setConfirmSkip]=useState(false);
 const [historyOpen,setHistoryOpen]=useState(false);
 const [reducedPreference]=useState(reducedMotionPreference);
 const onFinishRef=useRef(onFinish);
 onFinishRef.current=onFinish;
 const reducedMotion=reducedPreference||settings.reduceMotion;
 const autoPlay=settings.autoPlay;
 const timeline=useMemo(()=>compileOpening(character),
   [character.id,character.originId,character.classId]);
 const panel=OPENING_PANELS[index]??OPENING_PANELS[0]!;
 const shot=safeShot(panel.shot);
 const memory=ORIGIN_CINEMATIC_MEMORY[previewCharacter.originId];
 const fullText=useMemo(()=>openingLines(panel,previewCharacter).join("\n\n")+
   (panel.id==="you"?"\n\n"+memory.detail:""),
   [panel,character,previewOrigin,memory.detail]);
 const changeSettings=(patch:Partial<CinematicPreferences>)=>{
   setSettings(previous=>{
     const updated={...previous,...patch};
     saveCinematicPreferences(updated);
     return updated;
   });
 };
 useEffect(()=>{
   if(shot.audio!=="none")audioDirector.effect(shot.audio);
 },[panel.id,shot.audio]);
 useEffect(()=>{
   if(reducedMotion||settings.speed==="instant"){
     setVisible(fullText.length);return;
   }
   setVisible(0);
   const interval=window.setInterval(()=>setVisible(current=>{
     if(current>=fullText.length){window.clearInterval(interval);return fullText.length;}
     return Math.min(fullText.length,current+2);
   }),textCharacterInterval(settings.speed));
   return ()=>window.clearInterval(interval);
 },[index,fullText,reducedMotion,settings.speed]);
 useEffect(()=>{
   if(!autoPlay||historyOpen||confirmSkip||error)return;
   const timeout=window.setTimeout(()=>{
     if(index===timeline.beats.length-1)onFinishRef.current();
     else setIndex(value=>Math.min(value+1,timeline.beats.length-1));
   },reducedMotion?Math.min(shot.durationMs,4200):shot.durationMs);
   return ()=>window.clearTimeout(timeout);
 },[autoPlay,index,timeline,shot.durationMs,reducedMotion,historyOpen,confirmSkip,error]);
 const advance=()=>{
   audioDirector.effect("terminal");
   if(visible<fullText.length){setVisible(fullText.length);return;}
   if(index>=timeline.beats.length-1)onFinishRef.current();
   else setIndex(value=>value+1);
 };
 return <main className="na-opening-screen" aria-label="Prólogo cinematográfico de Nova Arcádia"
  data-cinematic-timeline={timeline.id}>
  <header className="na-opening-top">
   <span>TRANSMISSÃO DE BOAS-VINDAS <b> / NÚCLEO NARRATIVO</b></span>
   <div className="na-opening-top-controls">
    <label className="na-cinema-speed-label">Legendas
     <select aria-label="Velocidade das legendas" value={settings.speed}
      onChange={event=>changeSettings({speed:event.target.value as CinematicPreferences["speed"]})}>
      <option value="slow">Lento</option><option value="normal">Normal</option>
      <option value="fast">Rápido</option><option value="instant">Instantâneo</option>
     </select>
    </label>
    <button type="button" className="na-opening-autoplay" aria-pressed={autoPlay}
      onClick={()=>changeSettings({autoPlay:!autoPlay})}>
      {autoPlay?"Automático: ligado":"Automático: desligado"}</button>
    <button type="button" aria-pressed={settings.reduceMotion}
      onClick={()=>changeSettings({reduceMotion:!settings.reduceMotion})}>
      {reducedMotion?"Movimento reduzido":"Reduzir movimento"}</button>
    <button type="button" onClick={()=>setHistoryOpen(value=>!value)}
      aria-expanded={historyOpen}>Histórico</button>
    <button type="button" onClick={()=>setConfirmSkip(true)}
      aria-label="Pular prólogo com confirmação">
      Pular apresentação <span aria-hidden="true">↗</span></button>
   </div>
  </header>
  <section className="na-opening-layout" key={panel.id} data-shot-id={panel.id}>
   <SceneArtwork visual={panel.visual} character={previewCharacter} appearance={appearance}
     reducedMotion={reducedMotion} shot={shot}/>
   <article className="na-opening-narrative">
    <p className="na-opening-chapter">{panel.label} · {shot.mood.toUpperCase()}</p>
    <h1>{panel.title}</h1>
    <p className="na-opening-typed" aria-live="off" aria-label={fullText}>
     {fullText.slice(0,visible)}
     {visible<fullText.length&&<span className="na-opening-caret" aria-hidden="true">▍</span>}
    </p>
    {error&&<p className="na-opening-error" role="alert">{error}</p>}
    <p className="na-opening-prompt">{visible<fullText.length?
       "Avançar revela a fala completa.":"Toque para continuar a história."}</p>
   </article>
  </section>
  {historyOpen&&<aside className="na-cinema-transcript" role="region"
    aria-label="Histórico das cenas do prólogo">
    <header><strong>Registro das cenas vistas</strong>
      <button type="button" onClick={()=>setHistoryOpen(false)}>Voltar à cena</button></header>
    {OPENING_PANELS.slice(0,index+1).map(scene=><p key={scene.id}>
      <strong>{scene.title}</strong> · {openingLines(scene,previewCharacter).join(" ")}</p>)}
   </aside>}
  {confirmSkip&&<div className="na-cinema-confirm" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="na-skip-opening-title">
     <h2 id="na-skip-opening-title">Pular o prólogo?</h2>
     <p>A apresentação da sua origem continuará normalmente. Nenhuma decisão será tomada automaticamente.</p>
     <div><button type="button" onClick={()=>setConfirmSkip(false)}>
       Continuar assistindo</button>
      <button type="button" onClick={()=>{setConfirmSkip(false);onFinishRef.current();}}>
       Confirmar e continuar</button></div>
    </section>
   </div>}
  {import.meta.env.DEV&&<aside className="na-cinema-dev-tools"
    aria-label="Pré-visualização cinematográfica exclusiva de desenvolvimento">
    <strong>DEV · CÂMERA</strong>
    <label>Enquadramento <select value={index}
      onChange={event=>setIndex(Number(event.target.value))}>
      {OPENING_PANELS.map((scene,i)=><option value={i} key={scene.id}>
        {scene.id} · {scene.title}</option>)}
     </select></label>
    <label>Origem de prévia <select value={previewOrigin??character.originId}
      onChange={event=>setPreviewOrigin(event.target.value as OriginId)}>
      {ORIGIN_IDS.map(id=><option key={id} value={id}>{getOriginById(id).name}</option>)}
     </select></label>
    <span>{shot.focus} · x {shot.panX}%, y {shot.panY}% · zoom {shot.zoom.toFixed(2)}</span>
    <button type="button" onClick={()=>{setIndex(0);setPreviewOrigin(null);}}>
      Reiniciar prévia</button>
   </aside>}
  <footer className="na-opening-footer">
   <div className="na-opening-progress" role="progressbar"
    aria-label="Progresso do prólogo" aria-valuemin={0}
    aria-valuemax={timeline.beats.length} aria-valuenow={index+1}>
    {timeline.beats.map((beat,i)=><i key={beat.id} className={i<=index?"active":""}/>)}
    <small>{String(index+1).padStart(2,"0")} / {String(timeline.beats.length).padStart(2,"0")} · {Math.round(OPENING_TARGET_DURATION_MS/1000)} s</small>
   </div>
   <button type="button" className="na-opening-next" onClick={advance}
     disabled={Boolean(error)}>
     {visible<fullText.length?"Revelar texto":index===timeline.beats.length-1?
      "Seguir para a sua origem":"Próxima cena"}<span aria-hidden="true">→</span>
   </button>
  </footer>
 </main>;
}
