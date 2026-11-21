import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,ctx,next){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&
  !/\.[cm]?[jt]s$/.test(specifier))return next(specifier+".ts",ctx);
 return next(specifier,ctx);
}});
const {COUNCIL_IDS}=await import("../src/game/story/district-councils.ts");
const {RECOVERY_TASKS,EMPTY_RECOVERY,repairRecoveryEquipment}
 =await import("../src/game/story/recovery-network.ts");
const {RECOVERY_PUZZLES,calibrationPuzzle,correctCalibration}
 =await import("../src/game/story/recovery-calibrations.ts");
const cases=new Set();
let total=0;
for(const region of COUNCIL_IDS){
 const council={version:1,choices:{[region]:"solidarity"},defended:[region]};
 for(const task of RECOVERY_TASKS[region]){
  total++;
  const puzzle=calibrationPuzzle(task.room);
  assert.ok(puzzle,"Missing authored puzzle for "+task.room);
  assert.ok(!cases.has(puzzle.prompt),"Duplicated repair story");
  cases.add(puzzle.prompt);
  assert.equal(puzzle.options.length,3);
  assert.ok(puzzle.prompt.length>=70,"Narrative puzzle lacks world detail");
  assert.ok(puzzle.hint.length>=25);
  assert.ok(puzzle.explanation.length>=35);
  assert.equal(new Set(puzzle.options).size,3);
  const correct=puzzle.correct;
  assert.ok(Number.isInteger(correct)&&correct>=0&&correct<=2);
  assert.equal(correctCalibration(task.room,correct),true);
  for(const answer of [0,1,2]){
   assert.equal(correctCalibration(task.room,answer),answer===correct);
  }
  const start=repairRecoveryEquipment(EMPTY_RECOVERY,council,task.room,"sistema");
  assert.equal(start.ok,true,"Correct choice should have a legitimate repair event");
  assert.ok(start.xp>=20);
 }
}
assert.equal(total,21);
assert.equal(Object.keys(RECOVERY_PUZZLES).length,21);
assert.equal(calibrationPuzzle("baixada-memorial"),null,"Unrelated rooms should not require puzzles");
assert.equal(correctCalibration("baixada-memorial",0),false);
const ui=readFileSync("src/screens/ExplorationScreen.tsx","utf8");
assert.ok(ui.includes('id:"calibrate:"+found.area+":"+index'));
assert.ok(ui.includes('id:"calibrate:"+room+":"+index'));
assert.ok(ui.includes('if(!correctCalibration(room,answer))'));
assert.ok(ui.includes('saveRecovery(character.id,task.state)'));
assert.ok(ui.includes('onQuestXp("recovery-repair-"+room,task.xp)'));
console.log("OPERAÇÃO RETOMADA: 21 distinct 3-option machine calibrations, 63 original choices, contextual hints and safe wrong-answer retries.");
