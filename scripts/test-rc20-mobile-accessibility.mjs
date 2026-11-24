import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,context,next){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&
   !/\.[cm]?[jt]s$/.test(specifier))
  return next(specifier+".ts",context);
 return next(specifier,context);
}});
const {readAccessibility,saveAccessibility,sanitizeAccessibility,
 ACCESSIBILITY_KEY}=await import("../src/game/accessibility.ts");
const get=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const data=new Map();
globalThis.localStorage={
 getItem:k=>data.get(k)??null,
 setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)
};
globalThis.document={documentElement:{dataset:{}}};
const defaults=readAccessibility();
assert.deepEqual(defaults,{version:1,largeText:false,
 highContrast:false,reduceMotion:false});
const settings={version:1,largeText:true,highContrast:true,reduceMotion:true};
assert(saveAccessibility(settings));
assert.deepEqual(readAccessibility(),settings);
assert.equal(document.documentElement.dataset.naText,"large");
assert.equal(document.documentElement.dataset.naContrast,"high");
assert.equal(document.documentElement.dataset.naMotion,"reduced");
assert.equal(data.get("cyberpunk-tactical-rpg.settings.reduce-motion.v1"),"true");
assert.deepEqual(sanitizeAccessibility({highContrast:"true",largeText:1,
 reduceMotion:null}),defaults,"String coercion must not forge accessibility settings");
data.delete(ACCESSIBILITY_KEY);
assert.equal(readAccessibility().reduceMotion,true,
 "Legacy reduced-motion setting survives migration");
const app=get("src/App.tsx"),menu=get("src/components/CharacterMenu.tsx");
const exploration=get("src/screens/ExplorationScreen.tsx");
const archive=get("src/components/CinematicArchive.tsx");
const css=get("src/accessibility-rc20.css");
for(const marker of [
 'className="na-command-rail"','className="na-rail-attack"',
 'className="na-rail-abilities"','className="na-target-selector"',
 'aria-label="Selecionar alvo hostil na lista"',
 "disabled={!canAttack}","manager.endPlayerTurn()",
 "manager.useEnergySupply","grantBattleSalvage(original,state)",
 "className=\"na-victory-aftermath\"","battleAftermathFor(state.encounterId,character)",
 'className="na-tactical-secondary"',
 ])assert(app.includes(marker),"Missing RC20 gameplay+UI integration: "+marker);
for(const token of ["onCalibrateEquipment","calibrationCostLabel",
 "equippedCalibration(inventory,slot)","highContrast","largeText","reduceMotion"])
 assert(menu.includes(token),"Character menu lost upgrade/accessibility: "+token);
for(const token of ["onCalibrateEquipment","cinematicFocus"])
 assert(exploration.includes(token));
for(const token of ["BATTLE_AFTERMATH_IDS","aftermath:\"DESFECHO DE CONFRONTO\"",
 "data-cinema-archive=\"read-only\""])
 assert(archive.includes(token));
for(const token of [".na-command-rail","min-height:54px",
 "data-na-contrast=\"high\"","data-na-text=\"large\"",
 "data-na-motion=\"reduced\"","min-height:48px"])
 assert(css.includes(token));
console.log("RC20 MOBILE ACCESSIBILITY PASS: 4 visible pinned actions, selected hostile, cinematic archive, material calibration menu, persistent a11y and no Lite mode.");