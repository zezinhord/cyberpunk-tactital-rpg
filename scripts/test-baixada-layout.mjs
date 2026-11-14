import assert from "node:assert/strict";
import {
  GRID_WIDTH, GRID_HEIGHT, PLAYER_START, ACTOR_TILES, BUILDINGS, PROPS, ROAMING_NPCS,
  BUILDING_CELLS, ACTOR_CELLS, PROP_CELLS, cellKey, isInside, isWalkable,
} from "../src/game/baixada/layout.ts";

const seenBuildingCells = new Set();
for (const building of BUILDINGS) {
  assert.ok(building.height > 0);
  for (let x = building.x; x < building.x + building.width; x += 1) {
    for (let y = building.y; y < building.y + building.depth; y += 1) {
      const tile = { x, y };
      assert.ok(isInside(tile), "Edifício fora do mapa: " + building.id);
      const key = cellKey(tile);
      assert.ok(!seenBuildingCells.has(key), "Edifícios sobrepostos em " + key);
      seenBuildingCells.add(key);
    }
  }
}
assert.equal(seenBuildingCells.size, BUILDING_CELLS.size);
assert.ok(BUILDINGS.length >= 13, "Pátio do Reúso: seis edifícios adicionais.");
assert.ok(isWalkable(PLAYER_START), "Posição inicial bloqueada.");

for (const [id, tile] of Object.entries(ACTOR_TILES)) {
  assert.ok(isInside(tile), "Ator fora do mapa: " + id);
  assert.ok(!BUILDING_CELLS.has(cellKey(tile)), "Ator dentro de edifício: " + id);
  assert.ok(!PROP_CELLS.has(cellKey(tile)), "Prop sobre ator: " + id);
}
let count = 0;
const propKeys = new Set();
for (const [kind, tiles] of Object.entries(PROPS)) {
  for (const tile of tiles) {
    assert.ok(isInside(tile), "Prop fora do mapa: " + kind);
    const key = cellKey(tile);
    assert.ok(!BUILDING_CELLS.has(key) && !ACTOR_CELLS.has(key), "Decoração sobre estrutura/ator: " + kind + " " + key);
    assert.ok(!propKeys.has(key), "Decorações duplicadas na célula " + key);
    propKeys.add(key);
    count += 1;
  }
}
assert.equal(propKeys.size, count);
for(const npc of ROAMING_NPCS) {
  for(const point of npc.route) {
    assert.ok(isWalkable(point),"Rota de "+npc.name+" bloqueada em "+cellKey(point));
  }
}

function neighbors(tile) {
  return [{ x:tile.x - 1,y:tile.y },{ x:tile.x + 1,y:tile.y },{ x:tile.x,y:tile.y - 1 },{ x:tile.x,y:tile.y + 1 }];
}
const visited = new Set([cellKey(PLAYER_START)]);
const queue = [PLAYER_START];
for (let i = 0; i < queue.length; i += 1) {
  const current = queue[i];
  for (const candidate of neighbors(current)) {
    const key = cellKey(candidate);
    if (isWalkable(candidate) && !visited.has(key)) {
      visited.add(key); queue.push(candidate);
    }
  }
}
for (const [id, tile] of Object.entries(ACTOR_TILES)) {
  assert.ok(neighbors(tile).some((candidate) => visited.has(cellKey(candidate))), "Ator inacessível: " + id);
}
const walkableCount = GRID_WIDTH * GRID_HEIGHT - BUILDING_CELLS.size - ACTOR_CELLS.size - PROP_CELLS.size;
assert.equal(visited.size, walkableCount, "O cenário contém áreas caminháveis isoladas.");

console.log("Baixada: " + BUILDINGS.length + " edifícios, " + count + " props, " +
  visited.size + " células acessíveis e " + Object.keys(ACTOR_TILES).length +
  " interações alcançáveis. Planta validada.");
