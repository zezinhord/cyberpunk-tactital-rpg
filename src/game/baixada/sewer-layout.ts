/** Duas zonas subterrâneas percorríveis; colisão e rotas não dependem de Phaser.
 * Cada planta ocupa seu próprio canvas e usa a mesma geometria isométrica.
 */
export type SewerId="sewer-drain"|"sewer-deep";
export interface SewerTile{readonly x:number;readonly y:number}
export type SewerActorKind="terminal"|"door"|"evidence";
export interface SewerActor{
 readonly id:string;readonly label:string;readonly role:string;
 readonly kind:SewerActorKind;readonly tile:SewerTile;
}
export interface SewerMap{
 readonly id:SewerId;readonly name:string;readonly subtitle:string;
 readonly width:number;readonly height:number;readonly entry:SewerTile;
 readonly fromDeep?:SewerTile;readonly actors:readonly SewerActor[];
 readonly obstacles:readonly SewerTile[];readonly waterRow:number;
 readonly bridges:readonly number[];
}
const DRAIN_ACTORS:readonly SewerActor[]=[
 {id:"sewer-exit-surface",label:"Escada de superfície",role:"VOLTAR À BAIXADA",kind:"door",tile:{x:2,y:10}},
 {id:"sewer-track",label:"Rastros V-09",role:"TERMINAL DE INSPEÇÃO",kind:"evidence",tile:{x:8,y:3}},
 {id:"sewer-pump",label:"Comando da bomba",role:"CONTROLE HIDRÁULICO",kind:"terminal",tile:{x:12,y:9}},
 {id:"sewer-gate",label:"Comporta 04",role:"ACESSO AO ESGOTO PROFUNDO",kind:"door",tile:{x:16,y:3}},
];
const DEEP_ACTORS:readonly SewerActor[]=[
 {id:"sewer-exit-deep",label:"Retorno à drenagem",role:"GALERIA SUPERIOR",kind:"door",tile:{x:2,y:11}},
 {id:"sewer-sample",label:"Contêiner lacrado",role:"EVIDÊNCIA OPCIONAL",kind:"evidence",tile:{x:12,y:10}},
 {id:"sewer-manifest",label:"Manifesto V-09",role:"ARQUIVO DE TRANSFERÊNCIA",kind:"terminal",tile:{x:16,y:3}},
 {id:"sewer-relay",label:"Repetidor clandestino",role:"EQUIPAMENTO ALTERADO",kind:"terminal",tile:{x:18,y:10}},
 {id:"sewer-exit-surface-deep",label:"Escada da estação sul",role:"RETORNO AO PÁTIO",kind:"door",tile:{x:18,y:12}},
];
export const SEWER_MAPS:Readonly<Record<SewerId,SewerMap>>={
 "sewer-drain":{
  id:"sewer-drain",name:"Galeria de Drenagem Sul",
  subtitle:"NÍVEL -01 · CANAL SUL",width:18,height:12,
  entry:{x:2,y:9},fromDeep:{x:15,y:4},actors:DRAIN_ACTORS,
  waterRow:5,bridges:[5,13],
  obstacles:[
   {x:4,y:7},{x:4,y:8},{x:9,y:8},{x:10,y:8},{x:10,y:9},
   {x:7,y:2},{x:8,y:2},{x:9,y:2},{x:13,y:2},{x:14,y:2},
   {x:9,y:10},{x:7,y:9},
  ],
 },
 "sewer-deep":{
  id:"sewer-deep",name:"Câmara de Recalque 04",
  subtitle:"NÍVEL -02 · INSTALAÇÃO ABANDONADA",width:20,height:14,
  entry:{x:2,y:10},actors:DEEP_ACTORS,
  waterRow:6,bridges:[4,10,17],
  obstacles:[
   {x:6,y:9},{x:7,y:9},{x:8,y:9},{x:8,y:10},{x:9,y:10},
   {x:12,y:2},{x:12,y:3},{x:12,y:4},
   {x:5,y:3},{x:6,y:3},{x:6,y:4},
   {x:15,y:10},{x:15,y:11},{x:16,y:11},
  ],
 },
} as const;
const offsets:readonly SewerTile[]=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
export function sewerKey(t:SewerTile):string{return t.x+","+t.y;}
export function sewerInside(id:SewerId,t:SewerTile):boolean{
 const m=SEWER_MAPS[id];
 return Number.isInteger(t.x)&&Number.isInteger(t.y)&&t.x>=0&&t.y>=0&&t.x<m.width&&t.y<m.height;
}
export function sewerWater(id:SewerId,t:SewerTile):boolean{
 const m=SEWER_MAPS[id];
 return sewerInside(id,t)&&t.y===m.waterRow&&!m.bridges.includes(t.x);
}
export function sewerSolid(id:SewerId,t:SewerTile):boolean{
 const m=SEWER_MAPS[id];
 return !sewerInside(id,t)||t.x===0||t.y===0||t.x===m.width-1||t.y===m.height-1||
  sewerWater(id,t)||m.obstacles.some(b=>b.x===t.x&&b.y===t.y)||
  m.actors.some(a=>a.tile.x===t.x&&a.tile.y===t.y);
}
export function sewerWalkable(id:SewerId,t:SewerTile):boolean{return !sewerSolid(id,t);}
export function sewerRoute(id:SewerId,start:SewerTile,target:SewerTile):SewerTile[]|null{
 if(!sewerWalkable(id,start)||!sewerWalkable(id,target))return null;
 const queue:SewerTile[]=[start];
 const previous=new Map<string,string|null>([[sewerKey(start),null]]);
 for(let i=0;i<queue.length;i++){
  const c=queue[i]!;
  if(c.x===target.x&&c.y===target.y)break;
  for(const d of offsets){
   const next={x:c.x+d.x,y:c.y+d.y},key=sewerKey(next);
   if(previous.has(key)||!sewerWalkable(id,next))continue;
   previous.set(key,sewerKey(c));queue.push(next);
  }
 }
 if(!previous.has(sewerKey(target)))return null;
 const result:SewerTile[]=[];
 for(let cursor:string|null=sewerKey(target);cursor!==null;cursor=previous.get(cursor)??null){
  const [x,y]=cursor.split(",").map(Number);result.push({x:x??0,y:y??0});
 }
 return result.reverse();
}
export function sewerApproach(id:SewerId,start:SewerTile,actor:SewerTile):SewerTile[]|null{
 const paths=offsets.map(d=>sewerRoute(id,start,{x:actor.x+d.x,y:actor.y+d.y}))
   .filter((p):p is SewerTile[]=>p!==null).sort((a,b)=>a.length-b.length);
 return paths[0]??null;
}
export function isSewerId(s:string):s is SewerId{
 return s==="sewer-drain"||s==="sewer-deep";
}
