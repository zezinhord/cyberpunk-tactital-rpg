import {useMemo,useState} from "react";
import type {PlayerCharacter} from "../game/character/types.ts";
import {readCinematicHistory} from "../game/story/cinematic-engine.ts";
import {CINEMATIC_ARRIVAL_AREAS,arrivalForArea} from "../game/story/cinematic-arrivals.ts";
import {CINEMATIC_CONTACT_IDS,firstContactCinematic} from "../game/story/cinematic-contacts.ts";
import {CINEMATIC_BATTLE_IDS,battleIntroFor} from "../game/story/cinematic-battles.ts";
import {BATTLE_AFTERMATH_IDS,battleAftermathFor} from "../game/story/battle-aftermath.ts";
import NpcDialoguePanel,{type DialoguePageProps} from "./NpcDialoguePanel";
import "../cinematic-archive.css";

interface RecordedScene{
 id:string;category:"arrival"|"contact"|"battle"|"aftermath";title:string;
 speaker:string;role:string;portrait:string;text:string;
}
/** The archive is READ-ONLY. It uses only canonical dialogue from scenes
 * recorded in this character's history, never reveals unseen chapters and
 * never awards XP, changes a mission or writes a new cinematic receipt.
 */
export function recordedScenes(character:PlayerCharacter):readonly RecordedScene[]{
 const available=new Map<string,RecordedScene>();
 for(const area of CINEMATIC_ARRIVAL_AREAS){
  const scene=arrivalForArea(area);
  if(scene)available.set(scene.id,{id:scene.id,category:"arrival",
   title:scene.title,speaker:scene.speaker,role:scene.role,
   portrait:scene.portrait,text:scene.text});
 }
 for(const id of CINEMATIC_CONTACT_IDS){
  const scene=firstContactCinematic(id);
  if(scene)available.set(scene.cinematicId,{
   id:scene.cinematicId,category:"contact",
   title:scene.speaker,speaker:scene.speaker,role:scene.role,
   portrait:scene.portrait,text:scene.text});
 }
 for(const id of CINEMATIC_BATTLE_IDS){
  const scene=battleIntroFor(id,character);
  if(scene)available.set(scene.cinematicId,{
   id:scene.cinematicId,category:"battle",
   title:scene.role.replace("ABERTURA DE CONFRONTO · ",""),
   speaker:scene.speaker,role:scene.role,portrait:scene.portrait,text:scene.text});
 }
 for(const encounter of BATTLE_AFTERMATH_IDS){
  const scene=battleAftermathFor(encounter,character);
  if(scene)available.set(scene.cinematicId,{
   id:scene.cinematicId,category:"aftermath",title:scene.title,
   speaker:scene.speaker,role:scene.role,
   portrait:scene.portrait,text:scene.text});
 }
 const seen=new Set(readCinematicHistory(character.id));
 return [...available.values()].filter(scene=>seen.has(scene.id));
}
function replayPages(scene:RecordedScene):DialoguePageProps[]{
 const dot=scene.text.indexOf(". ");
 const split=dot>32&&dot<scene.text.length-38;
 const texts=split?[scene.text.slice(0,dot+1),scene.text.slice(dot+2)]:[scene.text];
 return texts.map(text=>({speaker:scene.speaker,role:scene.role,
  portrait:scene.portrait,text,cinematicId:scene.id}));
}
const LABELS:Readonly<Record<RecordedScene["category"],string>>={
 arrival:"CHEGADA AO DISTRITO",contact:"PRIMEIRO CONTATO",
 battle:"ANTES DO COMBATE",aftermath:"DESFECHO DE CONFRONTO",
};
export default function CinematicArchive({character}:{character:PlayerCharacter}){
 const scenes=useMemo(()=>recordedScenes(character),[character]);
 const [selected,setSelected]=useState<RecordedScene|null>(null);
 const [pageIndex,setPageIndex]=useState(0);
 const pages=selected?replayPages(selected):[];
 const open=(scene:RecordedScene)=>{setSelected(scene);setPageIndex(0);};
 const next=()=>{
  if(pageIndex<pages.length-1)setPageIndex(index=>index+1);
  else setSelected(null);
 };
 return <section className="na-cinema-archive" data-cinema-archive="read-only"
  aria-label="Arquivo de cenas narrativas já descobertas">
  <header>
   <span className="menu-panel-kicker">REGISTROS VISUAIS · PERSONAGEM ATUAL</span>
   <h3>Memórias de Nova Arcádia</h3>
   <p>Reveja cenas de locais, encontros e confrontos que este protagonista já
    descobriu. O replay não concede XP, itens, pontos de honra ou novas escolhas.</p>
   <strong>{scenes.length} registros recuperados</strong>
  </header>
  {scenes.length===0?<p role="status">Nenhuma dessas cenas foi descoberta neste
    personagem. Explore os distritos e converse com seus contatos.</p>:
   <div className="na-cinema-archive-grid">
    {scenes.map(scene=><button key={scene.id} type="button"
     onClick={()=>open(scene)} aria-label={"Rever: "+scene.title}>
      <small>{LABELS[scene.category]}</small>
      <strong>{scene.title}</strong>
      <span>{scene.speaker}</span>
      <em>Rever registro</em>
    </button>)}
   </div>}
  {selected&&pages[pageIndex]&&<div data-cinematic-replay="read-only">
   <NpcDialoguePanel page={pages[pageIndex]!} pageIndex={pageIndex}
    totalPages={pages.length} pages={pages}
    onClose={()=>setSelected(null)} onNext={next} onAnswer={()=>{}}/>
  </div>}
 </section>;
}
