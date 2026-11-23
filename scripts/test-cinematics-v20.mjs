import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const {ORIGIN_IDS}=await import("../src/game/character/origins.ts");
const {createPlayerCharacter}=await import("../src/game/character/storage.ts");
const {OPENING_PANELS,ORIGIN_CINEMATIC_MEMORY,OPENING_TARGET_DURATION_MS,
  compileOpening,openingLines,markOpeningSeen}=await import("../src/game/story/opening.ts");
const {compileCinematic,cinematicDuration,safeShot,startCinematic,
 advanceCinematic,skipCinematic,dialoguePresentation,sanitizeCinematicPreferences,
 textCharacterInterval,readCinematicHistory,markCinematicSeen}=await
 import("../src/game/story/cinematic-engine.ts");
const {CINEMATIC_ARRIVAL_AREAS,arrivalForArea,validateCinematicArrivals}=await
 import("../src/game/story/cinematic-arrivals.ts");
const {CINEMATIC_CONTACT_IDS,firstContactCinematic}=await
 import("../src/game/story/cinematic-contacts.ts");
const {CINEMATIC_BATTLE_IDS,battleIntroFor}=await
 import("../src/game/story/cinematic-battles.ts");
const root=path=>readFileSync(path,"utf8");
assert.equal(OPENING_PANELS.length,8);
assert.ok(OPENING_TARGET_DURATION_MS>=60000&&OPENING_TARGET_DURATION_MS<=120000);
assert.equal(OPENING_TARGET_DURATION_MS,cinematicDuration({
 id:"opening-nova-arcadia-v20",beats:OPENING_PANELS.map(p=>({id:p.id,shot:p.shot}))
}));
assert.equal(new Set(OPENING_PANELS.map(p=>p.id)).size,8);
assert.equal(ORIGIN_IDS.length,6);
assert.equal(new Set(Object.values(ORIGIN_CINEMATIC_MEMORY).map(m=>m.location)).size,6);
for(const originId of ORIGIN_IDS){
 const character=createPlayerCharacter("Cinematic QA "+originId,originId,"netrunner");
 const original=JSON.stringify(character);
 const timeline=compileOpening(character);
 assert.equal(timeline.beats.length,8);
 assert.equal(timeline.id,"opening-nova-arcadia-v20");
 assert.ok(ORIGIN_CINEMATIC_MEMORY[originId].detail.length>=40);
 assert.ok(openingLines(OPENING_PANELS[5],character).join(" ").includes(character.name));
 for(const beat of timeline.beats){
   assert.ok(beat.shot.zoom>=1&&beat.shot.zoom<=1.16);
   assert.ok(Math.abs(beat.shot.panX)<=12&&Math.abs(beat.shot.panY)<=10);
 }
 let current=startCinematic(timeline);
 for(let i=0;i<8;i++)current=advanceCinematic(timeline,current);
 assert.equal(current.finished,true);
 assert.equal(JSON.stringify(character),original,"Cinematics must not mutate protagonist");
 const seen=markOpeningSeen(character);
 assert.equal(seen.originId,character.originId);
 assert.equal(seen.classId,character.classId);
}
const shot=OPENING_PANELS[0].shot;
assert.equal(safeShot({...shot,zoom:4,panX:-99,durationMs:500000}).zoom,1.16);
const sample={
 id:"choice",beats:[{id:"decision",shot,choices:["a","b"]},
 {id:"after",shot}]
};
const context={originId:"baixada",classId:"netrunner",facts:new Set(["v09"])};
const compiled=compileCinematic(sample,context);
let runtime=startCinematic(compiled);
assert.equal(runtime.pendingChoice,true);
assert.deepEqual(skipCinematic(compiled,runtime),runtime,
 "Skip must not select an arbitrary irreversible narrative choice");
assert.deepEqual(advanceCinematic(compiled,runtime),runtime);
assert.deepEqual(advanceCinematic(compiled,runtime,"impossible"),runtime);
runtime=advanceCinematic(compiled,runtime,"b");
assert.equal(runtime.index,1);
assert.equal(skipCinematic(compiled,runtime).finished,true);
const conditional=compileCinematic({id:"conditional",beats:[
 {id:"origin",shot,condition:{origins:["baixada"],classes:["netrunner"]}},
 {id:"seen",shot,condition:{requiredFacts:["v09"]}},
 {id:"other",shot,condition:{origins:["militar"]}}
]},context);
assert.deepEqual(conditional.beats.map(b=>b.id),["origin","seen"]);
assert.equal(dialoguePresentation("Central de transporte","CHEGADA AO DISTRITO",1,false),"cinematic");
assert.equal(dialoguePresentation("Projeto Éden","rastros da rede",1,false),"cinematic");
assert.equal(dialoguePresentation("Dra. Amara","atendimento comunitário",1,false),"dramatic");
assert.equal(dialoguePresentation("Pedestre","saudação",1,false),"simple");
assert.equal(dialoguePresentation("Vendedor","feira",1,true),"dramatic");
assert.deepEqual(sanitizeCinematicPreferences({speed:"instant",autoPlay:false}),
 {speed:"instant",autoPlay:false,reduceMotion:false});
