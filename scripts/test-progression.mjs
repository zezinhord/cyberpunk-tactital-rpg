import assert from "node:assert/strict";
import {CLASS_IDS,ADVANCED_CLASS_SKILLS,ALL_CLASS_SKILLS,
 getClassSkills,getClassBranches,getStartingClassAbilities} from "../src/game/classes/registry.ts";
import {BRANCH_CLASS_SKILLS,MASTER_BRANCH_SKILLS} from "../src/game/classes/branches.ts";
import {createPlayerCharacter,loadCharacter,saveCharacter,parseCharacterSave} from "../src/game/character/storage.ts";
import {gainExperience,grantUniqueExperience,levelAtXp,purchaseAttribute,purchaseSkill,
 availableAttributePoints,availableSkillPoints,combatProgression,statBreakdown,getSkillRank,
 normalizeProgression,skillPrerequisite,skillEffectPreview,STAT_IDS,MAX_LEVEL,LEVEL_XP} from "../src/game/progression/tree.ts";
import {executeClassSkill} from "../src/game/classes/engine.ts";

const db=new Map();
globalThis.localStorage={
 getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k),
};
const clearSlots=()=>db.clear();
assert.equal(levelAtXp(0),1);
assert.equal(levelAtXp(29),1);
assert.equal(levelAtXp(30),2);
assert.equal(levelAtXp(75),3);
assert.equal(levelAtXp(900),MAX_LEVEL);
assert.equal(LEVEL_XP.length,MAX_LEVEL);
assert.equal(STAT_IDS.length,5);
assert.equal(Object.keys(ADVANCED_CLASS_SKILLS).length,22);
assert.equal(Object.keys(BRANCH_CLASS_SKILLS).length,33);
assert.equal(Object.keys(MASTER_BRANCH_SKILLS).length,33);
assert.equal(Object.keys(ALL_CLASS_SKILLS).length,99);
const signatures=new Set;
for(const classId of CLASS_IDS){
 clearSlots();
 let a=createPlayerCharacter("Origem A","militar",classId);
 let b=createPlayerCharacter("Origem B","pesquisador",classId);
 assert.equal(a.level,1);
 assert.equal(availableAttributePoints(a),0);
 assert.equal(availableSkillPoints(a),0);
 assert.deepEqual(getStartingClassAbilities(classId),[getClassSkills(classId)[0].id]);
 assert.notDeepEqual(statBreakdown(a,"vigor"),statBreakdown(b,"vigor"),
   "Origem diferente deve alterar a ficha de nível 1");
 const roots=getClassBranches(classId);
 assert.equal(roots.length,3,classId+" precisa três especializações");
 assert.equal(new Set(roots.map(x=>x.id)).size,3);
 assert.equal(getClassSkills(classId).length,9,classId+" precisa nove nós reais");
 assert.equal(new Set(roots.flatMap(x=>x.skillIds)).size,9);
 signatures.add(roots.map(x=>x.name).join("|"));
 for(const path of roots){
   assert.equal(path.skillIds.length,3);
   assert.ok(getClassSkills(classId).some(s=>s.id===path.skillIds[0]));
   assert.ok(getClassSkills(classId).some(s=>s.id===path.skillIds[1]));
   assert.equal(skillPrerequisite(path.skillIds[1]),path.skillIds[0]);
   assert.equal(skillPrerequisite(path.skillIds[2]),path.skillIds[1]);
   assert.equal(ALL_CLASS_SKILLS[path.skillIds[2]].minimumLevel>=7,true);
 }
 const root=roots[0].skillIds[0],child=roots[0].skillIds[1];
 assert.equal(getSkillRank(a,root),1,"Grau inicial gratuito");
 assert.equal(purchaseSkill(a,child).ok,false,"Sem ignorar nível de acesso");
 assert.equal(purchaseSkill(a,"other-class").ok,false);
 let exp=grantUniqueExperience(a,"enemy-trial-1",16);
 assert.equal(exp.awarded,true);
 assert.equal(exp.character.experience,16);
 assert.equal(grantUniqueExperience(exp.character,"enemy-trial-1",16).awarded,false);
 exp=grantUniqueExperience(exp.character,"trial-brief",64);
 assert.equal(exp.levelsGained,2);
 a=exp.character;
 assert.equal(a.level,3);
 assert.equal(availableAttributePoints(a),4);
 assert.equal(availableSkillPoints(a),4);
 const before=combatProgression(a);
 const up=purchaseAttribute(a,"precisao");assert.equal(up.ok,true);a=up.character;
 assert.equal(combatProgression(a).attack,before.attack+1);
 const vigor=purchaseAttribute(a,"vigor");assert.equal(vigor.ok,true);a=vigor.character;
 assert.equal(combatProgression(a).hp,before.hp+3);
 for(const id of ["reflexos","interface"]){
   const updated=purchaseAttribute(a,id);assert.equal(updated.ok,true);a=updated.character;
 }
 assert.equal(availableAttributePoints(a),0);
 assert.equal(purchaseAttribute(a,"influencia").ok,false);
 const upgraded=purchaseSkill(a,root);
 assert.equal(upgraded.ok,true, classId+" habilidade inicial não aprimorável");
 a=upgraded.character;
 assert.equal(getSkillRank(a,root),2);
 assert.equal(availableSkillPoints(a),3);
 const rootB=roots[1].skillIds[0];
 const bought=purchaseSkill(a,rootB);assert.equal(bought.ok,true);a=bought.character;
 assert.equal(getSkillRank(a,rootB),1);
 const rootC=roots[2].skillIds[0];
 const boughtC=purchaseSkill(a,rootC);assert.equal(boughtC.ok,true);a=boughtC.character;
 assert.equal(getSkillRank(a,rootC),1);
 assert.equal(saveCharacter(a),true);
 const restored=loadCharacter();
 assert.ok(restored);
 assert.equal(restored.level,3);
 assert.equal(restored.experience,80);
 assert.equal(restored.classId,classId);
 assert.equal(restored.originId,"militar");
 assert.equal(getSkillRank(restored,root),2);
 for(const id of STAT_IDS)assert.equal(restored.attributes[id]??0,a.attributes[id]??0,
   "Atributo distribuído deve sobreviver ao salvamento");
 assert.equal(availableSkillPoints(restored),1);
 assert.equal(grantUniqueExperience(restored,"enemy-trial-1",16).awarded,false);
 const legacy={...restored,baseAttributes:undefined,originStatBonuses:undefined,
   classStatBonuses:undefined,skillRanks:undefined};
 const parsed=parseCharacterSave(JSON.stringify({version:1,character:legacy}));
 assert.ok(parsed,"Saves legados devem carregar sem perda de níveis, XP e compras");
 assert.equal(parsed.level,3);
 assert.equal(statBreakdown(parsed,"precisao").origin,1);
 assert.equal(statBreakdown(parsed,"precisao").profession,
   statBreakdown(restored,"precisao").profession);
 const later=gainExperience(restored,500).character;
 assert.equal(later.level>=6,true);
 assert.equal(purchaseSkill(later,child).ok,true);
 const exploit={...later,skillRanks:{[root]:999,[rootB]:999,[rootC]:999},
   abilities:[...later.abilities,"other-class","nomade-arrancada"],
   attributes:Object.fromEntries(STAT_IDS.map(id=>[id,99]))};
 const sanitized=normalizeProgression(exploit);
 assert.ok(availableSkillPoints(sanitized)>=0);
 assert.ok(availableAttributePoints(sanitized)>=0);
 assert.ok(STAT_IDS.every(id=>statBreakdown(sanitized,id).total<=5));
 assert.equal(sanitized.abilities.includes("other-class"),false);
 if(classId!=="nomade")assert.equal(sanitized.abilities.includes("nomade-arrancada"),false);
 // Os graus mudam os números no mesmo interpretador de efeitos utilizado no APK.
 const ability=ALL_CLASS_SKILLS[root];
 assert.notEqual(skillEffectPreview(ability,1),skillEffectPreview(ability,2),
   "A prévia deve explicitar a diferença mecânica entre os graus");
 const state=(rank)=>({
   units:[{id:"runner",name:"Operativo",side:"player",x:1,y:1,hp:4,maxHp:30,armorClass:12,attackBonus:5},
    {id:"drone",name:"Sentinela",side:"enemy",x:2,y:1,hp:40,maxHp:40,armorClass:13,attackBonus:4}],
   classId,originId:"militar",characterLevel:3,characterAbilities:[root],
   characterSkillRanks:{[root]:rank},energy:10,maxEnergy:20,
   mainActionAvailable:true,activeSide:"player",combatComplete:false,
   classCooldowns:{},classGuardBonus:0,classGuardTurns:0,classExtraMovement:0,
   classNextDamageBonus:0,classNextAccuracyBonus:0,
   classEnemyArmorReduction:0,classEnemyArmorTurns:0,classEnemyAttackReduction:0,
   classEnemyAttackTurns:0,movementRemaining:3,movementPerTurn:6,
   enemyJamTurns:0,message:"",
 });
 const basic=state(1),high=state(2);
 assert.equal(executeClassSkill(basic,ability).ok,true);
 assert.equal(executeClassSkill(high,ability).ok,true);
 const changed=JSON.stringify({
   unit:basic.units,energy:basic.energy,movement:basic.movementRemaining,
   extra:basic.classNextDamageBonus,accuracy:basic.classNextAccuracyBonus,
   guard:basic.classGuardBonus,armor:basic.classEnemyArmorReduction,
   attack:basic.classEnemyAttackReduction,
 });
 const advanced=JSON.stringify({
   unit:high.units,energy:high.energy,movement:high.movementRemaining,
   extra:high.classNextDamageBonus,accuracy:high.classNextAccuracyBonus,
   guard:high.classGuardBonus,armor:high.classEnemyArmorReduction,
   attack:high.classEnemyAttackReduction,
 });
 assert.notEqual(changed,advanced,"Aprimorar "+root+" precisa alterar combate");
}
assert.equal(signatures.size,11,"Todas as classes precisam de ramos temáticos diferentes");
assert.equal(gainExperience(createPlayerCharacter("X","baixada","solo"),-3).levelsGained,0);
console.log("Progressão: 11 classes, 33 ramos, 99 técnicas, habilidades de domínio, ranks, XP e saves aprovados.");
