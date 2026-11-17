/** Cinco novos distritos autorais. A malha é navegável e compartilhada
 * entre renderer Phaser e testes de regressão: sem colisão ilusória.
 */
export type DistrictId="aurea"|"subsolo"|"setor-zero"|"prisma"|"periferia";
export type NodeSlot="exit"|"guide"|"terminal"|"cache"|"specialist"|"relay"|"community"|"discovery"|"interior";
export interface Tile{readonly x:number;readonly y:number}
export interface CityBlock{readonly x:number;readonly y:number;readonly w:number;readonly h:number}
export interface DistrictSpec{
 readonly id:DistrictId;readonly name:string;readonly subtitle:string;
 readonly intro:string;readonly guideName:string;readonly sky:number;
 readonly ground:number;readonly lane:number;readonly wall:number;
 readonly roof:number;readonly accent:number;
 readonly blocks:readonly CityBlock[];
}
export const DISTRICT_WIDTH=30,DISTRICT_HEIGHT=22;
export const DISTRICT_SPAWN:Tile={x:4,y:10};
/** Plantas distintas, compatíveis com os acessos e a navegação isométrica.
 * As massas novas fazem parte da colisão REAL, não são cenografia atravessável. */
const aureaBlocks:readonly CityBlock[]=[
 {x:3,y:1,w:5,h:4},{x:12,y:1,w:6,h:4},{x:21,y:1,w:6,h:4},
 {x:3,y:13,w:5,h:3},{x:15,y:13,w:3,h:4},{x:21,y:13,w:5,h:4},
 {x:2,y:17,w:3,h:3},{x:15,y:5,w:2,h:2},{x:22,y:6,w:3,h:2},
];
const subsoloBlocks:readonly CityBlock[]=[
 {x:3,y:2,w:6,h:3},{x:12,y:2,w:5,h:3},{x:21,y:2,w:4,h:3},
 {x:4,y:13,w:5,h:3},{x:13,y:13,w:5,h:3},{x:21,y:13,w:5,h:3},
 {x:2,y:6,w:3,h:2},{x:24,y:5,w:3,h:2},{x:18,y:17,w:3,h:2},
];
const zeroBlocks:readonly CityBlock[]=[
 {x:4,y:1,w:5,h:4},{x:14,y:1,w:4,h:4},{x:21,y:1,w:5,h:4},
 {x:4,y:13,w:6,h:3},{x:15,y:12,w:3,h:4},{x:22,y:12,w:4,h:4},
 {x:2,y:16,w:2,h:3},{x:26,y:14,w:2,h:3},{x:22,y:6,w:3,h:2},
];
const prismaBlocks:readonly CityBlock[]=[
 {x:3,y:2,w:5,h:3},{x:13,y:1,w:6,h:3},{x:22,y:2,w:5,h:3},
 {x:4,y:13,w:5,h:4},{x:14,y:13,w:5,h:4},{x:21,y:13,w:5,h:4},
 {x:8,y:5,w:2,h:2},{x:23,y:6,w:2,h:1},{x:2,y:16,w:2,h:2},
];
const periferiaBlocks:readonly CityBlock[]=[
 {x:3,y:2,w:4,h:3},{x:13,y:2,w:4,h:3},{x:22,y:1,w:4,h:3},
 {x:3,y:13,w:5,h:3},{x:14,y:13,w:4,h:3},{x:21,y:13,w:5,h:3},
 {x:8,y:3,w:2,h:2},{x:25,y:5,w:2,h:2},{x:2,y:17,w:3,h:2},
 {x:18,y:18,w:3,h:2},{x:26,y:14,w:2,h:2},
];
export const DISTRICTS:readonly DistrictSpec[]=[
 {id:"aurea",name:"Áurea",subtitle:"TORRES / HELIX / VIGILÂNCIA DE DADOS",
 intro:"Arranha-céus espelhados escondem auditorias eliminadas por sistemas de triagem.",
 guideName:"Celina",sky:0x18253b,ground:0x324354,lane:0x506272,
 wall:0x496779,roof:0x729bb3,accent:0xb6d7e1,blocks:aureaBlocks},
 {id:"subsolo",name:"Subsolo",subtitle:"TÚNEIS / MERCADO CINZENTO / ABRIGOS",
 intro:"As passagens esquecidas protegem sobreviventes e negociações que a cidade não registra.",
 guideName:"Mara",sky:0x101a29,ground:0x293542,lane:0x3b4d56,
 wall:0x394f60,roof:0x526b75,accent:0xdfb77c,blocks:subsoloBlocks},
 {id:"setor-zero",name:"Setor Zero",subtitle:"ZONA INTERDITADA / MEMÓRIA APAGADA",
 intro:"A quarentena interrompeu as ruas, mas algumas máquinas continuam respondendo a ordens.",
 guideName:"Iuri",sky:0x1b1a28,ground:0x302d3d,lane:0x454351,
 wall:0x53465d,roof:0x706477,accent:0xeea06e,blocks:zeroBlocks},
 {id:"prisma",name:"Prisma",subtitle:"NEON / CULTURA / TRANSMISSÕES PIRATAS",
 intro:"Boates e palcos digitais competem pela mesma atenção que os protestos procuram mobilizar.",
 guideName:"Kai",sky:0x25152e,ground:0x352a46,lane:0x594563,
 wall:0x65366a,roof:0x915389,accent:0xf08cbf,blocks:prismaBlocks},
 {id:"periferia",name:"Periferia",subtitle:"CARAVANAS / JARDINS / ROTAS LIVRES",
 intro:"Comunidades móveis cruzam estradas fora do mapa corporativo, transportando notícias e água.",
 guideName:"Dara",sky:0x30232b,ground:0x564539,lane:0x685d4f,
 wall:0x705f53,roof:0x957b61,accent:0xe9c18a,blocks:periferiaBlocks},
] as const;
/** Malha viária pintada adaptada ao uso social do distrito.
 * Não modifica pathfinding; só colore terreno efetivamente caminhável. */
