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
for(const marker of ["data-battlefield-renderer=\"svg\"","viewBox={tacticalViewBox(viewport)}",
 "manager.subscribe(","manager.movePlayerTo(","manager.interactWithTerminal(0,6)",
 "state.combatComplete","data-unit={unit.id}", "player-", "sentinel.svg"])
 assert.ok(ui.includes(marker),"Renderizador tático perdeu requisito: "+marker);
assert.ok(!ui.includes('import Phaser from "phaser"'),
 "Arena não pode depender do contexto Canvas que falha no Android.");
// The hostile silhouette must be a real 58x93 touch target, including
// keyboard access and unavailable-attack feedback without wasted actions.
for(const marker of ['data-tactical-target="enemy"','onClick={()=>{if(!draggedRef.current)manager.attack(hostile.id);}}',
 'role="button" tabIndex={0}','preview.hitChance',
 'width="58" height="93"','manager.movePlayerTo(cell.x,cell.y)'])
 assert.ok(ui.includes(marker),"Touch-first combat lost: "+marker);
assert.ok(app.includes("CHANCE DE ACERTO: {attackPreview.hitChance}%"),
 "The accuracy estimate must stay visible with cover in the battle HUD");
for(const marker of ['data-combat-exit="true"','data-combat-victory="true"',
 'setScreen("exploration")','onClick={exitBattle}','role="dialog"',
 "setVictoryDetailsOpen(false)"])
 assert.ok(app.includes(marker),"Saída pós-combate não aparece: "+marker);
for(const marker of [".na-battlefield-svg",".na-tactical-camera-controls",".na-victory-continue",
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
const unreachable=new TurnManager({encounterId:"v09"});
const initialPosition=unreachable.getState().units[0];
unreachable.movePlayerTo(3,1);
assert.match(unreachable.getState().message,/bloqueado|rota segura/,
 "Tapping an obstructed tile should explain why the avatar cannot move");
assert.deepEqual([unreachable.getState().units[0].x,unreachable.getState().units[0].y],
 [initialPosition.x,initialPosition.y]);
unreachable.state.movementRemaining=0;
unreachable.movePlayerTo(1,5);
assert.match(unreachable.getState().message,/células necessárias/,
 "An unreachable highlighted destination must explain movement cost");
assert.equal(unreachable.getState().mainActionAvailable,true,
 "Invalid movement may not consume a main action");
unreachable.movePlayerTo(1,6);
assert.match(unreachable.getState().message,/já está nessa posição/,
 "Tapping the current tile should never appear to silently fail");
console.log("QA arena: target taps, real hit odds, blocked movement reasons, mobile SVG and victory controls passed.");
