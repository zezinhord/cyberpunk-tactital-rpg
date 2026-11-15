import { useId, useState } from "react";
import { audioDirector, type SoundChannel } from "../audio/director";
import {RADIO_DISTRICTS,RADIO_MOODS,type RadioDistrict,type RadioMood} from "../audio/soundscapes";
import type {RadioStyle} from "../audio/curated";
const CHANNELS: readonly {id:SoundChannel;label:string;description:string}[] = [
 {id:"music",label:"Música",description:"Trilha eletrônica contextual"},
 {id:"effects",label:"Efeitos",description:"Passos, portas e combate"},
 {id:"ambient",label:"Ambiente",description:"Atividade urbana e máquinas"},
];
export default function AudioControls(){
 const uid=useId();
 const [radio,setRadio]=useState(()=>audioDirector.getRadioStatus());
 const [vol,setVol]=useState<Record<SoundChannel,number>>(()=>({
 music:audioDirector.getVolume("music"),effects:audioDirector.getVolume("effects"),ambient:audioDirector.getVolume("ambient")}));
 return <fieldset className="na-audio-settings"><legend>ÁUDIO · RÁDIO DE NOVA ARCÁDIA</legend>
  {CHANNELS.map(c=>{const id=uid+"-"+c.id,value=Math.round(vol[c.id]*100);
   return <label className="na-audio-row" key={id} htmlFor={id}>
    <span><strong>{c.label}</strong><small>{c.description}</small></span>
    <input id={id} aria-label={c.label} type="range" min={0} max={100} step={5} value={value}
      onChange={e=>{const n=Math.max(0,Math.min(1,Number(e.target.value)/100));
       setVol(v=>({...v,[c.id]:n}));audioDirector.setVolume(c.id,n);
       if(c.id==="effects")audioDirector.effect("interact");}}/>
    <output htmlFor={id}>{value}%</output>
   </label>;})}
  <div className="na-radio-settings" aria-label="Rádio de Nova Arcádia">
   <div><strong>RÁDIO DOS DISTRITOS</strong>
    <small>{radio.availableTracks} faixas locais · estilos urbanos, cyberpunk e tropical</small></div>
   <p>{radio.mode==="auto"?"DJ automático conforme distrito, situação e estilo.":"Sintonia manual de distrito e situação."}</p>
   <div className="na-radio-now-playing" role="status">
     <strong>TOCANDO AGORA</strong><span>{radio.trackName}</span>
     <small>{radio.trackArtist}</small>
   </div>
   <div className="na-radio-selector na-radio-style-row">
     <label>Estilo musical
       <select aria-label="Estilo de música" value={radio.style}
        onChange={e=>{
          audioDirector.setRadioStyle(e.target.value as RadioStyle);
          setRadio(audioDirector.getRadioStatus());
        }}>
         <option value="auto">Misto · música variada</option>
         <option value="cyberpunk">Cyberpunk / dark techno</option>
         <option value="tropical">Tropical / house / bossa</option>
         <option value="original">Trilha procedural original</option>
       </select>
     </label>
     <button type="button" className="na-radio-auto" onClick={()=>{
       audioDirector.nextSong();setRadio(audioDirector.getRadioStatus());
     }}>Próxima faixa ↻</button>
   </div>
   <div className="na-radio-selector">
    <label>Distrito
     <select value={radio.district} aria-label="Sintonia do distrito"
      onChange={e=>{
       audioDirector.setRadioStation(e.target.value as RadioDistrict,radio.mood);
       setRadio(audioDirector.getRadioStatus());
      }}>
      {RADIO_DISTRICTS.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
     </select>
    </label>
    <label>Faixa
     <select value={radio.mood} aria-label="Situação da trilha sonora"
      onChange={e=>{
       audioDirector.setRadioStation(radio.district,e.target.value as RadioMood);
       setRadio(audioDirector.getRadioStatus());
      }}>
      {RADIO_MOODS.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
     </select>
    </label>
   </div>
   <button type="button" className="na-radio-auto"
    disabled={radio.mode==="auto"} onClick={()=>{
     audioDirector.setRadioAutomatic();setRadio(audioDirector.getRadioStatus());
    }}>Voltar à trilha automática</button>
   <small>Faixas CC0 importadas na compilação, além da trilha original. Reprodução offline e sem anúncios; artistas e licenças nos créditos. Faixas NCS ainda não estão incluídas porque exigem autorização para jogos.</small>
  </div>
 </fieldset>;
}