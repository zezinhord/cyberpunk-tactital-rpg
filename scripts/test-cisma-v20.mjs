import assert from "node:assert/strict";
import {CLASS_IDS} from "../src/game/classes/registry.ts";
import {ORIGIN_IDS} from "../src/game/character/origins.ts";
import {
 CISMA_KEY,CISMA_STEPS,CISMA_OUTCOMES,CISMA_CLASS_METHODS,CISMA_ORIGIN_MEMORY,
 INITIAL_CISMA,beginCisma,advanceCisma,currentCismaStep,readCisma,saveCisma,
 validateCismaBackup,cismaObjective,cismaDistrictImpact,cismaFactionEffects,
} from "../src/game/story/cisma-v20.ts";

const data=new Map();
globalThis.localStorage={
 getItem:key=>data.get(key)??null,
 setItem:(key,value)=>{data.set(key,String(value));},
 removeItem:key=>data.delete(key),
};
assert.equal(CISMA_STEPS.length,8);
assert.equal(Object.keys(CISMA_CLASS_METHODS).length,11);
assert.deepEqual(Object.keys(CISMA_CLASS_METHODS).sort(),[...CLASS_IDS].sort());
assert.deepEqual(Object.keys(CISMA_ORIGIN_MEMORY).sort(),[...ORIGIN_IDS].sort());
const actorIds=CISMA_STEPS.map(s=>s.actor);
assert.equal(new Set(actorIds).size,actorIds.length,"each stage requires a distinct real actor");
assert.equal(currentCismaStep(INITIAL_CISMA),null);
assert.deepEqual(beginCisma(INITIAL_CISMA,false),INITIAL_CISMA,"cannot unlock before Eden ending");
assert.equal(advanceCisma(INITIAL_CISMA,actorIds[0],undefined,"solo").advanced,false);

const locations=["baixada","ferrugem","aurea","subsolo","setor-zero","prisma","periferia"];
for(const finale of CISMA_OUTCOMES){
 const owner="test-"+finale.id;
 let p=beginCisma(INITIAL_CISMA,true);
 assert.equal(p.started,true);
 assert.equal(validateCismaBackup(p),true);
 assert.equal(saveCisma(owner,p),true);
 assert.deepEqual(readCisma(owner),p);
 for(let i=0;i<CISMA_STEPS.length;i++){
  const step=CISMA_STEPS[i];
  assert.equal(currentCismaStep(p)?.id,step.id);
  assert.equal(cismaObjective(p),step.objective);
  assert.equal(advanceCisma(p,"id-errado",undefined,"netrunner").advanced,false);
  assert.equal(advanceCisma(p,step.actor,undefined,"netrunner").advanced,
    step.kind!=="decision","ending requires a conscious choice");
  if(step.kind==="decision")
   assert.equal(advanceCisma(p,step.actor,"outra-opcao","netrunner").advanced,false);
  const moved=advanceCisma(p,step.actor,
   step.kind==="decision"?finale.id:undefined,"netrunner");
  assert.equal(moved.advanced,true,step.title);
  assert.equal(moved.step.id,step.id);
  assert.ok(moved.message.length>80);
  p=moved.progress;
  assert.equal(p.method,"netrunner");
  assert.equal(p.step,i+1);
  assert.equal(p.history[i],step.id);
  assert.equal(validateCismaBackup(p),true);
  assert.equal(saveCisma(owner,p),true);
  assert.deepEqual(readCisma(owner),p,"cada prova sobrevive à retomada");
  assert.equal(advanceCisma(p,step.actor,undefined,"netrunner").advanced,false,
   "não pode repetir o mesmo passo");
 }
 assert.equal(p.completed,true);
 assert.equal(p.ending,finale.id);
 assert.equal(p.step,CISMA_STEPS.length);
 assert.ok(cismaObjective(p).length>80);
 assert.equal(advanceCisma(p,"feira-archive",finale.id,"netrunner").advanced,false);
 assert.ok(Object.keys(cismaFactionEffects(p)).length>0);
 for(const area of locations){
  const impact=cismaDistrictImpact(p,area);
  assert.ok(impact.label.length>5);
  assert.ok(impact.description.length>30);
  assert.ok(impact.pressure>=-1&&impact.pressure<=1);
 }
 assert.equal(cismaDistrictImpact({...p,completed:false,ending:null,step:7,history:p.history.slice(0,7)},"baixada"),null);
}
for(const cls of CLASS_IDS){
 let p=beginCisma(INITIAL_CISMA,true);
 const result=advanceCisma(p,CISMA_STEPS[0].actor,undefined,cls);
 assert.equal(result.advanced,true,"classe "+cls);
 assert.equal(result.progress.method,cls);
 assert.ok(result.progress.exposure>=0&&result.progress.exposure<=5);
 assert.ok(CISMA_CLASS_METHODS[cls].insight.length>35);
}
assert.equal(readCisma("absent").started,false);
assert.equal(saveCisma("",INITIAL_CISMA),false);
assert.equal(validateCismaBackup({...INITIAL_CISMA,step:5}),false);
assert.equal(validateCismaBackup({...INITIAL_CISMA,history:["hack"]}),false);
assert.equal(validateCismaBackup({...INITIAL_CISMA,ending:"pacto"}),false);
assert.equal(validateCismaBackup({...INITIAL_CISMA,exposure:900}),false);
assert.equal(validateCismaBackup({...INITIAL_CISMA,untrusted:"injection"}),false);
assert.equal(validateCismaBackup({...INITIAL_CISMA,started:false,step:1,history:["alarme"]}),false);
data.set(CISMA_KEY+"bad","{invalid");
assert.deepEqual(readCisma("bad"),INITIAL_CISMA);
const backup=globalThis.localStorage;
globalThis.localStorage=undefined;
assert.equal(saveCisma("offline",INITIAL_CISMA),false);
globalThis.localStorage=backup;
console.log("Cisma v2: 8 marcos, 3 escolhas, 11 métodos, 6 origens, 7 consequências regionais e salvamento por slot aprovados.");
