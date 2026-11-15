import assert from "node:assert/strict";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,context,nextResolve){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&!/\.[cm]?[jt]s$/.test(specifier))
   return nextResolve(specifier+".ts",context);
 return nextResolve(specifier,context);
}});
const {hasLineOfSight,coverBetween,coverArmorBonus}=await import("../src/game/map.ts");
const {planEnemyTurn,enemyProfile,withinShot}=await import("../src/game/tactics.ts");
const {TurnManager}=await import("../src/game/TurnManager.ts");
assert.equal(hasLineOfSight({x:1,y:2},{x:5,y:2}),false,"Tiro atravessou parede");
assert.equal(hasLineOfSight({x:1,y:6},{x:1,y:2}),true,"Linha livre negada");
assert.equal(hasLineOfSight({x:2,y:2},{x:4,y:4}),false,"Tiro cruzou canto sólido");
assert.equal(coverBetween({x:1,y:2},{x:5,y:2}),"full");
assert.equal(coverBetween({x:1,y:6},{x:1,y:2}),"none");
assert.equal(coverArmorBonus({x:1,y:6},{x:1,y:2}),0);
assert.equal(coverBetween({x:1,y:1},{x:3,y:0}),"partial");
assert.equal(coverArmorBonus({x:1,y:1},{x:3,y:0}),2);
assert.equal(withinShot({x:1,y:2},{x:5,y:2},6),false,"Alcance não pode atravessar parede");
const melee=new TurnManager({encounterId:"test"});
assert.equal(melee.getBasicAttackPreview().range,1);
assert.equal(melee.canAttack(),false);
melee.state.units[0].x=2;melee.state.units[0].y=0;
melee.state.units[1].x=1;melee.state.units[1].y=0;
melee.movePlayerTo(2,1);
assert.ok(melee.getState().cue?.path?.length>=2,"Animação recebeu caminho tático");

const equipped=new TurnManager({encounterId:"v09",weaponId:"pistola_manutencao"});
assert.equal(equipped.getBasicAttackPreview().range,4);
const covered=new TurnManager({encounterId:"v09",weaponId:"pistola_inducao"});
covered.state.units[0].x=1;covered.state.units[0].y=1;
covered.state.units[1].x=3;covered.state.units[1].y=0;
const coveredPreview=covered.getBasicAttackPreview();
assert.equal(coveredPreview.cover,"partial");
assert.equal(coveredPreview.defense,covered.state.units[1].armorClass+2);
assert.equal(coveredPreview.available,true);
const oldRandom=Math.random;
Math.random=()=>0.99;
try{
 const hp=covered.state.units[1].hp;
 covered.attack();
 assert.equal(covered.state.mainActionAvailable,false);
 assert.ok(covered.state.units[1].hp<hp,"Pistola equipada não causou dano real");
}finally{Math.random=oldRandom;}
const hacker=new TurnManager({
 classId:"netrunner",originId:"baixada",characterLevel:1,
 characterAbilities:["netrunner-intrusao"]
});
hacker.state.units[0].x=1;hacker.state.units[0].y=2;
hacker.state.units[1].x=5;hacker.state.units[1].y=2;
assert.equal(hacker.getClassAvailability("netrunner-intrusao").available,true,
 "Intrusão digital não exige linha visual de disparo");
hacker.activateClassAbility("netrunner-intrusao");
assert.equal(hacker.state.enemyJamTurns,1);
assert.equal(hacker.state.units[1].hp,hacker.state.units[1].maxHp-3);
assert.ok(equipped.getEnemyIntent().length>2);
const player=equipped.state.units[0],enemy=equipped.state.units[1];
player.x=1;player.y=2;enemy.x=5;enemy.y=2;
assert.equal(equipped.canAttack(),false,"Pistola atravessou parede");
const energy=equipped.state.energy;
equipped.attack();
assert.equal(equipped.state.mainActionAvailable,true,"Tiro inválido gastou ação");
assert.equal(equipped.state.energy,energy);
player.x=1;player.y=6;enemy.x=1;enemy.y=2;
assert.equal(equipped.canAttack(),true,"Pistola com linha de visão negada");
equipped.state.mainActionAvailable=false;
assert.equal(equipped.canAttack(),false);
const ai=planEnemyTurn(enemy,player,equipped.state.units,enemyProfile("v09",1));
assert.ok(["attack","reposition","advance","blocked"].includes(ai.action));
assert.equal(enemyProfile("test",1).range,1);
const helixPlayer={id:"runner",name:"Operativo",side:"player",x:1,y:1,hp:18,maxHp:18,armorClass:13,attackBonus:5};
const helixEnemy={id:"drone",name:"Agente",side:"enemy",x:2,y:0,hp:14,maxHp:14,armorClass:13,attackBonus:4};
const coverPlan=planEnemyTurn(helixEnemy,helixPlayer,[helixPlayer,helixEnemy],enemyProfile("district-aurea",1));
assert.equal(coverPlan.action,"reposition","Agente Helix não buscou a cobertura disponível");
assert.deepEqual(coverPlan.target,{x:3,y:0});
assert.equal(coverPlan.cover,"partial");

assert.ok(enemyProfile("district-setor-zero",3).range>=3);
console.log("Tática: LoS, obstrução, cobertura, arma de fogo, economia e IA aprovados.");
