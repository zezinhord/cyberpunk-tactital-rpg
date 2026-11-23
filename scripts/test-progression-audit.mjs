import assert from "node:assert/strict";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,context,next){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&
  !/\.[cm]?[jt]s$/.test(specifier))return next(specifier+".ts",context);
 return next(specifier,context);
}});
const {levelExperienceProgress,levelAtXp,LEVEL_XP,gainExperience,
 grantUniqueExperience,availableSkillPoints,purchaseSkill,skillEffectPreview}=
 await import("../src/game/progression/tree.ts");
const {createPlayerCharacter}=await import("../src/game/character/storage.ts");
const {CLASS_IDS,ALL_CLASS_SKILLS}=await import("../src/game/classes/registry.ts");
const {checkClassSkill,executeClassSkill}=await import("../src/game/classes/engine.ts");
const {readFileSync}=await import("node:fs");

// Do not change the historic XP curve, unlocks, or purchased save IDs.
for(let i=0;i<LEVEL_XP.length-1;i++){
 const start=LEVEL_XP[i],end=LEVEL_XP[i+1];
 const beginning=levelExperienceProgress({level:i+1,experience:start});
 assert.deepEqual([beginning.earned,beginning.remaining,beginning.percent],
  [0,end-start,0],"New levels must start with an empty XP meter");
 const almost=levelExperienceProgress({level:i+1,experience:end-1});
 assert.equal(almost.earned,end-start-1);
 assert.equal(almost.remaining,1);
 assert.ok(almost.percent<100&&almost.percent>0);
 assert.equal(levelAtXp(end),i+2);
}
assert.equal(levelExperienceProgress({level:10,experience:900}).nextLevel,null);
assert.equal(levelExperienceProgress({level:10,experience:900}).percent,100);
assert.equal(levelExperienceProgress({level:7,experience:75}).percent,0,
 "An upgraded legacy level with insufficient XP must not show negative progress");
assert.equal(levelExperienceProgress({level:2,experience:99}).percent,100,
 "A loaded XP milestone cannot overflow the visible level bar");

let a=createPlayerCharacter("QA","baixada","medtech");
a=gainExperience(a,75).character;
assert.equal(a.level,3);
assert.equal(availableSkillPoints(a),4);
const bought=purchaseSkill(a,"medtech-estimulante");
assert.equal(bought.ok,true);
assert.equal(availableSkillPoints(bought.character),3);
assert.equal(grantUniqueExperience(a,"quest-unique-v09",45).awarded,true);
assert.equal(grantUniqueExperience(
 grantUniqueExperience(a,"quest-unique-v09",45).character,
 "quest-unique-v09",45).awarded,false,
 "A campaign receipt must never issue duplicate XP");
