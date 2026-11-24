/** Camera-only controls for the existing 8×8 turn-based battle.
 * They never modify movement ranges, enemy positions or game saves.
 */
export interface TacticalViewport{zoom:number;panX:number;panY:number}
export const DEFAULT_TACTICAL_VIEWPORT:Readonly<TacticalViewport>={
 zoom:1,panX:0,panY:0,
};
const WIDTH=480,HEIGHT=320,MIN_ZOOM=1,MAX_ZOOM=1.8;
const clamp=(n:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,n));
export function normalizeTacticalViewport(raw:TacticalViewport):TacticalViewport{
 const zoom=Number.isFinite(raw.zoom)?clamp(raw.zoom,MIN_ZOOM,MAX_ZOOM):1;
 const maxX=WIDTH*(1-1/zoom)/2,maxY=HEIGHT*(1-1/zoom)/2;
 return {
  zoom:Math.round(zoom*100)/100,
  panX:Number.isFinite(raw.panX)?clamp(raw.panX,-maxX,maxX):0,
  panY:Number.isFinite(raw.panY)?clamp(raw.panY,-maxY,maxY):0,
 };
}
export function zoomTacticalViewport(current:TacticalViewport,delta:number):TacticalViewport{
 return normalizeTacticalViewport({
  ...current,zoom:current.zoom+delta,
 });
}
export function panTacticalViewport(
 current:TacticalViewport,screenDeltaX:number,screenDeltaY:number,
):TacticalViewport{
 if(current.zoom<=1)return {...DEFAULT_TACTICAL_VIEWPORT};
 return normalizeTacticalViewport({
  ...current,
  panX:current.panX-screenDeltaX/current.zoom,
  panY:current.panY-screenDeltaY/current.zoom,
 });
}
export function tacticalViewBox(view:TacticalViewport):string{
 const v=normalizeTacticalViewport(view);
 const width=WIDTH/v.zoom,height=HEIGHT/v.zoom;
 const x=WIDTH/2+v.panX-width/2,y=HEIGHT/2+v.panY-height/2;
 return [x,y,width,height].map(n=>Number(n.toFixed(2))).join(" ");
}
