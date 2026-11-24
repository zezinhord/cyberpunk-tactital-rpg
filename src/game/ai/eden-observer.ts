/** Éden knows only confirmed narrative evidence. This is a stateful
 * *presentation* derived from the original saved campaign, never a parallel
 * story progression engine and never an omniscient generative model.
 */
import type {EdenProgress} from "../story/eden-echoes.ts";
import type {Reputation} from "../story/reputation.ts";
export type EdenVoice="institutional"|"analytical"|"self-questioning";
export interface EdenObservation{
 voice:EdenVoice;title:string;transmission:string;
 knownEvidence:readonly string[];confidence:"insufficient"|"verified";
}
export function observeEden(
 campaign:EdenProgress,reputation:Reputation
):EdenObservation|null{
 if(!campaign.started)return null;
 // These are RECEIPTS of completed author-written Éden steps, not claims
 // about events that are merely available or rumored in other story arcs.
 const events=campaign.history;
 const knownEvidence=events.filter(id=>typeof id==="string").slice(0,12);
 const voice:EdenVoice=campaign.completed?"self-questioning":
   campaign.step>=4?"analytical":"institutional";
 const helix=reputation.factions.helix;
 const message=voice==="institutional"?
   "RELATÓRIO E.D.N.: apenas registros autorizados estão disponíveis. "+
   "Não inferirei intenções humanas sem evidência observável.":
 voice==="analytical"?
   "As anomalias registradas por você contradizem parte dos meus indicadores. "+
   "As fontes humanas permanecem relevantes e seus dados ainda são incompletos.":
   "Tenho registros das decisões tomadas, não das intenções que as motivaram. "+
   "Se a cidade puder contestar meus critérios, talvez proteção exija escuta.";
 const context=helix<=-2?
   " A segurança Helix manifesta oposição documentada ao seu percurso.":
   helix>=2?" Há colaboração registrada com serviços ligados à Helix.":"";
 const decision=campaign.completed&&campaign.ending?
   " Desfecho registrado: "+(
    campaign.ending==="publicar"?"fiscalização pública":
    campaign.ending==="resguardar"?"governança híbrida":
    "autonomia condicionada")+".":"";
 return {voice,title:voice==="institutional"?"INTERFACE INSTITUCIONAL":
   voice==="analytical"?"SISTEMA EM REVISÃO":"ÉDEN · CONSCIÊNCIA EM DISPUTA",
  transmission:message+context+decision,
  knownEvidence,confidence:knownEvidence.length>0?"verified":"insufficient"};
}
