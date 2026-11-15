import type { GameState, Unit } from "../types";
import type { ClassSkill, ClassEffect } from "./registry";
import {hasLineOfSight} from "../map.ts";

export type ClassCheck={available:true}|{available:false;reason:string};
export interface ClassResult {ok:boolean;message:string;amount:number}
const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);

function entities(state:GameState):{player?:Unit;enemy?:Unit}{
 return {player:state.units.find(u=>u.id==="runner"),enemy:state.units.find(u=>u.id==="drone")};
}
function hasEffect(ability:ClassSkill,type:ClassEffect["type"]):boolean {
 return ability.effects.some(e=>e.type===type);
}

/** Valida a economia de ações antes de qualquer mutação do estado. */
export function checkClassSkill(state:GameState,ability:ClassSkill):ClassCheck {
 const {player,enemy}=entities(state);
 if(state.classId!==ability.classId || state.characterLevel<ability.minimumLevel ||
    !state.characterAbilities.includes(ability.id))
   return {available:false,reason:"Habilidade não desbloqueada para a classe."};
 if(state.activeSide!=="player"||state.combatComplete||!player||player.hp<=0)
   return {available:false,reason:"Fora do seu turno."};
 if(!state.mainActionAvailable)return {available:false,reason:"Ação principal já utilizada."};
 const cooldown=state.classCooldowns[ability.id]??0;
 if(cooldown>0)return {available:false,reason:"Recarga: "+cooldown+" turno(s)."};
 if(state.energy<ability.cost)return {available:false,reason:"Energia insuficiente."};
 if(ability.target==="enemy"){
   if(!enemy||enemy.hp<=0)return {available:false,reason:"Sem alvo hostil ativo."};
   if(distance(player,enemy)>ability.range)
     return {available:false,reason:"Alvo fora do alcance de "+ability.range+" célula(s)."};
   // Descargas físicas não atravessam paredes. Efeitos de controle de rede
   // sem dano continuam representando interferência remota digital.
   if(ability.range>1&&hasEffect(ability,"damage")&&
      ability.classId!=="netrunner"&&!hasEffect(ability,"jam")&&
      !hasLineOfSight(player,enemy))
     return {available:false,reason:"Obstáculo bloqueia a técnica ofensiva."};
 }
 if(hasEffect(ability,"heal")&&player.hp>=player.maxHp)
   return {available:false,reason:"Vida já está no máximo."};
 if(hasEffect(ability,"guard")&&state.classGuardTurns>0)
   return {available:false,reason:"Proteção da classe ainda ativa."};
 if(hasEffect(ability,"enemyArmor")&&state.classEnemyArmorTurns>0)
   return {available:false,reason:"Vulnerabilidade do alvo já exposta."};
 if(hasEffect(ability,"enemyAttack")&&state.classEnemyAttackTurns>0)
   return {available:false,reason:"Alvo já está contido."};
 if(hasEffect(ability,"nextDamage")&&state.classNextDamageBonus>0)
   return {available:false,reason:"Próximo ataque já está potencializado."};
 return {available:true};
}

