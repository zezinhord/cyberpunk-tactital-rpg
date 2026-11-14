import assert from "node:assert/strict";
import {FERRUGEM_WIDTH,FERRUGEM_HEIGHT,FERRUGEM_START,FACTORIES,FERRUGEM_ACTORS,
 isFerrugemInside,isFerrugemWalkable,ferrugemStep,ferrugemPath,ferrugemApproach,
 KEY} from "../src/game/ferrugem/layout.ts";
import {FERRUGEM_STEPS,FERRUGEM_SAVE_PREFIX,FRESH_FERRUGEM,normalizeFerrugem,
 startFerrugem,currentFerrugemStep,advanceFerrugem,readFerrugem,saveFerrugem,
 ferrugemObjective} from "../src/game/ferrugem/story.ts";
assert.ok(FERRUGEM_WIDTH>=24&&FERRUGEM_HEIGHT>=18,"Ferrugem não pode ser apenas uma sala");
assert.ok(FACTORIES.length>=6,"Faltam núcleos industriais distintos");
assert.ok(isFerrugemWalkable(FERRUGEM_START),"Nascimento em obstáculo");
assert.equal(new Set(FERRUGEM_ACTORS.map(a=>a.id)).size,FERRUGEM_ACTORS.length);
const accessible=new Set([KEY(FERRUGEM_START)]),queue=[FERRUGEM_START];
for(let i=0;i<queue.length;i++){
 const tile=queue[i];
 for(const d of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]){
  const next={x:tile.x+d.x,y:tile.y+d.y},key=KEY(next);
  if(isFerrugemWalkable(next)&&!accessible.has(key)){accessible.add(key);queue.push(next);}
 }
}
let walkableCount=0;
for(let y=0;y<FERRUGEM_HEIGHT;y++)for(let x=0;x<FERRUGEM_WIDTH;x++){
 if(isFerrugemWalkable({x,y}))walkableCount++;
}
assert.equal(walkableCount,accessible.size,"Uma parte de Ferrugem ficou inacessível");
assert.ok(walkableCount>200,"Pouca área navegável");
for(const actor of FERRUGEM_ACTORS){
 assert.equal(isFerrugemInside(actor.tile),true,"Ator na borda: "+actor.id);
 assert.equal(isFerrugemWalkable(actor.tile),false,"Ator deve bloquear sua célula: "+actor.id);
 const path=ferrugemApproach(FERRUGEM_START,actor.tile);
 assert.ok(path?.length,"Sem caminho de toque até "+actor.id);
 const last=path.at(-1);
 assert.equal(Math.abs(last.x-actor.tile.x)+Math.abs(last.y-actor.tile.y),1,
  "Interação não alcança adjacência: "+actor.id);
 for(let i=1;i<path.length;i++)assert.equal(ferrugemStep(path[i-1],path[i]),true,
  "A rota atravessou parede/quina: "+actor.id);
}
assert.equal(ferrugemPath(FERRUGEM_START,{x:4,y:2}),null,"Não entrar no alto-forno");
assert.equal(ferrugemStep({x:3,y:5},{x:4,y:4}),false,"Não cortar esquina do alto-forno");
assert.equal(isFerrugemWalkable({x:1.5,y:9}),false,"Coordenadas fracionárias proibidas");
assert.equal(ferrugemStep({x:4,y:9},{x:6,y:9}),false,"Proibido pular duas células");
assert.equal(FERRUGEM_STEPS.length,9);
assert.equal(FERRUGEM_STEPS[0].actor,"ferrugem-foreman");
assert.equal(FERRUGEM_STEPS.at(-1).actor,"ferrugem-foreman");
for(const step of FERRUGEM_STEPS){
 assert.ok(FERRUGEM_ACTORS.some(a=>a.id===step.actor),"Objetivo sem ator do mapa: "+step.id);
 assert.ok(step.xp>0&&step.objective.length>20,"Objetivo incompleto: "+step.id);
}
let storage=new Map();
globalThis.localStorage={
 getItem:key=>storage.get(key)??null,
 setItem:(key,v)=>storage.set(key,String(v)),
 removeItem:key=>storage.delete(key),
};
assert.equal(readFerrugem("hero").started,false);
let progress=startFerrugem(FRESH_FERRUGEM);
assert.equal(progress.started,true);
assert.equal(progress.step,0);
assert.equal(advanceFerrugem(progress,"ferrugem-log").advanced,false,"Etapa não pode ser pulada");
for(let i=0;i<FERRUGEM_STEPS.length-1;i++){
 const step=FERRUGEM_STEPS[i];
 assert.equal(currentFerrugemStep(progress).id,step.id);
 const wrongChoice=advanceFerrugem(progress,step.actor,"publicar");
 assert.equal(wrongChoice.advanced,false,"Decisão fora da etapa final");
 const next=advanceFerrugem(progress,step.actor);
 assert.equal(next.advanced,true);
 assert.equal(next.stage.id,step.id);
 assert.equal(next.progress.step,i+1);
 assert.equal(progress.step,i,"Mutação de state proibida");
 progress=next.progress;
 assert.equal(saveFerrugem("hero",progress),true);
 assert.deepEqual(readFerrugem("hero"),progress);
}
assert.equal(advanceFerrugem(progress,"ferrugem-foreman").advanced,false,
 "Decisão final deve exigir escolha");
assert.equal(readFerrugem("outro").started,false,"Saves dos protagonistas isolados");
for(const ending of ["publicar","proteger"]){
 const final=advanceFerrugem(progress,"ferrugem-foreman",ending);
 assert.equal(final.advanced,true);
 assert.equal(final.progress.completed,true);
 assert.equal(final.progress.step,FERRUGEM_STEPS.length);
 assert.equal(final.progress.ending,ending);
 assert.equal(advanceFerrugem(final.progress,"ferrugem-foreman",ending).advanced,false,
  "Recompensa final não pode duplicar");
 assert.ok(ferrugemObjective(final.progress).length>25);
 assert.equal(normalizeFerrugem({...final.progress,step:999}).completed,false,
  "Dados inválidos não podem concluir campanha");
}
storage.set(FERRUGEM_SAVE_PREFIX+"hero","{corrupted");
assert.equal(readFerrugem("hero").started,false,"Save malformado deve ser recuperável");
globalThis.localStorage={getItem:()=>null,setItem:()=>{throw Error("quota exceeded")}};
assert.equal(saveFerrugem("hero",progress),false,"Falha de storage não pode confirmar avanço");
console.log("Ferrugem: mapa acessível, 9 objetivos, escolhas, recompensas e saves isolados aprovados.");
