import { useId, useState } from "react";
import { audioDirector, type SoundChannel } from "../audio/director";
import {RADIO_DISTRICTS,RADIO_MOODS,type RadioDistrict,type RadioMood} from "../audio/soundscapes";
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
 return <fieldset className="na-audio-settings"><legend>ÁUDIO · COMPOSIÇÃO ORIGINAL</legend>
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
    <small>56 faixas originais · sete distritos · reprodução individual</small></div>
   <p>{radio.mode==="auto"?"Trilha automática conforme o cenário.":"Sintonia manual ativa: "+radio.trackName}</p>
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
   <small>Arquivos de áudio inclusos no APK. Sem internet, anúncios ou transmissão de dados. O botão de Música acima controla o volume.</small>
  </div>
 </fieldset>;
}