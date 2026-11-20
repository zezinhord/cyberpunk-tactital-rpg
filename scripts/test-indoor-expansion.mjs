import assert from "node:assert/strict";
import {INNER_IDS,INNER_BLUEPRINTS,INNER_WIDTH,INNER_HEIGHT,INNER_SPAWN,INNER_EXIT_AT,
 innerApproach,innerPath,isInnerId,isInnerInteract} from "../src/game/districts/interiors.ts";
import {collectInnerProp,reconcileInnerExperience,innerReceipt}
 from "../src/game/story/indoor-rewards.ts";
import {createStartingInventory,saveInventory,loadInventory}
 from "../src/game/inventory.ts";
import {isSavedWorldArea,saveWorldArea,loadWorldArea}
 from "../src/game/baixada/world-area.ts";
import {ACTOR_TILES,PLAYER_START} from "../src/game/baixada/layout.ts";
import {approachRoute} from "../src/game/baixada/navigation.ts";
import {FERRUGEM_ACTORS,FERRUGEM_START,ferrugemApproach}
 from "../src/game/ferrugem/layout.ts";
import {NODE_TILES,DISTRICTS,DISTRICT_SPAWN,districtApproach}
 from "../src/game/districts/catalog.ts";
const db=new Map();
globalThis.localStorage={
 getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),
 removeItem:k=>db.delete(k),
};
assert.equal(INNER_WIDTH,19);assert.equal(INNER_HEIGHT,14);
assert.equal(INNER_IDS.length,35,"7 interiores originais + 28 novas zonas da expansão 2.0");
assert.equal(new Set(INNER_IDS.map(id=>INNER_BLUEPRINTS[id].title)).size,35,
 "Cada área nova precisa de identidade própria");
const fed=FERRUGEM_ACTORS.find(a=>a.id==="ferrugem-foundry-access");
assert.ok(fed);
assert.ok(ferrugemApproach(FERRUGEM_START,fed.tile)?.length,
 "Porta da fundição precisa ser alcançável na Ferrugem");
assert.ok(approachRoute(PLAYER_START,ACTOR_TILES["feira-casa-comum"])?.length,
 "Porta da Casa Comum precisa ser alcançável na Baixada");
for(const district of DISTRICTS){
 assert.ok(districtApproach(district.id,DISTRICT_SPAWN,NODE_TILES.interior)?.length,
  "Entrada inacessível no distrito "+district.id);
}
let count=0,allRewards=0;
for(const id of INNER_IDS){
 assert.equal(isInnerId(id),true);
 const room=INNER_BLUEPRINTS[id];
 assert.ok(room.title&&room.guideWords&&room.subtitle);
 assert.equal(room.props.length,3);
 assert.ok(innerApproach(id,INNER_SPAWN,room.guideAt)?.length,
  "NPC precisa ser alcançável em "+id);
 assert.ok(innerApproach(id,INNER_SPAWN,INNER_EXIT_AT)?.length,
  "Saída precisa ser alcançável em "+id);
 assert.equal(saveWorldArea("player-"+id,id),true);
 assert.equal(loadWorldArea("player-"+id),id);
 let inv=createStartingInventory("player-"+id);
 for(const prop of room.props){
  const obj=isInnerInteract("interior-"+id+"-"+prop.id);
  assert.ok(obj&&obj.prop===prop);
  const route=innerApproach(id,INNER_SPAWN,prop.at);
  assert.ok(route?.length,"Objeto deve ser acessível em "+id+" : "+prop.id);
  for(let i=1;i<route.length;i++)
   assert.equal(Math.abs(route[i].x-route[i-1].x)+Math.abs(route[i].y-route[i-1].y),1,
    "Sem atravessar diagonais entre móveis no interior");
  const owned=inv.quantities[prop.item];
  const reward=collectInnerProp(inv,id,prop.id);
  assert.equal(reward.ok,true);
  assert.equal(reward.xp,prop.xp);
  assert.equal(reward.state.quantities[prop.item],owned+1);
  assert.ok(reward.state.rewardReceipts?.includes(innerReceipt(id,prop)));
  inv=reward.state;
  assert.equal(collectInnerProp(inv,id,prop.id).ok,false,
   "Não repetir prêmios do interior "+id);
  count++;
 }
 assert.ok(innerPath(id,INNER_SPAWN,{x:15,y:10})?.length,
  "Uma ala secundária deve ser explorável "+id);
 assert.equal(saveInventory(inv),true);
 const restored=loadInventory("player-"+id);
 assert.deepEqual(restored.rewardReceipts,inv.rewardReceipts);
 const once=new Set(),grant=(event,xp)=>{
  assert.ok(xp>0);
  if(once.has(event))return true;
  once.add(event);allRewards+=xp;return true;
 };
 assert.equal(reconcileInnerExperience(restored,grant),true);
 assert.equal(once.size,3);
 assert.equal(reconcileInnerExperience(restored,grant),true);
 assert.equal(once.size,3);
}
assert.equal(count,105);
assert.ok(allRewards>2000);
assert.equal(isSavedWorldArea("aurea-archive"),true);
assert.equal(isSavedWorldArea("somente-um-placeholder"),false);
assert.equal(isInnerInteract("interior-aurea-archive-hack"),null);
console.log("Interiores: 35 mapas caminháveis, 105 recursos com recibos, saídas e acesso físico pelos sete distritos.");
