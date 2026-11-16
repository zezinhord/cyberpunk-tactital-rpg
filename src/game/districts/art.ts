/** Nova Arcádia: módulos de arte isométrica dos cinco distritos.
 * Geometria gerada uma vez no Graphics que vira a textura estática da região.
 * Não altera malha, colisão, missões ou equipamento; não importa Phaser em runtime.
 */
import type Phaser from "phaser";
import type {DistrictId,DistrictSpec,CityBlock,NodeSlot,Tile} from "./catalog";
type G=Phaser.GameObjects.Graphics;
type Point={x:number;y:number};
type Project=(tile:Tile)=>Point;
export type Architecture="corporate"|"nightlife"|"underground"|"quarantine"|"community";
export const DISTRICT_ART:Readonly<Record<DistrictId,{
 architecture:Architecture;signature:readonly string[];roofRise:number;skyline:string;
}>>={
 aurea:{architecture:"corporate",signature:["skybridges","vertical-gardens","helix-checkpoints"],roofRise:142,skyline:"glass-spires"},
 prisma:{architecture:"nightlife",signature:["concert-facades","luminous-billboards","street-awnings"],roofRise:86,skyline:"festival-terraces"},
 subsolo:{architecture:"underground",signature:["water-pipes","black-market-stalls","service-arches"],roofRise:68,skyline:"subterranean-arches"},
 "setor-zero":{architecture:"quarantine",signature:["sealed-laboratories","warning-beacons","eden-interference"],roofRise:108,skyline:"quarantine-towers"},
 periferia:{architecture:"community",signature:["patchwork-roofs","water-tanks","solar-panels"],roofRise:63,skyline:"hillside-houses"},
};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
function dim(col:number,factor:number):number{
 const r=Math.max(0,Math.min(255,Math.round((col>>16&255)*factor)));
 const g=Math.max(0,Math.min(255,Math.round((col>>8&255)*factor)));
 const b=Math.max(0,Math.min(255,Math.round((col&255)*factor)));
 return r<<16|g<<8|b;
}
function polygon(g:G,points:readonly Point[],fill:number,outline?:number):void{
 g.fillStyle(fill,1);g.lineStyle(outline===undefined?0:.9,outline??fill,outline===undefined?0:.65);
 g.beginPath();g.moveTo(points[0]!.x,points[0]!.y);
 for(let i=1;i<points.length;i++)g.lineTo(points[i]!.x,points[i]!.y);
 g.closePath();g.fillPath();if(outline!==undefined)g.strokePath();
}
function line(g:G,from:Point,to:Point,color:number,width=1,alpha=1):void{
 g.lineStyle(width,color,alpha);g.beginPath();g.moveTo(from.x,from.y);g.lineTo(to.x,to.y);g.strokePath();
}
function rect(g:G,x:number,y:number,w:number,h:number,color:number,alpha=1):void{
 g.fillStyle(color,alpha);g.fillRect(x,y,w,h);
}
function ellipse(g:G,x:number,y:number,w:number,h:number,color:number,alpha=1):void{
 g.fillStyle(color,alpha);g.fillEllipse(x,y,w,h);
}
/** Região de fundo: horizonte sem construir obstáculos falsos nas ruas. */
export function drawDistrictSkyline(g:G,id:DistrictId,s:DistrictSpec,w:number,h:number):void{
 const type=DISTRICT_ART[id].architecture;
 // Céu escuro e a umidade tropical permanecem comuns a todas as regiões.
 rect(g,0,0,w,h,s.sky);
 rect(g,0,109,w,55,dim(s.sky,1.20),.4);
 for(let i=0;i<16;i++){
  const x=25+i*98,high=(type==="corporate"?94:45)+((i*43+id.length*17)%79);
  const width=type==="corporate"?36+(i%3)*8:49+(i%4)*6;
  if(type==="underground"){
   // Arcos sobrepostos de uma cidade que cresceu nos túneis de serviço.
   rect(g,x,124-high,width,high+43,dim(s.wall,.62),.7);
   g.lineStyle(5,s.accent,.22);
   g.strokeCircle(x+width/2,158,33+(i%2)*12);
   rect(g,x+12,105,7,45,dim(s.roof,.6),.7);
  }else if(type==="community"){
   rect(g,x,140-high,width,high,dim(s.wall,.78),.75);
   polygon(g,[{x:x-4,y:140-high},{x:x+width/2,y:130-high},
    {x:x+width+5,y:140-high}],dim(s.roof,.8));
   rect(g,x+8,154-high,9,7,s.accent,.22);
  }else{
   rect(g,x,137-high,width,high+17,dim(s.wall,.76),.7);
   if(type==="corporate"){
    rect(g,x+width*.22,137-high,3,high,dim(s.roof,1.35),.67);
    rect(g,x+width*.69,137-high,3,high,dim(s.roof,1.35),.54);
    rect(g,x-3,137-high,width+6,3,s.accent,.57);
   }else if(type==="nightlife"){
    for(let n=0;n<4;n++)rect(g,x+5,147-high+n*17,width-10,3,s.accent,.24);
    if(i%4===0)rect(g,x+width/2-3,130-high,6,8,0xa5c9dc,.5);
   }else{
    rect(g,x-3,135-high,width+6,4,0xc69166,.27);
    rect(g,x+width-10,155-high,4,4,0xd75c51,.62);
   }
  }
 }
 if(type==="corporate"){
  // Passarela apenas no plano do horizonte, não atravessa a navegação.
  rect(g,255,64,290,10,0x324758,.78);
  rect(g,263,65,274,3,0xa7dfe5,.35);
 }else if(type==="nightlife"){
  for(let i=0;i<8;i++){
   line(g,{x:i*180,y:53},{x:i*180+110,y:87},s.accent,1.5,.44);
   ellipse(g,i*180+111,87,5,5,0xffc792,.66);
  }
 }else if(type==="quarantine"){
  for(let i=0;i<10;i++){
   line(g,{x:i*155,y:135},{x:i*155+8,y:57},dim(s.roof,1.1),2,.35);
   rect(g,i*155+6,57,4,5,0xf17c5f,.67);
  }
 }
}
/** Piso climático: marcas discretas sem adicionar falsas colisões. */
export function drawDistrictPavement(g:G,id:DistrictId,c:Point,tile:Tile,road:boolean):void{
 const n=tile.x*13+tile.y*29;
 if(road&&n%9===0){
  line(g,{x:c.x-10,y:c.y+2},{x:c.x+10,y:c.y+2},
   id==="prisma"?0xd9a5d0:id==="aurea"?0xb0c9d1:0xe1c28a,1.2,.3);
 }
 if(id==="setor-zero"&&n%17===0)
  line(g,{x:c.x-8,y:c.y-1},{x:c.x+6,y:c.y+4},0x191e25,2,.62);
 if(id==="periferia"&&n%23===0)
  line(g,{x:c.x-7,y:c.y+1},{x:c.x+4,y:c.y+5},0xd5b28b,1,.38);
 if(id==="subsolo"&&n%22===0)ellipse(g,c.x+3,c.y+5,16,4,0x5b929f,.19);
}
/** Edifícios reais com telhado isométrico e 2 fachadas, encaixados na grade bloqueada. */
export function drawDistrictBuilding(g:G,id:DistrictId,s:DistrictSpec,b:CityBlock,
 project:Project,index:number):void{
 const profile=DISTRICT_ART[id],style=profile.architecture;
 const rise=profile.roofRise+(index%3-1)*(style==="corporate"?17:12);
 // Limites -0.5 colocam o volume sobre as células que o pathfinder bloqueia.
 const a=project({x:b.x-.5,y:b.y-.5});
 const right=project({x:b.x+b.w-.5,y:b.y-.5});
 const front=project({x:b.x+b.w-.5,y:b.y+b.h-.5});
 const left=project({x:b.x-.5,y:b.y+b.h-.5});
 const lift=(p:Point):Point=>({x:p.x,y:p.y-rise});
 const ar=lift(a),br=lift(right),cr=lift(front),dr=lift(left);
 const dark=dim(s.wall,.69),lit=dim(s.wall,1.09),edge=dim(s.roof,.7);
 // Paredes opacas, portanto construções não são retângulos flutuantes.
 polygon(g,[right,front,cr,br],dark,edge);
 polygon(g,[front,left,dr,cr],lit,edge);
 polygon(g,[ar,br,cr,dr],s.roof,dim(s.roof,1.18));
 line(g,br,cr,dim(s.accent,1.2),1.4,.32);
 line(g,cr,dr,dim(s.accent,1.2),1.4,.22);
 // O peso de cada fachada está ligado à extensão isométrica do bloco.
 for(let i=1;i<=b.h;i++){
  const t=i/(b.h+1);
  const px=mix(br.x,cr.x,t),py=mix(br.y,cr.y,t);
  for(let floor=0;floor<Math.min(4,Math.floor(rise/27));floor++){
   const y=py+17+floor*24;
   if(y>mix(right.y,front.y,t)-8)continue;
   if(style==="corporate"){
    rect(g,px-4,y,13,13,0x172b3e,.9);
    rect(g,px-3,y+2,11,2,0xa7e3ed,.6);
    rect(g,px+2,y+5,1,7,0x84b9ce,.58);
   }else if(style==="nightlife"){
    rect(g,px-4,y,11,11,0x20152d,.94);
    rect(g,px-4,y,10,2,index%2===0?0xe28bbc:0xb7adf7,.78);
   }else if(style==="underground"){
    rect(g,px-4,y,9,9,0x101c27,.87);
    line(g,{x:px-5,y:y+10},{x:px+6,y:y+10},0xd7a567,1.2,.42);
   }else if(style==="quarantine"){
    rect(g,px-5,y,12,10,0x182028,.85);
    line(g,{x:px-5,y:y+9},{x:px+7,y:y},0xd2a56b,.5,.52);
   }else{
    rect(g,px-6,y,12,11,index%2===0?0x3f3940:0x665041,.94);
    rect(g,px-4,y+1,8,2,0xccb894,.44);
   }
  }
 }
 // Cornijas, toldos, caixas d'água e placas diferenciam distritos
 // sem criar objetos falsamente bloqueantes no caminho.
 const roofX=(ar.x+br.x+cr.x+dr.x)/4;
 const roofY=(ar.y+br.y+cr.y+dr.y)/4;
 if(style==="corporate"){
  // Jardins suspensos e painel de transmissão corporativa.
  rect(g,roofX-21,roofY-4,42,10,0x192934,.85);
  for(let k=0;k<5;k++)ellipse(g,roofX-15+k*8,roofY-8,7,12,0x637a54,.93);
  rect(g,front.x-26,front.y-rise+14,34,23,0x142737,.89);
  rect(g,front.x-24,front.y-rise+15,30,2,0x9edee7,.7);
  for(let k=0;k<3;k++)rect(g,front.x-20+k*9,front.y-rise+21,4,9,0x76b9cb,.55);
  line(g,{x:roofX,y:roofY},{x:roofX+13,y:roofY-25},0xa5d6e2,2,.7);
 }else if(style==="nightlife"){
  // Painéis de luz, letreiros musicais e cobertura de feira.
  rect(g,front.x-34,front.y-rise+12,52,30,0x291b35,.92);
  g.lineStyle(2,0xd992d2,.89);g.strokeRoundedRect(front.x-34,front.y-rise+12,52,30,3);
  for(let k=0;k<7;k++){
   rect(g,front.x-27+k*6,front.y-rise+32-(k*7+index*3)%16,
    3,5+(k*7+index*3)%16,k%2?0xc6a8f0:0xeab477,.9);
  }
  polygon(g,[{x:roofX-27,y:roofY+9},{x:roofX+27,y:roofY+9},
   {x:roofX+21,y:roofY+25},{x:roofX-32,y:roofY+25}],0xe2a773,0x713a6f);
  for(let k=0;k<5;k++)ellipse(g,roofX-18+k*9,roofY+9,3,3,0xffddb0,.78);
 }else if(style==="underground"){
  // Tubulações atravessam o teto; estações de manutenção e mercados subterrâneos.
  line(g,{x:ar.x+18,y:ar.y+7},{x:br.x-13,y:br.y+7},0xa37352,6,.75);
  line(g,{x:ar.x+18,y:ar.y+7},{x:br.x-13,y:br.y+7},0xd6aa74,1.2,.78);
  rect(g,front.x-32,front.y-rise+18,40,31,0x13202a,.95);
  g.lineStyle(3,0xca9a63,.88);
  g.strokeRoundedRect(front.x-32,front.y-rise+18,40,31,12);
  rect(g,front.x-25,front.y-rise+24,26,15,0x283b43,.7);
  for(let k=0;k<4;k++)rect(g,front.x-25+k*7,front.y-rise+42,3,3,0xeac080,.65);
 }else if(style==="quarantine"){
  // Fachada lacrada, antenas, faixa de alerta. Verde apenas para intrusão Éden.
  rect(g,front.x-32,front.y-rise+14,42,26,0x252633,.83);
  for(let k=0;k<5;k++)rect(g,front.x-29+k*8,front.y-rise+31,5,5,0xd4a16a,.52);
  line(g,{x:roofX,y:roofY},{x:roofX+2,y:roofY-30},0x81939c,2.5,.75);
  ellipse(g,roofX+2,roofY-32,23,8,0x92a1a3,.76);
  rect(g,roofX-21,roofY-3,5,8,0xe86d57,.9);
  // O pulso é explicitamente do Projeto Éden, nunca iluminação de segurança.
  if(index===2){
   line(g,{x:front.x+5,y:front.y-rise+15},
    {x:front.x+18,y:front.y-rise+32},0x7dffb3,2,.8);
   ellipse(g,front.x+18,front.y-rise+33,6,6,0x7dffb3,.74);
  }
  for(let k=0;k<3;k++)ellipse(g,ar.x+12+k*12,ar.y+12,14,7,0x586749,.7);
 }else{
  // Moradia em mosaico: chapas de tamanhos diversos, solar, caixa d'água.
  const patches=[0x98795c,0x705c5f,0xb49c78,0x827b71];
  for(let k=0;k<4;k++){
   polygon(g,[{x:mix(ar.x,dr.x,k/4),y:mix(ar.y,dr.y,k/4)},
    {x:mix(br.x,cr.x,k/4),y:mix(br.y,cr.y,k/4)},
    {x:mix(br.x,cr.x,(k+1)/4),y:mix(br.y,cr.y,(k+1)/4)},
    {x:mix(ar.x,dr.x,(k+1)/4),y:mix(ar.y,dr.y,(k+1)/4)}],
    patches[(k+index)%patches.length]??s.roof,dim(s.roof,.6));
  }
  rect(g,roofX-18,roofY-10,30,17,0x253b4b,.95);
  for(let k=0;k<3;k++)line(g,{x:roofX-17+k*9,y:roofY-9},
    {x:roofX-17+k*9,y:roofY+6},0x5c94ab,1,.8);
  rect(g,roofX+21,roofY-9,19,13,0x41535a,.96);
  ellipse(g,roofX+30,roofY-9,20,7,0x687781,.85);
  // Varal integrado ao volume, sem atravessar a rua.
  line(g,{x:front.x-16,y:front.y-rise+39},
   {x:left.x+14,y:left.y-rise+35},0x1c2d32,1.4,.83);
  rect(g,front.x-8,front.y-rise+39,7,10,0xd4a67f,.85);
 }
}
/** Interagíveis mantêm as mesmas coordenadas e hitbox da versão anterior.
 * Variações procedurais não são spritesheets definitivos de NPC.
 */
