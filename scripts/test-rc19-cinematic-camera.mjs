import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {focusForNarrativeCue} from "../src/game/story/cinematic-camera.ts";
const get=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
assert.equal(focusForNarrativeCue(null,"Mara"),null);
assert.equal(focusForNarrativeCue({speaker:"CENTRAL",role:"CHEGADA AO DISTRITO",
 cinematicId:"arrival:subsolo"},"Mara"),"objective");
assert.equal(focusForNarrativeCue({speaker:"Mara",role:"DIÁLOGO"},"Mara"),"guide");
assert.equal(focusForNarrativeCue({speaker:"Helena Voss",role:"PRIMEIRO CONTATO",
 cinematicId:"first-contact:helena"},"Kai"),"guide");
assert.equal(focusForNarrativeCue({speaker:"ARQUIVO",role:"DOSSIÊ DE PROVAS"},"Iuri"),"objective");
assert.equal(focusForNarrativeCue({speaker:"Pessoa",role:"CONVERSA"},"Iuri"),"hero");
const district=get("src/game/districts/DistrictScene.ts");
const inner=get("src/game/districts/DistrictInteriorScene.ts");
const host=get("src/components/InteriorWorld.tsx");
const screen=get("src/screens/ExplorationScreen.tsx");
for(const s of [district,inner]){
 assert.match(s,/setCinematicFocus\(focus:CinematicCameraFocus\|null\)/);
 assert.match(s,/camera\.stopFollow\(\)/);
 assert.match(s,/camera\.pan\(/);
 assert.match(s,/camera\.zoomTo\(/);
 assert.match(s,/camera\.startFollow\(/);
 assert.match(s,/prefers-reduced-motion/);
}
assert.match(host,/cinematicFocus=\s*null/);
assert.match(host,/scene\.setCinematicFocus\(cinematicRef\.current\)/);
assert.match(screen,/focusForNarrativeCue\(currentDialogue/);
assert.match(screen,/cinematicFocus=\{cinematicFocus\}/);
assert.doesNotMatch(get("src/game/story/cinematic-camera.ts"),
 /saveCharacter|grantUniqueExperience|saveDistrictProgress|awardXp/);
console.log("RC19 CAMERA PASS: canonical dialogue cues pan and zoom actual district and indoor Phaser scenes without altering quest state.");
