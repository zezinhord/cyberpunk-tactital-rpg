#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../src/components/BaixadaLiteWorld.tsx",import.meta.url),"utf8");
const pointer=source.slice(source.indexOf("const pointer=(event:PointerEvent)=>"),source.indexOf("const keydown=(event:KeyboardEvent)=>"));
assert.ok(pointer.length>100,"Pointer input callback is available");
assert.match(pointer,/const v=getView\(width,height,cameraPosition\)/,"Touch picking must use the visual camera position");
assert.doesNotMatch(pointer,/getView\(width,height,renderPosition\)/,"Touch picking must not use unsmoothed avatar position");
const W=48,H=24,OX=850,OY=135;
const tileCenter=p=>({x:OX+(p.x-p.y)*W/2,y:OY+(p.x+p.y)*H/2});
const getView=(width,height,world)=>{
 const zoom=Math.max(.76,Math.min(1.22,Math.min(width/930,height/475)*1.08));
 return {zoom,offsetX:width/2-world.x*zoom,offsetY:height*.53-world.y*zoom};
};
const pointAt=(tile,view)=>{const c=tileCenter(tile);return {x:view.offsetX+c.x*view.zoom,y:view.offsetY+c.y*view.zoom};};
const hit=(point,view)=>{
 const wx=(point.x-view.offsetX)/view.zoom,wy=(point.y-view.offsetY)/view.zoom;
 const rx=(wx-OX)/(W/2),ry=(wy-OY)/(H/2);
 return {x:Math.round((rx+ry)/2),y:Math.round((ry-rx)/2)};
};
for(const [width,height] of [[914,411],[1600,720],[1080,450]]){
 const camera=tileCenter({x:10,y:12});
 const avatar=tileCenter({x:17,y:14});
 const realView=getView(width,height,camera);
 const wrongView=getView(width,height,avatar);
 for(const tile of [{x:8,y:9},{x:10,y:13},{x:16,y:14}]){
   const screen=pointAt(tile,realView);
   assert.deepEqual(hit(screen,realView),tile,"Exact screen-to-tile mapping");
   assert.notDeepEqual(hit(screen,wrongView),tile,"Lagging camera exposes the old bug");
 }
}
console.log("Visual touch QA: 3 landscape sizes, 9 camera-aligned hits, stale-camera regression protected.");
