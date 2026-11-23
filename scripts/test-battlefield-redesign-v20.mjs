import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,context,next){
  if((specifier.startsWith("./")||specifier.startsWith("../"))&&
     !/\\.[cm]?[jt]s$/.test(specifier))
    return next(specifier+".ts",context);
  return next(specifier,context);
}});
const {TACTICAL_SIEGE_IDS,TACTICAL_SIEGE_MAPS,TACTICAL_MISSION_MAPS,
  layoutForEncounter,copyTacticalLayout}=await import("../src/game/combat/tactical-maps.ts");
const {BOARD_WIDTH,BOARD_HEIGHT,isBlocked,hasLineOfSight,findPath,
  pathCost,coverBetween,canStep,movementCost,tileHeight}=await import("../src/game/map.ts");
const {TurnManager}=await import("../src/game/TurnManager.ts");
const {planEnemyTurn,enemyProfile}=await import("../src/game/tactics.ts");
const designs=[...TACTICAL_SIEGE_IDS,...Object.keys(TACTICAL_MISSION_MAPS)];
assert.equal(TACTICAL_SIEGE_IDS.length,7);
assert.ok(designs.length>=20,"At least seven expansion maps in addition to council sites");
assert.equal(layoutForEncounter("v09"),null,"Do not break legacy V-09");
assert.equal(layoutForEncounter("test"),null,"Retain the real Limbo Test");
const signatures=new Set();
for(const id of designs){
  const layout=layoutForEncounter(id);
  assert.ok(layout,"Missing integrated encounter: "+id);
  const signature=[...layout.blocked].sort().join(";");
  assert.ok(!signatures.has(signature),"Duplicate obstacle geometry: "+id);
  signatures.add(signature);
  assert.equal(layout.objects.size,5,"All encounters contain functional props");
  assert.ok(layout.heights.size>0&&layout.terrain.size>0);
  assert.equal(isBlocked(layout.playerSpawn,layout),false);
  assert.equal(isBlocked(layout.enemySpawn,layout),false);
  assert.equal(isBlocked(layout.terminal,layout),false);
  let walkable=0;
  for(let y=0;y<BOARD_HEIGHT;y++)for(let x=0;x<BOARD_WIDTH;x++){
    const cell={x,y};
    if(isBlocked(cell,layout))continue;
    const path=findPath(layout.playerSpawn,cell,[],"runner",layout);
    assert.ok(path,"Disconnected tile "+id+" "+x+","+y);
    assert.equal(path[0].x,layout.playerSpawn.x);
    assert.equal(path.at(-1).y,y);
    assert.ok(path.every((p,i)=>i===0||canStep(path[i-1],p,layout)));
    assert.ok(pathCost(path,layout)>=path.length-1);
    walkable++;
  }
  assert.equal(walkable,64-layout.blocked.size);
  assert.ok(walkable>=48,"Insufficient tactical space");
  const base=new TurnManager({encounterId:id,weaponId:"pistola_inducao"});
  assert.deepEqual(base.getArenaLayout(),layout,"One manager must own a fresh identical layout");
  const runner=base.getState().units[0],enemy=base.getState().units[1];
  assert.ok(base.getReachableCells().length>=3,"Trapped initial protagonist");
  assert.ok(!isBlocked(runner,layout)&&!isBlocked(enemy,layout));
  const plan=planEnemyTurn(enemy,runner,base.getState().units,
    enemyProfile(id,1),layout);
  assert.ok(["advance","reposition","attack","blocked"].includes(plan.action));
  assert.equal(isBlocked(plan.target,layout),false);
  assert.ok(["none","partial","full"].includes(coverBetween(runner,enemy,layout)));
  const prop=[...layout.objects.values()].find(p=>p.kind==="barricade");
  assert.ok(prop&&prop.cover==="partial");
  assert.ok(layout.blocked.has(prop.position.x+","+prop.position.y));
  assert.ok(!layout.opaque.has(prop.position.x+","+prop.position.y),
    "Low cover must not be a full ballistic wall");
}
const sample=copyTacticalLayout(TACTICAL_SIEGE_MAPS["council-baixada"]);
assert.ok(sample);
const prop=[...sample.objects.values()].find(p=>p.kind==="barricade");
assert.ok(prop);
const target={x:prop.position.x+1,y:prop.position.y};
const shooter={x:prop.position.x-1,y:prop.position.y};
if(!isBlocked(shooter,sample)&&!isBlocked(target,sample)){
  assert.equal(hasLineOfSight(shooter,target,sample),true,
    "Low barricades do not block every shot");
  assert.equal(coverBetween(shooter,target,sample),"partial",
    "Cover must work only from the attack's direction");
}
assert.ok(movementCost({x:0,y:0},null)>=1);
assert.equal(tileHeight({x:6,y:6},sample),2);
assert.equal(tileHeight({x:4,y:4},sample),1);
const store=new Map();
const priorStorage=globalThis.localStorage;
Object.defineProperty(globalThis,"localStorage",{configurable:true,value:{
  getItem:key=>store.get(key)??null,
  setItem:(key,value)=>{store.set(key,value);},
  removeItem:key=>{store.delete(key);},
}});
try{
  const id="trial-1",characterId="battlefield-qa";
  const first=new TurnManager({encounterId:id,characterId,classId:"solo"});
  const layout=first.getArenaLayout();
  assert.ok(layout);
  const obstacle=[...layout.objects.values()].find(p=>p.kind==="barricade");
  assert.ok(obstacle);
  const around=[[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx,dy])=>({x:obstacle.position.x+dx,y:obstacle.position.y+dy}))
    .find(p=>p.x>=0&&p.y>=0&&p.x<8&&p.y<8&&!isBlocked(p,layout));
  assert.ok(around,"Destructible must have an adjacent legal interaction cell");
  first.state.units[0].x=around.x;first.state.units[0].y=around.y;
  assert.equal(first.interactWithObject(obstacle.position.x,obstacle.position.y),true);
  assert.equal(layout.objects.get(obstacle.position.x+","+obstacle.position.y).state,"damaged");
  assert.equal(first.getState().mainActionAvailable,false);
  first.state.mainActionAvailable=true;
  assert.equal(first.interactWithObject(obstacle.position.x,obstacle.position.y),true);
  assert.equal(isBlocked(obstacle.position,layout),false,"Demolition changes navigation");
  assert.equal(layout.objects.get(obstacle.position.x+","+obstacle.position.y).state,"destroyed");
  const reloaded=new TurnManager({encounterId:id,characterId});
  assert.equal(isBlocked(obstacle.position,reloaded.getArenaLayout()),false,
    "Environmental consequences survive encounters");
  assert.equal(isBlocked(obstacle.position,new TurnManager({
    encounterId:id,characterId:"other-qa"}).getArenaLayout()),true,
    "Environmental consequences are isolated by save slot");
  assert.equal(isBlocked(obstacle.position,layoutForEncounter(id)),true,
    "Blueprint cannot be modified by a combat session");
  const hacker=new TurnManager({encounterId:id,classId:"netrunner"});
  const gate=[...hacker.getArenaLayout().objects.values()].find(p=>p.kind==="security-door");
  const near=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>
    ({x:gate.position.x+dx,y:gate.position.y+dy}))
    .find(p=>p.x>=0&&p.y>=0&&p.x<8&&p.y<8&&!isBlocked(p,hacker.getArenaLayout()));
  assert.ok(near);
  hacker.state.units[0].x=near.x;hacker.state.units[0].y=near.y;
  assert.equal(hacker.interactWithObject(gate.position.x,gate.position.y),true);
  assert.equal(isBlocked(gate.position,hacker.getArenaLayout()),false,
    "Netrunner can remotely disable a locked door when adjacent");
  assert.equal(hacker.getArenaLayout().objects.get(gate.position.x+","+gate.position.y).state,"disabled");
}finally{
  if(priorStorage===undefined)delete globalThis.localStorage;
  else Object.defineProperty(globalThis,"localStorage",{configurable:true,value:priorStorage});
}
const ui=readFileSync("src/components/Battlefield.tsx","utf8");
for(const marker of ["manager.interactWithObject(","cell.terrain==="hazard"",
    "tileHeight","cell.height>0","data-unit={unit.id}","manager.movePlayerTo(cell.x,cell.y)"])
  assert.ok(ui.includes(marker),"Missing visible tactical feedback: "+marker);
console.log("20 distinct campaign tactical maps: connected spawns, cost-aware paths, height, AI, LoS, cover, destructibles, hacking, save isolation and mobile UI verified.");
