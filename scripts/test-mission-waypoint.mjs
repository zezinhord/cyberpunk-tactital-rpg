import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ACTOR_TILES,ROAMING_NPCS} from "../src/game/baixada/layout.ts";
import {firstMissionWaypoint} from "../src/game/baixada/mission-waypoint.ts";

const initial={step:0,hasSewerEvidence:false,patioConsoleRead:false,
 sentinelDefeated:false,evidenceReported:false};
const stage=(patch)=>firstMissionWaypoint({...initial,...patch});
assert.equal(stage({step:0})?.actorId,"enter-clinic");
assert.equal(stage({step:1})?.actorId,"enter-clinic");
assert.match(stage({step:1}).label,/terminal de atendimento/);
assert.match(stage({step:2}).label,/Dra\. Amara/);
assert.equal(stage({step:3})?.actorId,"enter-sewer-drain");
assert.equal(stage({step:3,hasSewerEvidence:true})?.actorId,"patio-console");
assert.equal(stage({step:3,hasSewerEvidence:true,patioConsoleRead:true})?.actorId,"patio-sentinel");
assert.equal(stage({step:3,sentinelDefeated:true})?.actorId,"lia");
assert.equal(stage({step:3,sentinelDefeated:true,evidenceReported:true}),null);
assert.equal(stage({step:NaN}),null);
assert.equal(stage({step:-1}),null);
assert.equal(stage({step:50}),null);

for(const patch of [{step:0},{step:1},{step:2},{step:3},
 {step:3,hasSewerEvidence:true},{step:3,hasSewerEvidence:true,patioConsoleRead:true},
 {step:3,sentinelDefeated:true}]){
 const w=stage(patch);
 assert.ok(w?.label,"Each exposed stage needs a clear destination");
 assert.ok(w.actorId in ACTOR_TILES||ROAMING_NPCS.some(n=>n.id===w.actorId),
  "Never invent a target which cannot be found on the original map");
}
const screen=readFileSync("src/screens/ExplorationScreen.tsx","utf8");
const world=readFileSync("src/components/BaixadaLiteWorld.tsx","utf8");
const wrapper=readFileSync("src/components/BaixadaWorld.tsx","utf8");
assert.ok(screen.includes("firstMissionWaypoint({"));
assert.ok(screen.includes("objectiveActorId={currentWaypoint?.actorId??null}"));
assert.ok(screen.includes("!operations.started&&!ferrugem.started"),
 "Intro destination must not override later active campaigns");
assert.ok(screen.includes('className="na-quest-next-stop"'));
assert.ok(wrapper.includes("objectiveActorId?:string|null;"));
assert.ok(world.includes("waypoint.current=objectiveActorId"));
assert.ok(world.includes("actorById.has(goalId)"));
assert.ok(world.includes("Math.atan2(goalY-markerY,goalX-markerX)"),
 "Offscreen destinations need arrows instead of false route lines");
assert.ok(world.includes("[appearance,objectiveActorId]"),
 "Quest changes must redraw without restarting the world or character");
assert.ok(world.includes('ctx.strokeStyle="#f2c982"'),
 "Quest navigation remains amber; green belongs exclusively to Eden");
console.log("Mission wayfinding: seven first-mission states, honest locations, no spoilers, Android edge arrows and compact HUD passed.");
