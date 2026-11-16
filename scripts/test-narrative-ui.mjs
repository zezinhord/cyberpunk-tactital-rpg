import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const opening=read("src/game/story/opening.ts");
const intro=read("src/components/OpeningCutscene.tsx");
const css=read("src/opening-cutscene.css");
const exp=read("src/screens/ExplorationScreen.tsx");
const panel=read("src/components/NpcDialoguePanel.tsx");
const portrait=read("src/components/NarrativePortrait.tsx");
const style=read("src/dialogue-cinematic.css");
for(const scene of ["skyline","aurea","eden","baixada","records","operative","interference","canal"])
 assert.ok(opening.includes('visual:"'+scene+'"'),"Missing cinematographic scene "+scene);
assert.ok(intro.includes("getPlayerLiteSpriteUrl"),"Hero appearance must match creation");
assert.ok(intro.includes("na-opening-autoplay"),"Optional auto-advance missing");
assert.ok(intro.includes("reducedMotion"),"Reduced motion support lost");
assert.ok(css.includes("na-cinema-drift-far")&&css.includes("na-cinema-rain"),"Parallax/weather missing");
assert.ok(exp.includes("<NpcDialoguePanel"),"Exploration must render dialogue overlay");
assert.ok(exp.includes("onAnswer={selectAnswer}"),"Dialogue must preserve quest/market callbacks");
assert.ok(exp.includes("registerCityEvent(district"),"District choices must remain operational");
assert.ok(exp.includes('registerFerrugemEvent("ferrugem-foreman"'),"Ferrugem choices must remain");
for(const name of ["amara","joana","nilo","saira","teo","lia","ramon","duda","helena","mara","rosa"])
 assert.ok(portrait.includes(name+":"),"Missing named portrait palette: "+name);
assert.ok(portrait.includes('data-portrait-id={p.id}'),"Portrait identity missing");
assert.ok(panel.includes("dialogueEmotion")&&panel.includes("setVisible"),"Dialogue acting/typing missing");
assert.ok(panel.includes("onAnswer(choice)")&&panel.includes("onNext()"),"Choice/advance callbacks missing");
assert.ok(panel.includes('role="dialog"')&&panel.includes("aria-modal"),"Dialog semantics missing");
assert.ok(style.includes("max-height:calc(100dvh - 16px)")&&style.includes("min-height:48px"),"Landscape mobile styling missing");
console.log("Narrative UI: eight panels, illustrated portraits, original choice callbacks, mobile and reduced-motion checks.");
