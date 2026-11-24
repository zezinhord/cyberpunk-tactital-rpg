/** Build contract: Android and desktop MUST use the same complete Phaser world.
 * The historical Lite prototype may remain for archaeological reference,
 * but cannot be imported into the shipping exploration route.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const get=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const route=get("src/components/BaixadaWorld.tsx");
const world=get("src/components/BaixadaPhaserWorld.tsx");
const scene=get("src/game/baixada/BaixadaScene.ts");
const screen=get("src/screens/ExplorationScreen.tsx");
const cold=get("scripts/test-android-cold-boot.mjs");
const native=get("scripts/test-android-single-apk-offline.mjs");
assert.match(route,/lazy\(\(\)=>import\("\.\/BaixadaPhaserWorld"\)\)/);
assert.match(route,/<PhaserWorld \{\.\.\.props\}\/>/);
assert.doesNotMatch(route,/BaixadaLiteWorld|isAndroidDevice\(/);
assert.match(world,/data-engine="phaser-full"/);
assert.match(world,/data-world-edition="complete"/);
assert.match(world,/data-original-sprites=/);
assert.match(world,/scene\.textures\.exists\(texture\)/);
assert.match(world,/new Phaser\.Game\(/);
assert.match(world,/Phaser\.CANVAS:Phaser\.AUTO/);
assert.match(world,/setMissionObjective\(objectiveActorId\?\?null\)/);
assert.match(world,/setWorldAlert\(Boolean\(worldAlert\)\)/);
assert.match(scene,/setMissionObjective\(actorId:string\|null\)/);
assert.match(scene,/setWorldAlert\(active:boolean\)/);
assert.match(scene,/this\.onInteract\(id\)/);
assert.match(scene,/camera\.startFollow\(this\.player/);
assert.match(screen,/<BaixadaWorld originId=/);
assert.match(screen,/objectiveActorId=\{currentWaypoint\?\.actorId\?\?null\}/);
assert.match(cold,/phaser-full/);
assert.doesNotMatch(cold,/data-engine=native-2d/);
assert.match(native,/phaser-full/);
console.log("RC17 FULL WORLD CONTRACT PASS: Android always loads Phaser, all mission/NPC hooks survive, Android smoke tests reject Lite.");
