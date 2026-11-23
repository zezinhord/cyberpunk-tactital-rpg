/** IA tática determinística: cada decisão considera alcance, geometria,
 * linhas de tiro e proteção. Sem efeitos colaterais e com custo limitado a 64
 * células por turno em tabuleiros 8×8 (adequado para Android de entrada). */
import {BOARD_HEIGHT,BOARD_WIDTH,coverArmorBonus,coverBetween,findPath,pathCost,movementCost,elevationAccuracyBonus,
  hasLineOfSight,isBlocked} from "./map.ts";
import type {EncounterId,Position,Unit} from "./types.ts";
import type {TacticalLayout} from "./combat/tactical-maps.ts";

export type EnemyRole="sentinel"|"drone"|"helix"|"hunter"|"suppressor"|"saboteur"|"sniper";
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
 if(encounter==="cisma-intercept")return wave>=2
  ?{role:"saboteur",name:"Sabotador do transmissor",range:3,mobility:3,preferredDistance:2}
  :{role:"suppressor",name:"Interceptador de Prisma",range:4,mobility:2,preferredDistance:3};
 if(encounter==="cisma-containment")return wave>=2
  ?{role:"hunter",name:"Unidade de contenção móvel",range:4,mobility:3,preferredDistance:3}
  :{role:"helix",name:"Escolta de quarentena",range:3,mobility:2,preferredDistance:2};
 if(encounter==="cisma-core")return wave===1
  ?{role:"suppressor",name:"Defesa de supressão",range:4,mobility:2,preferredDistance:3}
  :wave===2
   ?{role:"saboteur",name:"Desestabilizador neural",range:3,mobility:3,preferredDistance:2}
   :{role:"sniper",name:"Núcleo de precisão Éden",range:5,mobility:2,preferredDistance:4};
 if(encounter==="eden-relay")return {role:"suppressor",name:"Interceptador de supressão",range:4,mobility:2,preferredDistance:3};
 if(encounter==="eden-core")return wave>=2
  ?{role:"hunter",name:"Guardião do Éden",range:4,mobility:3,preferredDistance:3}
  :{role:"helix",name:"Escolta autônoma",range:3,mobility:2,preferredDistance:2};
 if(encounter.startsWith("council-")){
   // Distinct narrative threats for each community's chosen infrastructure.
   // Each follow-up wave deliberately changes role/range/priority, not just HP.
   switch(encounter){
     case "council-baixada":return wave>=2
       ?{role:"suppressor",name:"Dreno automatizado de cisternas",range:4,mobility:2,preferredDistance:3}
       :{role:"drone",name:"Drone de corte hídrico",range:2,mobility:3,preferredDistance:1};
     case "council-ferrugem":return wave>=2
       ?{role:"hunter",name:"Executor de produção Helix",range:4,mobility:3,preferredDistance:3}
       :{role:"saboteur",name:"Sabotador do freio industrial",range:3,mobility:3,preferredDistance:2};
     case "council-aurea":return wave===1
       ?{role:"sniper",name:"Atirador de arquivo clínico",range:5,mobility:1,preferredDistance:4}
       :wave===2
        ?{role:"saboteur",name:"Apagador de prontuários",range:3,mobility:3,preferredDistance:2}
        :{role:"hunter",name:"Guarda de auditoria blindado",range:4,mobility:3,preferredDistance:3};
     case "council-subsolo":return wave>=2
       ?{role:"suppressor",name:"Bloqueador de ar pressurizado",range:4,mobility:2,preferredDistance:3}
       :{role:"saboteur",name:"Contaminador do duto",range:3,mobility:3,preferredDistance:2};
     case "council-setor-zero":return wave===1
       ?{role:"helix",name:"Escolta de isolamento",range:3,mobility:2,preferredDistance:2}
       :wave===2
        ?{role:"suppressor",name:"Vigia do reator",range:4,mobility:2,preferredDistance:3}
        :{role:"sniper",name:"Executor do último veto",range:5,mobility:2,preferredDistance:4};
     case "council-prisma":return wave>=2
       ?{role:"sniper",name:"Atirador antitransmissão",range:5,mobility:1,preferredDistance:4}
       :{role:"suppressor",name:"Censor de sinal",range:4,mobility:2,preferredDistance:3};
     case "council-periferia":return wave>=2
       ?{role:"hunter",name:"Perseguidor de caravanas",range:4,mobility:3,preferredDistance:3}
       :{role:"helix",name:"Bloqueador de estrada",range:3,mobility:2,preferredDistance:2};
   }
 }
 if(encounter.startsWith("district-")){
   if(wave>=3)return {role:"hunter",name:"Caçador Helix",range:4,mobility:3,preferredDistance:3};
   if(wave===1&&(encounter==="district-aurea"||encounter==="district-prisma"))
     return {role:"sniper",name:"Atirador de cobertura",range:5,mobility:1,preferredDistance:4};
   if(wave===2&&encounter==="district-subsolo")
     return {role:"saboteur",name:"Sabotador de rede",range:3,mobility:3,preferredDistance:2};
   if(wave===2&&(encounter==="district-setor-zero"||encounter==="district-periferia"))
     return {role:"suppressor",name:"Agente de supressão",range:4,mobility:2,preferredDistance:3};
   return {role:"helix",name:"Segurança Helix",range:3,mobility:2,preferredDistance:2};
 }
 if(encounter==="trial-2"&&wave>=2)
   return {role:"saboteur",name:"Drone sabotador",range:3,mobility:3,preferredDistance:2};
 if(encounter==="trial-3"&&wave>=2)
   return {role:"suppressor",name:"Drone de supressão",range:4,mobility:2,preferredDistance:3};
 return wave>=2?{role:"drone",name:"Drone de supressão",range:3,mobility:2,preferredDistance:2}:
   {role:"drone",name:"Drone de interceptação",range:2,mobility:2,preferredDistance:1};
}
export function manhattan(a:Position,b:Position):number{
 return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
}
export function withinShot(attacker:Position,target:Position,range:number,
 layout:TacticalLayout|null=null):boolean{
 return manhattan(attacker,target)<=range&&hasLineOfSight(attacker,target,layout);
}
/** Escolhe cobertura útil sem impedir a unidade de disparar ou perseguir. */
export function planEnemyTurn(enemy:Unit,player:Unit,units:Unit[],
 profile:EnemyProfile,layout:TacticalLayout|null=null):EnemyPlan{
 const shot=(pos:Position)=>withinShot(pos,player,profile.range,layout);
 // Environmental hazard is an actionable flanking cost, not just a VFX.
 if(shot(enemy)&&layout?.terrain.get(enemy.x+","+enemy.y)==="hazard"){
   const escapes:{pos:Position;cost:number}[]=[];
   for(let y=0;y<BOARD_HEIGHT;y++)for(let x=0;x<BOARD_WIDTH;x++){
     const pos={x,y};if(isBlocked(pos,layout)||!shot(pos)||
       layout.terrain.get(x+","+y)==="hazard")continue;
     const path=findPath(enemy,pos,units,enemy.id,layout);
     if(path&&path.length>1&&pathCost(path,layout)<=profile.mobility)
       escapes.push({pos,cost:pathCost(path,layout)});
   }
   escapes.sort((a,b)=>a.cost-b.cost||a.pos.y-b.pos.y||a.pos.x-b.pos.x);
   if(escapes.length)return {action:"reposition",target:escapes[0]!.pos,
     mode:"ranged",cover:coverBetween(player,escapes[0]!.pos,layout),
     intent:"Abandonar área de risco ambiental"};
 }
 if(shot(enemy)){
   // Atiradores de precisão tentam manter distância após aproximação do jogador.
   if(profile.role==="sniper"&&manhattan(enemy,player)<profile.preferredDistance){
     const retreats:{pos:Position;distance:number;steps:number}[]=[];
     for(let y=0;y<BOARD_HEIGHT;y++)for(let x=0;x<BOARD_WIDTH;x++){
       const pos={x,y};if(isBlocked(pos,layout)||!shot(pos))continue;
       const path=findPath(enemy,pos,units,enemy.id,layout);
       if(path&&path.length>1&&pathCost(path,layout)<=profile.mobility)
         retreats.push({pos,distance:manhattan(pos,player),steps:pathCost(path,layout)});
     }
     retreats.sort((a,b)=>b.distance-a.distance||a.steps-b.steps||a.pos.y-b.pos.y||a.pos.x-b.pos.x);
     if(retreats.length&&retreats[0]!.distance>manhattan(enemy,player))
       return {action:"reposition",target:retreats[0]!.pos,mode:"ranged",
         cover:coverBetween(player,retreats[0]!.pos,layout),intent:"Recuar para disparo de precisão"};
   }
   // Seguranças corporativos e caçadores preferem um ângulo protegido de tiro
   // quando a rota cabe no deslocamento do turno. Drones de assalto não recuam.
   if((profile.role==="helix"||profile.role==="hunter")&&
      coverArmorBonus(player,enemy,layout)===0&&manhattan(enemy,player)>1){
     const shelters:{pos:Position;steps:number}[]=[];
     for(let y=0;y<BOARD_HEIGHT;y++)for(let x=0;x<BOARD_WIDTH;x++){
       const pos={x,y};
       if(isBlocked(pos,layout)||!shot(pos)||coverArmorBonus(player,pos,layout)===0)continue;
       const path=findPath(enemy,pos,units,enemy.id,layout);
       if(path&&path.length>1&&pathCost(path,layout)<=profile.mobility)
         shelters.push({pos,steps:pathCost(path,layout)});
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
     cover:"none",intent:profile.role==="suppressor"?"Rajada de supressão: reduz deslocamento":
       profile.role==="saboteur"?"Pulso sabotador: drena energia":
       profile.role==="sniper"?"Disparo de precisão de longo alcance":
       profile.range===1?"Ataque corpo a corpo":"Disparo hostil"};
 }
 const candidates:{pos:Position;cost:number;score:number}[]=[];
 const currentDistance=manhattan(enemy,player);
 for(let y=0;y<BOARD_HEIGHT;y++)for(let x=0;x<BOARD_WIDTH;x++){
   const pos={x,y};
   if(isBlocked(pos,layout)||manhattan(enemy,pos)>profile.mobility||pos.x===player.x&&pos.y===player.y)continue;
   const path=findPath(enemy,pos,units,enemy.id,layout);
   if(!path||pathCost(path,layout)>profile.mobility)continue;
   const dist=manhattan(pos,player),canFire=shot(pos);
   // Distância ideal e cobertura entram na estratégia, evitando IA que
   // apenas se aproxima em linha reta ou gira aleatoriamente.
   const score=(canFire?75:0)+
     (profile.role==="sniper"?(dist>=profile.preferredDistance?12:-18):0)+
     (canFire?Math.max(0,15-Math.abs(dist-profile.preferredDistance)*5):0)+
     (canFire?coverArmorBonus(player,pos,layout)*4:0)+
     elevationAccuracyBonus(pos,player,layout)*3-
     (layout?.terrain.get(x+","+y)==="hazard"?24:0)-
     Math.max(0,movementCost(pos,layout)-1)*2-
     Math.max(0,dist-profile.range)*5-
     Math.max(0,dist-currentDistance)*5-(pathCost(path,layout))*1.2;
   candidates.push({pos,cost:pathCost(path,layout),score});
 }
 candidates.sort((a,b)=>b.score-a.score||a.cost-b.cost||
   a.pos.y-b.pos.y||a.pos.x-b.pos.x);
 const best=candidates.find(x=>x.cost>0);
 if(!best)return {action:"blocked",target:{x:enemy.x,y:enemy.y},mode:"melee",
   cover:coverBetween(player,enemy,layout),intent:"Sem rota segura"};
 const canAttack=shot(best.pos);
 return {action:canAttack?"reposition":"advance",target:best.pos,
   mode:manhattan(best.pos,player)<=1?"melee":"ranged",
   cover:coverBetween(player,best.pos,layout),
   intent:canAttack?(profile.role==="suppressor"?"Preparar rajada de supressão":
     profile.role==="saboteur"?"Aproximar pulso de sabotagem":
     profile.role==="sniper"?"Mirar de longe":"Flanquear e disparar"):
     profile.role==="sentinel"?"Aproximação hostil":"Buscar linha de tiro"};
}
