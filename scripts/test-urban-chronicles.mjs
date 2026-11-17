import assert from "node:assert/strict";
import {INITIAL_URBAN,URBAN_CASES,decideUrban,currentUrbanCase,readUrban,
 saveUrban,normalizeUrban,validateUrbanBackup,urbanFactionEffects,urbanPressure,urbanActor,recordUrbanEvidence,urbanFollowupActor,recordUrbanFollowup,urbanFollowupNeeded} from "../src/game/story/urban-chronicles.ts";
import {INITIAL_FAVORS} from "../src/game/story/favors.ts";
import {INITIAL_MARKET} from "../src/game/story/market.ts";
import {calculateReputation,readReputation} from "../src/game/story/reputation.ts";
import {RADIO_DISTRICTS} from "../src/audio/soundscapes.ts";
const data=new Map();
globalThis.localStorage={getItem:k=>data.get(k)??null,
 setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
assert.equal(URBAN_CASES.length,21);
assert.equal(new Set(URBAN_CASES.map(x=>x.id)).size,21);
for(const district of RADIO_DISTRICTS){
 const cases=URBAN_CASES.filter(c=>c.district===district.id);
 assert.equal(cases.length,3,"O distrito deve ter três histórias próprias: "+district.id);
 let state=INITIAL_URBAN;
 assert.equal(currentUrbanCase(state,district.id,false),null);
 for(const active of cases){
  assert.equal(currentUrbanCase(state,district.id,true)?.id,active.id);
  assert.equal(decideUrban(state,district.id,"fake","a",true).ok,false);
  assert.equal(decideUrban(state,district.id,active.id,"a",true).ok,false,
   "Uma escolha sem visita física não deve ser aplicada");
  const investigation=recordUrbanEvidence(state,district.id,urbanActor(active).id,true);
  assert.equal(investigation.ok,true);
  assert.equal(recordUrbanEvidence(investigation.state,district.id,urbanActor(active).id,true).ok,false);
  state=investigation.state;
  assert.equal(urbanFollowupNeeded(state,active),true,"Segunda prova exigida no progresso novo");
  assert.equal(decideUrban(state,district.id,active.id,"a",true).ok,false,
    "Só uma interação não encerra investigação nova");
  const secondActor=urbanFollowupActor(active);
  assert.notEqual(secondActor.id,urbanActor(active).id);
  assert.equal(recordUrbanFollowup(state,district.id,urbanActor(active).id,true).ok,false);
  const second=recordUrbanFollowup(state,district.id,secondActor.id,true);
  assert.equal(second.ok,true);
  assert.equal(recordUrbanFollowup(second.state,district.id,secondActor.id,true).ok,false);
  state=second.state;
  const event=decideUrban(state,district.id,active.id,"a",true);
  assert.ok(event.ok&&event.choice.result.length>40);
  assert.equal(decideUrban(event.state,district.id,active.id,"b",true).ok,false,
   "Escolhas importantes são imutáveis");
  state=event.state;
 }
 assert.equal(currentUrbanCase(state,district.id,true),null);
 assert.ok(urbanPressure(state,district.id)>=0);
 assert.equal(validateUrbanBackup(state),true);
 assert.equal(saveUrban("urban-"+district.id,state),true);
 assert.deepEqual(readUrban("urban-"+district.id),state);
 const rep=calculateReputation({favors:INITIAL_FAVORS,market:INITIAL_MARKET,urban:state});
 assert.equal(rep.honor,0,"As escolhas não criam Honra universal");
 assert.ok(Object.values(rep.factions).some(score=>score!==0));
}
const a=URBAN_CASES.find(x=>x.id==="ba-agua");
const investigated=recordUrbanEvidence(INITIAL_URBAN,"baixada",urbanActor(a).id,true);
const completed=recordUrbanFollowup(investigated.state,"baixada",urbanFollowupActor(a).id,true);
const first=decideUrban(completed.state,"baixada",a.id,"a",true);
const second=decideUrban(completed.state,"baixada",a.id,"b",true);
assert.equal(urbanFactionEffects(first.state)[0].movimento_livre,2);
assert.equal(urbanFactionEffects(second.state)[0].consorcio_civico,2);
assert.equal(validateUrbanBackup({version:1,choices:{"ba-agua":"c"}}),false);
assert.equal(validateUrbanBackup({version:1,choices:{"/../../storage":"a"}}),false);
assert.deepEqual(normalizeUrban({version:1,choices:{"ba-agua":"a",evil:"a"}}).choices,{"ba-agua":"a"});
assert.equal(validateUrbanBackup({version:1,choices:{},evidence:["evil"]}),false);
assert.equal(validateUrbanBackup({version:1,choices:{},evidence:["ba-agua","ba-agua"]}),false);
assert.equal(normalizeUrban({version:1,choices:{"ba-agua":"b"}}).evidence.length,0,
 "Save legado sem pistas ainda deve abrir");
assert.equal(saveUrban("urban-slot",second.state),true);
assert.equal(readReputation("urban-slot").factions.consorcio_civico,2);
console.log("Ocorrências urbanas: 21 histórias, 7 distritos, 42 escolhas, ramificações, backups e reputações válidas.");

// Decisões regionais têm consequência mecânica verificável e não alteram o esquema de save.
const {urbanCombatSupport}=await import("../src/game/story/urban-chronicles.ts");
const districtA={version:1,choices:{"au-crachas":"a"}};
const districtB={version:1,choices:{"au-crachas":"b"}};
assert.equal(urbanCombatSupport(districtA,"district-aurea")?.attack,1);
assert.equal(urbanCombatSupport(districtB,"district-aurea")?.armor,1);
assert.equal(urbanCombatSupport(districtA,"district-prisma"),null);
assert.equal(urbanCombatSupport(districtA,"test"),null);
assert.equal(urbanCombatSupport({version:1,choices:{"su-rotas":"a"}},"district-subsolo")?.movement,1);
assert.equal(urbanCombatSupport({version:1,choices:{"pe-agua":"b"}},"district-periferia")?.armor,1);
console.log("Decisões regionais agora influenciam atributos de combate em cada distrito.");

// Compatibilidade: saves 0.9 com uma única visita não perdem decisões pendentes.
const oldSave={version:1,choices:{},evidence:["ba-agua"]};
assert.equal(validateUrbanBackup(oldSave),true);
assert.equal(urbanFollowupNeeded(oldSave,a),false);
assert.equal(decideUrban(oldSave,"baixada","ba-agua","a",true).ok,true);
assert.equal(validateUrbanBackup({version:1,choices:{},evidence:["ba-agua"],followups:["evil"]}),false);
assert.equal(validateUrbanBackup({version:1,choices:{},evidence:[],followups:["ba-agua"]}),false);
console.log("21 ocorrências com duas etapas de investigação; legado sem migração destrutiva.");
