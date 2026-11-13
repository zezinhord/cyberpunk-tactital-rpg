import assert from "node:assert/strict";
import { ROAMING_NPCS, cellKey, ACTOR_TILES, PLAYER_START } from "../src/game/baixada/layout.ts";
import { CitizenRoutine } from "../src/game/baixada/npc-routines.ts";
import { canStand, canTraverse } from "../src/game/baixada/navigation.ts";
const occupiedStatic=new Set(Object.values(ACTOR_TILES).map(cellKey));
for(const spec of ROAMING_NPCS){
  let pos={...spec.route[0]};
  const routine=new CitizenRoutine(spec);
  const visited=new Set([cellKey(pos)]);let idle=0;let moves=0;
  for(let tick=0;tick<45;tick++){
    const result=routine.tick(pos,new Set([cellKey(PLAYER_START)]));
    assert.ok(canStand(result.tile),spec.id+" invadiu sólido");
    if(result.moved){assert.ok(canTraverse(pos,result.tile),spec.id+" cortou parede");moves++;}
    else idle++;
    pos=result.tile;visited.add(cellKey(pos));
  }
  assert.ok(moves>=7,spec.id+" não realizou caminhada real.");
  assert.ok(idle>=3,spec.id+" não fez pausas.");
  assert.ok(!occupiedStatic.has(cellKey(pos)));
  routine.interact();
  assert.equal(routine.state,"interact");
  for(let i=0;i<3;i++)routine.tick(pos,new Set());
  assert.equal(routine.state,"return");
  assert.ok(visited.size>=3,"Rota com poucos destinos");
}
console.log("NPCs: "+ROAMING_NPCS.length+" rotinas com movimento, colisão, idle, interação e retorno validadas.");
