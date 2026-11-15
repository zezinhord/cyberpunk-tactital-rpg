/** IA tática determinística: cada decisão considera alcance, geometria,
 * linhas de tiro e proteção. Sem efeitos colaterais e com custo limitado a 64
 * células por turno em tabuleiros 8×8 (adequado para Android de entrada). */
import {BOARD_HEIGHT,BOARD_WIDTH,coverArmorBonus,coverBetween,findPath,
  hasLineOfSight,isBlocked} from "./map.ts";
import type {EncounterId,Position,Unit} from "./types.ts";

export type EnemyRole="sentinel"|"drone"|"helix"|"hunter";
export interface EnemyProfile{
 role:EnemyRole;name:string;range:number;mobility:number;preferredDistance:number;
}
export type EnemyPlan={
 action:"attack"|"advance"|"reposition"|"blocked";
 target:Position;mode:"melee"|"ranged";
 intent:string;cover:"none"|"partial"|"full";
};
export function enemyProfile(encounter:EncounterId,wave:number):EnemyProfile{
 if(encounter==="test")return {role:"sentinel",name:"Sentinela",range:1,mobility:2,preferredDistance:1};
 if(encounter==="v09")return {role:"hunter",name:"Vigilância V-09",range:3,mobility:2,preferredDistance:2};
 if(encounter.startsWith("district-")){
   return wave>=3?{role:"hunter",name:"Caçador Helix",range:4,mobility:3,preferredDistance:3}:
     {role:"helix",name:"Segurança Helix",range:3,mobility:2,preferredDistance:2};
 }
 return wave>=2?{role:"drone",name:"Drone de supressão",range:3,mobility:2,preferredDistance:2}:
   {role:"drone",name:"Drone de interceptação",range:2,mobility:2,preferredDistance:1};
}
export function manhattan(a:Position,b:Position):number{
 return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
}
export function withinShot(attacker:Position,target:Position,range:number):boolean{
 return manhattan(attacker,target)<=range&&hasLineOfSight(attacker,target);
}
/** Escolhe cobertura útil sem impedir a unidade de disparar ou perseguir. */
export function planEnemyTurn(enemy:Unit,player:Unit,units:Unit[],
 profile:EnemyProfile):EnemyPlan{
 const shot=(pos:Position)=>withinShot(pos,player,profile.range);
 if(shot(enemy)){
   // Seguranças corporativos e caçadores preferem um ângulo protegido de tiro
   // quando a rota cabe no deslocamento do turno. Drones de assalto não recuam.
   if((profile.role==="helix"||profile.role==="hunter")&&
      coverArmorBonus(player,enemy)===0&&manhattan(enemy,player)>1){
     const shelters:{pos:Position;steps:number}[]=[];
     for(let y=0;y<BOARD_HEIGHT;y++)for(let x=0;x<BOARD_WIDTH;x++){
       const pos={x,y};
       if(isBlocked(pos)||!shot(pos)||coverArmorBonus(player,pos)===0)continue;
       const path=findPath(enemy,pos,units,enemy.id);
       if(path&&path.length>1&&path.length-1<=profile.mobility)
         shelters.push({pos,steps:path.length-1});
     }
     shelters.sort((a,b)=>a.steps-b.steps||
       manhattan(a.pos,player)-manhattan(b.pos,player)||
       a.pos.y-b.pos.y||a.pos.x-b.pos.x);
     if(shelters.length){
       return {action:"reposition",target:shelters[0]!.pos,mode:"ranged",
         cover:"partial",intent:"Buscar cobertura e flanquear"};
     }
   }
   // Drones corpo a corpo continuam pressionando o jogador a curta distância.
   return {action:"attack",target:{x:enemy.x,y:enemy.y},
     mode:manhattan(enemy,player)<=1?"melee":"ranged",
     cover:"none",intent:profile.range===1?"Ataque corpo a corpo":"Disparo hostil"};
 }
 const candidates:{pos:Position;cost:number;score:number}[]=[];
 const currentDistance=manhattan(enemy,player);
 for(let y=0;y<BOARD_HEIGHT;y++)for(let x=0;x<BOARD_WIDTH;x++){
   const pos={x,y};
   if(isBlocked(pos)||manhattan(enemy,pos)>profile.mobility||pos.x===player.x&&pos.y===player.y)continue;
   const path=findPath(enemy,pos,units,enemy.id);
   if(!path||path.length-1>profile.mobility)continue;
   const dist=manhattan(pos,player),canFire=shot(pos);
   // Distância ideal e cobertura entram na estratégia, evitando IA que
   // apenas se aproxima em linha reta ou gira aleatoriamente.
   const score=(canFire?75:0)+
     (canFire?Math.max(0,15-Math.abs(dist-profile.preferredDistance)*5):0)+
     (canFire?coverArmorBonus(player,pos)*4:0)-
     Math.max(0,dist-profile.range)*5-
     Math.max(0,dist-currentDistance)*5-(path.length-1)*1.2;
   candidates.push({pos,cost:path.length-1,score});
 }
 candidates.sort((a,b)=>b.score-a.score||a.cost-b.cost||
   a.pos.y-b.pos.y||a.pos.x-b.pos.x);
 const best=candidates.find(x=>x.cost>0);
 if(!best)return {action:"blocked",target:{x:enemy.x,y:enemy.y},mode:"melee",
   cover:coverBetween(player,enemy),intent:"Sem rota segura"};
 const canAttack=shot(best.pos);
 return {action:canAttack?"reposition":"advance",target:best.pos,
   mode:manhattan(best.pos,player)<=1?"melee":"ranged",
   cover:coverBetween(player,best.pos),
   intent:canAttack?"Flanquear e disparar":profile.role==="sentinel"?"Aproximação hostil":"Buscar linha de tiro"};
}
