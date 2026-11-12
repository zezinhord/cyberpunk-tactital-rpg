import { getAllClasses,CLASS_SKILLS,type ClassId } from "../game/classes/registry";

/** Componente compartilhado entre criação e migração de protagonistas antigos.
 * Independente da origem e da apresentação corporal.
 */
export default function ClassSelection({value,onChange,compact=false}:{
 value:ClassId|null;onChange:(next:ClassId)=>void;compact?:boolean;
}){
 const selected=getAllClasses().find(c=>c.id===value);
 const ability=selected?CLASS_SKILLS[selected.startingAbilities[0]??""]:null;
 return <section className="class-selection" aria-label="Seleção das onze classes oficiais">
   <div className="section-heading">
     <div><p className="eyebrow">CLASSE MECÂNICA · INDEPENDENTE DA ORIGEM</p>
       <h2>Qual é sua especialização?</h2></div>
     <span className="selection-count">11 classes</span>
   </div>
   <div className={"class-grid"+(compact?" compact":"")} role="group" aria-label="Classes disponíveis">
     {getAllClasses().map((entry,i)=><button type="button" key={entry.id}
       className={"class-option"+(value===entry.id?" selected":"")}
       aria-pressed={value===entry.id} onClick={()=>onChange(entry.id)}>
       <span className="class-index">{String(i+1).padStart(2,"0")} · {entry.role.toUpperCase()}</span>
       <strong>{entry.name}</strong>
       <small>{entry.alias??entry.specialties.join(" · ")}</small>
     </button>)}
   </div>
   {selected&&<article className="class-selection-detail" aria-live="polite">
      <strong>{selected.name} · {selected.role}</strong>
      <p>{selected.description}</p>
      <p><b>Exploração:</b> {selected.explorationFocus} · <b>Limite:</b> {selected.strategicLimit}</p>
      {ability&&<p className="class-skill-preview"><b>Habilidade inicial: {ability.name}</b>
        {" — "}{ability.description} <small>Energia {ability.cost}; recarga {ability.cooldown} turnos.</small></p>}
      <small>Passivas, especiais de alto impacto e progressão serão ampliadas na 0.6.9.</small>
   </article>}
   {!selected&&<p className="validation-note">Selecione uma classe para habilitar o protagonista. Sua origem pode ser qualquer uma das seis disponíveis.</p>}
 </section>;
}