assert.ok(textCharacterInterval("slow")>textCharacterInterval("fast"));
assert.equal(validateCinematicArrivals(),true);
assert.equal(CINEMATIC_ARRIVAL_AREAS.length,7);
for(const area of CINEMATIC_ARRIVAL_AREAS){
 const a=arrivalForArea(area);
 assert.ok(a&&a.text.length>35&&a.id==="arrival:"+area);
 assert.ok(a.role.includes("CHEGADA AO DISTRITO"));
}
assert.equal(arrivalForArea("unknown"),null);
assert.equal(CINEMATIC_CONTACT_IDS.length,8);
for(const id of CINEMATIC_CONTACT_IDS){
 const intro=firstContactCinematic(id);
 assert.ok(intro?.cinematicId==="first-contact:"+id&&intro.text.length>45);
 assert.ok(dialoguePresentation(intro.speaker,intro.role,1,false)==="cinematic");
}
assert.equal(firstContactCinematic("SISTEMA DE MONITORAMENTO"),null);
assert.equal(CINEMATIC_BATTLE_IDS.length,5);
for(const id of CINEMATIC_BATTLE_IDS){
 const intro=battleIntroFor(id);
 assert.ok(intro&&intro.text.length>60);
 assert.equal(intro.cinematicId,"battle-intro:"+id);
 assert.equal(dialoguePresentation(intro.speaker,intro.role,1,false),"cinematic");
}
assert.equal(battleIntroFor("test"),null);
const tacticalChar=createPlayerCharacter("Cinemática tática","baixada","netrunner");
const tacticalText=battleIntroFor("v09",tacticalChar)?.text??"";
assert.match(tacticalText,/interfaces|painéis/i);
assert.match(tacticalText,/Baixada/);
assert.ok(battleIntroFor("v09",{...tacticalChar,classId:"solo"}).text!==tacticalText,
 "Class identity must change a real narrative beat");



const priorStorage=globalThis.localStorage;
const memory=new Map();
Object.defineProperty(globalThis,"localStorage",{configurable:true,value:{
 getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)
}});
try{
 assert.deepEqual(readCinematicHistory("slot-a"),[]);
 assert.equal(markCinematicSeen("slot-a","arrival:aurea"),true);
 assert.equal(markCinematicSeen("slot-a","arrival:aurea"),true);
 assert.deepEqual(readCinematicHistory("slot-a"),["arrival:aurea"]);
 assert.deepEqual(readCinematicHistory("slot-b"),[],
  "Cinematic diary must never leak between character slots");
}finally{
 if(priorStorage===undefined)delete globalThis.localStorage;
 else Object.defineProperty(globalThis,"localStorage",{configurable:true,value:priorStorage});
}
const intro=root("src/components/OpeningCutscene.tsx");
const panel=root("src/components/NpcDialoguePanel.tsx");
const explore=root("src/screens/ExplorationScreen.tsx");
const app=root("src/App.tsx");
const styles=root("src/opening-cutscene.css")+root("src/dialogue-cinematic.css");
for(const key of ["getPlayerLiteSpriteUrl","na-opening-autoplay",
 "na-cinema-confirm","setConfirmSkip(true)","reducedMotion","ORIGIN_CINEMATIC_MEMORY",
 "compileOpening(character)","textCharacterInterval"])
 assert.ok(intro.includes(key),"Opening lost cinematic feature: "+key);
for(const key of ["onAnswer(choice)","onNext()","pendingChoice",
 "data-cinematic-mode={mode}","NarrativePortrait","cinematicId?:string"])
 assert.ok(panel.includes(key),"Dialogue lost narrative contract: "+key);
for(const key of ["arrivalForArea(area)","firstContactCinematic(pages[0]!.speaker)",
 "readCinematicHistory(character.id)","cinematicId:arrival.id",
 "<NpcDialoguePanel","onAnswer={selectAnswer}"])
 assert.ok(explore.includes(key),"Existing mission interaction lost: "+key);
assert.ok(app.includes("setBattleCinematic(intro")&&app.includes("<BattleCinematicDialogue"),
 "Story boss scenes must use real battle flow and original exit controls");
assert.ok(styles.includes(".origin-militar")&&styles.includes(".cinematic-cinematic"));
console.log("Cutscene QA: 8 timed scenes (~89s), six origins, reactive dialogue, protected choices, seven district arrivals, slot isolation and UI contracts passed.");
