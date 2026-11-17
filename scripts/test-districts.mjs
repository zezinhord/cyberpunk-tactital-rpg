import assert from "node:assert/strict";
import {
 DISTRICTS,DISTRICT_SPAWN,DISTRICT_WIDTH,DISTRICT_HEIGHT,
 NODE_TILES,actorFromId,districtActorId,isDistrictId,getDistrict,
 cellKey,districtWalkable,districtCanStep,districtPath,districtApproach,districtRoad,
} from "../src/game/districts/catalog.ts";
import {
 CHAPTERS,FRESH_CHAPTER,DISTRICT_SAVE_KEY,
 readDistrictProgress,saveDistrictProgress,validateDistrictBackup,
 beginDistrict,advanceDistrict,districtCurrentStep,districtObjective,
} from "../src/game/districts/progress.ts";
import {
 DISTRICT_POSITIONS_KEY,loadDistrictPosition,saveDistrictPosition,
 validateDistrictPositions,
} from "../src/game/districts/positions.ts";

assert.equal(DISTRICTS.length,5);
assert.equal(CHAPTERS.length,5);
assert.equal(DISTRICT_WIDTH,30);assert.equal(DISTRICT_HEIGHT,22);
const ids=new Set(DISTRICTS.map(x=>x.id));assert.equal(ids.size,5);
assert.equal(isDistrictId("setor-zero"),true);
assert.equal(isDistrictId("ferrugem"),false);
// QA de identidade: nenhuma região secundária pode reutilizar a mesma planta.
const distinctBlocks=new Set(DISTRICTS.map(d=>JSON.stringify(d.blocks)));
assert.equal(distinctBlocks.size,5,"Distritos precisam de geometrias próprias");
const distinctRoads=new Set(DISTRICTS.map(d=>{
 const roads=[];
 for(let y=1;y<DISTRICT_HEIGHT-1;y++)for(let x=1;x<DISTRICT_WIDTH-1;x++)
  if(districtRoad(d.id,{x,y}))roads.push(cellKey({x,y}));
 return roads.join("|");
}));
assert.equal(distinctRoads.size,5,"Distritos não podem repetir exatamente a malha viária");
const visited=new Set();
const storage=new Map();
globalThis.localStorage={
 getItem:k=>storage.get(k)??null,
 setItem:(k,v)=>storage.set(k,String(v)),
 removeItem:k=>storage.delete(k),
};
for(const d of DISTRICTS){
 assert.ok(d.intro.length>30,"Um distrito precisa de contexto narrativo");
 assert.equal(getDistrict(d.id).name,d.name);
 assert.ok(d.blocks.length>=8,"Mapas secundários devem ter zonas construtivas próprias");
 assert.ok(districtWalkable(d.id,DISTRICT_SPAWN));
 const traversed=new Set([cellKey(DISTRICT_SPAWN)]),queue=[DISTRICT_SPAWN];
 for(let n=0;n<queue.length;n++){
  const p=queue[n];
  for(const offset of [{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0}]){
   const next={x:p.x+offset.x,y:p.y+offset.y};
   if(districtWalkable(d.id,next)&&!traversed.has(cellKey(next))){
    traversed.add(cellKey(next));queue.push(next);
   }
  }
 }
 let walkable=0;
 for(let y=0;y<DISTRICT_HEIGHT;y++)
  for(let x=0;x<DISTRICT_WIDTH;x++)
   if(districtWalkable(d.id,{x,y}))walkable++;
 assert.ok(walkable>260,"Distrito minúsculo: "+d.id);
 assert.equal(traversed.size,walkable,"Área isolada em "+d.id);
 for(const [slot,target] of Object.entries(NODE_TILES)){
  assert.equal(districtWalkable(d.id,target),false,"Ator não bloqueia célula");
  const id=districtActorId(d.id,slot);
  assert.ok(actorFromId(id)?.district===d.id,"Identificador não reconhecido");
  const route=districtApproach(d.id,DISTRICT_SPAWN,target);
  assert.ok(route?.length,"Sem rota até "+d.id+"/"+slot);
  const last=route.at(-1);
  assert.equal(Math.abs(last.x-target.x)+Math.abs(last.y-target.y),1,
   "Interação fora do alcance "+id);
  for(let i=1;i<route.length;i++)
   assert.equal(districtCanStep(d.id,route[i-1],route[i]),true,
    "Cortou parede/quina em "+id);
 }
 assert.equal(districtPath(d.id,DISTRICT_SPAWN,d.blocks[0]),null);
 assert.equal(districtCanStep(d.id,{x:4,y:10},{x:6,y:10}),false);
 assert.ok(districtApproach(d.id,DISTRICT_SPAWN,NODE_TILES.discovery)?.length,"Nova área explorável inacessível: "+d.id);
 const chapter=CHAPTERS.find(c=>c.id===d.id);
 assert.ok(chapter&&chapter.steps.length===7,"São sete etapas por distrito");
 let progress=beginDistrict(FRESH_CHAPTER);
 assert.equal(progress.started,true);
 assert.equal(advanceDistrict(d.id,progress,"district-"+d.id+"-relay").advanced,false,
  "Objetivo pode ser pulado "+d.id);
 for(let i=0;i<6;i++){
  const stage=chapter.steps[i];
  assert.equal(districtCurrentStep(d.id,progress).id,stage.id);
  const result=advanceDistrict(d.id,progress,districtActorId(d.id,stage.slot));
  assert.ok(result.advanced,"Etapa falhou "+d.id+"/"+stage.id);
  assert.ok(result.step.xp>=10);
  assert.equal(result.state.step,i+1);
  assert.equal(saveDistrictProgress("hero",d.id,result.state),true);
  assert.deepEqual(readDistrictProgress("hero",d.id),result.state);
  progress=result.state;
 }
 assert.equal(advanceDistrict(d.id,progress,districtActorId(d.id,"guide")).advanced,false,
  "Decisão obrigatória pode ser ignorada "+d.id);
 for(const ending of ["divulgar","resguardar"]){
  const result=advanceDistrict(d.id,progress,districtActorId(d.id,"guide"),ending);
  assert.equal(result.advanced,true);
  assert.equal(result.state.completed,true);
  assert.equal(result.state.ending,ending);
  assert.equal(result.state.step,chapter.steps.length);
  assert.ok(districtObjective(d.id,result.state).length>20);
  assert.equal(advanceDistrict(d.id,result.state,districtActorId(d.id,"guide"),ending).advanced,false,
   "Dossiê não pode gerar XP duplicado");
 }
 const finished=advanceDistrict(d.id,progress,districtActorId(d.id,"guide"),"divulgar").state;
 assert.equal(saveDistrictProgress("hero",d.id,finished),true);
 visited.add(d.id);
 const point=districtApproach(d.id,DISTRICT_SPAWN,NODE_TILES.cache).at(-1);
 assert.equal(saveDistrictPosition("hero",d.id,point),true);
 assert.deepEqual(loadDistrictPosition("hero",d.id),point);
 assert.equal(saveDistrictPosition("hero",d.id,NODE_TILES.cache),false,
  "Salvar em cima do depósito bloqueado");
}
assert.equal(visited.size,5);
const map=JSON.parse(storage.get(DISTRICT_SAVE_KEY+"hero"));
assert.equal(validateDistrictBackup(map),true);
assert.equal(validateDistrictBackup({...map,admin:{started:true}}),false);
assert.equal(validateDistrictBackup({aurea:{...map.aurea,step:999}}),false);
const positions=JSON.parse(storage.get(DISTRICT_POSITIONS_KEY+"hero"));
assert.equal(validateDistrictPositions(positions),true);
assert.equal(validateDistrictPositions({...positions,"../../foo":{x:1,y:1}}),false);
assert.equal(readDistrictProgress("other","aurea").started,false,"Personagens não podem compartilhar missões");
globalThis.localStorage.setItem(DISTRICT_SAVE_KEY+"corrupt","not-json");
assert.equal(readDistrictProgress("corrupt","aurea").started,false);
console.log("Distritos: 5 mapas alcançáveis, 35 objetivos, 10 finais, radio 7 zonas e saves preservados.");
