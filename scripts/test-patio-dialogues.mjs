import assert from "node:assert/strict";
import { isPatioCitizen,getPatioConversation } from "../src/game/dialogues/patio.ts";
for(const id of ["lia","ramon","duda"]){
  assert.equal(isPatioCitizen(id),true);
  const d=getPatioConversation(id,"baixada",false);
  assert.ok(d.speaker&&d.text.length>70);
  assert.ok(d.choices.length>=2);
  assert.ok(d.choices.some(x=>x.clue));
  assert.ok(d.choices.every(x=>x.label&&x.reply));
  assert.ok(getPatioConversation(id,"pesquisador",true).text.includes("sentinela"));
}
assert.equal(isPatioCitizen("exterior"),false);
console.log("Diálogos: 3 habitantes, escolhas, pistas e variações por origem/consequência aprovados.");
