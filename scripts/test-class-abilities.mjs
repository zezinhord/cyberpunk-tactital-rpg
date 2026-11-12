import assert from "node:assert/strict";
import {isPlayableClass,getClassSkills} from "../src/game/classes/registry.ts";
import {checkClassSkill,executeClassSkill,advanceClassRound,advanceClassGuard} from "../src/game/classes/engine.ts";
assert.equal(isPlayableClass("baixada"),false,"Origem não pode virar classe.");
assert.deepEqual(getClassSkills(null),[]);
const game=()=>({
  units:[{id:"runner",x:1,y:1,hp:10,maxHp:18,armorClass:12},{id:"drone",x:2,y:1,hp:14,maxHp:14}],
  classId:"class-approved-test",characterLevel:1,characterAbilities:[],
  energy:10,mainActionAvailable:true,activeSide:"player",combatComplete:false,
  classCooldowns:{},classGuardBonus:0,classGuardTurns:0,enemyJamTurns:0,message:"",
});
const skill={id:"exclusive-pilot",classId:"class-approved-test",name:"Ataque de teste",role:"offense",
  description:"",cost:4,cooldown:2,range:2,minimumLevel:1,damage:7,healing:0,
  armorBonus:0,armorDuration:0,jamTurns:0,area:0,visual:"hit"};
const st=game();
assert.equal(checkClassSkill(st,skill).available,true);
assert.equal(executeClassSkill(st,skill).ok,true);
assert.equal(st.units[1].hp,7);
assert.equal(st.energy,6);
assert.equal(executeClassSkill(st,skill).ok,false);
advanceClassRound(st);assert.equal(st.classCooldowns[skill.id],2);
const guard=game();
assert.equal(executeClassSkill(guard,{...skill,id:"defense-pilot",damage:0,armorBonus:3,armorDuration:2,role:"defense"}).ok,true);
assert.equal(guard.units[0].armorClass,15);
advanceClassGuard(guard);assert.equal(guard.units[0].armorClass,15);
advanceClassGuard(guard);assert.equal(guard.units[0].armorClass,12);
console.log("Classes: origem/classe isoladas, ataque real, energia, recarga e defesa expirável.");
