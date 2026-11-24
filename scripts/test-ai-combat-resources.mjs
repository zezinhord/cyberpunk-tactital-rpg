import assert from "node:assert/strict";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,context,next){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&
    !/\.[cm]?[jt]s$/.test(specifier))return next(specifier+".ts",context);
 return next(specifier,context);
}});
const {capacityForEnemy,initializeEnemyTactics,enemyTacticTurn}=
 await import("../src/game/ai/enemy-resources.ts");
const {decideEnemy,hearEnemy,initialEnemyMemory}=
 await import("../src/game/ai/tactical-brain.ts");
const {enemyProfile}=await import("../src/game/tactics.ts");
const {TurnManager}=await import("../src/game/TurnManager.ts");

assert.equal(capacityForEnemy("helix"),0);
assert.equal(capacityForEnemy("sniper"),0);
assert.equal(capacityForEnemy("suppressor"),2);
assert.equal(capacityForEnemy("saboteur"),2);
const start=initializeEnemyTactics("suppressor");
const first=enemyTacticTurn(start,"suppressor",true,10);
assert.equal(first.device,"suppression");
assert.equal(first.next.charges,1);
assert.equal(first.next.cooldown,1);
const cooldown=enemyTacticTurn(first.next,"suppressor",true,10);
assert.equal(cooldown.device,null,"An enemy cannot bypass device cooldown");
assert.equal(cooldown.next.cooldown,0);
const second=enemyTacticTurn(cooldown.next,"suppressor",true,10);
assert.equal(second.next.charges,0);
assert.equal(enemyTacticTurn(second.next,"suppressor",true,10).device,null);
assert.equal(enemyTacticTurn(start,"suppressor",false,10).next.charges,2,
 "Blocked action cannot waste a device charge");
assert.equal(enemyTacticTurn(initializeEnemyTactics("saboteur"),
 "saboteur",true,0).device,null,
 "No energy means no needless sabotage resource use");
assert.equal(enemyTacticTurn(start,"saboteur",true,10).next.charges,1,
 "New wave gets its own capped resources");

const make=(encounter,wave)=>{
 const t=new TurnManager({encounterId:encounter});
 t.state.wave=wave;
 const [player,enemy]=t.state.units;
 player.x=1;player.y=6;player.hp=100;player.maxHp=100;
 enemy.x=1;enemy.y=4;enemy.hp=50;enemy.maxHp=50;
 return t;
};
const oldRandom=Math.random;
try{
 Math.random=()=>0.99999; // natural 20: deterministic legal hit
 const suppressor=make("district-setor-zero",2);
 suppressor.endPlayerTurn();
 assert.equal(suppressor.state.enemyTacticalCharges,1,
  "First suppressor shot consumes one device charge");
 assert.equal(suppressor.state.movementRemaining,
  suppressor.state.movementPerTurn-2);
 suppressor.endPlayerTurn();
 assert.equal(suppressor.state.enemyTacticalCharges,1,
  "Second shot must be a basic attack during cooldown");
 assert.equal(suppressor.state.movementRemaining,
  suppressor.state.movementPerTurn,"Cooldown must not repeat suppression");
 suppressor.endPlayerTurn();
 assert.equal(suppressor.state.enemyTacticalCharges,0,
  "Third turn may use final charge");
 suppressor.endPlayerTurn();
 assert.equal(suppressor.state.enemyTacticalCharges,0,
  "Fifth special charge must never materialize");

 const saboteur=make("district-subsolo",2);
 saboteur.state.energy=7;
 saboteur.endPlayerTurn();
 assert.equal(saboteur.state.enemyTacticalCharges,1);
 assert.equal(saboteur.state.energy,5,
  "Real sabotage must drain actual energy, without passive refund");
 saboteur.endPlayerTurn();
 assert.equal(saboteur.state.enemyTacticalCharges,1,
  "Cooldown prevents repeated sabotage each enemy turn");
 assert.ok(saboteur.state.energy>=5,
  "Basic attack never invents another sabotage drain");

 const jammed=make("district-setor-zero",2);
 jammed.state.enemyJamTurns=1;
 jammed.endPlayerTurn();
 assert.equal(jammed.state.enemyTacticalCharges,2,
  "EMP prevents hostile action without consuming device charges");

 const nextWave=new TurnManager({encounterId:"district-setor-zero"});
 nextWave.state.units[0].x=6;nextWave.state.units[0].y=2;
 nextWave.state.units[1].x=6;nextWave.state.units[1].y=1;
 nextWave.state.units[1].hp=1;
 nextWave.attack();
 assert.equal(nextWave.state.wave,1,
  "RC19: captain death cannot skip a living wing");
 assert.equal(nextWave.state.units[1].hp,0);
 nextWave.state.units.filter(unit=>unit.side==="enemy").forEach(unit=>{
  unit.hp=0;
 });
 nextWave.resolveEnemyDown();
 assert.equal(nextWave.state.wave,2,
  "Wave progresses only when all squad members are neutralized");
 assert.equal(nextWave.state.enemyTacticalCharges,2,
  "Only a genuinely new enemy/wave receives fresh charges");
}finally{Math.random=oldRandom;}

const e={id:"drone",name:"Guard",side:"enemy",x:5,y:2,hp:20,maxHp:20,
 armorClass:13,attackBonus:4};
const p={id:"runner",name:"Operative",side:"player",x:1,y:2,
 hp:18,maxHp:18,armorClass:12,attackBonus:5};
const profile=enemyProfile("district-aurea",1);
const audible=hearEnemy(initialEnemyMemory(),{x:2,y:2},1,8);
const investigated=decideEnemy(e,p,[e,p],profile,audible,1);
assert.equal(investigated.memory.lastKnownSense,"sound");
assert.deepEqual(investigated.memory.lastKnown,{x:2,y:2});
const nextSearch=decideEnemy(e,p,[e,p],profile,investigated.memory,2);
assert.deepEqual(nextSearch.memory.lastKnown,{x:2,y:2},
 "Sound memory must persist beyond the first turn");
const lastSearch=decideEnemy(e,p,[e,p],profile,nextSearch.memory,3);
assert.ok(lastSearch.memory.lastKnown);
const gone=decideEnemy(e,p,[e,p],profile,lastSearch.memory,4);
assert.equal(gone.memory.lastKnown,null,
 "Audio memory must expire and resume ordinary patrol");
console.log("Enemy devices and sound memory: finite charges, cooldowns, misses, EMP, new waves and multi-turn audio search passed.");
