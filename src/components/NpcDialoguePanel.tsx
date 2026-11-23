import {useEffect,useRef,useState,type ReactNode} from "react";
import NarrativePortrait,{characterPortrait,dialogueEmotion} from "./NarrativePortrait";
import type {ConversationOption} from "../game/dialogues/patio";
import {audioDirector} from "../audio/director";
import {dialoguePresentation,readCinematicPreferences,
 saveCinematicPreferences,textCharacterInterval,markCinematicSeen,
 type CinematicPreferences} from "../game/story/cinematic-engine.ts";

export interface DialoguePageProps{
 speaker:string;role:string;portrait:string;text:string;choices?:readonly ConversationOption[];
 /** Existing quest event presented cinematically; never a new quest receipt. */
 cinematicId?:string;
}
interface Props{
 page:DialoguePageProps;pageIndex:number;totalPages:number;pages?:readonly DialoguePageProps[];
 onClose:()=>void;onNext:()=>void;onAnswer:(choice:ConversationOption)=>void;
 children?:ReactNode;characterId?:string;
}
function reducedMotion():boolean{
 try{return window.matchMedia("(prefers-reduced-motion: reduce)").matches||
   localStorage.getItem("cyberpunk-tactical-rpg.settings.reduce-motion.v1")==="true";
 }catch{return false;}
}
export default function NpcDialoguePanel({
 page,pageIndex,totalPages,pages,onClose,onNext,onAnswer,children,characterId
}:Props){
 const motionReduced=useRef(reducedMotion()).current;
 const [settings,setSettings]=useState<CinematicPreferences>(readCinematicPreferences);
 const [visible,setVisible]=useState(motionReduced||settings.speed==="instant"?page.text.length:0);
 const [history,setHistory]=useState(false);
 const emotion=dialogueEmotion(page.text);
 const portrait=characterPortrait(page.speaker,page.role);
 const pendingChoice=Boolean(page.choices?.length)||Boolean(children);
 const mode=dialoguePresentation(page.speaker,page.role,totalPages,pendingChoice);
 const reduced=motionReduced||settings.reduceMotion;
 const generatedSceneId="dialogue:"+page.speaker.toLocaleLowerCase("pt-BR").normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")+":"+page.role
  .toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[^a-z0-9]+/g,"-");
 const sceneId=page.cinematicId??generatedSceneId;
 const changeSettings=(speed:CinematicPreferences["speed"])=>{
  setSettings(previous=>{
   const next={...previous,speed};saveCinematicPreferences(next);return next;
  });
 };
 useEffect(()=>{
  if(reduced||settings.speed==="instant"){setVisible(page.text.length);return;}
  setVisible(0);
  const timer=window.setInterval(()=>setVisible(value=>{
   if(value>=page.text.length){window.clearInterval(timer);return page.text.length;}
   return Math.min(page.text.length,value+3);
  }),textCharacterInterval(settings.speed));
  return ()=>window.clearInterval(timer);
 },[page.text,pageIndex,reduced,settings.speed]);
 useEffect(()=>setHistory(false),[page.text,pageIndex]);
 useEffect(()=>{
  if(mode==="cinematic"&&pageIndex===0)audioDirector.effect(portrait.tone==="eden"?"eden":"archive");
 },[mode,pageIndex,portrait.tone]);
 // Automatic playback only advances middle dialogue pages with no decision.
 // Last page, failure/reward gates and any choice always require manual action.
 useEffect(()=>{
  if(!settings.autoPlay||pendingChoice||history||
    visible<page.text.length||pageIndex+1>=totalPages)return;
  const timer=window.setTimeout(()=>onNext(),Math.max(1800,
    Math.min(5400,page.text.length*28)));
  return ()=>window.clearTimeout(timer);
 },[settings.autoPlay,pendingChoice,history,visible,page.text.length,
   pageIndex,totalPages,onNext]);
 const incomplete=visible<page.text.length;
 const record=()=>{if(mode==="cinematic"&&characterId)markCinematicSeen(characterId,sceneId);};
 const next=()=>{
  if(incomplete){setVisible(page.text.length);return;}
  if(pendingChoice)return; // No choice can be silently accepted or skipped.
  record();onNext();
 };
 const answer=(choice:ConversationOption)=>{
  record();onAnswer(choice); // Existing mission engine persists consequence.
 };
 return <div className="dialogue-scrim na-narrative-scrim" role="presentation"
  onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <section className={"dialogue-panel na-narrative-panel tone-"+portrait.tone+
    " cinematic-"+mode+(reduced?" motion-reduced":"")}
    role="dialog" aria-modal="true" aria-labelledby="dialogue-title"
    data-dialogue-ui="v20" data-emotion={emotion} data-cinematic-mode={mode}
    data-shot-index={pageIndex%2}
    onKeyDown={event=>{if(event.key==="Escape"){event.preventDefault();onClose();}}}>
   <header className="na-dialogue-top">
    <span>{mode==="cinematic"?"SEQUÊNCIA CINEMATOGRÁFICA":
      mode==="dramatic"?"CENA DRAMÁTICA":"INTERAÇÃO"} · NOVA ARCÁDIA
      <b> / {portrait.tone==="eden"?"REDE CENTRAL":"CANAL LOCAL"}</b></span>
    <div>
     <label className="na-dialogue-speed">Legendas
      <select aria-label="Velocidade do diálogo" value={settings.speed}
        onChange={event=>changeSettings(event.target.value as CinematicPreferences["speed"])}>
       <option value="slow">Lento</option><option value="normal">Normal</option>
       <option value="fast">Rápido</option><option value="instant">Instantâneo</option>
      </select></label>
     <button type="button" aria-pressed={history} onClick={()=>setHistory(x=>!x)}>
       {history?"Voltar à fala":"Histórico"}</button>
     <button type="button" aria-label="Encerrar conversa"
       className="na-dialogue-close" onClick={onClose}>✕</button>
    </div>
   </header>
   <div className="na-dialogue-main">
    <div className="na-dialogue-presence">
     <NarrativePortrait speaker={page.speaker} role={page.role} emotion={emotion}/>
     <small>{emotion==="concerned"?"PREOCUPAÇÃO":emotion==="suspicious"?"DESCONFIANÇA":
       emotion==="angry"?"TENSÃO":emotion==="resolute"?"DETERMINAÇÃO":"NEUTRO"}</small>
     {mode!=="simple"&&<div className="na-dialogue-shot-label">
      {pageIndex%2===0?"PLANO DE PERSONAGEM":"CONTRAPLANO"} · {pageIndex+1}/{totalPages}
     </div>}
    </div>
    <div className="na-dialogue-body">
     <div className="dialogue-head">
      <div><span className="eyebrow">{page.role}</span>
       <h2 id="dialogue-title">{page.speaker}</h2></div>
     </div>
     {history?<div className="na-dialogue-transcript" role="region" aria-label="Fala completa">
       {(pages??[page]).slice(0,pageIndex+1).map((item,i)=>
         <article key={i}><strong>{item.speaker} · FALA {i+1} / {totalPages}</strong>
         <p>{item.text}</p></article>)}
      </div>:<p className="na-dialogue-spoken" aria-label={page.text}
       onClick={incomplete?()=>setVisible(page.text.length):undefined}>
        {page.text.slice(0,visible)}
        {incomplete&&<span className="na-dialogue-caret" aria-hidden="true">▍</span>}
       </p>}
     <div className="na-dialogue-choices">
      {children}
      {page.choices&&<div className="dialogue-choice-list" role="group"
         aria-label="Respostas do protagonista">
        {page.choices.map((choice,i)=><button type="button" key={choice.id}
          onClick={()=>answer(choice)}>
          <span aria-hidden="true">{String(i+1).padStart(2,"0")}</span>{choice.label}
         </button>)}
       </div>}
     </div>
    </div>
   </div>
   <footer className="na-dialogue-footer">
    <span className="na-dialogue-cue">{incomplete?"Avançar revela a fala":
      pendingChoice?"Escolha uma resposta para registrar a decisão":
      "Resposta ou próxima fala"}</span>
    <button type="button" className="dialogue-continue"
      disabled={!incomplete&&pendingChoice} onClick={next}>
      {incomplete?"Revelar texto":pendingChoice?"Escolha uma resposta":
        pageIndex+1<totalPages?"Continuar":"Fechar diálogo"}<span>→</span>
    </button>
   </footer>
  </section>
 </div>;
}
