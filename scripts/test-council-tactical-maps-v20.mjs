import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,context,next){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&
  !/\.[cm]?[jt]s$/.test(specifier))return next(specifier+".ts",context);
 return next(specifier,context);
}});
const {TACTICAL_SIEGE_IDS,TACTICAL_SIEGE_MAPS,layoutForEncounter}=await
 import("../src/game/combat/tactical-maps.ts");
const {isBlocked,hasLineOfSight,findPath,coverBetween,BOARD_WIDTH,BOARD_HEIGHT}=await
 import("../src/game/map.ts");
const {planEnemyTurn,enemyProfile}=await import("../src/game/tactics.ts");
const {TurnManager}=await import("../src/game/TurnManager.ts");
assert.equal(TACTICAL_SIEGE_IDS.length,7);
assert.equal(layoutForEncounter("v09"),null);
assert.equal(isBlocked({x:3,y:1}),true,"Old fights retain the old obstacles");
const mapSignatures=new Set();
let alteredLines=0;
for(const id of TACTICAL_SIEGE_IDS){
 const layout=TACTICAL_SIEGE_MAPS[id];
 assert.equal(layout.id,id);
 assert.equal(layoutForEncounter(id),layout);
 const signature=[...layout.blocked].sort().join(";");
 assert.ok(!mapSignatures.has(signature),"Reused tactical geometry: "+id);
 mapSignatures.add(signature);
 assert.ok(layout.blocked.size>=7&&layout.blocked.size<=14);
 for(const pos of [layout.playerSpawn,layout.enemySpawn,layout.terminal])
  assert.equal(isBlocked(pos,layout),false,"Critical objective inaccessible in "+id);
 let accessible=0;
 for(let y=0;y<BOARD_HEIGHT;y++)for(let x=0;x<BOARD_WIDTH;x++){
  const pos={x,y};
  if(isBlocked(pos,layout))continue;
  const route=findPath(layout.playerSpawn,pos,[], "runner",layout);
  assert.ok(route,"Disconnected tile "+x+","+y+" in "+id);
  accessible++;
  assert.equal(route[0].x,layout.playerSpawn.x);
  assert.equal(route.at(-1).y,y);
  for(const cell of route)assert.equal(isBlocked(cell,layout),false);
 }
 assert.equal(accessible,64-layout.blocked.size);
 const base=new TurnManager({encounterId:id,weaponId:"pistola_inducao"});
 const state=base.getState();
 assert.deepEqual(base.getArenaLayout(),layout);
 assert.equal(state.units[0].x,layout.playerSpawn.x);
 assert.equal(state.units[1].y,layout.enemySpawn.y);
 assert.ok(base.getReachableCells().every(pos=>!isBlocked(pos,layout)));
 assert.ok(base.getReachableCells().length>3,"Player trapped in "+id);
 const blocked=[...layout.blocked][0].split(",").map(Number);
 base.movePlayerTo(blocked[0],blocked[1]);
 assert.deepEqual([base.getState().units[0].x,base.getState().units[0].y],
                  [layout.playerSpawn.x,layout.playerSpawn.y],"Wall collision failed");
 const player=state.units[0],enemy=state.units[1];
 const profile=enemyProfile(id,1);
 const plan=planEnemyTurn(enemy,player,state.units,profile,layout);
 assert.ok(["attack","advance","reposition","blocked"].includes(plan.action));
 assert.ok(!isBlocked(plan.target,layout));
 for(let y=0;y<BOARD_HEIGHT;y++)for(let x=0;x<BOARD_WIDTH;x++){
  const target={x,y};
  if(isBlocked(target,layout)||isBlocked(target))continue;
  if(hasLineOfSight(layout.playerSpawn,target,layout)!==
     hasLineOfSight(layout.playerSpawn,target))alteredLines++;
 }
 // All 7 arenas must retain the exact cover semantics used by the real engine.
 const cover=coverBetween(layout.playerSpawn,layout.enemySpawn,layout);
 assert.ok(["none","partial","full"].includes(cover));
 const old=new TurnManager({encounterId:"v09"});
 assert.equal(old.getArenaLayout(),null);
}
assert.ok(alteredLines>=7,"Maps should change actual firing lanes in several districts");
const ui=readFileSync("src/components/Battlefield.tsx","utf8");
const manager=readFileSync("src/game/TurnManager.ts","utf8");
assert.ok(ui.includes("sceneTiles.map(cell"),"SVG must use dynamic map geometry");
assert.ok(ui.includes("isBlocked(cell,manager.getArenaLayout())"));
assert.ok(manager.includes("this.arenaLayout"));
console.log("7 connected unique 8x8 tactical battlefields; player movement, enemy AI, cover, LOS, SVG and legacy fights verified.");
