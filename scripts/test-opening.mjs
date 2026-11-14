import assert from "node:assert/strict";
import {OPENING_PANELS,openingLines,nextStoryScreen,markOpeningSeen}
 from "../src/game/story/opening.ts";
import {createPlayerCharacter} from "../src/game/character/storage.ts";

assert.equal(OPENING_PANELS.length,6,"A cutscene deve conter exatamente seis cenas.");
assert.equal(new Set(OPENING_PANELS.map(scene=>scene.id)).size,6,"Quadros precisam de IDs únicos.");
assert.equal(new Set(OPENING_PANELS.map(scene=>scene.visual)).size,6,"Cada cena precisa de arte própria.");
for(const scene of OPENING_PANELS){
 assert.ok(scene.title.length>=8&&scene.title.length<=65,"Título legível: "+scene.id);
 assert.equal(scene.lines.length,2,"Texto em duas falas para telas pequenas: "+scene.id);
 assert.ok(scene.lines.every(line=>line.length>=10&&line.length<170),
  "Falas curtas para celular: "+scene.id);
}
const created=createPlayerCharacter("Jogadora de QA","baixada","netrunner");
assert.equal(created.openingSeen,false,"Novo protagonista deve começar pela cutscene");
assert.equal(nextStoryScreen(created),"opening");
const identityPanel=OPENING_PANELS[4];
assert.ok(openingLines(identityPanel,created).join(" ").includes(created.name));
assert.ok(!openingLines(identityPanel,created).some(s=>s.includes("{")),
 "Todos os tokens narrativos devem ser substituídos.");
const viewed=markOpeningSeen(created);
assert.equal(created.openingSeen,false,"A transição não pode mutar personagem original");
assert.equal(viewed.openingSeen,true);
assert.equal(viewed.id,created.id);
assert.equal(viewed.originId,created.originId);
assert.equal(viewed.classId,created.classId);
assert.deepEqual(viewed.abilities,created.abilities);
assert.equal(nextStoryScreen(viewed),"introduction");
assert.equal(nextStoryScreen({...viewed,introductionCompleted:true}),"exploration");
const legacy={...created};
delete legacy.openingSeen;
assert.equal(nextStoryScreen(legacy),"introduction",
 "Save legado anterior à cutscene não deve ser forçado a revê-la");
assert.equal(nextStoryScreen({...legacy,introductionCompleted:true}),"exploration");
assert.equal(nextStoryScreen(null),"introduction");
console.log("Prólogo: 6 cenários, narrativa por origem, progressão nova e legado preservados.");
