import assert from "node:assert/strict";
import {SEWER_MAPS,sewerApproach,sewerRoute,sewerWalkable,sewerWater,sewerSolid,sewerKey}
 from "../src/game/baixada/sewer-layout.ts";
import {FRESH_SEWER,SEWER_KEY,readSewer,saveSewer,applySewerEvent,hasSewerEvidence,
 sewerNextObjective,sewerStatus,normalizeSewer} from "../src/game/story/sewer-v09.ts";

const names=Object.keys(SEWER_MAPS);
assert.deepEqual(names,["sewer-drain","sewer-deep"]);
assert.notEqual(SEWER_MAPS["sewer-drain"].name,SEWER_MAPS["sewer-deep"].name);
let uniqueActorIds=new Set();
for(const id of names){
 const map=SEWER_MAPS[id],visited=new Set(),queue=[map.entry];
 assert.ok(map.width>=18&&map.height>=12,"Mapa subterrâneo não deve ser minúsculo: "+id);
 assert.ok(sewerWalkable(id,map.entry),"Spawn dentro de parede/água no "+id);
 visited.add(sewerKey(map.entry));
 for(let i=0;i<queue.length;i++){
  const tile=queue[i];
  for(const step of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]){
   const next={x:tile.x+step.x,y:tile.y+step.y},key=sewerKey(next);
   if(!visited.has(key)&&sewerWalkable(id,next)){visited.add(key);queue.push(next);}
  }
 }
 let allWalkable=0;
 for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){
  if(sewerWalkable(id,{x,y}))allWalkable++;
 }
 assert.equal(visited.size,allWalkable,"Zonas inacessíveis no "+id);
 assert.ok(allWalkable>115,"Esgoto tem pouca área navegável: "+id);
 assert.equal(map.actors.length>=4,true,"Faltam pistas e portas no "+id);
 for(const actor of map.actors){
  assert.ok(!uniqueActorIds.has(actor.id),"ID duplicado: "+actor.id);
  uniqueActorIds.add(actor.id);
  assert.equal(sewerSolid(id,actor.tile),true,"Interação não ocupa célula sólida: "+actor.id);
  const path=sewerApproach(id,map.entry,actor.tile);
  assert.ok(path?.length,"Sem percurso até "+actor.id+" em "+id);
  const last=path.at(-1);
  assert.equal(Math.abs(last.x-actor.tile.x)+Math.abs(last.y-actor.tile.y),1,
   "Interação remota sem aproximação: "+actor.id);
  for(let i=1;i<path.length;i++){
   const a=path[i-1],b=path[i];
   assert.equal(Math.abs(a.x-b.x)+Math.abs(a.y-b.y),1,"Movimento diagonal: "+id);
   assert.ok(sewerWalkable(id,b),"Rota atravessa obstáculo "+id);
  }
 }
 assert.equal(sewerRoute(id,map.entry,map.actors[0].tile),null,
  "O jogador não pode pisar dentro de uma porta");
 for(let x=1;x<map.width-1;x++){
  assert.equal(sewerWater(id,{x,y:map.waterRow}),!map.bridges.includes(x),
   "Passarela ou água inconsistente em "+id+" x="+x);
 }
}
assert.ok(sewerApproach("sewer-drain",SEWER_MAPS["sewer-drain"].fromDeep,
 SEWER_MAPS["sewer-drain"].actors.find(a=>a.id==="sewer-exit-surface").tile),
 "Retorno da câmara à galeria não tem rota caminhável");

// Checkpoint funciona para todos os eventos, pode ser salvo e retomado entre mapas.
let state={...FRESH_SEWER};
assert.equal(applySewerEvent(state,"sewer-gate").allowed,false,"Não atravessar sem bomba");
assert.equal(applySewerEvent(state,"sewer-pump").allowed,false,"Bomba exige pista");
assert.equal(applySewerEvent(state,"sewer-manifest").allowed,false,"Manifesto exige comporta");
let db=new Map();
globalThis.localStorage={
 getItem:key=>db.get(key)??null,
 setItem:(key,value)=>db.set(key,String(value)),
 removeItem:key=>db.delete(key),
};
const chain=[
 ["sewer-track","traceFound"],
 ["sewer-pump","pumpRestored"],
 ["sewer-gate","gateOpened"],
 ["sewer-manifest","manifestRecovered"],
 ["sewer-sample","sampleRecovered"],
];
for(const [event,key] of chain){
 const r=applySewerEvent(state,event);
 assert.equal(r.allowed,true,event);
 assert.equal(r.changed,true,event);
 assert.equal(state[key],false,"Estado anterior mutado: "+event);
 state=r.state;
 assert.equal(state[key],true,event);
 assert.equal(saveSewer("hero",state),true);
 assert.deepEqual(readSewer("hero"),state);
 assert.equal(applySewerEvent(state,event).changed,false,
   "Não repetir checkpoint de "+event);
}
assert.equal(hasSewerEvidence(state),true);
assert.equal(sewerStatus(state),"4 / 4 marcos da investigação subterrânea");
assert.ok(sewerNextObjective(state).includes("Pátio"));
assert.equal(hasSewerEvidence(readSewer("outro-heroi")),false);
assert.equal(normalizeSewer({traceFound:true,manifestRecovered:"true"}).manifestRecovered,false);
const last=db.get(SEWER_KEY+"hero");
globalThis.localStorage={getItem:()=>last,setItem:()=>{throw Error("quota")}};
assert.equal(saveSewer("hero",state),false,"Falha de storage não pode marcar sucesso");
console.log("Esgotos: 2 mapas conectados, água, colisões, rotas, portões, evidências, saves e retorno aprovados.");
