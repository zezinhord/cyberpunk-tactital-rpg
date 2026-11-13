import assert from "node:assert/strict";
import { SECTORS,sectorAt,getSectorById,GRID_WIDTH,GRID_HEIGHT,isStreet,PLAYER_START,ROAMING_NPCS } from "../src/game/baixada/layout.ts";
import { route,assertRoute,canStand,approachRoute } from "../src/game/baixada/navigation.ts";
assert.deepEqual(SECTORS.map(x=>x.id),["baixada","patio","feira"]);
assert.equal(GRID_WIDTH,33);assert.equal(GRID_HEIGHT,30);
for(const [sector,tile] of [["baixada",{x:6,y:9}],["patio",{x:24,y:12}],["feira",{x:12,y:26}]]){
 assert.equal(sectorAt(tile),sector);
 assert.ok(getSectorById(sector).description);
 const way=route(PLAYER_START,tile);
 assert.ok(way && way.length>=1,"Setor desconectado: "+sector);
 assert.ok(assertRoute(way),"Rota inválida até "+sector);
}
for(const tile of [{x:6,y:19},{x:6,y:20},{x:12,y:19},{x:12,y:26},{x:18,y:26}]){
 assert.ok(isStreet(tile),"Rua nova não renderizada "+JSON.stringify(tile));
 assert.ok(canStand(tile),"Cruzamento bloqueado "+JSON.stringify(tile));
}
const target={x:13,y:26};
const access=approachRoute(PLAYER_START,target);
assert.ok(access&&assertRoute(access));
assert.equal(ROAMING_NPCS.length,5);
console.log("Semiaberto: três regiões caminháveis conectadas, Mercado e acessos antigos preservados.");
