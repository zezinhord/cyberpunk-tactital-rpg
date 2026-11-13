import assert from "node:assert/strict";
import {readV09,markV09Defeated,markV09Reported,grantV09Experience} from "../src/game/story/v09.ts";
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
const original={
  id:"hero",name:"Hero",originId:"baixada",classId:null,level:1,experience:20,
  abilities:[],skills:[],attributes:{},equipment:[],introductionCompleted:true,
  questRewards:[],createdAt:"2026-01-01",updatedAt:"2026-01-01",
};
const reward=grantV09Experience(original);
assert.equal(reward.awarded,true);
assert.equal(reward.character.experience,35);
assert.deepEqual(reward.character.questRewards,["v09"]);
assert.equal(original.experience,20,"O estado original não pode ser mutado");
assert.equal(grantV09Experience(reward.character).awarded,false,"Recompensa V-09 duplicada");
assert.equal(grantV09Experience(reward.character).character.experience,35);
console.log("Missão V-09: vitória e recompensa atômica, sem duplicação, relato e isolamento por personagem.");
