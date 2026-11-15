import assert from "node:assert/strict";
import {GRAPHICS_MODE_KEY,defaultGraphicsMode,readGraphicsMode,
 saveGraphicsMode,performanceGameConfig} from "../src/game/performance.ts";
import {readPerformanceReport,PERFORMANCE_LOG_KEY} from "../src/game/performance-diagnostics.ts";
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
console.log("Android: perfis 30/60 FPS, antialias, saves e leitura segura do diagnóstico aprovados.");
