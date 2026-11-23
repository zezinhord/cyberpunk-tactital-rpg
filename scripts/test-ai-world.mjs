import assert from "node:assert/strict";
import {registerHooks} from "node:module";
import {readFileSync} from "node:fs";
registerHooks({resolve(specifier,ctx,next){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&
    !/\.[cm]?[jt]s$/.test(specifier))return next(specifier+".ts",ctx);
 return next(specifier,ctx);
}});
const {readWorldMemory,saveWorldMemory,recordNpcMemory,
 npcRemembers,validWorldMemoryBackup,AI_WORLD_MEMORY_KEY}=
 await import("../src/game/ai/world-memory.ts");
const {contextualPatioConversation}=await import("../src/game/ai/contextual-dialogue.ts");
const {getPatioConversation}=await import("../src/game/dialogues/patio.ts");
const {createPlayerCharacter}=await import("../src/game/character/storage.ts");
const {INITIAL_EDEN}=await import("../src/game/story/eden-echoes.ts");
const {observeEden}=await import("../src/game/ai/eden-observer.ts");
const {districtReaction}=await import("../src/game/ai/faction-reactivity.ts");
const {PARTY_POSTURES,chooseCompanionAction}=await import("../src/game/ai/companion-brain.ts");
const {COMPANION_CATALOG,setPartyPosture,validateParty,saveParty,readParty}=
 await import("../src/game/companions.ts");
const {TurnManager}=await import("../src/game/TurnManager.ts");
const db=new Map();
globalThis.localStorage={getItem:k=>db.get(k)??null,
 setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k),
 key:i=>[...db.keys()][i]??null,get length(){return db.size;}};
const character=createPlayerCharacter("Operativa","pesquisador","netrunner");
const report={honor:0,community:5,
 factions:{helix:-3,movimento_livre:3,mercado_cinzento:0,consorcio_civico:0}};
assert.equal(readWorldMemory(character.id).facts.length,0);
let state=readWorldMemory(character.id);
let changed=recordNpcMemory(state,"lia","met","baixada","first-contact","Primeira conversa");
assert.equal(changed.changed,true);
state=changed.state;
assert.equal(recordNpcMemory(state,"lia","met","baixada","first-contact","Repetido").changed,false);
assert.equal(saveWorldMemory(character.id,state),true);
assert.equal(npcRemembers(readWorldMemory(character.id),"lia","met"),true);
assert.equal(validWorldMemoryBackup(readWorldMemory(character.id)),true);
assert.equal(validWorldMemoryBackup({version:1,facts:[{...state.facts[0],secret:"injected"}]}),false);
assert.equal(validWorldMemoryBackup({version:1,facts:[{...state.facts[0],summary:"<script>"}]}),false);
db.set(AI_WORLD_MEMORY_KEY+character.id,"{invalid");
assert.equal(readWorldMemory(character.id).facts.length,0,"Corrupt memory must not brick save");
assert.equal(saveWorldMemory(character.id,state),true);
let bounded=state;
for(let i=0;i<150;i++)
 bounded=recordNpcMemory(bounded,"person-"+i,"met","baixada","visit",
   "Conversa de bairro").state;
assert.ok(bounded.facts.length<=48);
assert.equal(validWorldMemoryBackup(bounded),true);
const simple=getPatioConversation("lia","pesquisador",false);
const enhanced=contextualPatioConversation("lia",simple,
 {character,reputation:report,memory:state});
assert.ok(enhanced.choices.some(x=>x.id==="ai-lia-engineering"));
assert.ok(enhanced.text.includes("última conversa"));
assert.ok(!enhanced.choices.some(x=>x.marketAction||x.shopAction||x.favorAction),
 "Insight options cannot mutate inventory, quests or reputation");
const novice=createPlayerCharacter("Nova","baixada","solo");
const quiet=contextualPatioConversation("lia",
 getPatioConversation("lia","baixada",false),
 {character:novice,reputation:{...report,community:0},memory:readWorldMemory("missing")});
assert.ok(!quiet.choices.some(c=>c.id==="ai-lia-engineering"));
assert.equal(observeEden(INITIAL_EDEN,report),null);
const analytic=observeEden({...INITIAL_EDEN,started:true,step:4,
 history:["amarra","marcas-canal","turnos","auditoria"]},report);
assert.equal(analytic.voice,"analytical");
assert.equal(analytic.knownEvidence.length,4);
const endgame=observeEden({...INITIAL_EDEN,started:true,completed:true,
 step:10,history:["amarra"],ending:"resguardar"},report);
assert.equal(endgame.voice,"self-questioning");
assert.ok(endgame.transmission.includes("governança híbrida"));
assert.equal(districtReaction("aurea",report).attitude,"wary");
assert.equal(districtReaction("baixada",report).attitude,"friendly");
assert.equal(districtReaction("prisma",report).attitude,"neutral");
assert.equal(PARTY_POSTURES.length,5);
let party={version:1,recruited:["joana","nilo"],active:["joana","nilo"]};
assert.equal(validateParty(party),true,"Old saves without posture stay valid");
const stance=setPartyPosture(party,"support");
assert.equal(stance.ok,true);
assert.equal(saveParty(character.id,stance.state),true);
assert.equal(readParty(character.id).posture,"support");
assert.equal(setPartyPosture(party,"unknown").ok,false);
const fighter=new TurnManager({
 partySupport:[COMPANION_CATALOG.joana,COMPANION_CATALOG.nilo],
 partyPosture:"support",encounterId:"test"});
fighter.state.units[0].hp=7;
const decision=chooseCompanionAction(
 [COMPANION_CATALOG.joana,COMPANION_CATALOG.nilo],
 fighter.getState(),"support");
assert.equal(decision,"joana","Heal comes before energy at critical HP");
fighter.endPlayerTurn();
assert.ok(fighter.getState().companionUsed.includes("joana"),
 "Automatic ally healing consumes its existing one-use charge");
assert.equal(fighter.getState().bonusActionAvailable,true,
 "Next player round gets exactly its normal bonus action back");
const atMax=new TurnManager({partySupport:[COMPANION_CATALOG.joana],
 partyPosture:"support",encounterId:"test"});
assert.equal(chooseCompanionAction([COMPANION_CATALOG.joana],
 atMax.getState(),"support"),null,
 "Companion must not waste healing on a full-HP protagonist");
assert.equal(chooseCompanionAction([COMPANION_CATALOG.joana],
 fighter.getState(),"hold"),null);
const app=readFileSync("src/screens/ExplorationScreen.tsx","utf8");
for(const marker of ["contextualPatioConversation(","recordNpcMemory(",
  "observeEden(eden,reputation)","districtReaction(cityArea,reputation)"])
 assert.ok(app.includes(marker),"Missing live narrative binding "+marker);
const team=readFileSync("src/components/CharacterMenu.tsx","utf8");
assert.ok(team.includes('className="na-party-postures"'));
console.log("World AI: memory+backup validation, attribute checks, Eden voices, district responses, companion postures, healing and old party saves passed.");
