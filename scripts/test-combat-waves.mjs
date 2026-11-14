import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
const require=createRequire(import.meta.url);
const tsPackage=require("typescript");
const ts=tsPackage.default??tsPackage;
// Testa o mesmo TurnManager de produção. Um loader de desenvolvimento CJS
// usa apenas TypeScript já fixado no package-lock, sem dependências extras.
require.extensions[".ts"]=(mod,filename)=>{
  const source=readFileSync(filename,"utf8");
  const output=ts.transpileModule(source,{fileName:filename,compilerOptions:{
    module:1,target:9,
    esModuleInterop:true,
  }}).outputText;
  mod._compile(output,filename);
};
const {TurnManager}=require("../src/game/TurnManager.ts");
 for(const encounter of ["trial-1","trial-2","trial-3"]){
  const m=new TurnManager({
   playerName:"Protagonista",originId:"baixada",classId:"solo",
   characterLevel:3,characterAbilities:["solo-ruptura","solo-marca","solo-furia"],
   encounterId:encounter,
   progressionBonuses:{hp:3,attack:1,armor:1,movement:1,energy:2},
  });
  const total=encounter==="trial-3"?3:2;
  let state=m.getState();
  assert.equal(state.wave,1);
  assert.equal(state.totalWaves,total);
  assert.equal(state.units[0].maxHp,21);
  assert.equal(state.maxEnergy,12);
  assert.equal(state.characterAbilities.length,3);
  assert.equal(m.getClassAbilities().length,3);
  for(let wave=1;wave<=total;wave++){
   // Prepara o inimigo com 1 PV e aproxima o personagem apenas na fixture,
   // a partir daqui a resolução usa o motor e os efeitos reais.
   m.state.units[0].x=5;m.state.units[0].y=1;
   m.state.units[0].attackBonus=100;
   m.state.units[1].x=6;m.state.units[1].y=1;
   m.state.units[1].hp=1;
   m.state.mainActionAvailable=true;
   m.state.combatComplete=false;
   if(wave===1)m.activateClassAbility("solo-ruptura");
   else if(wave===2){
      m.state.cooldowns["pulse-emp"]=0;
      m.activateSpecial("pulse-emp");
   }else m.attack();
   state=m.getState();
   if(wave<total){
     assert.equal(state.wave,wave+1,encounter+" não avançou onda");
     assert.equal(state.combatComplete,false,"Vitória cedo demais");
     assert.ok(state.units[1].hp>0,"Drone da próxima onda ausente");
     assert.equal(state.mainActionAvailable,true,"Nova onda deve liberar ação");
   }else{
     assert.equal(state.combatComplete,true,"Vitória final não registrada");
     assert.equal(state.units[1].hp,0);
     assert.ok(state.message.includes("ondas"));
   }
  }
 }
console.log("Combat: 2+2+3 ondas reais, três fontes de dano, energia e classe preservadas.");
