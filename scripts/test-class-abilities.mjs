import assert from "node:assert/strict";
import { CLASS_IDS,PLAYABLE_CLASSES,CLASS_SKILLS,getClassSkills,getAllClasses,
 isPlayableClass,getStartingClassAbilities } from "../src/game/classes/registry.ts";
import { checkClassSkill,executeClassSkill,advanceClassRound,
 advanceClassGuard,advanceClassEnemyDebuffs } from "../src/game/classes/engine.ts";

const ORIGINS=["corporativo","baixada","gangue","militar","pesquisador","nomade"];
assert.equal(CLASS_IDS.length,11);
assert.equal(new Set(CLASS_IDS).size,11,"IDs devem ser únicos");
assert.equal(getAllClasses().length,11);
assert.ok(!isPlayableClass("baixada"),"Origem da Baixada não é classe.");
assert.equal(getClassSkills(null).length,0);
function game(classId,abilityId) {
 return {
  units:[{id:"runner",name:"Jogador",side:"player",x:1,y:1,hp:9,maxHp:20,armorClass:12,attackBonus:5},
   {id:"drone",name:"Drone",side:"enemy",x:2,y:1,hp:18,maxHp:18,armorClass:13,attackBonus:4}],
  classId,originId:"baixada",characterLevel:1,characterAbilities:[abilityId],
  energy:8,maxEnergy:10,mainActionAvailable:true,activeSide:"player",combatComplete:false,
  classCooldowns:{},classGuardBonus:0,classGuardTurns:0,classExtraMovement:0,
  classNextDamageBonus:0,classNextAccuracyBonus:0,
  classEnemyArmorReduction:0,classEnemyArmorTurns:0,
  classEnemyAttackReduction:0,classEnemyAttackTurns:0,
  movementRemaining:3,movementPerTurn:6,enemyJamTurns:0,message:"",
 };
}
let total=0;
const signatures=new Set();
for (const id of CLASS_IDS){
 const classSpec=PLAYABLE_CLASSES[id];
 assert.equal(classSpec.id,id);
 assert.ok(classSpec.name.length>=4);
 assert.ok(classSpec.description.length>15);
 assert.ok(classSpec.explorationFocus.length>8);
 assert.ok(classSpec.specialties.length>=2);
 assert.ok(classSpec.plannedPassive&&classSpec.plannedUltimate&&classSpec.plannedProgression);
 const skills=getClassSkills(id).filter(s=>s.minimumLevel===1);
 assert.ok(skills.length>=1,id+" sem habilidade exclusiva");
 assert.deepEqual(skills.map(s=>s.id),getStartingClassAbilities(id));
 for (const skill of skills) {
  total++;
  assert.equal(skill.classId,id);
  assert.ok(skill.description.length>20);
  assert.ok(skill.cost>0&&skill.cooldown>0);
  assert.ok(skill.effects.length>=1);
  assert.ok(skill.minimumLevel<=1);
  assert.ok(skill.rankNote&&skill.maxRank>=2);
  signatures.add(JSON.stringify(skill.effects));
  const state=game(id,skill.id);
  const before=JSON.stringify({u:state.units,energy:state.energy,movement:state.movementRemaining});
  assert.equal(checkClassSkill(state,skill).available,true,"Inacessível "+id);
  const result=executeClassSkill(state,skill);
  assert.equal(result.ok,true,id+": "+result.message);
  assert.equal(state.mainActionAvailable,false);
  assert.ok(state.energy>=0&&state.energy<=state.maxEnergy);
  assert.equal(state.classCooldowns[skill.id],skill.cooldown+1);
  assert.ok(JSON.stringify({u:state.units,energy:state.energy,movement:state.movementRemaining})!==before,
    "Sem efeito mecânico real: "+id);
  const unavailable=executeClassSkill(state,skill);
  assert.equal(unavailable.ok,false,"Permitiu segunda ativação no mesmo turno");
  assert.equal(state.classCooldowns[skill.id],skill.cooldown+1);
  for (let tick=0;tick<=skill.cooldown;tick++)advanceClassRound(state);
  assert.equal(state.classCooldowns[skill.id],0);
  for(let tick=0;tick<3;tick++){
   advanceClassGuard(state);
   advanceClassEnemyDebuffs(state);
  }
  assert.equal(state.classGuardBonus,0,id+" proteção não expirou");
  assert.equal(state.classEnemyArmorReduction,0,id+" redução de defesa não expirou");
  assert.equal(state.classEnemyAttackReduction,0,id+" redução de ataque não expirou");
  assert.equal(state.units[0].armorClass,12);
  assert.equal(state.units[1].armorClass,13);
  assert.equal(state.units[1].attackBonus,4);
  const wrong=game("solo",skill.id);
  if(id!=="solo")assert.equal(checkClassSkill(wrong,skill).available,false,"Habilidade usada por classe errada: "+id);
  const locked=game(id,"another-id");
  assert.equal(checkClassSkill(locked,skill).available,false,"Habilidade não desbloqueada utilizada");
  const noEnergy=game(id,skill.id);noEnergy.energy=0;
  assert.equal(checkClassSkill(noEnergy,skill).available,false,"Habilidade sem energia");
  if(skill.target==="enemy"){
   const far=game(id,skill.id);far.units[1].x=7;far.units[1].y=7;
   assert.equal(checkClassSkill(far,skill).available,false,"Sem validação de alcance");
  }
 }
}
// 11 estilos mecânicos efetivamente distintos, sem cores/nomes como única diferença.
assert.equal(total,11);
assert.equal(signatures.size,11);
for(const origin of ORIGINS)assert.ok(origin.length>1);
const netrunner=game("netrunner","netrunner-intrusao");
executeClassSkill(netrunner,CLASS_SKILLS["netrunner-intrusao"]);
assert.equal(netrunner.enemyJamTurns,1);
assert.equal(netrunner.units[1].hp,15);
const media=game("midia","midia-denuncia");
executeClassSkill(media,CLASS_SKILLS["midia-denuncia"]);
assert.equal(media.units[1].armorClass,10);
const nomad=game("nomade","nomade-rota");
executeClassSkill(nomad,CLASS_SKILLS["nomade-rota"]);
assert.equal(nomad.movementRemaining,7);
assert.equal(nomad.movementPerTurn,10);
console.log("Classes: 11 oficiais, 11 exclusivas com efeitos distintos, custos, cooldown, alcance, desbloqueio, durações e economia aprovados.");