export function districtRoad(id:DistrictId,t:Tile):boolean{
 const {x,y}=t;
 if(y===10||x===11||x===19)return true;
 switch(id){
  case "aurea":return y===6&&x>=3&&x<=27||y===18&&x>=11&&x<=28;
  case "subsolo":return y===7&&x>=3&&x<=27||y===17&&x>=4&&x<=28;
  case "setor-zero":return y===6&&x>=3&&x<=25||x===26&&y>=10&&y<=20;
  case "prisma":return y===6&&x>=3&&x<=27||y===18&&x>=3&&x<=27;
  case "periferia":return y===7&&x>=3&&x<=27||y===18&&x>=3&&x<=27;
 }
}
export function isDistrictId(input:unknown):input is DistrictId{
 return typeof input==="string"&&DISTRICTS.some(d=>d.id===input);
}
export function getDistrict(id:DistrictId):DistrictSpec{
 return DISTRICTS.find(d=>d.id===id)!;
}
export const NODE_TILES:Readonly<Record<NodeSlot,Tile>>={
 exit:{x:2,y:10},guide:{x:6,y:8},terminal:{x:12,y:7},
 cache:{x:7,y:17},specialist:{x:18,y:9},
 relay:{x:24,y:8},community:{x:12,y:17},discovery:{x:27,y:19},interior:{x:27,y:6},
};
export const NODE_NAMES:Readonly<Record<NodeSlot,string>>={
 exit:"Transporte de retorno",guide:"Contato local",terminal:"Console público",
 cache:"Depósito oculto",specialist:"Operador de campo",
 relay:"Repetidor clandestino",community:"Assembleia da região",
 discovery:"Arquivo recuperável",interior:"Entrada para espaço interno",
};
export function districtActorId(id:DistrictId,slot:NodeSlot):string{
 return "district-"+id+"-"+slot;
}
export function actorFromId(id:string):{district:DistrictId;slot:NodeSlot}|null{
 for(const d of DISTRICTS)
  for(const slot of Object.keys(NODE_TILES) as NodeSlot[])
   if(id===districtActorId(d.id,slot))return {district:d.id,slot};
 return null;
}
export const cellKey=(t:Tile):string=>t.x+","+t.y;
export function districtInside(t:Tile):boolean{
 return Number.isInteger(t.x)&&Number.isInteger(t.y)&&
  t.x>0&&t.y>0&&t.x<DISTRICT_WIDTH-1&&t.y<DISTRICT_HEIGHT-1;
}
export function districtWalkable(id:DistrictId,t:Tile):boolean{
 if(!districtInside(t))return false;
 if(Object.values(NODE_TILES).some(a=>a.x===t.x&&a.y===t.y))return false;
 return !getDistrict(id).blocks.some(b=>
  t.x>=b.x&&t.x<b.x+b.w&&t.y>=b.y&&t.y<b.y+b.h);
}
const STEPS:readonly Tile[]=[
 {x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0},
 {x:1,y:1},{x:1,y:-1},{x:-1,y:1},{x:-1,y:-1},
];
export function districtCanStep(id:DistrictId,a:Tile,b:Tile):boolean{
 const dx=b.x-a.x,dy=b.y-a.y;
 if(Math.abs(dx)>1||Math.abs(dy)>1||(!dx&&!dy)||!districtWalkable(id,b))return false;
 return dx===0||dy===0||
  districtWalkable(id,{x:a.x+dx,y:a.y})&&districtWalkable(id,{x:a.x,y:a.y+dy});
}
export function districtPath(id:DistrictId,start:Tile,target:Tile):Tile[]|null{
 if(!districtWalkable(id,start)||!districtWalkable(id,target))return null;
 const nodes:Tile[]=[start],seen=new Map<string,string|null>([[cellKey(start),null]]);
 for(let i=0;i<nodes.length;i++){
  const at=nodes[i]!;
  if(cellKey(at)===cellKey(target))break;
  for(const d of STEPS){
   const next={x:at.x+d.x,y:at.y+d.y},key=cellKey(next);
   if(seen.has(key)||!districtCanStep(id,at,next))continue;
   seen.set(key,cellKey(at));nodes.push(next);
  }
 }
 if(!seen.has(cellKey(target)))return null;
 const path:Tile[]=[];
 for(let key:string|null=cellKey(target);key!==null;key=seen.get(key)??null){
  const [x,y]=key.split(",").map(Number);
  path.push({x:x??0,y:y??0});
 }
 return path.reverse();
}
export function districtApproach(id:DistrictId,start:Tile,actor:Tile):Tile[]|null{
 return STEPS.slice(0,4).map(d=>districtPath(id,start,
  {x:actor.x+d.x,y:actor.y+d.y}))
  .filter((x):x is Tile[]=>x!==null)
  .sort((a,b)=>a.length-b.length)[0]??null;
}
