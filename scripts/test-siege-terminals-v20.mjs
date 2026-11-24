import assert from "node:assert/strict";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,ctx,next){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&
   !/\.[cm]?[jt]s$/.test(specifier))return next(specifier+".ts",ctx);
 return next(specifier,ctx);
}});
const {TurnManager}=await import("../src/game/TurnManager.ts");
const {TACTICAL_SIEGE_IDS}=await import("../src/game/combat/tactical-maps.ts");
const {SIEGE_TERMINAL_NAMES}=await import("../src/game/combat/siege-terminals.ts");
assert.equal(Object.keys(SIEGE_TERMINAL_NAMES).length,7);
const outcomes=new Set();
for(const id of TACTICAL_SIEGE_IDS){
 const arena=new TurnManager({encounterId:id});
 const before=arena.state;
 before.units[0].hp-=5;
 before.energy=before.maxEnergy-6;
 before.suppressionTurns=1;
 const oldHP=before.units[0].hp;
 const oldEnergy=before.energy;
 const oldMoves=before.movementRemaining;
 const site=arena.getArenaLayout().site;
 arena.interactWithTerminal(0,6);
 const after=arena.getState();
 assert.equal(after.terminalUsed,true,id+" must mark terminal consumed");
 assert.ok(after.energy>=oldEnergy,id+" should not lower energy");
 assert.ok(after.message.includes(SIEGE_TERMINAL_NAMES[site])||
  site==="water"||site==="furnace"||site==="records"||site==="ventilation"||
  site==="quarantine"||site==="broadcast"||site==="road");
 assert.ok(after.cue?.visual==="terminal");
 switch(site){
  case "water":assert.equal(after.units[0].hp,oldHP+4);break;
  case "furnace":assert.equal(after.enemyJamTurns,1);break;
  case "records":assert.equal(after.classNextAccuracyBonus,3);break;
  case "ventilation":
   assert.equal(after.suppressionTurns,0);
   assert.equal(after.movementRemaining,oldMoves+2);break;
  case "quarantine":assert.equal(after.barrierTurns,2);break;
  case "broadcast":assert.equal(after.enemyJamTurns,1);
   assert.equal(after.energy,oldEnergy+3);break;
  case "road":assert.equal(after.movementRemaining,oldMoves+3);break;
 }
 outcomes.add(after.message);
 arena.interactWithTerminal(0,6);
 assert.equal(arena.getState().energy,after.energy,"No repeated energy");
 assert.equal(arena.getState().units[0].hp,after.units[0].hp,"No repeated healing");
}
assert.equal(outcomes.size,7,"All terminals need distinct effects and writing");
const legacy=new TurnManager({encounterId:"test"});
legacy.interactWithTerminal(0,6);
assert.equal(legacy.getState().terminalUsed,false);
legacy.state.energy=4;
legacy.interactWithTerminal(0,6);
assert.equal(legacy.getState().energy,7);
assert.equal(legacy.getState().terminalUsed,true);
console.log("Seven council battlefield terminals: separate gameplay effects, no repeat exploits; old test arena unchanged.");
