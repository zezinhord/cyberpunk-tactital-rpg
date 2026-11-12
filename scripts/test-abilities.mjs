/** Testes determinísticos do motor de habilidades, sem Phaser ou React. */
import assert from "node:assert/strict";
import { checkSpecial, useSpecial, advanceSpecialRound, isEnemyJammed, advanceBarrierAfterEnemyAction } from "../src/game/abilities/engine.ts";
import { SPECIALS } from "../src/game/abilities/catalog.ts";

function game() {
  return {
    units: [
      { id:"runner", side:"player", name:"Operativo", x:1,y:6,hp:12,maxHp:18,armorClass:12,attackBonus:5 },
      { id:"drone", side:"enemy", name:"Sentinela", x:2,y:6,hp:16,maxHp:16,armorClass:13,attackBonus:4 },
    ],
    activeSide:"player",round:1,movementRemaining:6,movementPerTurn:6,
    mainActionAvailable:true,bonusActionAvailable:true,originAbilityAvailable:false,originAbilityName:"",
    combatComplete:false,message:"",log:[], energy:10,maxEnergy:10,
    cooldowns:{"pulse-emp":0,barrier:0,regeneration:0},barrierTurns:0,enemyJamTurns:0,terminalUsed:false,
    cue:null,
  };
}

assert.equal(SPECIALS["pulse-emp"].cost,3);
assert.equal(SPECIALS.barrier.armorBonus,3);

const emp=game();
assert.equal(useSpecial(emp,"pulse-emp").ok,true);
assert.equal(emp.units[1].hp,11);
assert.equal(emp.enemyJamTurns,1);
assert.equal(emp.energy,7);
assert.equal(isEnemyJammed(emp),true);
assert.equal(isEnemyJammed(emp),false);
assert.equal(checkSpecial(emp,"pulse-emp").available,false);
advanceSpecialRound(emp);
assert.equal(emp.cooldowns["pulse-emp"],2);

const guard=game();
assert.equal(useSpecial(guard,"barrier").ok,true);
assert.equal(guard.units[0].armorClass,15);
assert.equal(advanceBarrierAfterEnemyAction(guard),false);
assert.equal(guard.units[0].armorClass,15);
assert.equal(advanceBarrierAfterEnemyAction(guard),true);
assert.equal(guard.units[0].armorClass,12);
assert.equal(advanceBarrierAfterEnemyAction(guard),false);
assert.equal(guard.units[0].armorClass,12);

const heal=game();
assert.equal(useSpecial(heal,"regeneration").ok,true);
assert.equal(heal.units[0].hp,18);
assert.equal(heal.energy,6);
assert.equal(heal.mainActionAvailable,false);
const full=game();
full.units[0].hp=18;
assert.equal(checkSpecial(full,"regeneration").available,false);
assert.equal(full.energy,10);

const far=game();
far.units[1].x=7;far.units[1].y=1;
assert.equal(checkSpecial(far,"pulse-emp").available,false);
assert.equal(far.energy,10);
assert.equal(useSpecial(far,"pulse-emp").ok,false);
assert.equal(far.energy,10);

console.log("Habilidades: 16 verificações básicas aprovadas.");
