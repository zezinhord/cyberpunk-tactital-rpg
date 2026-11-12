import type { GameState } from "../types";
import type { ClassSkill } from "./registry";
export type ClassCheck={available:true}|{available:false;reason:string};
const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function checkClassSkill(state:GameState,ability:ClassSkill):ClassCheck {
  const player=state.units.find(u=>u.id==="runner"),enemy=state.units.find(u=>u.id==="drone");
  if(state.classId!==ability.classId || state.characterLevel<ability.minimumLevel)
    return {available:false,reason:"Classe ou nível incompatível."};
  if(ability.minimumLevel>1&&!state.characterAbilities.includes(ability.id))
    return {available:false,reason:"Habilidade não desbloqueada."};
  if(state.activeSide!=="player"||state.combatComplete||!player||player.hp<=0)
    return {available:false,reason:"Fora do turno."};
  if(!state.mainActionAvailable)return {available:false,reason:"Ação principal utilizada."};
  if((state.classCooldowns[ability.id]??0)>0)return {available:false,reason:"Em recarga."};
  if(state.energy<ability.cost)return {available:false,reason:"Energia insuficiente."};
  if(ability.damage>0||ability.jamTurns>0){
    if(!enemy||enemy.hp<=0)return {available:false,reason:"Sem alvo."};
    if(distance(player,enemy)>ability.range)return {available:false,reason:"Alvo fora de alcance."};
  }
  if(ability.healing>0&&player.hp>=player.maxHp)return {available:false,reason:"Vida cheia."};
  return {available:true};
}
export function executeClassSkill(state:GameState,ability:ClassSkill):{ok:boolean;message:string;amount:number} {
  const valid=checkClassSkill(state,ability);
  if(!valid.available)return {ok:false,message:valid.reason,amount:0};
  const player=state.units.find(u=>u.id==="runner")!;
  const enemy=state.units.find(u=>u.id==="drone");
  state.energy-=ability.cost;
  state.mainActionAvailable=false;
  state.classCooldowns[ability.id]=ability.cooldown+1;
  let amount=0;
  if(ability.damage>0&&enemy){amount=Math.min(enemy.hp,ability.damage);enemy.hp=Math.max(0,enemy.hp-ability.damage);}
  if(ability.healing>0){amount=Math.min(ability.healing,player.maxHp-player.hp);player.hp+=amount;}
  if(ability.armorBonus>0){
    player.armorClass+=ability.armorBonus;
    state.classGuardBonus+=ability.armorBonus;
    state.classGuardTurns=Math.max(state.classGuardTurns,ability.armorDuration);
  }
  if(ability.jamTurns>0)state.enemyJamTurns=Math.max(state.enemyJamTurns,ability.jamTurns);
  if(enemy?.hp===0)state.combatComplete=true;
  const message=ability.name+" ativada. "+(ability.damage?"Dano: "+amount:ability.healing?"Cura: "+amount:"Defesa: +"+ability.armorBonus)+".";
  state.message=message;
  return {ok:true,message,amount};
}
export function advanceClassRound(state:GameState):void {
  for(const [id,turns] of Object.entries(state.classCooldowns))
    state.classCooldowns[id]=Math.max(0,turns-1);
}
export function advanceClassGuard(state:GameState):void {
  if(state.classGuardTurns<=0)return;
  state.classGuardTurns--;
  if(state.classGuardTurns===0){
    const player=state.units.find(u=>u.id==="runner");
    if(player)player.armorClass-=state.classGuardBonus;
    state.classGuardBonus=0;
  }
}
