/** Distrito Ferrugem: malha isométrica original 26×19. Regras determinísticas
 * e testáveis sem Phaser; nenhuma passagem permite atravessar fábricas.
 */
export interface Cell{readonly x:number;readonly y:number}
export type IndustrialActorKind="worker"|"terminal"|"evidence"|"exit";
export interface IndustrialActor{
 readonly id:string;readonly title:string;readonly role:string;
 readonly tile:Cell;readonly kind:IndustrialActorKind;
}
export const FERRUGEM_WIDTH=26,FERRUGEM_HEIGHT=19;
export const FERRUGEM_START:Cell={x:4,y:9};
export const FACTORIES:readonly {id:string;x:number;y:number;w:number;h:number;title:string}[]=[
 {id:"alto-forno",x:4,y:1,w:5,h:4,title:"ALTO-FORNO 7"},
 {id:"armazem-leste",x:13,y:2,w:5,h:3,title:"GALPÃO 3"},
 {id:"vapor-industrial",x:20,y:1,w:4,h:4,title:"VAPOR"},
 {id:"prensa",x:5,y:12,w:5,h:4,title:"PRENSA 2"},
 {id:"reciclagem",x:13,y:12,w:4,h:4,title:"REFINO"},
 {id:"subestacao",x:20,y:12,w:4,h:4,title:"REDE 11"},
];
export const FERRUGEM_ACTORS:readonly IndustrialActor[]=[
 {id:"ferrugem-exit",title:"Transporte para Baixada",role:"VOLTAR À BAIXADA",tile:{x:2,y:9},kind:"exit"},
 {id:"ferrugem-foreman",title:"Rosa",role:"OPERADORA DA SIDERÚRGICA",tile:{x:6,y:7},kind:"worker"},
 {id:"ferrugem-cabinet",title:"Quadro elétrico",role:"CONTROLE DE ENERGIA",tile:{x:11,y:6},kind:"terminal"},
 {id:"ferrugem-scrap",title:"Depósito de sucata",role:"CONFERIR PEÇAS",tile:{x:7,y:17},kind:"evidence"},
 {id:"ferrugem-pump",title:"Válvula de vapor",role:"REGULAR PRESSÃO",tile:{x:19,y:8},kind:"terminal"},
 {id:"ferrugem-log",title:"Livro de turno",role:"ARQUIVO DE PRODUÇÃO",tile:{x:15,y:9},kind:"terminal"},
 {id:"ferrugem-relay",title:"Repetidor da Helix",role:"SINAL ALTERADO",tile:{x:23,y:9},kind:"terminal"},
 {id:"ferrugem-shelter",title:"Posto comunitário",role:"TRABALHADORES",tile:{x:11,y:16},kind:"worker"},
 {id:"ferrugem-conveyor",title:"Esteira clandestina",role:"SEPARAÇÃO DE CARGA",tile:{x:19,y:16},kind:"evidence"},
 {id:"ferrugem-salvage",title:"Arquivo de refugo",role:"RECUPERAR MICROATUADOR",tile:{x:23,y:17},kind:"evidence"},
] as const;
export const KEY=(t:Cell)=>t.x+","+t.y;
const walls:ReadonlySet<string>=(()=>{
 const a=new Set<string>();
 for(const building of FACTORIES){
  for(let x=building.x;x<building.x+building.w;x++)
   for(let y=building.y;y<building.y+building.h;y++)a.add(KEY({x,y}));
 }
 for(const actor of FERRUGEM_ACTORS)a.add(KEY(actor.tile));
 return a;
})();
export function isFerrugemInside(t:Cell):boolean{
 return Number.isInteger(t.x)&&Number.isInteger(t.y)&&
  t.x>0&&t.y>0&&t.x<FERRUGEM_WIDTH-1&&t.y<FERRUGEM_HEIGHT-1;
}
export function isFerrugemWalkable(t:Cell):boolean{return isFerrugemInside(t)&&!walls.has(KEY(t));}
const STEPS:readonly Cell[]=[
 {x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0},
 {x:1,y:1},{x:1,y:-1},{x:-1,y:1},{x:-1,y:-1},
];
const ADJACENT=STEPS.slice(0,4);
export function ferrugemStep(from:Cell,to:Cell):boolean{
 const dx=to.x-from.x,dy=to.y-from.y;
 if(Math.abs(dx)>1||Math.abs(dy)>1||(!dx&&!dy)||!isFerrugemWalkable(to))return false;
 return dx===0||dy===0||
  (isFerrugemWalkable({x:from.x+dx,y:from.y})&&
   isFerrugemWalkable({x:from.x,y:from.y+dy}));
}
export function ferrugemPath(start:Cell,target:Cell):Cell[]|null{
 if(!isFerrugemWalkable(start)||!isFerrugemWalkable(target))return null;
 const nodes:Cell[]=[start],prev=new Map<string,string|null>([[KEY(start),null]]);
 for(let i=0;i<nodes.length;i++){
  const current=nodes[i]!;
  if(KEY(current)===KEY(target))break;
  for(const d of STEPS){
   const n={x:current.x+d.x,y:current.y+d.y},key=KEY(n);
   if(prev.has(key)||!ferrugemStep(current,n))continue;
   prev.set(key,KEY(current));nodes.push(n);
  }
 }
 if(!prev.has(KEY(target)))return null;
 const path:Cell[]=[];
 for(let key:string|null=KEY(target);key!==null;key=prev.get(key)??null){
  const [x,y]=key.split(",").map(Number);
  path.push({x:x??0,y:y??0});
 }
 return path.reverse();
}
export function ferrugemApproach(start:Cell,target:Cell):Cell[]|null{
 return ADJACENT.map(d=>ferrugemPath(start,{x:target.x+d.x,y:target.y+d.y}))
  .filter((path):path is Cell[]=>path!==null)
  .sort((a,b)=>a.length-b.length)[0]??null;
}
export function isFerrugemActor(id:string):boolean{
 return FERRUGEM_ACTORS.some(actor=>actor.id===id);
}
