import assert from "node:assert/strict";
import {registerHooks} from "node:module";
import {readFileSync} from "node:fs";
registerHooks({resolve(specifier,context,next){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&
   !/\.[cm]?[jt]s$/.test(specifier))return next(specifier+".ts",context);
 return next(specifier,context);
}});
const {CLASS_IDS,ALL_CLASS_SKILLS, getClassById, getClassBranches}=await import("../src/game/classes/registry.ts");
const {getHybridArchetype, MULTICLASS_UNLOCK_LEVEL, MULTICLASS_SKILL_COST,
 SECONDARY_MAX_RANK}=await import("../src/game/classes/hybrids.ts");
const {createPlayerCharacter,saveCharacter,loadCharacter,parseCharacterSave}=
 await import("../src/game/character/storage.ts");
const {gainExperience,purchaseMulticlass,purchaseSkill,availableSkillPoints,
 getSkillRank,combatProgression,normalizeProgression}=await import("../src/game/progression/tree.ts");
const {TurnManager}=await import("../src/game/TurnManager.ts");
const db=new Map();
globalThis.localStorage={getItem:key=>db.get(key)??null,setItem:(key,v)=>db.set(key,String(v)),
 removeItem:key=>db.delete(key),key:i=>[...db.keys()][i]??null,get length(){return db.size;}};
assert.equal(MULTICLASS_UNLOCK_LEVEL,4);
assert.equal(MULTICLASS_SKILL_COST,2);
assert.equal(SECONDARY_MAX_RANK,2);
// Every unordered pair of 11 classes receives one valid mechanically small archetype.
const archetypes=new Set();
let combinationCount=0;
for(let i=0;i<CLASS_IDS.length;i++)for(let k=i+1;k<CLASS_IDS.length;k++){
 const primary=CLASS_IDS[i],secondary=CLASS_IDS[k];
 const a=getHybridArchetype(primary,secondary);
 const inverse=getHybridArchetype(secondary,primary);
 assert.ok(a,"Missing archetype "+primary+"/"+secondary);
 assert.deepEqual(a,inverse,"Role-pair hybrid may not depend on selection order");
 assert.ok(["attack","armor","energy","movement"].includes(a.bonus));
 archetypes.add(a.id);combinationCount++;
}
assert.equal(combinationCount,55);
assert.ok(archetypes.size>=9,"Hybrids should have meaningful archetype diversity");
assert.equal(getHybridArchetype("solo","solo"),null);
assert.equal(getHybridArchetype("solo","unknown"),null);

let original=createPlayerCharacter("Operativo","militar","solo");
assert.equal(original.multiclassId,null);
assert.equal(purchaseMulticlass(original,"netrunner").ok,false,
 "Secondary role cannot be selected at character creation for free");
original=gainExperience(original,75).character;
assert.equal(purchaseMulticlass(original,"netrunner").ok,false,"Level 3 cannot multiclass");
original=gainExperience(original,60).character; // level 4 / 135 XP
assert.equal(original.level,4);
assert.equal(availableSkillPoints(original),6);
const originalStats=combatProgression(original);
const chosen=purchaseMulticlass(original,"netrunner");
assert.equal(chosen.ok,true,chosen.message);
let hero=chosen.character;
assert.equal(hero.multiclassId,"netrunner");
assert.equal(hero.classId,"solo");
assert.equal(availableSkillPoints(hero),4,"Choosing a second role costs exactly 2 HAB");
assert.deepEqual(combatProgression(hero),originalStats,
 "Never grant the entire secondary class's permanent stat package");
assert.deepEqual(hero.classStatBonuses,original.classStatBonuses);
assert.equal(getSkillRank(hero,"solo-ruptura"),1);
assert.equal(getSkillRank(hero,"netrunner-intrusao"),1,
 "A secondary role begins with its root technique at rank one");
assert.equal(purchaseMulticlass(hero,"policial").ok,false,
 "Third classes are not allowed");
assert.equal(purchaseMulticlass(hero,"solo").ok,false,
 "Duplicating main class may not farm points or bonuses");
assert.equal(purchaseSkill(hero,"tecnico-recalibracao").ok,false,
 "A player may not buy an unrelated third-class ability");
assert.equal(purchaseSkill(hero,"netrunner-apagao").ok,false,
 "Secondary advanced skills must respect their prerequisite");
assert.equal(purchaseSkill(hero,"netrunner-intrusao").ok,false,
 "Secondary root cannot upgrade on the same level it is chosen");
