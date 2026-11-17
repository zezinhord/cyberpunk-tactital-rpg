import assert from "node:assert/strict";
import {registerHooks} from "node:module";
import {readFileSync} from "node:fs";
registerHooks({
 resolve(specifier,context,nextResolve){
  if((specifier.startsWith("./")||specifier.startsWith("../"))&&
    !/\.[cm]?[jt]s$/.test(specifier))return nextResolve(specifier+".ts",context);
  return nextResolve(specifier,context);
 }
});
const {TurnManager}=await import("../src/game/TurnManager.ts");
const {isOperativeDefeated,recoverFromDefeat,stabilizeAfterDefeat}=
 await import("../src/game/combat/defeat.ts");
const {loadHealth,saveHealth}=await import("../src/game/combat/health.ts");
const {loadWorldArea,saveWorldArea}=await import("../src/game/baixada/world-area.ts");
const data=new Map();
let failPrefix="";
globalThis.localStorage={
 getItem:k=>data.get(k)??null,
 setItem:(k,v)=>{if(k.startsWith(failPrefix)&&failPrefix)throw Error("disk full");data.set(k,String(v))},
 removeItem:k=>data.delete(k)
};
const saved=("mission-v09",{story:"pending",progress:4});
data.set("cyberpunk-tactical-rpg.mission.v1.operativo-a",JSON.stringify(saved));
data.set("cyberpunk-tactical-rpg.inventory.v1.operativo-a",JSON.stringify({item:"kit_trauma"}));
// Gera morte real pelo turno do inimigo, sem alteração no motor de regras.
const prevRandom=Math.random;
try{
 Math.random=()=>0.99999; // acerto crítico do inimigo.
 for(const encounterId of ["test","v09","trial-1","district-aurea","eden-core"]){
  const m=new TurnManager({playerName:"A",currentHp:1,encounterId});
  // Posições usadas somente no teste; toda resolução usa motor real.
  m.state.units[0].x=5;m.state.units[0].y=1;
  m.state.units[1].x=6;m.state.units[1].y=1;
  m.state.units[1].attackBonus=100;
  let count=0;
  while(!m.getState().combatComplete&&count++<4)m.endPlayerTurn();
  const result=m.getState();
  assert.equal(result.combatComplete,true,encounterId+" deve terminar com 0 PV");
  assert.equal(result.units[0].hp,0);
  assert.ok(result.units[1].hp>0);
  assert.equal(isOperativeDefeated(result),true);
  assert.equal(result.defeatedEnemyCount,0,"Morte não concede XP de inimigo");
  assert.ok(result.message.includes("incapacitado"));
  m.endPlayerTurn();
  assert.equal(m.getState().round,result.round,"O jogo não deve continuar turno após derrota");
 }
}finally{Math.random=prevRandom;}
assert.equal(stabilizeAfterDefeat(18,"clinic"),7);
assert.equal(stabilizeAfterDefeat(18,"retry"),9);
assert.equal(stabilizeAfterDefeat(1,"clinic"),1);
assert.equal(stabilizeAfterDefeat(0,"retry"),0);
assert.ok(saveWorldArea("operativo-a","subsolo"));
assert.ok(saveHealth("operativo-a",1,18));
const retry=recoverFromDefeat("operativo-a",18,"retry");
assert.equal(retry.ok,true);
assert.equal(retry.hp,9);
assert.equal(loadHealth("operativo-a",18),9);
assert.equal(loadWorldArea("operativo-a"),"subsolo","Retentativa preserva local antes da batalha");
const clinic=recoverFromDefeat("operativo-a",18,"clinic");
assert.equal(clinic.ok,true);
assert.equal(clinic.hp,7);
assert.equal(loadHealth("operativo-a",18),7);
assert.equal(loadWorldArea("operativo-a"),"clinic","Evacuação deve entrar na clínica");
assert.ok(saveWorldArea("operativo-b","prisma"));
assert.equal(loadWorldArea("operativo-b"),"prisma","Não mexe no segundo slot");
assert.ok(!recoverFromDefeat("",18,"clinic").ok);
assert.ok(!recoverFromDefeat("operativo-a",0,"clinic").ok);
assert.ok(!recoverFromDefeat("operativo-a",18,"invalid").ok);
failPrefix="cyberpunk-tactical-rpg.health.";
assert.equal(recoverFromDefeat("operativo-a",18,"retry").ok,false);
assert.equal(loadHealth("operativo-a",18),7);
failPrefix="";
assert.ok(saveWorldArea("operativo-a","subsolo"));
assert.ok(saveHealth("operativo-a",1,18));
failPrefix="cyberpunk-tactical-rpg.world-area.";
assert.equal(recoverFromDefeat("operativo-a",18,"clinic").ok,false);
failPrefix="";
assert.equal(loadHealth("operativo-a",18),1,"Não gravar cura se a transição falhar");
assert.equal(loadWorldArea("operativo-a"),"subsolo","Falha de armazenamento mantém posição");
assert.ok(data.get("cyberpunk-tactical-rpg.mission.v1.operativo-a")?.includes("pending"));
assert.ok(data.get("cyberpunk-tactical-rpg.inventory.v1.operativo-a")?.includes("kit_trauma"));
const battleScene=readFileSync(new URL("../src/game/BattleScene.ts",import.meta.url),"utf8");
const fx=battleScene.slice(battleScene.indexOf("private showEffect("),battleScene.indexOf("private drawBoard("));
assert.ok(battleScene.includes("private hasLiveCanvas()"),"Renderer desativado deve ignorar eventos tardios");
assert.ok(battleScene.includes("if(!this.hasLiveCanvas())return"),"Eventos de dano não podem desenhar sem contexto");
assert.ok(!fx.includes("this.add.text("),"Golpes fatais não devem alocar Phaser.Text nem CanvasPool");
const app=readFileSync(new URL("../src/App.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/arena-v030.css",import.meta.url),"utf8");
for(const marker of ['role="dialog"','aria-modal="true"','data-combat-defeat="true"',
 'handleDefeatChoice("clinic")','handleDefeatChoice("retry")',
 'setScreen("title")','setScreen("exploration")','setBattleReset(n=>n+1)'])
 assert.ok(app.includes(marker),"Falta recuperação de derrota na interface: "+marker);
assert.ok(css.includes("position:fixed")&&css.includes("z-index:10050")&&
 css.includes("max-height:calc(100dvh - 16px)"));
console.log("MORTE QA: 5 confrontos derrotados, UI visível em landscape, reentrada na clínica, 50% de HP para retry, identidade de slots, saves e ausência de XP.");
