import assert from "node:assert/strict";
import {createStartingInventory,loadInventory,saveInventory} from "../src/game/inventory.ts";
import {FAVORS,INITIAL_FAVORS,acceptFavor,recordFavorActivity,
 claimFavor,buyFromNilo,syncFavorItems,visibleFavors,readFavors,saveFavors,
 favorStatus} from "../src/game/story/favors.ts";
const data=new Map();
globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
const ctx0={missionStep:0,v09Defeated:false};
const ctx1={missionStep:1,v09Defeated:false};
const ctx3={missionStep:3,v09Defeated:false};
assert.equal(visibleFavors(ctx0).length,0);
assert.deepEqual(visibleFavors(ctx1).map(x=>x.id),["triagem","filtros"]);
assert.ok(!visibleFavors(ctx3).some(x=>x.id==="seguranca"));
assert.equal(visibleFavors({...ctx3,v09Defeated:true}).length,FAVORS.length-1,
 "Contrato de Davi requer reputação de Honra");
assert.equal(visibleFavors({...ctx3,v09Defeated:true,honor:2}).length,FAVORS.length);
let state={...INITIAL_FAVORS};
assert.equal(acceptFavor(state,"seguranca",ctx1).ok,false);
let acc=acceptFavor(state,"triagem",ctx1);
assert.equal(acc.ok,true);state=acc.state;
assert.equal(acceptFavor(state,"triagem",ctx1).ok,false);
assert.equal(favorStatus(state,"triagem"),"active");
assert.equal(recordFavorActivity(state,"vendedor").ready.length,0);
const event=recordFavorActivity(state,"terminal-clinica");state=event.state;
assert.deepEqual(event.ready,["triagem"]);
assert.equal(recordFavorActivity(state,"terminal-clinica").ready.length,0);
assert.equal(favorStatus(state,"triagem"),"ready");
let claim=claimFavor(state,"triagem");assert.equal(claim.ok,true);state=claim.state;
assert.equal(claimFavor(state,"triagem").ok,false);
assert.equal(state.credits,60);assert.equal(state.honor,1);
assert.equal(saveFavors("slot1",state),true);state=readFavors("slot1");
assert.equal(state.claimed[0],"triagem");
let inv=syncFavorItems(createStartingInventory("slot1"),state);
assert.equal(inv.quantities.curativo_campo,4);
assert.equal(syncFavorItems(inv,state).quantities.curativo_campo,4,"No double item reward");
assert.equal(saveInventory(inv),true);
assert.equal(loadInventory("slot1").rewardReceipts?.includes("favor-triagem"),true);
let buy=buyFromNilo(state,"curativo_campo");assert.equal(buy.ok,true);state=buy.state;
assert.equal(state.credits,30);
inv=syncFavorItems(inv,state);assert.equal(inv.quantities.curativo_campo,5);
assert.equal(syncFavorItems(inv,state).quantities.curativo_campo,5);
assert.equal(buyFromNilo(state,"colete_reforcado").ok,false);
const state2={...INITIAL_FAVORS};
assert.equal(readFavors("other").claimed.length,0);
assert.equal(state2.credits,0);
const a=acceptFavor(state2,"rotas",ctx3);assert.equal(a.ok,true);
assert.equal(recordFavorActivity(a.state,"tomas").ready[0],"rotas");
const patio=acceptFavor(INITIAL_FAVORS,"patio",ctx3);
assert.equal(patio.ok,true);
assert.deepEqual(recordFavorActivity(patio.state,"patio-console",false).ready,[],
 "Console bloqueado não deve concluir favor");
assert.equal(recordFavorActivity(patio.state,"patio-console",true).ready[0],"patio",
 "Favor avança depois da autorização pela investigação V-09");
console.log("Favores: desbloqueio progressivo, entrega ao NPC, 1x XP/itens, carteira, loja e saves isolados.");
