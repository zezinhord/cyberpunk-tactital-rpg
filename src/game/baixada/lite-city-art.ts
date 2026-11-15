/** Port fiel das fachadas, janelas, cobogós, telhados, toldos, luminárias,
 * placas e props do Phaser da Baixada para Canvas 2D de baixo consumo.
 *
 * O contexto já está no sistema de coordenadas do mundo (48x24 / tile).
 * Não é gerado nenhum bitmap do mapa inteiro. Somente elementos visíveis
 * são redesenhados, com a mesma planta/cores do BaixadaScene original.
 */
import type {BuildingSpec,Tile} from "./layout";
import type {LiteArtAssets} from "./lite-art-assets";

export interface Point{readonly x:number;readonly y:number}
export const tileWorld=({x,y}:Tile):Point=>({
 x:850+(x-y)*24,y:135+(x+y)*12,
});
function rgba(rgb:number,alpha:number):string{
 return "rgba("+((rgb>>16)&255)+","+((rgb>>8)&255)+","+(rgb&255)+","+alpha+")";
}
function hex(rgb:number):string{return "#"+rgb.toString(16).padStart(6,"0");}
function shade(rgb:number,mul:number):string{
 const r=Math.floor(((rgb>>16)&255)*mul);
 const g=Math.floor(((rgb>>8)&255)*mul);
 const b=Math.floor((rgb&255)*mul);
 return "rgb("+r+","+g+","+b+")";
}
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
function shape(ctx:CanvasRenderingContext2D,points:readonly Point[],
 fill:string,stroke?:string,weight=1):void{
 if(!points.length)return;
 ctx.beginPath();ctx.moveTo(points[0]!.x,points[0]!.y);
 for(const point of points.slice(1))ctx.lineTo(point.x,point.y);
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=weight;ctx.stroke();}
}
function line(ctx:CanvasRenderingContext2D,points:readonly Point[],
 color:string,width=1):void{
 if(points.length<2)return;
 ctx.beginPath();ctx.moveTo(points[0]!.x,points[0]!.y);
 for(const point of points.slice(1))ctx.lineTo(point.x,point.y);
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}
function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,
 r:number,color:string):void{
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);
 ctx.fillStyle=color;ctx.fill();
}
function ellipse(ctx:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,
 color:string):void{
 ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
 ctx.fillStyle=color;ctx.fill();
}

export function paintCityBackground(ctx:CanvasRenderingContext2D,width:number,
 height:number):void{
 const sky=ctx.createLinearGradient(0,0,0,height);
 sky.addColorStop(0,"#111e27");
 sky.addColorStop(.40,"#1d3238");
 sky.addColorStop(1,"#3e3c36");
 ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
 const sun=ctx.createRadialGradient(width*.72,height*.18,5,
   width*.72,height*.18,width*.43);
 sun.addColorStop(0,"rgba(218,133,83,.19)");
 sun.addColorStop(1,"rgba(218,133,83,0)");
 ctx.fillStyle=sun;ctx.fillRect(0,0,width,height);
 for(let i=0;i<20;i++){
  const x=(i*83+19)%(width+86)-43;
  const h=45+(i*43)%100;
  ctx.fillStyle=i%3===0?"rgba(11,25,31,.65)":"rgba(21,38,42,.64)";
  ctx.fillRect(x,height*.38-h,36+(i%4)*11,h+28);
  ctx.fillStyle="rgba(219,167,102,.18)";
  for(let y=0;y<3;y++)if((i+y)%3===0)
   ctx.fillRect(x+7,height*.38-h+12+y*16,5,3);
 }
 ctx.strokeStyle="rgba(15,30,37,.72)";
 ctx.lineWidth=2;
 for(let i=0;i<3;i++){
  ctx.beginPath();ctx.moveTo(0,height*.21+i*28);
  ctx.bezierCurveTo(width*.34,height*.25+i*17,
    width*.74,height*.19+i*29,width,height*.23+i*19);
  ctx.stroke();
 }
}

