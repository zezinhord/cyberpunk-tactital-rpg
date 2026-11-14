/** Diagnóstico voluntário e local da prévia: não envia dados à rede.
 * Uma amostra a cada 10 s minimiza overhead e continua visível após sair.
 */
import type Phaser from "phaser";
import {readGraphicsMode} from "./performance";
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
