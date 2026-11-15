/** Paisagem sonora original de Nova Arcádia. A edição integral do APK
 * distribui 56 faixas Ogg/Opus locais, descarregadas ao trocar de estação.
 * Fallback procedural leve evita silêncio em dev/Chrome sem codec disponível.
 * Não há streaming remoto, anúncios ou telemetria.
 */
import {getSong,isRadioDistrict,isRadioMood,type RadioDistrict,
 type RadioMood} from "./soundscapes.ts";
import {chooseWithoutRepetition,curatedCandidates,isRadioStyle,
 type RadioStyle} from "./curated.ts";
export type SoundScene="menu"|"exploration"|"interior"|"battle"|"story";
export type SoundChannel="music"|"effects"|"ambient";
const KEY="cyberpunk-tactical-rpg.audio.v068.";
const DEFAULT: Record<SoundChannel,number>={music:0.28,effects:0.48,ambient:0.26};
const RADIO_KEY="cyberpunk-tactical-rpg.radio.v1.";
export type RadioMode="auto"|"manual";
function savedRadioValue(key:string):string|null{
 try{return globalThis.localStorage?.getItem(RADIO_KEY+key)??null;}
 catch{return null;}
}
function persistRadioValue(key:string,value:string):void{
 try{globalThis.localStorage?.setItem(RADIO_KEY+key,value);}catch{}
}
export interface RadioStatus{
 mode:RadioMode;district:RadioDistrict;mood:RadioMood;style:RadioStyle;
 playing:boolean;trackName:string;trackArtist:string;availableTracks:number;
}
export function readVolume(channel:SoundChannel):number {
  try { const raw=globalThis.localStorage?.getItem(KEY+channel);if(raw===null||raw===undefined)return DEFAULT[channel];const v=Number(raw);return Number.isFinite(v)&&v>=0&&v<=1?v:DEFAULT[channel]; }
  catch{return DEFAULT[channel];}
}
const SCORES: Record<SoundScene, {root:number;steps:readonly number[];speed:number}> = {
  menu:{root:110,steps:[0,7,3,10,7,3,0,5],speed:750},
  exploration:{root:98,steps:[0,5,7,3,0,10,5,3],speed:900},
  interior:{root:90,steps:[0,3,7,10],speed:1100},
  battle:{root:123,steps:[0,1,7,6,3,1,8,6],speed:360},
  story:{root:82,steps:[0,5,10,7],speed:1250},
};
class SynthDirector {
  private ctx:AudioContext|null=null;
  private outputs:Record<SoundChannel,GainNode>|null=null;
  private current:SoundScene="menu";
  private installed=false;
  private timer:number|null=null;
  private beat=0;
  private previousStep=0;
  private lastEffect=0;
  private soundtrack:HTMLAudioElement|null=null;
  private soundtrackURL="";
  private soundtrackBlocked=false;
  private district:RadioDistrict="baixada";
  private radioMode:RadioMode=savedRadioValue("mode")==="manual"?"manual":"auto";
  private radioDistrict:RadioDistrict=isRadioDistrict(savedRadioValue("district"))
    ?savedRadioValue("district") as RadioDistrict:"baixada";
  private radioMood:RadioMood=isRadioMood(savedRadioValue("mood"))
    ?savedRadioValue("mood") as RadioMood:"exploracao";
  private rotation=0;
  private style:RadioStyle=isRadioStyle(savedRadioValue("style"))?
    savedRadioValue("style") as RadioStyle:"auto";
  private licensed=new Set<string>();
  private failedLicensed=new Set<string>();
  private history:string[]=[];
  private playingName="";
  private playingArtist="Nova Arcádia";
  private selectedLicensedId="";
  private musicFadeToken=0;
  private readonly radioListeners=new Set<(status:RadioStatus)=>void>();
  private readonly volumes:{[K in SoundChannel]:number}={
    music:readVolume("music"),effects:readVolume("effects"),ambient:readVolume("ambient"),
  };
  install():void {
    if(typeof window==="undefined"||this.installed)return;
    this.installed=true;
    const unlock=()=>{this.activate();window.removeEventListener("pointerdown",unlock);window.removeEventListener("keydown",unlock);};
    window.addEventListener("pointerdown",unlock,{once:true,passive:true});
    window.addEventListener("keydown",unlock,{once:true});
  }
  private activate():void {
    if(this.ctx){void this.ctx.resume();return;}
    try{
      this.ctx=new AudioContext();
      const output=this.ctx.createDynamicsCompressor();
      output.threshold.value=-17;output.ratio.value=6;
      output.connect(this.ctx.destination);
      this.outputs={music:this.ctx.createGain(),effects:this.ctx.createGain(),ambient:this.ctx.createGain()};
      for(const key of ["music","effects","ambient"] as const){
        this.outputs[key].gain.value=this.volumes[key];
        this.outputs[key].connect(output);
      }
      try{
        const audio=new Audio();
        audio.preload="none";
        audio.loop=false;
        audio.volume=this.volumes.music*0.65;
        audio.onended=()=>{
          this.rotation++;
          this.soundtrackURL="";
          this.switchTrack();
        };
        audio.onerror=()=>{
          if(this.selectedLicensedId){
            this.failedLicensed.add(this.selectedLicensedId);
            this.soundtrackURL="";
            this.selectedLicensedId="";
            this.switchTrack();
            return;
          }
          this.soundtrackBlocked=true;
          this.startScore();
        };
        this.soundtrack=audio;
      }catch{/* Fallback síntese procedural. */}
      this.switchTrack();
      // Somente arquivos locais: os originais continuam funcionando offline caso
      // a importação CC0 não exista na versão de desenvolvimento.
      void fetch("/assets/music/catalog.json",{cache:"force-cache"}).then(response=>{
        if(!response.ok)throw Error("Sem catálogo CC0");
        return response.json() as Promise<{items?:{id:string}[]}>;
      }).then(catalog=>{
        this.licensed=new Set((catalog.items??[]).map(item=>item.id));
        if(this.licensed.size&&this.style!=="original")this.nextSong();
        this.notifyRadio();
      }).catch(()=>{/* Mantém trilha local original. */});
    }catch{this.ctx=null;this.outputs=null;}
  }
  subscribeRadio(listener:(status:RadioStatus)=>void):()=>void{
    this.radioListeners.add(listener);
    listener(this.getRadioStatus());
    return ()=>{this.radioListeners.delete(listener);};
  }
  private notifyRadio():void{
    if(this.radioListeners.size===0)return;
    const state=this.getRadioStatus();
    for(const listener of this.radioListeners)listener(state);
  }
  getVolume(channel:SoundChannel):number{return this.volumes[channel];}
  setVolume(channel:SoundChannel,value:number):void {
    const v=Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
    this.volumes[channel]=v;
    try{globalThis.localStorage?.setItem(KEY+channel,String(v));}catch{}
    const ctx=this.ctx,g=this.outputs?.[channel];
    if(ctx&&g)g.gain.setTargetAtTime(v,ctx.currentTime,0.055);
    if(channel==="music"&&this.soundtrack){
      this.soundtrack.volume=v*.65;
      if(v===0)this.soundtrack.pause();
      else if(this.soundtrack.paused)this.switchTrack();
      this.notifyRadio();
    }
  }
  setScene(scene:SoundScene):void {
    if(scene===this.current)return;
    this.current=scene;
    this.beat=0;this.rotation++;
    this.switchTrack();
  }
  setDistrict(district:RadioDistrict):void{
    if(this.district===district)return;
    this.district=district;
    if(this.radioMode==="auto"){
      this.rotation++;
      this.switchTrack();
    }
  }
  getRadioStatus():RadioStatus{
    const district=this.radioMode==="manual"?this.radioDistrict:this.district;
    const mood=this.radioMode==="manual"?this.radioMood:this.automaticMood();
    return {mode:this.radioMode,district,mood,style:this.style,
      playing:!!this.soundtrack&&!this.soundtrack.paused&&!this.soundtrackBlocked,
      trackName:this.playingName||getSong(district,mood).name,
      trackArtist:this.playingArtist,availableTracks:56+this.licensed.size};
  }
  setRadioStation(district:RadioDistrict,mood:RadioMood):void{
    if(!isRadioDistrict(district)||!isRadioMood(mood))return;
    this.radioMode="manual";
    this.radioDistrict=district;this.radioMood=mood;
    persistRadioValue("mode","manual");
    persistRadioValue("district",district);
    persistRadioValue("mood",mood);
    this.rotation++;this.switchTrack();
  }
  setRadioStyle(style:RadioStyle):void{
    if(!isRadioStyle(style))return;
    this.style=style;
    persistRadioValue("style",style);
    this.nextSong();
  }
  nextSong():void{
    this.rotation++;
    this.soundtrackURL="";
    this.switchTrack();
  }
  setRadioAutomatic():void{
    this.radioMode="auto";
    persistRadioValue("mode","auto");
    this.rotation++;this.switchTrack();
  }
  private automaticMood():RadioMood{
    const moods:readonly RadioMood[]=this.current==="menu"
      ? ["abertura","memorias"]
      : this.current==="battle" ? ["confronto","perseguicao"]
      : this.current==="story" ? ["revelacao","memorias"]
      : this.current==="interior" ? ["investigacao","contatos"]
      : ["exploracao","contatos","investigacao","memorias"];
    return moods[this.rotation%moods.length]??"exploracao";
  }
  private stopSynthScore():void{
    if(this.timer!==null&&typeof window!=="undefined")window.clearInterval(this.timer);
    this.timer=null;
  }
  private switchTrack():void{
    if(!this.ctx||!this.soundtrack)return;
    const district=this.radioMode==="manual"?this.radioDistrict:this.district;
    const mood=this.radioMode==="manual"?this.radioMood:this.automaticMood();
    const legacy=getSong(district,mood);
    const pool=curatedCandidates(district,mood,this.style,
      new Set([...this.licensed].filter(id=>!this.failedLicensed.has(id))));
    const chosen=chooseWithoutRepetition(pool,this.history,Math.random());
    const selected=chosen??null;
    const url=selected?.url??legacy.url;
    const audio=this.soundtrack;
    if(this.soundtrackURL!==url){
      audio.pause();
      this.musicFadeToken++;
      audio.src=url;
      this.soundtrackURL=url;
      this.soundtrackBlocked=false;
      this.selectedLicensedId=selected?.id??"";
      this.playingName=selected?.name??legacy.name;
      this.playingArtist=selected?.artist??"Trilha original de Nova Arcádia";
      this.history=[...this.history.filter(existing=>existing!==url),url].slice(-4);
      audio.volume=0;
    }
    this.notifyRadio();
    if(this.volumes.music===0){audio.pause();this.stopSynthScore();return;}
    try{
      const token=++this.musicFadeToken;
      const promise=audio.play();
      if(promise)void promise.then(()=>{
        if(this.soundtrack!==audio||audio.paused)return;
        this.stopSynthScore();
        const start=performance.now();
        const fade=()=>{
          if(token!==this.musicFadeToken||audio.paused)return;
          const ratio=Math.min(1,(performance.now()-start)/700);
          audio.volume=Math.max(0,Math.min(1,this.volumes.music*0.65*ratio));
          if(ratio<1)requestAnimationFrame(fade);
        };
        requestAnimationFrame(fade);
      }).catch(()=>{
        this.soundtrackBlocked=true;
        this.startScore();
      });
    }catch{
      this.soundtrackBlocked=true;
      this.startScore();
    }
  }
  private tone(channel:SoundChannel,freq:number,duration:number,kind:OscillatorType,level:number):void {
    const ctx=this.ctx,output=this.outputs?.[channel];
    if(!ctx||!output||ctx.state!=="running")return;
    const t=ctx.currentTime;
    const g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002,level),t+0.035);
    g.gain.exponentialRampToValueAtTime(0.0001,t+Math.max(.065,duration));
    const osc=ctx.createOscillator();osc.type=kind;osc.frequency.setValueAtTime(freq,t);
    osc.connect(g);g.connect(output);osc.start(t);osc.stop(t+Math.max(.08,duration)+.05);
    osc.onended=()=>{osc.disconnect();g.disconnect();};
  }
  private startScore():void {
    if(typeof window==="undefined"||!this.ctx)return;
    this.stopSynthScore();
    if(this.soundtrack&&!this.soundtrack.paused)return;
    const score=SCORES[this.current];
    this.timer=window.setInterval(()=>{
      const cur=SCORES[this.current];
      const step=cur.steps[this.beat++%cur.steps.length]??0;
      const fundamental=cur.root*Math.pow(2,step/12);
      this.tone("music",fundamental,cur.speed/850,"triangle",0.11);
      if(this.beat%4===1)this.tone("music",cur.root/2,cur.speed/600,"sine",0.09);
      if(this.beat%2===0)this.tone("ambient",this.current==="battle"?58:46,0.5,"sine",0.09);
    },score.speed);
  }
  effect(kind:"step"|"door"|"terminal"|"interact"|"hit"|"tech"|"victory"):void {
    if(!this.ctx)return;
    const now=Date.now();
    if(kind==="step"&&now-this.previousStep<170)return;
    if(now-this.lastEffect<45)return;
    this.lastEffect=now;
    if(kind==="step")this.previousStep=now;
    const defs:Record<typeof kind,[number,number,OscillatorType,number]>={
      step:[83,.075,"triangle",.16],door:[160,.27,"sawtooth",.12],
      terminal:[590,.22,"sine",.16],interact:[340,.11,"triangle",.11],
      hit:[114,.18,"sawtooth",.22],tech:[740,.26,"square",.09],
      victory:[440,.45,"sine",.23],
    };
    const [f,d,w,a]=defs[kind];
    this.tone("effects",f,d,w,a);
    if(kind==="tech"||kind==="victory")this.tone("effects",f*1.5,d*.8,"sine",a*.65);
  }
}
export const audioDirector=new SynthDirector();
