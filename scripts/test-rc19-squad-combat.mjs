/** RC19 squad regression: exact original mission IDs, physical collision,
 * target selection, no early victory, legacy solo test and bounded AI.
 */
import assert from "node:assert/strict";
import {registerHooks} from "node:module";
registerHooks({resolve(spec,ctx,next){
 if((spec.startsWith("./")||spec.startsWith("../"))&&!/\.[cm]?[jt]s$/.test(spec))
  return next(spec+".ts",ctx);
 return next(spec,ctx);
}});
const {TurnManager}=await import("../src/game/TurnManager.ts");
const {isInsideBoard,isBlocked,findPath}=await import("../src/game/map.ts");
const {squadSizeForEncounter,activeEnemies,targetEnemy}=await import(
 "../src/game/combat/squad-encounters.ts");
for(const encounter of ["test","v09","trial-1"]){
 const manager=new TurnManager({encounterId:encounter});
 assert.equal(activeEnemies(manager.getState()).length,1,encounter+" legacy encounter");
 assert.equal(squadSizeForEncounter(encounter,1),1);
}
let encounters=0;
for(const name of ["council-baixada","council-ferrugem","council-aurea",
  "council-subsolo","council-setor-zero","council-prisma",
  "council-periferia","district-aurea","district-subsolo",
  "district-setor-zero","district-prisma","district-periferia",
  "eden-core","cisma-core","trial-3"]){
 const manager=new TurnManager({encounterId:name,weaponId:"fuzil_aurea"});
 const current=manager.getState();
 const enemies=activeEnemies(current);
 assert(enemies.length>=2,name+": no real squad spawned");
 const occupied=new Set();
 for(const unit of current.units){
  assert(isInsideBoard(unit)&&!isBlocked(unit,manager.getArenaLayout()),
   name+": illegal spawn");
  const key=unit.x+","+unit.y;
  assert(!occupied.has(key),name+": overlapping units at "+key);
  occupied.add(key);
 }
 const wing=enemies.find(x=>x.id!=="drone");
 assert(wing, name+": no selectable wing");
 assert(manager.setEnemyTarget(wing.id));
 assert.equal(targetEnemy(manager.getState())?.id,wing.id);
 assert(manager.getBasicAttackPreview(wing.id).distance>=0);
 assert(!manager.setEnemyTarget("drone-wing-99"));
 // A dead captain is not a victory while the wing survives.
 manager.state.units.find(x=>x.id==="drone").hp=0;
 manager.resolveEnemyDown();
 assert.equal(manager.getState().combatComplete,false,
  name+": captain death won the wave with surviving wing");
 assert.equal(manager.getState().wave,1);
 assert.equal(manager.getSquadThreatCount(),enemies.length-1);
 assert.equal(targetEnemy(manager.getState())?.id,wing.id,
  name+": auto-retarget must use a living hostile");
 // Continue the wave with all threats neutralized.
 manager.state.units.filter(x=>x.side==="enemy").forEach(x=>{x.hp=0});
 manager.resolveEnemyDown();
 if(manager.getState().totalWaves>1){
  assert.equal(manager.getState().wave,2,name+": wave did not advance");
  assert.equal(manager.getState().defeatedEnemyCount,1);
  assert(manager.getSquadThreatCount()>=2,
   name+": squad didn't respawn in wave two");
  assert.equal(manager.getState().selectedEnemyId,"drone");
 }else{
  assert(manager.getState().combatComplete);
 }
 // All hostile waves share the exact original XP milestone counter.
 while(!manager.getState().combatComplete){
  manager.state.units.filter(x=>x.side==="enemy").forEach(x=>{x.hp=0});
  manager.resolveEnemyDown();
 }
 assert.equal(manager.getState().defeatedEnemyCount,manager.getState().totalWaves,
  name+": unexpected XP/quest receipt inflation");
 encounters++;
}
const battle=new TurnManager({encounterId:"council-baixada"});
const units=battle.getState().units;
assert(battle.setEnemyTarget(units[2].id));
const primary=battle.state.units.find(x=>x.id==="drone");
primary.hp=0;
battle.endPlayerTurn();
assert.equal(battle.getState().combatComplete,false);
assert(battle.getState().round>=2,"squad turn failed to return control");
const after=battle.getState();
const alive=after.units.filter(x=>x.hp>0);
assert.equal(new Set(alive.map(x=>x.x+","+x.y)).size,alive.length,
 "squad AI illegally overlaps another actor");
console.log("RC19 SQUAD PASS: "+encounters+
 " multi-hostile story encounters, legal spawns, selectable wing skills, zero early rewards and safe enemy turns.");
