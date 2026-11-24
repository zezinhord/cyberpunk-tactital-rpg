/** Read-only faction world response. Scores come exclusively from the
 * official story reputation calculator, not from duplicate AI mutations.
 * Reactions change dialogue/attitude, never spawn unwinnable encounters.
 */
import type {Reputation,FactionId} from "../story/reputation.ts";
export type DistrictName="baixada"|"ferrugem"|"aurea"|"subsolo"|
 "setor-zero"|"prisma"|"periferia";
export type NpcAttitude="wary"|"neutral"|"friendly";
export interface DistrictReaction{
 faction:FactionId;attitude:NpcAttitude;alert:"normal"|"increased";
 label:string;reason:string;
}
const localGroup:Readonly<Record<DistrictName,FactionId>>={
 baixada:"movimento_livre",ferrugem:"movimento_livre",
 aurea:"helix",subsolo:"mercado_cinzento",
 "setor-zero":"helix",prisma:"mercado_cinzento",
 periferia:"movimento_livre",
};
const socialName:Readonly<Record<FactionId,string>>={
 helix:"Helix",movimento_livre:"Movimento Livre",
 mercado_cinzento:"Mercado Cinzento",consorcio_civico:"Consórcio Cívico"};
export function districtReaction(
 district:DistrictName,reputation:Reputation
):DistrictReaction{
 const faction=localGroup[district],score=reputation.factions[faction];
 const attitude:NpcAttitude=score<=-2?"wary":score>=2?"friendly":"neutral";
 const alert=attitude==="wary"?"increased":"normal";
 const reason=attitude==="wary"?
  "Decisões anteriores reduziram a confiança desse grupo. Contatos cautelosos.":
  attitude==="friendly"?
  "Apoio documentado nas decisões anteriores. Contatos mais receptivos.":
  "Sem evidência suficiente para alterar a abordagem local.";
 return {faction,attitude,alert,
  label:socialName[faction]+" · "+(attitude==="wary"?"desconfiança":
    attitude==="friendly"?"reconhecimento":"relação neutra"),reason};
}
