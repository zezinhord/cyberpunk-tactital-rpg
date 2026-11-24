/** Diagnóstico voluntário e local da prévia: não envia dados à rede.
 * Uma amostra a cada 10 s minimiza overhead e continua visível após sair.
 */
import type Phaser from "phaser";
import {readGraphicsMode} from "./performance.ts";
export const PERFORMANCE_LOG_KEY="cyberpunk-tactical-rpg.performance-last.v1";
export type PerformanceReport={
 scene:string;fps:number;minimumFps:number;samples:number;
 mode:string;contextLost:boolean;capturedAt:string;
};
export function readPerformanceReport():PerformanceReport|null{
 try{
  const raw=globalThis.localStorage?.getItem(PERFORMANCE_LOG_KEY);
  if(!raw)return null;
  const value=JSON.parse(raw) as Partial<PerformanceReport>;
  if(typeof value.fps!=="number"||!Number.isFinite(value.fps)||
     typeof value.scene!=="string"||typeof value.minimumFps!=="number")return null;
  return value as PerformanceReport;
 }catch{return null;}
}
export function attachPerformanceDiagnostics(game:Phaser.Game,scene:string):()=>void{
 let samples=0,minimum=Infinity,contextLost=false;
 let disposed=false;
 const record=()=>{
  if(disposed)return;
  const fps=Math.round(game.loop?.actualFps??0);
  if(!Number.isFinite(fps)||fps<1)return;
  samples++;
  // Ignorar a primeira amostra de boot para não confundir carregamento de assets
  // com queda contínua durante a exploração.
  if(samples>1)minimum=Math.min(minimum,fps);
  const payload:PerformanceReport={
   scene,fps,minimumFps:Number.isFinite(minimum)?minimum:fps,samples,
   mode:readGraphicsMode(),contextLost,capturedAt:new Date().toISOString(),
  };
  try{globalThis.localStorage?.setItem(PERFORMANCE_LOG_KEY,JSON.stringify(payload));}catch{}
 };
 const onLost=()=>{
  contextLost=true;
  record();
 };
 game.canvas?.addEventListener("webglcontextlost",onLost);
 const interval=globalThis.setInterval(record,10000);
 return ()=>{
  disposed=true;
  globalThis.clearInterval(interval);
  game.canvas?.removeEventListener("webglcontextlost",onLost);
 };
}

/** Measure the ACTUAL Canvas 2D paints on Android without WebGL/Phaser.
 * A continuously scheduled requestAnimationFrame is not a rendered frame;
 * count only completed paints while the camera or hero is moving. Reset the
 * window after backgrounding or long idle pauses to avoid false 1 FPS reports.
 * Saves a small, local-only sample every ~3 seconds of active exploration.
 */
export function createCanvasPerformanceDiagnostics(scene:string){
 let first=0,last=0,frames=0,samples=0,minimum=Infinity,disposed=false;
 const clearWindow=()=>{first=0;last=0;frames=0;};
 return {
  frame(now:number,active:boolean):void{
   if(disposed||!Number.isFinite(now))return;
   if(!active){clearWindow();return;}
   if(!first||!last||now-last>400){
    first=now;last=now;frames=1;return;
   }
   frames++;
   last=now;
   const duration=now-first;
   if(duration<3000)return;
   const fps=Math.round((frames-1)*1000/duration);
   // Ignore startup/recovery intervals that contain too few real paints.
   if(frames>=12&&fps>0&&fps<=120){
    samples++;
    if(samples>1)minimum=Math.min(minimum,fps);
    const payload:PerformanceReport={
     scene,fps,minimumFps:Number.isFinite(minimum)?minimum:fps,
     samples,mode:readGraphicsMode(),contextLost:false,
     capturedAt:new Date().toISOString(),
    };
    try{globalThis.localStorage?.setItem(PERFORMANCE_LOG_KEY,JSON.stringify(payload));}catch{}
   }
   first=now;frames=1;
  },
  dispose():void{disposed=true;clearWindow();},
 };
}
