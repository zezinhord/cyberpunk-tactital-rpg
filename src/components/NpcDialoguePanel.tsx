import {useEffect,useRef,useState,type ReactNode} from "react";
import NarrativePortrait,{characterPortrait,dialogueEmotion} from "./NarrativePortrait";
import type {ConversationOption} from "../game/dialogues/patio";
export interface DialoguePageProps{
 speaker:string;role:string;portrait:string;text:string;choices?:readonly ConversationOption[];
}
interface Props{
 page:DialoguePageProps;pageIndex:number;totalPages:number;
 onClose:()=>void;onNext:()=>void;onAnswer:(choice:ConversationOption)=>void;children?:ReactNode;
}
function reducedMotion():boolean{
 try{return window.matchMedia("(prefers-reduced-motion: reduce)").matches||
   localStorage.getItem("cyberpunk-tactical-rpg.settings.reduce-motion.v1")==="true";
 }catch{return false;}
}
export default function NpcDialoguePanel({page,pageIndex,totalPages,onClose,onNext,onAnswer,children}:Props){
 const motionReduced=useRef(reducedMotion()).current;
 const [visible,setVisible]=useState(motionReduced?page.text.length:0);
 const [history,setHistory]=useState(false);
 const emotion=dialogueEmotion(page.text);
 const portrait=characterPortrait(page.speaker,page.role);
 useEffect(()=>{
  if(motionReduced){setVisible(page.text.length);return;}
  setVisible(0);
  const timer=window.setInterval(()=>setVisible(v=>{
   if(v>=page.text.length){window.clearInterval(timer);return page.text.length;}
   return Math.min(page.text.length,v+3);
  }),24);
  return ()=>window.clearInterval(timer);
 },[page.text,pageIndex,motionReduced]);
 useEffect(()=>setHistory(false),[page.text,pageIndex]);
 const incomplete=visible<page.text.length;
 const next=()=>incomplete?setVisible(page.text.length):onNext();
 return <div className="dialogue-scrim na-narrative-scrim" role="presentation"
  onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <section className={"dialogue-panel na-narrative-panel tone-"+portrait.tone} role="dialog"
   aria-modal="true" aria-labelledby="dialogue-title" data-dialogue-ui="v077"
   data-emotion={emotion} onKeyDown={event=>{if(event.key==="Escape"){event.preventDefault();onClose();}}}>
   <header className="na-dialogue-top">
    <span>INTERAÇÃO · NOVA ARCÁDIA <b>/ {portrait.tone==="eden"?"REDE CENTRAL":"CANAL LOCAL"}</b></span>
    <div>
     <button type="button" aria-pressed={history} onClick={()=>setHistory(x=>!x)}>
      {history?"Voltar à fala":"Histórico"}</button>
     <button type="button" aria-label="Encerrar conversa" className="na-dialogue-close" onClick={onClose}>✕</button>
    </div>
   </header>
   <div className="na-dialogue-main">
    <div className="na-dialogue-presence">
     <NarrativePortrait speaker={page.speaker} role={page.role} emotion={emotion}/>
     <small>{emotion==="concerned"?"PREOCUPAÇÃO":emotion==="suspicious"?"DESCONFIANÇA":
       emotion==="angry"?"TENSÃO":emotion==="resolute"?"DETERMINAÇÃO":"NEUTRO"}</small>
    </div>
    <div className="na-dialogue-body">
     <div className="dialogue-head">
      <div><span className="eyebrow">{page.role}</span><h2 id="dialogue-title">{page.speaker}</h2></div>
     </div>
     {history?<div className="na-dialogue-transcript" role="region" aria-label="Fala completa">
       <strong>FALA {pageIndex+1} / {totalPages}</strong><p>{page.text}</p>
      </div>:<p className="na-dialogue-spoken" aria-label={page.text}
       onClick={incomplete?()=>setVisible(page.text.length):undefined}>
       {page.text.slice(0,visible)}{incomplete&&<span className="na-dialogue-caret" aria-hidden="true">▍</span>}
      </p>}
     <div className="na-dialogue-choices">
      {children}
      {page.choices&&<div className="dialogue-choice-list" role="group" aria-label="Respostas do protagonista">
       {page.choices.map((choice,i)=><button type="button" key={choice.id} onClick={()=>onAnswer(choice)}>
        <span aria-hidden="true">{String(i+1).padStart(2,"0")}</span>{choice.label}
       </button>)}
      </div>}
     </div>
    </div>
   </div>
   <footer className="na-dialogue-footer">
    <span className="na-dialogue-cue">{incomplete?"Avançar revela a fala":"Resposta ou próxima fala"}</span>
    <button type="button" className="dialogue-continue" onClick={next}>
     {incomplete?"Revelar texto":pageIndex+1<totalPages?"Continuar":"Fechar diálogo"}<span>→</span>
    </button>
   </footer>
  </section>
 </div>;
}
