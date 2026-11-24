import assert from "node:assert/strict";
import {smoothCamera,interpolateWalk,completedStepAt} from "../src/game/baixada/motion.ts";
import {canvasFrameDeadline} from "../src/game/baixada/frame-pacing.ts";
const p={x:130,y:80},q={x:280,y:140};
assert.deepEqual(interpolateWalk(p,q,-100,150),p);
assert.deepEqual(interpolateWalk(p,q,150,150),q);
assert.deepEqual(interpolateWalk(p,q,300,150),q);
assert.deepEqual(interpolateWalk(p,q,75,150),{x:205,y:110});
assert.deepEqual(interpolateWalk(p,q,0,0),q);
assert.deepEqual(smoothCamera(p,q,0),p);
const first=smoothCamera(p,q,16.67);
assert.ok(first.x>p.x&&first.x<q.x);
assert.ok(first.y>p.y&&first.y<q.y);
let camera30=p,camera60=p;
for(let i=0;i<60;i++)camera30=smoothCamera(camera30,q,16.67);
for(let i=0;i<30;i++)camera60=smoothCamera(camera60,q,33.34);
assert.ok(Math.abs(camera30.x-q.x)<.5);
assert.ok(Math.abs(camera60.x-q.x)<.5);
assert.ok(Math.abs(camera30.x-camera60.x)<.5);
assert.deepEqual(smoothCamera(q,q,33),q);
// Crossing a tile boundary at t=178ms must not delay the next tile until 178.
assert.equal(completedStepAt(0,150,178),150);
assert.equal(completedStepAt(150,195,360),345);
assert.equal(completedStepAt(150,195,344),null);
assert.equal(completedStepAt(0,150,149),null);
assert.equal(completedStepAt(0,0,100),null);
assert.equal(completedStepAt(0,150,Number.NaN),null);
assert.equal(completedStepAt(Number.POSITIVE_INFINITY,150,180),null);
// A 60 Hz browser produces timestamps of 16.66667ms. The old 16.67/33.34
// comparison produced only 30/20 paints respectively. Verify real cadence.
function paintedFps(refresh,target){
 let last=0,paints=0;
 for(let i=1;i<=refresh*10;i++){
  const now=i*1000/refresh;
  const next=canvasFrameDeadline(now,last,target);
  if(next.due){last=next.nextAt;paints++;}
 }
 return paints/10;
}
for(const [refresh,target] of [[60,60],[60,30],[90,60],[120,60],[120,30]]){
 const actual=paintedFps(refresh,target);
 assert.ok(Math.abs(actual-target)<1.5,
  `Cadence regression on ${refresh}Hz screen: target ${target}, actual ${actual}`);
}
assert.deepEqual(canvasFrameDeadline(5000,120,30),{due:true,nextAt:5000},
 "After a WebView stall, do not draw runaway catch-up frames");
assert.equal(canvasFrameDeadline(Number.NaN,50,30).due,false);
console.log("Movimentação: interpolação, câmera e cadência real 30/60 FPS em telas 60/90/120Hz aprovadas.");
