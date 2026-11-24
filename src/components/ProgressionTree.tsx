import {useState} from "react";
import type {PlayerCharacter} from "../game/character/types";
import {ALL_CLASS_SKILLS,CLASS_IDS,getClassById,getClassBranches,type ClassId} from "../game/classes/registry";
import {getHybridArchetype,effectiveSkillMinimumLevel,effectiveSkillMaxRank,
 MULTICLASS_UNLOCK_LEVEL,MULTICLASS_SKILL_COST} from "../game/classes/hybrids.ts";
import {STATS,STAT_IDS,GENERAL_PASSIVES,MAX_STAT_RANK,
 availableAttributePoints,availableSkillPoints,statRank,statBreakdown,getSkillRank,
 levelExperienceProgress,masteryExperienceProgress,influenceTrustBonus,
 skillPrerequisite,combatProgression,skillEffectPreview,type StatId} from "../game/progression/tree";

export default function ProgressionTree({character,onAttribute,onSkill,onMulticlass}:{
 character:PlayerCharacter;
 onAttribute:(id:StatId)=>string;
 onSkill:(id:string)=>string;
 onMulticlass:(id:ClassId)=>string;
}){
 const [section,setSection]=useState<"attributes"|"skills">("attributes");
 const [feedback,setFeedback]=useState("");
 const [pendingSecondary,setPendingSecondary]=useState<ClassId|null>(null);
 const [skillTrack,setSkillTrack]=useState<"primary"|"secondary">("primary");
 const attributePoints=availableAttributePoints(character);
 const skillPoints=availableSkillPoints(character);
 const xpProgress=levelExperienceProgress(character);
 const mastery=masteryExperienceProgress(character);
 const displayedClass=skillTrack==="secondary"&&character.multiclassId?
   character.multiclassId:character.classId;
 const branches=getClassBranches(displayedClass);
 const previewArchetype=getHybridArchetype(character.classId,pendingSecondary);
 const currentArchetype=getHybridArchetype(character.classId,character.multiclassId);
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
      "Limite de atributo";
 };
 return <div className="na-tree" aria-label="Evolução de personagem">
   <header className="na-tree-intro">
     <div className="na-tree-summary">
       <div><small>OPERATIVO · EVOLUÇÃO</small><h4>Nível {character.level} · {character.classId?getClassById(character.classId).name:"Classe pendente"}
         {character.multiclassId?" + "+getClassById(character.multiclassId).name:""}</h4>
         {currentArchetype&&<small>ARQUÉTIPO · {currentArchetype.name}</small>}</div>
       <div className="na-tree-points"><strong>ATR {attributePoints}</strong><strong>HAB {skillPoints}</strong></div>
     </div>
     <p>{xpProgress.nextLevel===null?
        "Nível 10 · Maestria "+mastery.points+"/"+mastery.cap+" · "+
        (mastery.points===mastery.cap?
          "Especialização máxima alcançada":
          "faltam "+mastery.remaining+" XP para +1 ponto de habilidade"):
        character.experience+" XP totais · "+xpProgress.earned+" / "+
         xpProgress.required+" XP neste nível · faltam "+xpProgress.remaining+
         " XP para o nível "+xpProgress.nextLevel}</p>
     <div className="na-tree-xp-track" role="progressbar" aria-valuemin={0}
       aria-valuemax={xpProgress.nextLevel===null?mastery.required:xpProgress.required||1}
       aria-valuenow={xpProgress.nextLevel===null?mastery.earned:xpProgress.earned}
       aria-label={xpProgress.nextLevel===null?"Progresso de maestria":"Progresso de XP do nível atual"}>
       <span style={{width:(xpProgress.nextLevel===null?mastery.percent:xpProgress.percent)+"%"}}/>
     </div>
     {xpProgress.nextLevel===null&&<small className="na-tree-mastery-note">
       A cada 450 XP após o nível 10, ganhe +1 ponto de habilidade (até 8).
       Seus atributos e níveis existentes permanecem inalterados.
     </small>}
     <div className="na-tree-tabs" role="group" aria-label="Seção de evolução">
       <button type="button" className={section==="attributes"?"selected":""}
         aria-pressed={section==="attributes"} onClick={()=>setSection("attributes")}>Atributos</button>
       <button type="button" className={section==="skills"?"selected":""}
         aria-pressed={section==="skills"} onClick={()=>setSection("skills")}>Habilidades de classe</button>
     </div>
     {feedback&&<p className="na-tree-feedback" role="status">{feedback}</p>}
   </header>
   {character.classId&&<section className="na-multiclass-panel" aria-label="Escolha de segunda classe">
     <div className="na-multiclass-head">
       <strong>CARREIRA HÍBRIDA · {character.multiclassId?"2/2 CLASSES":"1/2 CLASSES"}</strong>
       <small>Uma classe secundária no máximo · sem atributos duplicados</small>
     </div>
     {character.multiclassId?
       <div className="na-multiclass-result">
         <strong>{getClassById(character.classId).name} + {getClassById(character.multiclassId).name}</strong>
         {currentArchetype&&<p>{currentArchetype.name} · {currentArchetype.bonusText}.
           Duas disciplinas, porém uma única ação principal, energia e recargas compartilhadas.</p>}
       </div>:
       <>
         <p>Desbloqueie uma segunda classe no nível {MULTICLASS_UNLOCK_LEVEL}
           por {MULTICLASS_SKILL_COST} pontos de habilidade. Ela recebe a técnica inicial,
           mas não seus bônus de atributos; as técnicas secundárias possuem grau máximo 2.</p>
         <div className="na-multiclass-actions">
           <label htmlFor="na-secondary-class">Segunda classe</label>
           <select id="na-secondary-class" value={pendingSecondary??""}
             onChange={event=>setPendingSecondary(event.target.value as ClassId||null)}>
             <option value="">Escolher classe secundária</option>
             {CLASS_IDS.filter(id=>id!==character.classId).map(id=>
               <option key={id} value={id}>{getClassById(id).name}</option>)}
           </select>
           <button type="button"
             disabled={!pendingSecondary||character.level<MULTICLASS_UNLOCK_LEVEL||
               skillPoints<MULTICLASS_SKILL_COST}
             onClick={()=>{if(pendingSecondary){
               const message=onMulticlass(pendingSecondary);
               setFeedback(message);
               setSkillTrack("secondary");
             }}}>
             {character.level<MULTICLASS_UNLOCK_LEVEL?"Exige nível 4":
              skillPoints<MULTICLASS_SKILL_COST?"Exige 2 HAB":
              "Confirmar multiclasse · 2 HAB"}
           </button>
         </div>
         {previewArchetype&&<p className="na-archetype-preview">
           <strong>{previewArchetype.name}</strong> · {previewArchetype.description}
           <small> Benefício: {previewArchetype.bonusText}</small>
         </p>}
       </>}
   </section>}
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
     {character.multiclassId&&<div className="na-tree-tabs na-hybrid-tabs" role="group" aria-label="Árvores de cada classe">
       <button type="button" className={skillTrack==="primary"?"selected":""}
         aria-pressed={skillTrack==="primary"} onClick={()=>setSkillTrack("primary")}>
         Principal · {getClassById(character.classId!).name}
       </button>
       <button type="button" className={skillTrack==="secondary"?"selected":""}
         aria-pressed={skillTrack==="secondary"} onClick={()=>setSkillTrack("secondary")}>
         Secundária · {getClassById(character.multiclassId).name}
       </button>
     </div>}
     <p>Três caminhos por classe; os mesmos pontos de habilidade são usados nas duas árvores.
       {skillTrack==="secondary"&&character.multiclassId?
         " Técnicas secundárias exigem níveis maiores e param no grau 2.":""}</p>
     {!character.classId&&<p>Escolha uma classe na aba Personagem para habilitar seus talentos.</p>}
     <div className="na-tree-branches">
       {branches.map(branch=><div className="na-tree-branch" key={branch.id}>
         <div className="na-tree-branch-heading"><h4>{branch.name}</h4><p>{branch.description}</p></div>
         {branch.skillIds.map((id,index)=>{
           const skill=ALL_CLASS_SKILLS[id];
           if(!skill)return null;
           const rank=getSkillRank(character,id);
           const prior=skillPrerequisite(id);
           const minimum=effectiveSkillMinimumLevel(character,skill);
           const needsLevel=rank>0?minimum+rank:minimum;
           const prereqLocked=Boolean(prior&&!character.abilities.includes(prior));
           const locked=character.level<needsLevel||prereqLocked;
           const rankCap=effectiveSkillMaxRank(character,skill);
           const maxed=rank>=rankCap;
           const start=skill.minimumLevel===1&&rank>=1;
           return <div className="na-tree-connected-node" key={id}>
             {index>0&&<div className="na-tree-connection" aria-hidden="true"><span>│</span><span>▼</span></div>}
             <article className={"na-tree-node "+(rank?"unlocked":"")+(locked?" locked":"")}>
               <div><strong><span aria-hidden="true">{skill.visual==="emp"?"⌁":skill.visual==="repair"?"✚":skill.visual==="shield"?"⬡":skill.visual==="move"?"➤":"⌖"}</span> {skill.name}</strong>
                 <small>GRAU {rank}/{rankCap}</small></div>
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