export function drawDistrictInteractable(g:G,id:DistrictId,slot:NodeSlot,c:Point,s:DistrictSpec):void{
 const type=DISTRICT_ART[id].architecture;
 ellipse(g,c.x,c.y+4,38,11,0x07121a,.42);
 const npc=slot==="guide"||slot==="specialist"||slot==="community";
 if(npc){
  const suits:Record<Architecture,number>={corporate:0x334d61,nightlife:0x694267,
   underground:0x453f3c,quarantine:0x69726a,community:0x856655};
  // Cabeça, ombros e silhueta com adereços reconhecíveis por distrito.
  rect(g,c.x-11,c.y-42,22,34,suits[type],1);
  ellipse(g,c.x,c.y-49,19,21,0xc3987f,.97);
  polygon(g,[{x:c.x-13,y:c.y-38},{x:c.x+13,y:c.y-38},
   {x:c.x+10,y:c.y-8},{x:c.x-9,y:c.y-8}],dim(suits[type],.78),dim(s.wall,.85));
  if(type==="corporate"){
   rect(g,c.x-8,c.y-36,16,4,0xb1d7dc,.81);
   rect(g,c.x+10,c.y-30,8,15,0x182b34,.97);
   rect(g,c.x+11,c.y-26,6,2,0xffd166,.83);
  }else if(type==="nightlife"){
   ellipse(g,c.x-10,c.y-50,8,12,0xd69ac4,.9);
   ellipse(g,c.x+10,c.y-50,8,12,0xd69ac4,.9);
   rect(g,c.x-11,c.y-22,22,2,0xe7b58e,.82);
  }else if(type==="underground"){
   polygon(g,[{x:c.x-16,y:c.y-50},{x:c.x,y:c.y-65},
    {x:c.x+16,y:c.y-50}],0x27303a);
   rect(g,c.x-8,c.y-47,17,5,0x263c45,.94);
   rect(g,c.x-4,c.y-45,7,2,0xe1bb83,.64);
  }else if(type==="quarantine"){
   rect(g,c.x-10,c.y-55,20,12,0x55646a,.92);
   rect(g,c.x-8,c.y-52,16,5,0x263944,.96);
   rect(g,c.x-9,c.y-30,18,2,0xd4a36a,.86);
  }else{
   polygon(g,[{x:c.x-13,y:c.y-34},{x:c.x+4,y:c.y-35},
    {x:c.x+15,y:c.y-9},{x:c.x-1,y:c.y-10}],0xae8064);
   rect(g,c.x+10,c.y-37,9,18,0x4c544d,.85);
  }
  if(slot==="specialist")rect(g,c.x-11,c.y-21,22,3,0xffd166,.68);
 }else{
  const fills:Record<Architecture,number>={corporate:0x263d50,nightlife:0x3c2b4c,
   underground:0x2c3338,quarantine:0x373640,community:0x615047};
  const w=slot==="exit"?35:30,h=slot==="exit"?55:37;
  rect(g,c.x-w/2,c.y-h-1,w,h,fills[type],.96);
  g.lineStyle(2,0xffd166,.79);g.strokeRoundedRect(c.x-w/2,c.y-h-1,w,h,4);
  if(type==="corporate"){
   rect(g,c.x-9,c.y-h+8,18,10,0x83bac9,.68);
   for(let k=0;k<3;k++)rect(g,c.x-6+k*6,c.y-h+11,2,5,0x1c3441,.91);
  }else if(type==="nightlife"){
   rect(g,c.x-8,c.y-h+7,16,14,0x7c4874,.92);
   for(let k=0;k<4;k++)rect(g,c.x-6+k*4,c.y-h+17-(k*3)%8,2,6,0xdfa8da,.81);
  }else if(type==="underground"){
   rect(g,c.x-10,c.y-h+10,20,8,0x141e24,.95);
   rect(g,c.x-7,c.y-h+12,14,3,0x78a4a7,.7);
  }else if(type==="quarantine"){
   for(let k=0;k<3;k++)line(g,{x:c.x-13+k*10,y:c.y-h+6},
    {x:c.x-7+k*10,y:c.y-h+13},0xd6a465,2,.85);
   rect(g,c.x-8,c.y-h+22,16,3,0xcb7d69,.7);
  }else{
   rect(g,c.x-11,c.y-h+9,22,7,0x8f7a56,.95);
   rect(g,c.x-9,c.y-h+20,18,5,0x405762,.83);
  }
  if(slot==="exit")rect(g,c.x-4,c.y-19,8,9,0xffd166,.8);
 }
 // Marcador neutro legível além da cor: losango sobre cada interagível.
 polygon(g,[{x:c.x,y:c.y-89},{x:c.x+5,y:c.y-84},
  {x:c.x,y:c.y-79},{x:c.x-5,y:c.y-84}],0xffd166,0x101923);
}
