/** Áudio 100% sintetizado durante execução; composição original Nova Arcádia.
 * Nenhum arquivo de terceiros e nenhum áudio remoto. Usuário controla 3 canais.
 */
export type SoundScene="menu"|"exploration"|"interior"|"battle"|"story";
export type SoundChannel="music"|"effects"|"ambient";
const KEY="cyberpunk-tactical-rpg.audio.v068.";
const DEFAULT: Record<SoundChannel,number>={music:0.28,effects:0.48,ambient:0.26};
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
      this.startScore();
    }catch{this.ctx=null;this.outputs=null;}
  }
  getVolume(channel:SoundChannel):number{return this.volumes[channel];}
  setVolume(channel:SoundChannel,value:number):void {
    const v=Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
    this.volumes[channel]=v;
    try{globalThis.localStorage?.setItem(KEY+channel,String(v));}catch{}
    const ctx=this.ctx,g=this.outputs?.[channel];
    if(ctx&&g)g.gain.setTargetAtTime(v,ctx.currentTime,0.055);
  }
  setScene(scene:SoundScene):void {
    if(scene===this.current)return;
    this.current=scene;
    this.beat=0;
    this.startScore();
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
    if(this.timer!==null)window.clearInterval(this.timer);
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
