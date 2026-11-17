import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {HEALTH_KEY,healAtClinic,loadHealth,saveHealth} from "../src/game/combat/health.ts";
const records=new Map();
globalThis.localStorage={
 getItem:key=>records.get(key)??null,
 setItem:(key,value)=>records.set(key,value),
 removeItem:key=>records.delete(key),
};
assert.equal(saveHealth("player-1",5,27),true);
assert.equal(saveHealth("player-2",8,18),true);
assert.equal(loadHealth("player-1",27),5);
assert.equal(healAtClinic("player-1",27),true);
assert.equal(loadHealth("player-1",27),27);
assert.equal(loadHealth("player-2",18),8,"Cura não pode alterar outro slot");
assert.deepEqual(JSON.parse(records.get(HEALTH_KEY+"player-1")),{hp:27,maxHp:27});
const screen=readFileSync(new URL("../src/screens/ExplorationScreen.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/immersive-ui.css",import.meta.url),"utf8");
const start=screen.indexOf('className="na-clinic-quick-treatment"');
const end=screen.indexOf('<aside className={"na-mission-hub',start);
assert.ok(start>0&&end>start,"O botão médico deve estar fora do painel de missões");
assert.ok(screen.includes('onClick={performClinicTreatment}'),"Botão não dispara tratamento");
assert.ok(screen.includes('if(choice.id==="clinic-treatment")'),"Diálogo não permite cura");
assert.ok(screen.includes('const sayClinic='),"Médica deve oferecer a escolha em cada etapa");
assert.ok(css.includes('.na-clinic-quick-treatment')&&css.includes('min-height:48px'),
 "Cura deve permanecer acessível no Android horizontal");
console.log("Hospital: cura persistente independente de missões e seleção por Dra. Amara.");
