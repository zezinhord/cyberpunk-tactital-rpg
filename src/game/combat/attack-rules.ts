/** Deterministic d20 combat rules used by damage, overwatch, enemy AI,
 * and the tactical HUD. Natural 1 always misses; natural 20 always hits.
 * All other rolls must reach the defender's armor plus cover bonus.
 */
export function attackHits(roll:number,bonus:number,defense:number):boolean{
 if(!Number.isInteger(roll)||roll<1||roll>20||
    !Number.isFinite(bonus)||!Number.isFinite(defense))return false;
 if(roll===1)return false;
 if(roll===20)return true;
 return roll+bonus>=defense;
}
/** Exact probability over 20 equally likely d20 results (steps of 5%).
 * UI never claims 100% certainty while a natural 1 can still fail.
 */
export function attackHitChance(bonus:number,defense:number):number{
 if(!Number.isFinite(bonus)||!Number.isFinite(defense))return 0;
 let hits=0;
 for(let roll=1;roll<=20;roll++)if(attackHits(roll,bonus,defense))hits++;
 return hits*5;
}
