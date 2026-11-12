import { useId, useState } from "react";
import { audioDirector, type SoundChannel } from "../audio/director";
const CHANNELS: readonly {id:SoundChannel;label:string;description:string}[] = [
 {id:"music",label:"Música",description:"Trilha eletrônica contextual"},
 {id:"effects",label:"Efeitos",description:"Passos, portas e combate"},
 {id:"ambient",label:"Ambiente",description:"Atividade urbana e máquinas"},
];
export default function AudioControls(){
 const uid=useId();
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
 </fieldset>;
}