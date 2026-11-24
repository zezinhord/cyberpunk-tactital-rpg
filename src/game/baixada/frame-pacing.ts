/** Fractional Canvas 2D frame pacing for Android screens.
 * Browser requestAnimationFrame on 60 Hz displays reports ~16.66667 ms.
 * Comparing to rounded 16.67 / 33.34 accidentally halves the frame rate.
 *
 * Carry the fractional deadline forward, avoiding cumulative drift on
 * 90/120 Hz screens. Drop accumulated catch-up after a long WebView stall.
 */
export type CanvasTargetFps=30|60;
export function canvasFrameDeadline(now:number,lastPaint:number,
 targetFps:CanvasTargetFps):{due:boolean;nextAt:number}{
 if(!Number.isFinite(now)||now<0)return {due:false,nextAt:lastPaint};
 const interval=1000/targetFps;
 if(!Number.isFinite(lastPaint)||lastPaint<=0||now<lastPaint)
  return {due:true,nextAt:now};
 const elapsed=now-lastPaint;
 // Tolerate sub-millisecond rAF timestamp rounding. Without this,
 // 33.333ms (60 Hz / 2) never clears a rounded 33.34ms threshold.
 if(elapsed<interval-0.8)return {due:false,nextAt:lastPaint};
 if(elapsed>interval*2.5)return {due:true,nextAt:now};
 return {due:true,nextAt:lastPaint+interval};
}
