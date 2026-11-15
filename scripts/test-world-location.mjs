import {WORLD_AREA_KEY,loadWorldArea,saveWorldArea,isSavedWorldArea} from "../src/game/baixada/world-area.ts";
import assert from "node:assert/strict";
import { validateSpawn,sameTile,saveWorldLocation,loadWorldLocation } from "../src/game/baixada/location.ts";
import {PLAYER_START,BUILDINGS} from "../src/game/baixada/layout.ts";
assert.deepEqual(validateSpawn({x:-1,y:2}),PLAYER_START);
assert.deepEqual(validateSpawn({x:BUILDINGS[0].x,y:BUILDINGS[0].y}),PLAYER_START);
assert.deepEqual(validateSpawn({x:NaN,y:2}),PLAYER_START);
assert.deepEqual(validateSpawn({x:1.5,y:12}),PLAYER_START);
assert.deepEqual(validateSpawn({x:Infinity,y:12}),PLAYER_START);
const storage=new Map();
globalThis.localStorage={
  setItem:(key,value)=>storage.set(key,value),
  getItem:key=>storage.get(key)??null,
};
saveWorldLocation("test",{x:8.5,y:12});
assert.equal(storage.size,0,"Não deve salvar célula fracionária");
saveWorldLocation("test",{x:24,y:7});
assert.deepEqual(loadWorldLocation("test"),{x:24,y:7});
assert.ok(sameTile(validateSpawn({x:24,y:7}),{x:24,y:7}));
console.log("Posição de exploração: persistência validada contra células sólidas e entradas malformadas.");

assert.equal(loadWorldArea("hero-unknown"),null,"Novo personagem começa na Baixada");
assert.equal(saveWorldArea("hero-unknown","ferrugem"),true);
assert.equal(loadWorldArea("hero-unknown"),"ferrugem");
assert.equal(saveWorldArea("hero-unknown","sewer-deep"),true);
assert.equal(loadWorldArea("hero-unknown"),"sewer-deep");
assert.equal(saveWorldArea("hero-unknown",null),true);
assert.equal(loadWorldArea("hero-unknown"),null);
assert.equal(saveWorldArea("hero-unknown","../../other"),false);
assert.equal(isSavedWorldArea({area:"ferrugem"}),false);
globalThis.localStorage?.setItem(WORLD_AREA_KEY+"hero-bad",'"area-malformada"');
assert.equal(loadWorldArea("hero-bad"),null,"Dados de área suspeitos não ativam mapa");
console.log("Áreas: Ferrugem, esgoto e retorno à Baixada persistidos com validação.");