for(const id of CLASS_IDS){
 assert.equal(typeof ALL_CLASS_SKILLS[Object.keys(ALL_CLASS_SKILLS).find(s=>ALL_CLASS_SKILLS[s].classId===id)].id,"string",
  "All eleven classes must expose a combat skill");
}
const make=(id,{hp=30,energy=10,guard=0,armorDebuff=0,nextDamage=0}={})=>{
 const skill=ALL_CLASS_SKILLS[id];
 assert.ok(skill,"Missing skill "+id);
 return {
  units:[{id:"runner",hp,maxHp:30,armorClass:12,attackBonus:3,x:1,y:1},
   {id:"drone",hp:30,maxHp:30,armorClass:13,attackBonus:4,x:2,y:1}],
  classId:skill.classId,characterLevel:10,characterAbilities:[id],
  characterSkillRanks:{[id]:1},energy,maxEnergy:20,
  mainActionAvailable:true,activeSide:"player",combatComplete:false,
  classCooldowns:{},classGuardBonus:guard?3:0,classGuardTurns:guard,
  classEnemyArmorTurns:armorDebuff,classEnemyArmorReduction:armorDebuff?3:0,
  classEnemyAttackTurns:0,classEnemyAttackReduction:0,
  classNextDamageBonus:nextDamage,classNextAccuracyBonus:0,
  classExtraMovement:0,movementRemaining:3,movementPerTurn:6,enemyJamTurns:0,
  message:""
 };
};
// Healing + armor: full HP should not suppress usable protection.
{
 const state=make("medtech-triagem");
 assert.equal(checkClassSkill(state,ALL_CLASS_SKILLS["medtech-triagem"]).available,true);
 assert.equal(executeClassSkill(state,ALL_CLASS_SKILLS["medtech-triagem"]).ok,true);
 assert.equal(state.units[0].hp,30);
 assert.equal(state.units[0].armorClass,13);
 assert.equal(state.energy,7);
}
// Conversely, existing protection must not prevent an actual heal or stack armor.
{
 const state=make("medtech-triagem",{hp:19,guard:2});
 assert.equal(checkClassSkill(state,ALL_CLASS_SKILLS["medtech-triagem"]).available,true);
 assert.equal(executeClassSkill(state,ALL_CLASS_SKILLS["medtech-triagem"]).ok,true);
 assert.equal(state.units[0].hp,27);
 assert.equal(state.units[0].armorClass,12,"Do not stack an existing guard");
 assert.equal(state.classGuardTurns,2,"Existing guard duration stays unchanged");
}
// Damage + debuff: while a debuff is active, damage must stay usable.
{
 const state=make("solo-marca",{armorDebuff:2});
 assert.equal(checkClassSkill(state,ALL_CLASS_SKILLS["solo-marca"]).available,true);
 assert.equal(executeClassSkill(state,ALL_CLASS_SKILLS["solo-marca"]).ok,true);
 assert.equal(state.units[1].hp,25);
 assert.equal(state.units[1].armorClass,13,"Active debuffs may not stack");
 assert.equal(state.classEnemyArmorTurns,2);
}
// Focus + movement: allow mobility without stacking a second next-hit buff.
{
 const state=make("rockerboy-levante",{nextDamage:3});
 assert.equal(checkClassSkill(state,ALL_CLASS_SKILLS["rockerboy-levante"]).available,true);
 assert.equal(executeClassSkill(state,ALL_CLASS_SKILLS["rockerboy-levante"]).ok,true);
 assert.equal(state.classNextDamageBonus,3);
 assert.equal(state.movementRemaining,4);
}
// A pure heal with no missing HP must remain blocked without consuming EN.
{
 // Take an actual single-effect healing skill from the 11-class registry.
 const pure=Object.values(ALL_CLASS_SKILLS).find(s=>s.classId==="medtech"&&
  s.effects.length===1&&s.effects[0].type==="heal");
 assert.ok(pure,"Medical healing-only skill must exist");
 const state=make(pure.id);
 const previous=state.energy;
 assert.equal(checkClassSkill(state,pure).available,false);
 assert.equal(executeClassSkill(state,pure).ok,false);
 assert.equal(state.energy,previous);
}
// Both empty components must never consume an action for no actual effect.
{
 const state=make("medtech-triagem",{guard:1});
 assert.equal(checkClassSkill(state,ALL_CLASS_SKILLS["medtech-triagem"]).available,false);
 assert.equal(state.mainActionAvailable,true);
}
const ui=readFileSync("src/components/ProgressionTree.tsx","utf8");
assert.ok(ui.includes("levelExperienceProgress(character)"));
assert.ok(ui.includes("Grau atual:")&&ui.includes("Próximo grau:"),
 "Current ability effects and upgraded effects must both be visible");
const picker=readFileSync("src/components/CombatAbilityPicker.tsx","utf8");
assert.ok(picker.includes("skillEffectPreview(skill,rank)"),
 "Combat must show the EXACT effects of the purchased skill rank");
assert.ok(picker.includes("EFEITO NO GRAU")&&picker.includes("GRAU "),
 "Purchased upgrades must be visibly identified in the skill picker");
console.log("Progression audit: 10 XP thresholds, 11 classes, unique XP, safe mixed skills and rank previews passed.");