export function drawCityBuilding(ctx:CanvasRenderingContext2D,b:BuildingSpec):void{
 const a=tileWorld({x:b.x,y:b.y});
 const front1=tileWorld({x:b.x+b.width,y:b.y});
 const c=tileWorld({x:b.x+b.width,y:b.y+b.depth});
 const d=tileWorld({x:b.x,y:b.y+b.depth});
 const h=b.height;
 const at={x:a.x,y:a.y-h},bt={x:front1.x,y:front1.y-h};
 const ct={x:c.x,y:c.y-h},dt={x:d.x,y:d.y-h};
 const wall=hex(b.wall),roof=hex(b.roof);
 ctx.save();
 // Volume original da Baixada. A luz vem da esquerda e revela a fachada.
 shape(ctx,[d,c,ct,dt],wall,"#132128",1.7);
 shape(ctx,[front1,c,ct,bt],shade(b.wall,.72),"#132128",1.7);
 shape(ctx,[at,bt,ct,dt],roof,rgba(b.accent,.78),1.8);
 // Sombra sob a beirada e borda do telhado.
 line(ctx,[{x:dt.x,y:dt.y+4},{x:ct.x,y:ct.y+4}],
   "rgba(7,17,23,.56)",2);
 line(ctx,[{x:bt.x,y:bt.y+4},{x:ct.x,y:ct.y+4}],
   "rgba(7,17,23,.46)",1.8);
 // Rejunte, colunas e marcas de ferrugem nas fachadas.
 for(let col=1;col<b.width;col++){
  const t=col/b.width;
  const upper={x:lerp(bt.x,ct.x,t),y:lerp(bt.y,ct.y,t)+8};
  const lower={x:lerp(front1.x,c.x,t),y:lerp(front1.y,c.y,t)-4};
  line(ctx,[upper,lower],"rgba(12,27,34,.45)",1.6);
 }
 for(let row=0;row<2;row++)for(let col=0;col<b.width;col++){
  const t=(col+.5)/b.width;
  const bx=lerp(bt.x,ct.x,t);
  const by=lerp(bt.y,ct.y,t)+Math.min(h-22,20+row*Math.max(22,(h-36)/2));
  rounded(ctx,bx-6,by-5,12,14,2,"#111f26");
  ctx.fillStyle=rgba(b.accent,.8);ctx.fillRect(bx-4,by-3,8,2);
  ctx.fillStyle="rgba(120,205,211,.22)";
  ctx.fillRect(bx-4,by+1,8,6);
  ctx.fillStyle="rgba(20,27,27,.8)";
  ctx.fillRect(bx-1,by,1,7);
 }
 const paneled=b.style==="housing"||b.style==="canal"||b.style==="community";
 if(paneled){
  const cobogoY=lerp(bt.y,ct.y,.25)+16;
  const cobogoX=lerp(bt.x,ct.x,.25);
  for(let row=0;row<2;row++)for(let col=0;col<3;col++){
   const px=cobogoX+col*8,py=cobogoY+row*9+col*4;
   ctx.fillStyle="rgba(16,29,34,.9)";ctx.fillRect(px,py,5,5);
   ctx.strokeStyle="rgba(224,196,159,.5)";ctx.lineWidth=.8;
   ctx.strokeRect(px,py,5,5);
  }
 }
 if(b.style==="clinic"){
  line(ctx,[{x:lerp(bt.x,ct.x,.1),y:lerp(bt.y,ct.y,.5)+20},
    {x:lerp(bt.x,ct.x,.9),y:lerp(bt.y,ct.y,.5)+38}],
     "rgba(164,208,207,.75)",3);
  ctx.fillStyle="rgba(207,235,224,.6)";
  ctx.fillRect(lerp(bt.x,ct.x,.2),lerp(bt.y,ct.y,.28)+16,13,2);
 }
 if(b.style==="workshop"){
  const sx=lerp(d.x,c.x,.74),sy=lerp(d.y,c.y,.74)-24;
  rounded(ctx,sx-14,sy-4,28,23,2,"rgba(66,56,50,.98)");
  for(let i=0;i<4;i++)line(ctx,
    [{x:sx-12,y:sy+i*5},{x:sx+12,y:sy+i*5}],
    "rgba(206,168,117,.72)",1.7);
 }
 if(b.style==="canal"){
  line(ctx,[{x:d.x+15,y:d.y-9},{x:d.x+15,y:d.y-54},
    {x:d.x+33,y:d.y-54}],"#48616a",2.5);
 }
 // Entrada escura, maçaneta âmbar; os atores interativos continuam no mapa.
 const doorX=(d.x+c.x)/2,doorY=(d.y+c.y)/2-26;
 rounded(ctx,doorX-8,doorY-15,16,42,2,"#101a21");
 ctx.strokeStyle="rgba(235,185,111,.66)";
 ctx.lineWidth=1;ctx.strokeRect(doorX-8,doorY-15,16,42);
 ctx.fillStyle=rgba(b.accent,.9);ctx.fillRect(doorX+4,doorY+2,2,3);
 line(ctx,[{x:d.x+7,y:d.y-12},{x:c.x-7,y:c.y-12}],rgba(b.accent,.6),1.7);
 if(paneled){
  const upper=lerp(d.y,c.y,.32);
  line(ctx,[{x:d.x+7,y:upper-35},{x:c.x-7,y:upper-35}],
    "rgba(210,179,136,.52)",1.8);
  for(let i=0;i<3;i++){
   ctx.fillStyle=i===1?"#967665":"#b0a98b";
   ctx.fillRect(d.x+12+i*13,upper-33+i*2,11,9);
  }
 }
 const awningStyles=["market","workshop","depot","community"];
 if(awningStyles.includes(b.style)){
  const x=lerp(d.x,c.x,.55),y=lerp(d.y,c.y,.55)-31;
  shape(ctx,[{x:x-30,y},{x:x+30,y},{x:x+35,y:y+14},{x:x-36,y:y+14}],
   b.style==="market"?"#ac7757":"#b28b58","#2a2621",1.3);
  line(ctx,[{x:x-27,y:y+2},{x:x+24,y:y+2}],
    "rgba(250,220,163,.76)",1.8);
 }
 const roofCenter={
  x:(at.x+bt.x+ct.x+dt.x)/4,y:(at.y+bt.y+ct.y+dt.y)/4,
 };
 if(b.style==="factory"){
  ctx.fillStyle="#30393d";
  ctx.fillRect(roofCenter.x-21,roofCenter.y-20,11,26);
  ctx.fillRect(roofCenter.x+13,roofCenter.y-33,10,39);
  ctx.fillStyle="rgba(211,157,108,.65)";
  ctx.fillRect(roofCenter.x-22,roofCenter.y-19,13,3);
 }else if(b.style==="utility"||b.style==="canal"){
  rounded(ctx,roofCenter.x-13,roofCenter.y-15,26,21,5,"#34464c");
  ellipse(ctx,roofCenter.x,roofCenter.y-15,13,3.5,
    "rgba(198,219,204,.5)");
 }else if(b.style==="clinic"){
  rounded(ctx,roofCenter.x-18,roofCenter.y-5,36,12,2,"#283d47");
  line(ctx,[{x:roofCenter.x-13,y:roofCenter.y},
    {x:roofCenter.x+13,y:roofCenter.y}],"rgba(171,212,209,.65)",2);
 }
 // Sinalização cromática original com moldura, não texto flutuando sobre teto.
 if(b.sign){
  const labelX=(d.x+c.x)/2,labelY=(d.y+c.y)/2-h+15;
  rounded(ctx,labelX-44,labelY-9,88,18,3,"rgba(10,25,32,.98)");
  ctx.strokeStyle=rgba(b.accent,.89);ctx.lineWidth=1;
  ctx.strokeRect(labelX-44,labelY-9,88,18);
  ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.font="bold 10px monospace";ctx.fillStyle="#eff3dc";
  const text=b.sign.length>15?b.sign.slice(0,14)+"…":b.sign;
  ctx.fillText(text,labelX,labelY,80);
 }
 ctx.restore();
}

