import assert from "node:assert/strict";
import { BUILDINGS, PROPS, ACTOR_TILES, PLAYER_START, BUILDING_CELLS, cellKey } from "../src/game/baixada/layout.ts";
import { canStand, canTraverse, route, approachRoute, assertRoute, collisionAt, ORTHOGONAL_STEPS } from "../src/game/baixada/navigation.ts";
for (const building of BUILDINGS) {
  for(let x=building.x;x<building.x+building.width;x++)
  for(let y=building.y;y<building.y+building.depth;y++) {
    const t={x,y};
    assert.equal(collisionAt(t),"building",building.id+" ("+x+","+y+")");
    assert.equal(canStand(t),false);
    assert.equal(route(PLAYER_START,t),null);
    for (const d of ORTHOGONAL_STEPS) {
      const n={x:x+d.x,y:y+d.y};
      if(canStand(n))assert.equal(canTraverse(n,t),false,"Parede atravessável "+building.id);
    }
  }
}
assert.equal(canTraverse({x:6,y:9},{x:7,y:10}),false,"Diagonal nunca liberada");
assert.equal(canTraverse({x:6,y:9},{x:8,y:9}),false,"Movimento rápido de duas células bloqueado");
for(const tiles of Object.values(PROPS))for(const tile of tiles)assert.equal(collisionAt(tile),"prop");
for(const [id,tile] of Object.entries(ACTOR_TILES)){
  assert.equal(collisionAt(tile),"actor",id);
  const path=approachRoute(PLAYER_START,tile);
  assert.ok(path && path.length>=1,"Interação sem rota: "+id);
  assert.ok(assertRoute(path),"Rota atravessou sólido em "+id);
  assert.ok(!path.some(t=>BUILDING_CELLS.has(cellKey(t))),"Rota passou por edifício");
  const last=path.at(-1);
  assert.equal(Math.abs(last.x-tile.x)+Math.abs(last.y-tile.y),1);
}
const dynamic=new Set(["7,9"]);
assert.equal(route({x:6,y:9},{x:7,y:9},{occupied:dynamic}),null);
assert.equal(canStand({x:7,y:9},{occupied:dynamic}),false);
const detour=route({x:6,y:9},{x:8,y:9},{occupied:dynamic});
assert.ok(detour&&assertRoute(detour,{occupied:dynamic}));
assert.equal(collisionAt({x:-1,y:0}),"outside");
for(const tile of [{x:1.2,y:7},{x:5.5,y:10},{x:NaN,y:6},{x:Infinity,y:8}]){
  assert.equal(collisionAt(tile),"outside","Coordenadas não inteiras nunca podem ser caminháveis: "+JSON.stringify(tile));
  assert.equal(canStand(tile),false);
  assert.equal(route(PLAYER_START,tile),null);
}
console.log("Física: edifícios, paredes, portas, diagonais, passos rápidos, props e bloqueio dinâmico aprovados.");
