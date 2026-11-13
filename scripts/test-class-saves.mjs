import assert from "node:assert/strict";
import {readV09,markV09Defeated} from "../src/game/story/v09.ts";
import { CLASS_IDS,getStartingClassAbilities } from "../src/game/classes/registry.ts";
import { createPlayerCharacter,assignCharacterClass,loadCharacter,saveCharacter,CHARACTER_SAVE_KEY } from "../src/game/character/storage.ts";
const db=new Map();
globalThis.localStorage={
 getItem:k=>db.get(k)??null,
 setItem:(k,v)=>db.set(k,String(v)),
 removeItem:k=>db.delete(k),
};
const origins=["corporativo","baixada","gangue","militar","pesquisador","nomade"];
for(const [i,originId] of origins.entries()){
 for(const [j,classId] of CLASS_IDS.entries()){
  const c=createPlayerCharacter("Protagonista",originId,classId);
  assert.equal(c.originId,originId);
  assert.equal(c.classId,classId);
  assert.deepEqual(c.abilities,getStartingClassAbilities(classId));
  assert.equal(c.level,1);
  assert.equal(saveCharacter(c),true);
  const restored=loadCharacter();
  assert.equal(restored?.id,c.id,"Identificador mudou após save");
  assert.deepEqual(restored?.questRewards,[]);
  assert.equal(restored?.originId,originId,"Origem alterada no save");
  assert.equal(restored?.classId,classId,"Classe alterada no save");
  assert.deepEqual(restored?.abilities,c.abilities);
 }
}
const legacy=createPlayerCharacter("Antigo","nomade",null);
legacy.level=5;
legacy.experience=245;
legacy.abilities=["habilidade-legada"];
assert.equal(saveCharacter(legacy),true);
const old=loadCharacter();
assert.equal(old?.classId,null);
assert.equal(old?.level,5);
assert.equal(old?.experience,245);
const assigned=assignCharacterClass(old,"netrunner");
assert.equal(assigned?.classId,"netrunner");
assert.ok(assigned.abilities.includes("netrunner-intrusao"));
assert.ok(assigned.abilities.includes("habilidade-legada"));
assert.equal(assigned.level,5);
assert.equal(assigned.experience,245);
assert.equal(assigned.originId,"nomade");
assert.equal(assignCharacterClass(assigned,"solo").classId,"netrunner","Classe não pode ser trocada por acidente.");
saveCharacter(assigned);
assert.equal(loadCharacter()?.classId,"netrunner");
// Um save legado antigo sem arrays completos continua recuperável.
db.set(CHARACTER_SAVE_KEY,JSON.stringify({version:1,character:{
 id:"legacy",name:"Moradora",originId:"baixada",classId:null,
 level:2,experience:12,introductionCompleted:true,
 createdAt:"2025-01-01",updatedAt:"2025-01-01"
}}));
const migrated=loadCharacter();
assert.equal(migrated?.id,"legacy");
assert.equal(migrated?.classId,null);
assert.deepEqual(migrated?.abilities,[]);
assert.deepEqual(migrated?.questRewards,[]);
const corrupt=createPlayerCharacter("Corrompido","baixada","solo");
corrupt.level=-3;
assert.equal(saveCharacter(corrupt),true);
assert.equal(loadCharacter(),null,"Nível inválido não deve contaminar regras");
assert.equal(migrated?.originId,"baixada");
const alreadyRewarded=createPlayerCharacter("Vencedor","baixada","solo");
alreadyRewarded.questRewards=["v09"];
alreadyRewarded.experience=15;
saveCharacter(alreadyRewarded);
assert.equal(readV09(alreadyRewarded.id).defeated,false);
const reconciled=loadCharacter();
assert.equal(reconciled?.experience,15);
assert.deepEqual(reconciled?.questRewards,["v09"]);
assert.equal(readV09(alreadyRewarded.id).defeated,true,
  "Vitória não recuperada após salvar XP mas antes do marco narrativo");
const legacyWinner=createPlayerCharacter("Veterano","nomade","tecnico");
legacyWinner.experience=99;
saveCharacter(legacyWinner);
markV09Defeated(legacyWinner.id);
const normalized=loadCharacter();
assert.equal(normalized?.experience,99,"Recompensa legada não pode ser concedida novamente");
assert.ok(normalized?.questRewards.includes("v09"));
console.log("Save: 66 origens/classes, migração, níveis válidos e recuperação segura da recompensa V-09.");
