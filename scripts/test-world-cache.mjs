import assert from "node:assert/strict";
import {createStartingInventory,saveInventory,loadInventory} from "../src/game/inventory.ts";
import {DISCOVERY_AREAS,DISCOVERY_REWARDS,claimDiscovery} from "../src/game/story/discoveries.ts";
import {DISTRICTS,DISTRICT_SPAWN,NODE_TILES,districtApproach,districtPath,DISTRICT_WIDTH,DISTRICT_HEIGHT}
 from "../src/game/districts/catalog.ts";
import {FERRUGEM_START,FERRUGEM_ACTORS,ferrugemApproach} from "../src/game/ferrugem/layout.ts";
const data=new Map();
globalThis.localStorage={
 getItem:key=>data.get(key)??null,
 setItem:(key,val)=>data.set(key,String(val)),
 removeItem:key=>data.delete(key),
};
assert.equal(DISTRICT_WIDTH,30);assert.equal(DISTRICT_HEIGHT,22);
assert.equal(DISCOVERY_AREAS.length,6);
const ids=new Set(DISCOVERY_AREAS);
assert.equal(ids.size,6);
for(const district of DISTRICTS){
 const point=NODE_TILES.discovery;
 assert.ok(districtApproach(district.id,DISTRICT_SPAWN,point)?.length,
  "Cache inacessível por toque: "+district.id);
 assert.ok(districtPath(district.id,DISTRICT_SPAWN,{x:28,y:19})?.length,
  "Rota periférica do mapa inacessível: "+district.id);
}
const salvage=FERRUGEM_ACTORS.find(n=>n.id==="ferrugem-salvage");
assert.ok(salvage);
assert.ok(ferrugemApproach(FERRUGEM_START,salvage.tile)?.length,
 "Refugo de Ferrugem deve ser alcançável");
let itemCount=0;
for(const area of DISCOVERY_AREAS){
 let inventory=createStartingInventory("slot-"+area);
 const item=DISCOVERY_REWARDS[area].item;
 const current=inventory.quantities[item];
 const claim=claimDiscovery(inventory,area);
 assert.equal(claim.ok,true);
 assert.equal(claim.xp,12);
 itemCount++;
 assert.equal(claim.state.quantities[item],current+1);
 assert.ok(claim.state.rewardReceipts.includes("discovery-"+area));
 assert.equal(claimDiscovery(claim.state,area).ok,false,
  "Recibo deve impedir exploração repetida");
 assert.equal(saveInventory(claim.state),true);
 inventory=loadInventory(inventory.ownerId);
 assert.equal(claimDiscovery(inventory,area).ok,false,
  "Save/restore deve preservar o recibo da descoberta");
}
assert.equal(itemCount,6);
console.log("Exploração: 5 rotas periféricas + 1 arquivo Ferrugem, 6 itens reais, 6×12 XP e recibos persistentes.");
