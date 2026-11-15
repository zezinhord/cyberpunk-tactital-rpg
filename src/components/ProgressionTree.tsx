import {useState} from "react";
import type {PlayerCharacter} from "../game/character/types";
import {getClassById,getClassSkills} from "../game/classes/registry";
import {STATS,STAT_IDS,GENERAL_PASSIVES,
 availableAttributePoints,availableSkillPoints,statRank,
 LEVEL_XP,skillPrerequisite,type StatId} from "../game/progression/tree";

export default function ProgressionTree({character,onAttribute,onSkill}:{
 character:PlayerCharacter;
 onAttribute:(id:StatId)=>string;
 onSkill:(id:string)=>string;
}){
 const [feedback,setFeedback]=useState("");
 const attributePoints=availableAttributePoints(character);
 const skillPoints=availableSkillPoints(character);
 const classSkills=getClassSkills(character.classId);
 const orderedSkills=[...classSkills].sort((a,b)=>a.minimumLevel-b.minimumLevel);
 const xpCurrent=character.experience;
 const next=LEVEL_XP[character.level]??null;
 return <div className="na-tree">
  <section className="na-tree-intro">
    <h4>Árvore do protagonista · Nível {character.level}</h4>
    <p>{next===null?"Nível máximo alcançado":xpCurrent+" / "+next+" XP para o próximo nível"}</p>
    <div className="na-tree-points">
      <strong>ATRIBUTOS: {attributePoints} PONTOS</strong>
      <strong>HABILIDADES: {skillPoints} PONTOS</strong>
    </div>
    <p>Ao subir de nível: +2 pontos de atributos e +2 de habilidades.
      Os efeitos comprados são permanentes e associados ao salvamento deste personagem.</p>
    {feedback&&<p className="na-tree-feedback" role="status">{feedback}</p>}
  </section>
  <section className="na-tree-section">
    <h4>1 · Atributos fundamentais</h4>
    <div className="na-tree-grid">
      {STAT_IDS.map(id=><article className="na-tree-node" key={id}>
        <div><strong>{STATS[id].name}</strong><span>{statRank(character,id)} / 5</span></div>
        <p>{STATS[id].description}</p>
        <button type="button" disabled={attributePoints<1||statRank(character,id)>=5}
          onClick={()=>setFeedback(onAttribute(id))}>+1 atributo · 1 ponto</button>
      </article>)}
    </div>
  </section>
  <section className="na-tree-section">
    <h4>2 · Técnicas de classe {character.classId?"— "+getClassById(character.classId).name:""}</h4>
    {!character.classId&&<p>Escolha uma classe na aba Personagem para desbloquear seu ramo exclusivo.</p>}
    <div className="na-tree-grid">
      {orderedSkills.map(skill=>{
        const owned=character.abilities.includes(skill.id);
        const prior=skillPrerequisite(skill.id);
        const locked=character.level<skill.minimumLevel||Boolean(prior&&!character.abilities.includes(prior));
        return <article className={"na-tree-node "+(owned?"unlocked":"")} key={skill.id}>
          <div><strong>{skill.name}</strong><span>Nível {skill.minimumLevel}</span></div>
          <p>{skill.description}</p>
          <small>{skill.cost} EN · Recarga {skill.cooldown} turnos
            {prior?" · Requer "+(orderedSkills.find(s=>s.id===prior)?.name??prior):""}</small>
          <button type="button" disabled={owned||locked||skillPoints<1}
            onClick={()=>setFeedback(onSkill(skill.id))}>
            {owned?"Desbloqueada":locked?"Bloqueada pelo nível/pré-requisito":"Comprar · 1 ponto"}
          </button>
        </article>;
      })}
    </div>
  </section>
  <section className="na-tree-section">
    <h4>3 · Passivas comuns</h4>
    <div className="na-tree-grid">
      {Object.entries(GENERAL_PASSIVES).map(([id,passive])=>{
        const owned=character.skills.includes(id);
        return <article className={"na-tree-node "+(owned?"unlocked":"")} key={id}>
          <div><strong>{passive.name}</strong><span>Nível {passive.minimumLevel}</span></div>
          <p>{passive.description}</p>
          <button type="button" disabled={owned||character.level<passive.minimumLevel||skillPoints<1}
            onClick={()=>setFeedback(onSkill(id))}>{owned?"Adquirida":"Comprar · 1 ponto"}</button>
        </article>;
      })}
    </div>
  </section>
 </div>;
}
