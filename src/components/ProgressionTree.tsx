import {useState} from "react";
import type {PlayerCharacter} from "../game/character/types";
import {ALL_CLASS_SKILLS,getClassById,getClassBranches} from "../game/classes/registry";
import {STATS,STAT_IDS,GENERAL_PASSIVES,MAX_STAT_RANK,
 availableAttributePoints,availableSkillPoints,statRank,statBreakdown,getSkillRank,
 levelExperienceProgress,influenceTrustBonus,skillPrerequisite,combatProgression,skillEffectPreview,type StatId} from "../game/progression/tree";

export default function ProgressionTree({character,onAttribute,onSkill}:{
 character:PlayerCharacter;
 onAttribute:(id:StatId)=>string;
 onSkill:(id:string)=>string;
}){
 const [section,setSection]=useState<"attributes"|"skills">("attributes");
 const [feedback,setFeedback]=useState("");
 const attributePoints=availableAttributePoints(character);
 const skillPoints=availableSkillPoints(character);
 const xpProgress=levelExperienceProgress(character);
 const branches=getClassBranches(character.classId);
 const statBefore=combatProgression(character);
 const preview=(id:StatId)=>{
   if(id==="influencia"){
     const current=statRank(character,id);
     const before=influenceTrustBonus(current);
     const after=influenceTrustBonus(Math.min(MAX_STAT_RANK,current+1));
     return "Confiança na Feira +"+after+" (atual +"+before+")"+
       (after===before?" · próximo marco no grau "+(current<3?3:5):"");
   }
   const upgraded={...character,attributes:{...character.attributes,
     [id]:(character.attributes[id]??0)+1}};
   const after=combatProgression(upgraded);
   const changes=[
    ["Vida",after.hp-statBefore.hp],["Ataque",after.attack-statBefore.attack],
    ["Defesa",after.armor-statBefore.armor],["Movimento",after.movement-statBefore.movement],
    ["Energia",after.energy-statBefore.energy]].filter(([,value])=>Number(value)>0);
   return changes.map(([name,value])=>name+" +"+value).join(" · ")||
      (id==="influencia"?"Maior influência nas negociações da Feira":"Limite de atributo");
 };
 return <div className="na-tree" aria-label="Evolução de personagem">
   <header className="na-tree-intro">
     <div className="na-tree-summary">
       <div><small>OPERATIVO · EVOLUÇÃO</small><h4>Nível {character.level} · {character.classId?getClassById(character.classId).name:"Classe pendente"}</h4></div>
       <div className="na-tree-points"><strong>ATR {attributePoints}</strong><strong>HAB {skillPoints}</strong></div>
     </div>
     <p>{xpProgress.nextLevel===null?
        "Nível máximo atingido · "+character.experience+" XP totais":
        character.experience+" XP totais · "+xpProgress.earned+" / "+
         xpProgress.required+" XP neste nível · faltam "+xpProgress.remaining+
         " XP para o nível "+xpProgress.nextLevel}</p>
     <div className="na-tree-xp-track" role="progressbar" aria-valuemin={0}
       aria-valuemax={xpProgress.required||1}
       aria-valuenow={xpProgress.nextLevel===null?1:xpProgress.earned}
       aria-label={xpProgress.nextLevel===null?"Nível máximo":"Progresso de XP do nível atual"}>
       <span style={{width:xpProgress.percent+"%"}}/>
     </div>
     <div className="na-tree-tabs" role="group" aria-label="Seção de evolução">
       <button type="button" className={section==="attributes"?"selected":""}
         aria-pressed={section==="attributes"} onClick={()=>setSection("attributes")}>Atributos</button>
       <button type="button" className={section==="skills"?"selected":""}
         aria-pressed={section==="skills"} onClick={()=>setSection("skills")}>Habilidades de classe</button>
     </div>
     {feedback&&<p className="na-tree-feedback" role="status">{feedback}</p>}
   </header>
   {section==="attributes"?<section className="na-tree-section">
     <h4>Atributos universais</h4>
     <p>Base + pontos investidos + origem + classe. Os bônus históricos de origem continuam válidos.</p>
     <div className="na-tree-grid">
       {STAT_IDS.map(id=>{
         const breakdown=statBreakdown(character,id);
         const canBuy=attributePoints>0&&statRank(character,id)<MAX_STAT_RANK;
         return <article className="na-tree-node" key={id}>
           <div><strong>{STATS[id].name}</strong><b>{breakdown.total} / {MAX_STAT_RANK}</b></div>
           <p>{STATS[id].description}</p>
           <small>Base {breakdown.base} · Investido +{breakdown.allocated}</small>
           <small>Origem +{breakdown.origin} · Classe +{breakdown.profession}</small>
           <span className="na-tree-preview">Próximo grau: {statRank(character,id)<MAX_STAT_RANK?preview(id):"Máximo alcançado"}</span>
           <button type="button" disabled={!canBuy} onClick={()=>setFeedback(onAttribute(id))}>
             {statRank(character,id)>=MAX_STAT_RANK?"Máximo":"Investir 1 ponto"}
           </button>
         </article>;
       })}
     </div>
     <h4>Passivas universais</h4>
     <div className="na-tree-grid">
       {Object.entries(GENERAL_PASSIVES).map(([id,passive])=>{
         const owned=character.skills.includes(id);
         const locked=character.level<passive.minimumLevel;
         return <article className={"na-tree-node "+(owned?"unlocked":"")} key={id}>
           <div><strong>{passive.name}</strong><small>NV {passive.minimumLevel}</small></div>
           <p>{passive.description}</p>
           <small>{owned?"Ativa permanentemente":locked?"Bloqueada pelo nível":"Custa 1 ponto de habilidade"}</small>
           <button type="button" disabled={owned||locked||skillPoints<1}
             onClick={()=>setFeedback(onSkill(id))}>{owned?"Adquirida":"Desbloquear · 1 HAB"}</button>
         </article>;
       })}
     </div>
   </section>:<section className="na-tree-section">
     <h4>Especializações exclusivas</h4>
     <p>Três caminhos por classe. Cada ligação mostra a exigência de desbloqueio; o grau das técnicas altera o efeito real no combate.</p>
     {!character.classId&&<p>Escolha uma classe na aba Personagem para habilitar seus talentos.</p>}
     <div className="na-tree-branches">
       {branches.map(branch=><div className="na-tree-branch" key={branch.id}>
         <div className="na-tree-branch-heading"><h4>{branch.name}</h4><p>{branch.description}</p></div>
         {branch.skillIds.map((id,index)=>{
           const skill=ALL_CLASS_SKILLS[id];
           if(!skill)return null;
           const rank=getSkillRank(character,id);
           const prior=skillPrerequisite(id);
           const needsLevel=rank>0?skill.minimumLevel+rank:skill.minimumLevel;
           const prereqLocked=Boolean(prior&&!character.abilities.includes(prior));
           const locked=character.level<needsLevel||prereqLocked;
           const maxed=rank>=skill.maxRank;
           const start=skill.minimumLevel===1&&rank>=1;
           return <div className="na-tree-connected-node" key={id}>
             {index>0&&<div className="na-tree-connection" aria-hidden="true"><span>│</span><span>▼</span></div>}
             <article className={"na-tree-node "+(rank?"unlocked":"")+(locked?" locked":"")}>
               <div><strong><span aria-hidden="true">{skill.visual==="emp"?"⌁":skill.visual==="repair"?"✚":skill.visual==="shield"?"⬡":skill.visual==="move"?"➤":"⌖"}</span> {skill.name}</strong>
                 <small>GRAU {rank}/{skill.maxRank}</small></div>
               <p>{skill.description}</p>
               <small>{skill.cost} energia · {skill.cooldown} turnos de recarga · alcance {skill.range}</small>
               <small>{prior?"Requer "+(ALL_CLASS_SKILLS[prior]?.name??prior):"Raiz independente da especialização"} · Nível {needsLevel}</small>
               {rank>0&&<span className="na-tree-preview">Grau atual: {skillEffectPreview(skill,rank)}</span>}
               {!maxed&&<span className="na-tree-preview">Próximo grau: {skillEffectPreview(skill,rank+1)}</span>}
               <button type="button" disabled={maxed||locked||skillPoints<1}
                 onClick={()=>setFeedback(onSkill(id))}>
                 {maxed?"Grau máximo":locked?"Bloqueada":start?"Aprimorar · 1 HAB":rank?"Elevar grau · 1 HAB":"Desbloquear · 1 HAB"}
               </button>
             </article>
           </div>;
         })}
       </div>)}
     </div>
   </section>}
 </div>;
}
