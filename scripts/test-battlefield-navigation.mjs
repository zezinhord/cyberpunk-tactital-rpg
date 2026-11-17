import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,context,next){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&
 !/\.[cm]?[jt]s$/.test(specifier))return next(specifier+".ts",context);
 return next(specifier,context);
}});
const {TurnManager}=await import("../src/game/TurnManager.ts");
const {BOARD_WIDTH,BOARD_HEIGHT,isBlocked}=await import("../src/game/map.ts");
const ui=readFileSync("src/components/Battlefield.tsx","utf8");
const app=readFileSync("src/App.tsx","utf8");
const css=readFileSync("src/arena-v030.css","utf8");
assert.equal(BOARD_WIDTH*BOARD_HEIGHT,64);
assert.equal(isBlocked({x:3,y:1}),true);
for(const marker of ["data-battlefield-renderer=\"svg\"","viewBox=\"0 0 480 320\"",
 "manager.subscribe(","manager.movePlayerTo(","manager.interactWithTerminal(0,6)",
 "state.combatComplete","data-unit={unit.id}", "player-", "sentinel.svg"])
 assert.ok(ui.includes(marker),"Renderizador tático perdeu requisito: "+marker);
assert.ok(!ui.includes('import Phaser from "phaser"'),
 "Arena não pode depender do contexto Canvas que falha no Android.");
for(const marker of ['data-combat-exit="true"','data-combat-victory="true"',
 'setScreen("exploration")','onClick={exitBattle}','role="dialog"',
 "setVictoryDetailsOpen(false)"])
 assert.ok(app.includes(marker),"Saída pós-combate não aparece: "+marker);
for(const marker of [".na-battlefield-svg",".na-victory-continue",
 ".na-arena-exit-quick","z-index:10050"])
 assert.ok(css.includes(marker),"Interface não garante saída acessível: "+marker);
const arena=new TurnManager({encounterId:"v09"});
const before=arena.getState();
assert.equal(before.combatComplete,false);
assert.equal(before.units.find(x=>x.id==="runner").x,1);
const cells=arena.getReachableCells();
assert.ok(cells.length>5,"O tabuleiro inicial não tem caminhos");
const p=cells.find(p=>p.x===1&&p.y===5);
assert.ok(p&&!isBlocked(p));
arena.movePlayerTo(p.x,p.y);
assert.equal(arena.getState().units.find(x=>x.id==="runner").y,5);
arena.state.units[0].x=5;arena.state.units[0].y=1;
arena.state.units[0].attackBonus=100;
arena.state.units[1].x=6;arena.state.units[1].y=1;
arena.state.units[1].hp=1;
const previous=Math.random;
try{Math.random=()=>.9999;arena.attack();}finally{Math.random=previous;}
assert.equal(arena.getState().combatComplete,true);
assert.equal(arena.getReachableCells().length,0);
console.log("QA arena: SVG 8x8, movimento, terminal, sprites, vitória e retorno em dois controles de alto contraste.");
