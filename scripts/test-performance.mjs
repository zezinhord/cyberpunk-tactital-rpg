import assert from "node:assert/strict";
import {GRAPHICS_MODE_KEY,defaultGraphicsMode,readGraphicsMode,
 saveGraphicsMode,performanceGameConfig} from "../src/game/performance.ts";
import {readPerformanceReport,PERFORMANCE_LOG_KEY,
 createCanvasPerformanceDiagnostics} from "../src/game/performance-diagnostics.ts";
const memory=new Map();
globalThis.localStorage={
 getItem:key=>memory.get(key)??null,
 setItem:(key,value)=>memory.set(key,String(value)),
 removeItem:key=>memory.delete(key),
};
assert.equal(defaultGraphicsMode(true),"economy","Android deve priorizar estabilidade");
assert.equal(defaultGraphicsMode(false),"balanced","Navegador desktop mantém 60 FPS");
assert.equal(saveGraphicsMode("economy"),true);
assert.equal(memory.get(GRAPHICS_MODE_KEY),"economy");
assert.equal(readGraphicsMode(),"economy");
let config=performanceGameConfig("economy");
assert.equal(config.fps.limit,30);
assert.equal(config.fps.target,30);
assert.equal(config.render.antialias,false);
assert.equal(config.render.antialiasGL,false);
assert.equal(config.render.preserveDrawingBuffer,false);
assert.equal(config.render.roundPixels,false,"Movimento subpixel deve permanecer suave");
assert.ok(config.render.batchSize<=4096,"Evitar batch GPU excessivo");
assert.equal(saveGraphicsMode("balanced"),true);
config=performanceGameConfig();
assert.equal(config.fps.target,60);
assert.equal(config.fps.limit,0);
assert.equal(readGraphicsMode(),"balanced");
memory.set(GRAPHICS_MODE_KEY,"value-malformed");
assert.equal(readGraphicsMode(),defaultGraphicsMode(),"Persistência inválida não deve travar jogo");
assert.equal(readPerformanceReport(),null);
memory.set(PERFORMANCE_LOG_KEY,JSON.stringify({
 scene:"Baixada",fps:26,minimumFps:18,samples:2,
 mode:"economy",contextLost:false,capturedAt:new Date().toISOString()}));
assert.equal(readPerformanceReport().minimumFps,18);
memory.set(PERFORMANCE_LOG_KEY,"{arquivo-malformado");
assert.equal(readPerformanceReport(),null,"Logs corrompidos não travam o menu");
// Android Canvas rendering must report painted-frame FPS, not animation tick
// frequency. Background/idle gaps cannot become spurious 1 FPS samples.
saveGraphicsMode("balanced");
memory.delete(PERFORMANCE_LOG_KEY);
const canvas=createCanvasPerformanceDiagnostics("Baixada · Android Canvas 2D");
for(let i=0;i<195;i++)canvas.frame(1000+i*1000/60,true);
let sample=readPerformanceReport();
assert.ok(sample&&sample.fps>=57&&sample.fps<=62,"60FPS Canvas frames");
assert.equal(sample.samples,1,"First active 3-second window");
canvas.frame(20000,false);
assert.equal(readPerformanceReport().samples,1,"Idle must not count as slowdown");
saveGraphicsMode("economy");
for(let i=0;i<105;i++)canvas.frame(25000+i*1000/30,true);
sample=readPerformanceReport();
assert.ok(sample&&sample.fps>=28&&sample.fps<=31,"30FPS Canvas frames");
assert.equal(sample.minimumFps,sample.fps,"Minimum excludes startup only");
assert.equal(sample.samples,2);
assert.equal(sample.mode,"economy");
canvas.frame(35000,true); // long background pause resets FPS estimator
assert.equal(readPerformanceReport().samples,2);
canvas.dispose();
for(let i=0;i<105;i++)canvas.frame(40000+i*1000/60,true);
assert.equal(readPerformanceReport().samples,2,"Disposal prevents stale reports");
console.log("Android: 30/60 FPS, true Canvas frame samples, idle suspension, safe diagnostics and saved graphics modes passed.");
