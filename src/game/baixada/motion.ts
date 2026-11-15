/** Cinemática pura do Android: deslocamento baseado em tempo e câmera com
 * amortecimento estável independente dos quadros renderizados.
 * A posição lógica e os bloqueios continuam sob responsabilidade do grid.
 */
export type ScreenPoint={x:number;y:number};
export function interpolateWalk(from:ScreenPoint,to:ScreenPoint,
 elapsedMs:number,durationMs:number):ScreenPoint{
 const fraction=Math.max(0,Math.min(1,Number.isFinite(elapsedMs)&&
  Number.isFinite(durationMs)&&durationMs>0?elapsedMs/durationMs:1));
 return {x:from.x+(to.x-from.x)*fraction,
  y:from.y+(to.y-from.y)*fraction};
}
export function smoothCamera(current:ScreenPoint,target:ScreenPoint,
 deltaMs:number):ScreenPoint{
 const elapsed=Math.max(0,Math.min(64,Number.isFinite(deltaMs)?deltaMs:0));
 const alpha=1-Math.exp(-elapsed/85);
 const next={x:current.x+(target.x-current.x)*alpha,
   y:current.y+(target.y-current.y)*alpha};
 if(Math.abs(next.x-target.x)<0.35)next.x=target.x;
 if(Math.abs(next.y-target.y)<0.35)next.y=target.y;
 return next;
}
