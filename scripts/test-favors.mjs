import assert from "node:assert/strict";
import {createStartingInventory,loadInventory,saveInventory} from "../src/game/inventory.ts";
import {FAVORS,INITIAL_FAVORS,acceptFavor,recordFavorActivity,
 claimFavor,buyFromNilo,syncFavorItems,visibleFavors,knownFavors,discoverFavors,validateFavorBackup,readFavors,saveFavors,
 favorStatus,buyFromNilo as buyForTest,NILO_SHOP,shopOfferUnlocked} from "../src/game/story/favors.ts";
import {INITIAL_MARKET,applyMarketAction,getMarketConversation} from "../src/game/story/market.ts";
import {calculateReputation,factionStanding,syncFactionAids,readReputation} from "../src/game/story/reputation.ts";
const data=new Map();
globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
const ctx0={missionStep:0,v09Defeated:false};
const ctx1={missionStep:1,v09Defeated:false};
const ctx3={missionStep:3,v09Defeated:false};
assert.equal(visibleFavors(ctx0).length,0);
assert.deepEqual(visibleFavors(ctx1).map(x=>x.id),["triagem","filtros"]);
assert.ok(!visibleFavors(ctx3).some(x=>x.id==="seguranca"));
assert.ok(visibleFavors({...ctx3,v09Defeated:true}).length<FAVORS.length,
 "Novos favores precisam de Honra antes da liberação");
assert.ok(visibleFavors({...ctx3,v09Defeated:true,honor:2}).some(x=>x.id==="seguranca"));
assert.equal(visibleFavors({...ctx3,v09Defeated:true,honor:3}).length,FAVORS.length);
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
// Reputação derivada de ações já salvas: não existe uma segunda carteira falsificável.
const noRep=calculateReputation({favors:INITIAL_FAVORS,market:INITIAL_MARKET});
assert.deepEqual(noRep.factions,{helix:0,movimento_livre:0,mercado_cinzento:0});
assert.equal(factionStanding(-3),"Hostil");
assert.equal(factionStanding(4),"Aliada");
let community=INITIAL_FAVORS;
for(const id of ["triagem","agua"]){
  const favor=FAVORS.find(f=>f.id===id);
  community=acceptFavor(community,id,{missionStep:3,v09Defeated:false,honor:community.honor}).state;
  community=recordFavorActivity(community,favor.taskId).state;
  community=claimFavor(community,id).state;
}
assert.equal(community.honor,3);
const allied=calculateReputation({favors:community,market:INITIAL_MARKET});
assert.equal(allied.factions.movimento_livre,3);
const cell=NILO_SHOP.find(o=>o.item==="celula_energia");
assert.equal(shopOfferUnlocked(cell,INITIAL_FAVORS,allied),false);
assert.equal(shopOfferUnlocked(cell,community,noRep),false);
assert.equal(shopOfferUnlocked(cell,community,allied),true);
assert.equal(buyForTest(community,"celula_energia",noRep).ok,false);
assert.equal(buyForTest(community,"celula_energia",allied).ok,true);
assert.equal(buyForTest(community,"celula_energia",allied).state.credits,65);

assert.ok(!getMarketConversation("feira-ajuda","solo",INITIAL_MARKET,false,"baixada",noRep)
  .choices.some(c=>c.id==="rede-livre-apoio"),"Sem Honra, rede livre não oferece ajuda");
assert.equal(applyMarketAction(INITIAL_MARKET,"rede-livre-apoio","solo",false,0,noRep).applied,false);
const relief=applyMarketAction(INITIAL_MARKET,"rede-livre-apoio","solo",false,0,allied);
assert.equal(relief.applied,true);
assert.equal(relief.state.decisions.includes("rede-livre-apoio"),true);
assert.equal(applyMarketAction(relief.state,"rede-livre-apoio","solo",false,0,allied).applied,false);
let aidInventory=createStartingInventory("reputation");
let rewarded=syncFactionAids(aidInventory,relief.state);
assert.equal(rewarded.quantities.curativo_campo,aidInventory.quantities.curativo_campo+2);
assert.equal(syncFactionAids(rewarded,relief.state).quantities.curativo_campo,rewarded.quantities.curativo_campo);
assert.ok(rewarded.rewardReceipts.includes("rede-rede-livre-apoio"));

const openHelix=applyMarketAction(INITIAL_MARKET,"helix-proposta","nomade",true,0,noRep);
assert.equal(openHelix.applied,true,"Proposta Helix disponível independentemente de classe após V-09");
const freelance=calculateReputation({favors:INITIAL_FAVORS,market:openHelix.state});
assert.equal(freelance.factions.helix,2);
assert.equal(freelance.factions.movimento_livre,-2);
assert.equal(getMarketConversation("feira-archive","nomade",openHelix.state,true,"baixada",freelance)
  .choices.some(c=>c.id==="helix-autorizacao"),true);