/** Efeitos de classe tipados. Todas as alterações passam pelo mesmo núcleo. */
export function executeClassSkill(state:GameState,ability:ClassSkill):ClassResult {
 const check=checkClassSkill(state,ability);
 if(!check.available)return {ok:false,message:check.reason,amount:0};
 const {player,enemy}=entities(state);
 if(!player)return {ok:false,message:"Protagonista indisponível.",amount:0};

 state.energy-=ability.cost;
 state.mainActionAvailable=false;
 state.classCooldowns[ability.id]=ability.cooldown+1;
 let amount=0;
 const notes:string[]=[];
 const rawRank=state.characterSkillRanks?.[ability.id]??1;
 const rank=Number.isSafeInteger(rawRank)?Math.min(ability.maxRank,Math.max(1,rawRank)):1;
 for(const effect of ability.effects){
   // Um único intérprete para todos os graus e classes. Aprimorar altera
   // o efeito, nunca apenas o texto ou a aparência do nó.
   const power=("amount" in effect?effect.amount:0)+(rank-1)*
     (effect.type==="damage"||effect.type==="heal"?2:1);
   const duration=("turns" in effect?effect.turns:0)+
     (effect.type==="jam"&&rank>=3?1:0);
   switch(effect.type){
     case "damage":{
       if(!enemy)break;
       const dealt=Math.min(enemy.hp,power);
       enemy.hp=Math.max(0,enemy.hp-power);
       amount+=dealt;notes.push("Dano "+dealt);
       break;
     }
     case "jam":
       if(enemy && enemy.hp>0){
         state.enemyJamTurns=Math.max(state.enemyJamTurns,duration);
         notes.push("Interferência por "+duration+" ação hostil");
       }
       break;
     case "heal":{
       const restored=Math.min(power,player.maxHp-player.hp);
       player.hp+=restored;amount+=restored;notes.push("Vida +"+restored);
       break;
     }
     case "guard":
       player.armorClass+=power;
       state.classGuardBonus+=power;
       state.classGuardTurns=Math.max(state.classGuardTurns,duration);
       notes.push("Defesa +"+power+" por "+duration+" ação(ões) hostis");
       break;
     case "energy":{
       const regained=Math.min(power,state.maxEnergy-state.energy);
       state.energy+=regained;amount+=regained;notes.push("Energia +"+regained);
       break;
     }
     case "movement":
       state.movementRemaining+=power;
       state.movementPerTurn+=power;
       state.classExtraMovement+=power;
       notes.push("Movimento +"+power+" neste turno");
       break;
     case "nextDamage":
       state.classNextDamageBonus+=power;
       notes.push("Próximo ataque básico +"+power+" dano");
       break;
     case "nextAccuracy":
       state.classNextAccuracyBonus+=power;
       notes.push("Próximo ataque básico +"+power+" acerto");
       break;
     case "enemyArmor":
       if(enemy){
         enemy.armorClass-=power;
         state.classEnemyArmorReduction=power;
         state.classEnemyArmorTurns=duration;
         notes.push("Defesa inimiga -"+power+" por "+duration+" ação(ões)");
       }
       break;
     case "enemyAttack":
       if(enemy){
         enemy.attackBonus-=power;
         state.classEnemyAttackReduction=power;
         state.classEnemyAttackTurns=duration;
         notes.push("Ataque inimigo -"+power+" por "+duration+" ação(ões)");
       }
       break;
   }
 }
 if(enemy && enemy.hp<=0)state.combatComplete=true;
 const message=ability.name+": "+notes.join("; ")+".";
 state.message=message;
 return {ok:true,message,amount};
}

/** Começo do turno seguinte: cooldown conta turnos COMPLETOS. */
export function advanceClassRound(state:GameState):void {
 for(const [id,turns] of Object.entries(state.classCooldowns))
   state.classCooldowns[id]=Math.max(0,turns-1);
}
/** Depois da ação hostil, expirando efeitos apenas uma vez. */
export function advanceClassGuard(state:GameState):void {
 if(state.classGuardTurns<=0)return;
 state.classGuardTurns--;
 if(state.classGuardTurns===0){
   const player=state.units.find(u=>u.id==="runner");
   if(player)player.armorClass-=state.classGuardBonus;
   state.classGuardBonus=0;
 }
}
export function advanceClassEnemyDebuffs(state:GameState):void {
 const enemy=state.units.find(u=>u.id==="drone");
 if(state.classEnemyArmorTurns>0 && --state.classEnemyArmorTurns===0){
   if(enemy)enemy.armorClass+=state.classEnemyArmorReduction;
   state.classEnemyArmorReduction=0;
 }
 if(state.classEnemyAttackTurns>0 && --state.classEnemyAttackTurns===0){
   if(enemy)enemy.attackBonus+=state.classEnemyAttackReduction;
   state.classEnemyAttackReduction=0;
 }
}
