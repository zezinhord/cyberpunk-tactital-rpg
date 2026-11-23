/** Explicit player-selected AI orders for existing remote allies.
 * Autonomous supports consume the SAME bonus action and once-per-encounter
 * charge as manual support; no extra units or infinite free heals.
 */
import type {CompanionId,CompanionProfile} from "../companions.ts";
import type {GameState} from "../types.ts";
export const PARTY_POSTURES=["manual","offensive","defensive","support","hold"] as const;
export type PartyPosture=typeof PARTY_POSTURES[number];
export const PARTY_POSTURE_LABELS:Readonly<Record<PartyPosture,string>>={
 manual:"Manual",offensive:"Ofensiva",defensive:"Defensiva",
 support:"Suporte",hold:"Manter posição"};
export function isPartyPosture(value:unknown):value is PartyPosture{
 return typeof value==="string"&&PARTY_POSTURES.includes(value as PartyPosture);
}
export function chooseCompanionAction(
 companions:readonly CompanionProfile[],state:GameState,posture:PartyPosture
):CompanionId|null{
 if(posture==="manual"||posture==="hold"||state.combatComplete||
   state.activeSide!=="player"||!state.bonusActionAvailable)return null;
 const player=state.units.find(u=>u.id==="runner"&&u.hp>0);
 const enemy=state.units.find(u=>u.id==="drone"&&u.hp>0);
 if(!player||!enemy)return null;
 const candidates=companions.filter(c=>!state.companionUsed.includes(c.id))
   .filter(c=>{
    if(c.aid==="heal")return player.hp<=player.maxHp-3&&
       player.hp/player.maxHp<=(posture==="defensive"?.65:.75);
    if(c.aid==="energy")return state.energy<=state.maxEnergy-
       Math.min(c.power,3)&&state.energy/state.maxEnergy<=.6;
    if(c.aid==="jam")return state.enemyJamTurns<=0;
    if(c.aid==="focus")return state.classNextAccuracyBonus<=0;
    return false;
   });
 const order=posture==="offensive"?["focus","jam","heal","energy"]:
   posture==="defensive"?["heal","jam","energy","focus"]:
   ["heal","energy","jam","focus"];
 const priority=(c:CompanionProfile)=>order.indexOf(c.aid);
 candidates.sort((a,b)=>priority(a)-priority(b)||a.id.localeCompare(b.id));
 return candidates[0]?.id??null;
}