export type PropKind="marketStalls"|"palms"|"lamps"|"bins"|"crates";
export function drawCityProp(ctx:CanvasRenderingContext2D,kind:PropKind,
 tile:Tile,assets:LiteArtAssets):void{
 const p=tileWorld(tile);
 ctx.save();
 if(kind==="marketStalls"){
  const img=assets.decor("market");
  if(img){
   // Mesmo SVG 200x180 escalado a 40% como em BaixadaScene.
   ctx.drawImage(img,p.x-40,p.y-68,80,72);
  }else{
   rounded(ctx,p.x-18,p.y-27,36,24,2,"#765341");
   shape(ctx,[{x:p.x-25,y:p.y-27},{x:p.x,y:p.y-50},
     {x:p.x+26,y:p.y-27},{x:p.x,y:p.y-14}],
     "#e2b67e","#563927",2);
  }
 }else if(kind==="palms"){
  const img=assets.decor("palm");
  if(img){
   ctx.drawImage(img,p.x-26,p.y-86,52,87);
  }else{
   line(ctx,[{x:p.x,y:p.y},{x:p.x+4,y:p.y-54},
     {x:p.x-1,y:p.y-69}],"#8a714e",5);
   ellipse(ctx,p.x-1,p.y-69,26,9,"#69866a");
  }
 }else if(kind==="lamps"){
  ellipse(ctx,p.x,p.y+2,12,3.5,"rgba(4,13,18,.4)");
  line(ctx,[p,{x:p.x+3,y:p.y-69},{x:p.x+18,y:p.y-74}],
    "#2a3b40",4);
  line(ctx,[{x:p.x+8,y:p.y-70},{x:p.x+18,y:p.y-74}],
    "rgba(218,157,101,.87)",2.4);
  const halo=ctx.createRadialGradient(p.x+19,p.y-75,1,p.x+19,p.y-75,26);
  halo.addColorStop(0,"rgba(250,202,112,.25)");
  halo.addColorStop(1,"rgba(250,202,112,0)");
  ctx.fillStyle=halo;
  ctx.beginPath();ctx.arc(p.x+19,p.y-75,26,0,Math.PI*2);ctx.fill();
  rounded(ctx,p.x+13,p.y-79,11,5,2,"#ffe0a1");
 }else if(kind==="bins"){
  rounded(ctx,p.x-8,p.y-16,16,17,3,"#1a292c");
  ctx.fillStyle="#989682";ctx.fillRect(p.x-7,p.y-16,14,3);
  ctx.strokeStyle="#0b161b";ctx.lineWidth=1;ctx.strokeRect(p.x-8,p.y-16,16,17);
 }else if(kind==="crates"){
  rounded(ctx,p.x-9,p.y-12,18,12,2,"#96734c");
  ctx.strokeStyle="#3b3125";ctx.lineWidth=1;ctx.strokeRect(p.x-7,p.y-10,14,9);
  line(ctx,[{x:p.x-7,y:p.y-10},{x:p.x+7,y:p.y-1}],
    "rgba(221,179,110,.7)",1.5);
 }
 ctx.restore();
}