assert.equal(getMarketConversation("feira-ajuda","nomade",openHelix.state,true,"baixada",freelance)
  .text.includes("cautela"),true);
const helixState=applyMarketAction(INITIAL_MARKET,"corpo-credencial","corporativo",false,0,noRep);
assert.equal(helixState.applied,true);
const helixRep=calculateReputation({favors:INITIAL_FAVORS,market:helixState.state});
assert.equal(helixRep.factions.helix,2);
assert.equal(helixRep.factions.movimento_livre,-1);
assert.equal(applyMarketAction(helixState.state,"helix-autorizacao","corporativo",false,0,helixRep).applied,false,
 "Helix precisa de manifestação V-09");
const corporateDeal=applyMarketAction(helixState.state,"helix-autorizacao","corporativo",true,0,helixRep);
assert.equal(corporateDeal.applied,true);
assert.equal(calculateReputation({favors:INITIAL_FAVORS,market:corporateDeal.state}).factions.movimento_livre,-3,
 "A credencial expõe contatos e afeta a confiança do Movimento Livre, sem remover Honra");
assert.equal(calculateReputation({favors:INITIAL_FAVORS,market:corporateDeal.state}).honor,0);

const greyMarket={...INITIAL_MARKET,decisions:["street-atalho"]};
const greyRep=calculateReputation({favors:INITIAL_FAVORS,market:greyMarket});
assert.equal(greyRep.factions.mercado_cinzento,2);
const route=applyMarketAction(greyMarket,"cinzento-rotas","marginal",true,0,greyRep);
assert.equal(route.applied,true);
assert.equal(syncFactionAids(createStartingInventory("route"),route.state)
  .quantities.conector_reuso,createStartingInventory("route").quantities.conector_reuso+2);
assert.equal(route.state.heat,0);

const chapters={subsolo:{started:true,completed:true,step:7,ending:"divulgar",history:[]}};
const leaked=calculateReputation({favors:INITIAL_FAVORS,market:greyMarket,chapters});
assert.equal(leaked.factions.mercado_cinzento,0,"Divulgar rotas do Subsolo tem custo político");
assert.deepEqual(calculateReputation({favors:community,market:INITIAL_MARKET}),allied,
 "Reputação sem relógios ou duplicação");
assert.equal(saveFavors("reputation",community),true);
assert.equal(readReputation("reputation").factions.movimento_livre,3,
 "Reputação deve ser reconstruída após reiniciar o aplicativo");
console.log("Reputação: Honra + facções, conflitos corporativos, serviços reais, recibos e persistência aprovados.");
// Nove pedidos regionais permanecem ocultos até conversar com os contatos.
const ctxRegional={missionStep:3,v09Defeated:true,honor:3};
assert.equal(FAVORS.length,15);
let regional={...INITIAL_FAVORS};
assert.equal(knownFavors(regional,ctxRegional).length,6);
for(const task of FAVORS.filter(q=>q.requiresContact)){
 assert.equal(acceptFavor(regional,task.id,ctxRegional).ok,false,
  "O quadro não pode inventar oferta antes de conhecer "+task.contact);
 const discovered=discoverFavors(regional,task.contactId,ctxRegional);
 assert.ok(discovered.revealed.includes(task.id));
 regional=discovered.state;
 assert.equal(discoverFavors(regional,task.contactId,ctxRegional).revealed.length,0);
 const accepted=acceptFavor(regional,task.id,ctxRegional);
 assert.equal(accepted.ok,true);
 assert.deepEqual(recordFavorActivity(accepted.state,task.taskId,false).ready,[],
   "Ponto regional bloqueado não cumpre favor");
 const activity=recordFavorActivity(accepted.state,task.taskId,true);
 assert.ok(activity.ready.includes(task.id));
 const claimed=claimFavor(activity.state,task.id);
 assert.equal(claimed.ok,true);
 regional=claimed.state;
 assert.equal(claimFavor(regional,task.id).ok,false);
}
assert.equal(regional.claimed.length,9);
assert.equal(knownFavors(regional,ctxRegional).length,15);
assert.equal(validateFavorBackup(regional),true);
assert.equal(saveFavors("regional",regional),true);
assert.equal(readFavors("regional").claimed.length,9);
assert.equal(readFavors("regional").discovered.length,9);
let oldBackup={...regional};
delete oldBackup.discovered;
assert.equal(validateFavorBackup(oldBackup),true,"Backups da 0.7.9 sem descobertas continuam válidos");
console.log("Favores: 15 atividades, nove descobertas narrativas, execução regional e recompensas únicas.");