const secondRoot=purchaseSkill(hero,"netrunner-sobrecarga");
assert.equal(secondRoot.ok,true,secondRoot.message);
hero=secondRoot.character;
assert.equal(availableSkillPoints(hero),3);
const saved=normalizeProgression(hero);
assert.equal(saved.multiclassId,"netrunner");
assert.equal(availableSkillPoints(saved),3);
assert.ok(saved.abilities.includes("netrunner-sobrecarga"));
assert.equal(saveCharacter(saved),true);
const reloaded=loadCharacter();
assert.ok(reloaded);
assert.equal(reloaded.multiclassId,"netrunner");
assert.equal(availableSkillPoints(reloaded),3);
assert.ok(reloaded.abilities.includes("netrunner-sobrecarga"));
// Upgrade once and never exceed secondary rank two, even with enough XP.
hero=gainExperience(reloaded,1000).character;
const plus=purchaseSkill(hero,"netrunner-intrusao");
assert.equal(plus.ok,true,plus.message);
hero=plus.character;
assert.equal(getSkillRank(hero,"netrunner-intrusao"),2);
assert.equal(purchaseSkill(hero,"netrunner-intrusao").ok,false,
 "Secondary ability must not reach rank three");
const forged={...hero,multiclassId:"policial",
 abilities:[...hero.abilities,"tecnico-recalibracao"],
 skillRanks:{...hero.skillRanks,"policial-contencao":99}};
const cleaned=normalizeProgression(forged);
assert.ok(!cleaned.abilities.includes("netrunner-intrusao")||
 cleaned.multiclassId==="policial",
 "Only abilities of the current two classes can survive save normalization");
assert.equal(cleaned.abilities.includes("tecnico-recalibracao"),false);
const old={...original};
delete old.multiclassId;
const legacy=parseCharacterSave(JSON.stringify({version:1,character:old}));
assert.ok(legacy);
assert.equal(legacy.multiclassId,null);
assert.deepEqual(combatProgression(legacy),combatProgression(original));

const hybrid=getHybridArchetype("solo","netrunner");
assert.ok(hybrid);
const opts={classId:"solo",multiclassId:"netrunner",characterLevel:5,
 characterAbilities:hero.abilities,characterSkillRanks:hero.skillRanks,
 encounterId:"test"};
const base=new TurnManager({...opts,multiclassId:null});
const manager=new TurnManager(opts);
assert.equal(manager.getState().archetypeId,hybrid.id);
assert.equal(manager.getState().multiclassId,"netrunner");
assert.equal(manager.getState().units[0].attackBonus-base.getState().units[0].attackBonus,
 hybrid.bonus==="attack"?1:0);
assert.equal(manager.getState().units[0].armorClass-base.getState().units[0].armorClass,
 hybrid.bonus==="armor"?1:0);
assert.equal(manager.getState().maxEnergy-base.getState().maxEnergy,
 hybrid.bonus==="energy"?1:0);
assert.equal(manager.getState().movementPerTurn-base.getState().movementPerTurn,
 hybrid.bonus==="movement"?1:0);
assert.ok(manager.getClassAbilities().some(a=>a.id==="solo-ruptura"));
assert.ok(manager.getClassAbilities().some(a=>a.id==="netrunner-intrusao"));
manager.state.units[0].x=1;manager.state.units[0].y=1;
manager.state.units[1].x=2;manager.state.units[1].y=1;
assert.equal(manager.getClassAvailability("netrunner-intrusao").available,true);
manager.activateClassAbility("netrunner-intrusao");
assert.equal(manager.getState().mainActionAvailable,false,
 "Using secondary class technique consumes the same primary action");
assert.equal(manager.getClassAvailability("solo-ruptura").available,false,
 "There is NO second combat action for the primary class");
const noSecondary=new TurnManager({...opts,multiclassId:null});
assert.equal(noSecondary.getClassAvailability("netrunner-intrusao").available,false,
 "Cannot use unlocked abilities of a role not chosen in current build");
const level3=new TurnManager({...opts,characterLevel:3});
assert.equal(level3.getClassAbilities().some(s=>s.classId==="netrunner"),false,
 "A lower-level forged battle must not enable multiclass abilities");
const tree=readFileSync("src/components/ProgressionTree.tsx","utf8");
const menu=readFileSync("src/components/CharacterMenu.tsx","utf8");
const picker=readFileSync("src/components/CombatAbilityPicker.tsx","utf8");
assert.ok(tree.includes('skillTrack==="secondary"')&&tree.includes('id="na-secondary-class"'));
assert.ok(tree.includes("getHybridArchetype(character.classId,pendingSecondary)"));
assert.ok(tree.includes("effectiveSkillMaxRank(character,skill)"));
assert.ok(menu.includes("CLASSE PRINCIPAL")&&menu.includes("ARQUÉTIPO"));
assert.ok(picker.includes("Classe secundária ·")&&picker.includes("Classe principal"));
console.log("Multiclasse: 55 pares, arquétipos diversos, 2 HAB/nível 4, graus, saves e ações compartilhadas aprovados.");
