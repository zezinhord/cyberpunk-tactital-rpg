import assert from "node:assert/strict";
import {readV09,markV09Defeated,markV09Reported} from "../src/game/story/v09.ts";
const values=new Map();
globalThis.localStorage={
  getItem:(key)=>values.get(key)??null,
  setItem:(key,value)=>{values.set(key,String(value));},
};
assert.deepEqual(readV09("charA"),{defeated:false,reported:false});
assert.equal(markV09Reported("charA"),false);
assert.equal(markV09Defeated("charA"),true);
assert.equal(markV09Defeated("charA"),false);
assert.equal(readV09("charB").defeated,false);
assert.equal(markV09Reported("charA"),true);
assert.equal(markV09Reported("charA"),false);
assert.deepEqual(readV09("charA"),{defeated:true,reported:true});
console.log("Missão V-09: vitória persistente, idempotência, relato e isolamento por personagem.");
