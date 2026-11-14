import {useEffect,useState} from "react";
import type {GameState} from "../game/types";
import type {TurnManager} from "../game/TurnManager";
import {SPECIAL_IDS,SPECIALS} from "../game/abilities/catalog";
import type {SpecialId} from "../game/abilities/catalog";
import {audioDirector} from "../audio/director";

type SkillOption={
 key:string;id:string;kind:"class"|"common"|"origin";
 name:string;description:string;cost:number;range:number;
 ready:boolean;status:string;
};
interface Props {
 manager:TurnManager;
 state:GameState;
 className:string;
 originDescription:string;
 onClose:()=>void;
}
export default function CombatAbilityPicker({manager,state,className,originDescription,onClose}:Props){
 const [selectedKey,setSelectedKey]=useState<string|null>(null);
 useEffect(()=>{
   const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();};
   window.addEventListener("keydown",onKey);
   return ()=>window.removeEventListener("keydown",onKey);
 },[onClose]);
 const classes:SkillOption[]=manager.getClassAbilities().map(skill=>{
   const check=manager.getClassAvailability(skill.id);
   return {key:"class:"+skill.id,id:skill.id,kind:"class",name:skill.name,
     description:skill.description,cost:skill.cost,range:skill.range,
     ready:check.available,status:check.available?"PRONTA":check.reason};
 });
 const common:SkillOption[]=SPECIAL_IDS.map(id=>{
   const skill=SPECIALS[id],check=manager.getSpecialAvailability(id);
   return {key:"common:"+id,id,kind:"common",name:skill.name,
     description:skill.description,cost:skill.cost,range:skill.range,
     ready:check.available,status:check.available?"PRONTA":check.reason};
 });
 const originReady=state.originAbilityAvailable&&state.activeSide==="player"&&!state.combatComplete;
 const origin:SkillOption={
   key:"origin",id:"origin",kind:"origin",name:state.originAbilityName,
   description:originDescription+" (uma utilização por confronto)",
   cost:0,range:0,ready:originReady,
   status:!state.originAbilityAvailable?"JÁ UTILIZADA"
     :state.combatComplete?"COMBATE ENCERRADO"
     :state.activeSide!=="player"?"AGUARDE SEU TURNO":"PRONTA",
 };
 const options=[...classes,...common,origin];
 const selected=options.find(skill=>skill.key===selectedKey)??null;
 const useSelected=()=>{
   if(!selected?.ready)return;
   audioDirector.effect("tech");
   if(selected.kind==="class")manager.activateClassAbility(selected.id);
   else if(selected.kind==="common")manager.activateSpecial(selected.id as SpecialId);
   else manager.activateOriginAbility();
   onClose();
 };
 const group=(heading:string,items:SkillOption[])=>(
   <section className="na-ability-picker-group">
     <h3>{heading}</h3>
     {items.length===0
      ? <p>Nenhuma técnica de classe disponível. Escolha uma classe na Central do Personagem.</p>
      : <div className="na-ability-picker-list">
       {items.map(skill=><button type="button" key={skill.key}
         className={"na-ability-choice"+(skill.key===selectedKey?" selected":"")}
         aria-pressed={skill.key===selectedKey} onClick={()=>setSelectedKey(skill.key)}>
         <span><strong>{skill.name}</strong><small>{skill.cost} EN · {skill.range===0?"EM SI MESMO":"ALC "+skill.range}</small></span>
         <em className={skill.ready?"ready":""}>{skill.status}</em>
       </button>)}
      </div>}
   </section>
 );
 return <div className="na-ability-overlay" role="presentation"
   onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
   <section className="na-ability-picker" role="dialog" aria-modal="true"
      aria-label="Escolher habilidades de combate">
     <header className="na-ability-picker-head">
       <div><span>CONTROLE TÁTICO · {className.toUpperCase()}</span><h2>Escolher habilidade</h2></div>
       <button type="button" aria-label="Fechar habilidades" onClick={onClose}>✕</button>
     </header>
     <p className="na-ability-picker-energy">Energia {state.energy}/{state.maxEnergy} ·
       {state.mainActionAvailable?" Ação principal disponível":" Ação principal já usada"}</p>
     <div className="na-ability-picker-content">
       {group("Técnicas da classe",classes)}
       {group("Habilidades comuns",common)}
       {group("Habilidade de origem", [origin])}
     </div>
     <div className="na-ability-picker-selected" aria-live="polite">
       {selected?<><strong>{selected.name}</strong>
         <p>{selected.description}</p>
         <small>{selected.kind==="origin"
           ?"A habilidade de origem é usada imediatamente."
           :selected.range===0?"Aplicada ao protagonista."
           :"Se estiver ao alcance, a habilidade será aplicada automaticamente ao inimigo da arena."}</small>
         <span className={selected.ready?"ready":""}>{selected.status}</span>
       </>:<p>Toque em uma habilidade para ler seus efeitos e depois confirme a utilização.</p>}
     </div>
     <footer className="na-ability-picker-actions">
       <button type="button" onClick={onClose}>Voltar ao combate</button>
       <button type="button" className="primary" onClick={useSelected}
         disabled={!selected?.ready}>Usar habilidade</button>
     </footer>
   </section>
 </div>;
}
