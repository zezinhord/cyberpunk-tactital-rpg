import assert from "node:assert/strict";
import { validateSpawn,sameTile } from "../src/game/baixada/location.ts";
import {PLAYER_START,BUILDINGS} from "../src/game/baixada/layout.ts";
assert.deepEqual(validateSpawn({x:-1,y:2}),PLAYER_START);
assert.deepEqual(validateSpawn({x:BUILDINGS[0].x,y:BUILDINGS[0].y}),PLAYER_START);
assert.deepEqual(validateSpawn({x:NaN,y:2}),PLAYER_START);
assert.ok(sameTile(validateSpawn({x:24,y:7}),{x:24,y:7}));
console.log("Posição de exploração: persistência validada contra células sólidas e entradas malformadas.");
