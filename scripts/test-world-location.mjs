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
