import assert from "node:assert/strict";
import { CLASS_IDS } from "../src/game/classes/registry.ts";
import { MARKET_ACTIONS,MARKET_CLUE_TEXT,INITIAL_MARKET,
 getMarketConversation,applyMarketAction,readMarket,saveMarket,isMarketActor } from "../src/game/story/market.ts";
const db=new Map();
globalThis.localStorage={getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
for(const id of ["feira-corretor","feira-ajuda","feira-archive","iza","tomas"])assert.ok(isMarketActor(id));
for(const [idx,classId] of CLASS_IDS.entries()){
 const action=MARKET_ACTIONS.find(a=>a.classId===classId);
 assert.ok(action,"Classe sem utilidade social: "+classId);
 const talk=getMarketConversation(action.actor,classId,INITIAL_MARKET,false,"baixada");
 assert.ok(talk.choices.some(c=>c.id===action.id));
 assert.ok(!getMarketConversation(action.actor,CLASS_IDS[(idx+1)%11],INITIAL_MARKET,false,"baixada").choices.some(c=>c.id===action.id));
 const result=applyMarketAction(INITIAL_MARKET,action.id,classId);
 assert.ok(result.applied);
 assert.ok(result.state.clues.includes(action.clue));
 assert.ok(result.state.decisions.includes(action.id));
 assert.ok(MARKET_CLUE_TEXT[action.clue]);
 assert.equal(applyMarketAction(result.state,action.id,classId).applied,false,"Repetição de favor não deve ser farmável");
 assert.equal(applyMarketAction(INITIAL_MARKET,action.id,CLASS_IDS[(idx+1)%11]).applied,false,"Outra classe pode escolher ação exclusiva");
 assert.ok(result.state.heat>=0&&result.state.heat<=5);
 assert.ok(result.state.trust>=0&&result.state.trust<=5);
 assert.equal(saveMarket("char-"+idx,result.state),true);
 assert.deepEqual(readMarket("char-"+idx),result.state);
}
assert.deepEqual(readMarket("char-other"),INITIAL_MARKET);
assert.ok(getMarketConversation("feira-archive","netrunner",INITIAL_MARKET,true,"corporativo").text.includes("V-09"));
console.log("Mercado: 5 habitantes/pontos, 11 soluções por classe, 11 pistas, atenção, confiança e persistência independentes aprovadas.");
