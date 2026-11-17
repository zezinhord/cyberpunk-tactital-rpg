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
 // Parapeitos, rufos e emendas acompanham o plano do teto isométrico.
 // Detalhes de material, sem transformar a cobertura em nova colisão.
 line(ctx,[{x:at.x,y:at.y-3},{x:bt.x,y:bt.y-3},{x:ct.x,y:ct.y-3}],
   "rgba(211,190,162,.5)",1.8);
 line(ctx,[{x:ct.x,y:ct.y-3},{x:dt.x,y:dt.y-3}],
   "rgba(28,43,47,.72)",2.1);
 const roofRibs=2+(b.id.length%3);
 for(let i=1;i<roofRibs;i++){
  const t=i/roofRibs;
  line(ctx,[{x:lerp(at.x,dt.x,t),y:lerp(at.y,dt.y,t)},
   {x:lerp(bt.x,ct.x,t),y:lerp(bt.y,ct.y,t)}],
   i%2?"rgba(226,203,166,.24)":"rgba(14,35,39,.26)",.9);
 }
 // Telhas e chapas reaproveitadas criam textura isométrica sem imagens grandes.
 // O brilho frio é material / reflexo; nunca um marcador de interação.
 for(let i=1;i<=3;i++){
  const t=i/4;
  line(ctx,[{x:lerp(at.x,dt.x,t),y:lerp(at.y,dt.y,t)},
    {x:lerp(bt.x,ct.x,t),y:lerp(bt.y,ct.y,t)}],
    i===2?"rgba(8,26,31,.25)":"rgba(194,190,158,.19)",1);
 }
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
 // Acabamento da Baixada: canos, trincas e uma varanda de serviço.
 // Só ocupam a fachada do próprio prédio: a passagem segue legível.
 if(b.style==="housing"||b.style==="canal"||b.style==="depot"||
    b.style==="community"||b.style==="factory"){
  const t=.78,px=lerp(d.x,c.x,t),py=lerp(d.y,c.y,t);
  line(ctx,[{x:px,y:py-h+15},{x:px+2,y:py-25},{x:px-1,y:py-8}],
   "rgba(31,52,56,.84)",2.8);
  line(ctx,[{x:px+3,y:py-h+16},{x:px+4,y:py-22}],
   "rgba(198,163,126,.38)",.9);
  if(b.id.length%2===0){
   const bx=lerp(d.x,c.x,.26),by=lerp(d.y,c.y,.26);
   line(ctx,[{x:bx,y:by-19},{x:bx+4,y:by-25},
    {x:bx+7,y:by-22}],"rgba(26,42,44,.48)",1);
  }
 }
 if(b.style==="housing"&&b.height>=85){
  const x=lerp(d.x,c.x,.63),y=lerp(d.y,c.y,.63)-h*.48;
  shape(ctx,[{x:x-16,y},{x:x+12,y:y+11},
   {x:x+9,y:y+15},{x:x-18,y:y+4}],
   "rgba(74,86,77,.94)","rgba(226,203,164,.55)",.9);
  for(let i=0;i<4;i++)
   line(ctx,[{x:x-12+i*7,y:y-10+i*2.4},
     {x:x-12+i*7,y:y+i*2.4}],"rgba(24,38,43,.82)",1.7);
 }
 // Varais, cabos e tecido são parte da identidade da Baixada.
 // Tudo permanece contido na fachada do próprio prédio (sem bloquear ruas).
 if(paneled){
  const wireStart={x:lerp(d.x,c.x,.09),y:lerp(d.y,c.y,.09)-h*.52};
  const wireEnd={x:lerp(d.x,c.x,.88),y:lerp(d.y,c.y,.88)-h*.52};
  ctx.beginPath();ctx.moveTo(wireStart.x,wireStart.y);
  ctx.quadraticCurveTo((wireStart.x+wireEnd.x)/2,
    (wireStart.y+wireEnd.y)/2+7,wireEnd.x,wireEnd.y);
  ctx.strokeStyle="rgba(25,35,37,.9)";ctx.lineWidth=1.6;ctx.stroke();
  const fabrics=["#bd8976","#d9b98c","#6b9a9c","#997f75"];
  for(let i=0;i<3;i++){
   const t=(i+1)/4;
   const x=lerp(wireStart.x,wireEnd.x,t);
   const y=lerp(wireStart.y,wireEnd.y,t)+4;
   const length=10+(i%2)*4;
   shape(ctx,[{x:x-5,y},{x:x+5,y:y+1},
     {x:x+4,y:y+length+1},{x:x-4,y:y+length}],
     fabrics[(i+b.id.length)%fabrics.length]??"#bd8976",
     "rgba(13,30,34,.47)",.6);
  }
 }
 if(b.style==="community"){
  // Pintura comunitária na fachada, fiel à malha isométrica e à paleta tropical.
  const mx=lerp(d.x,c.x,.40),my=lerp(d.y,c.y,.40)-h*.48;
  shape(ctx,[{x:mx-19,y:my-9},{x:mx+17,y:my+3},
    {x:mx+17,y:my+20},{x:mx-19,y:my+8}],
    "rgba(44,75,81,.87)","rgba(232,184,114,.74)",1.2);
  ellipse(ctx,mx,my+1,6,6,"rgba(242,189,110,.95)");
  line(ctx,[{x:mx-12,y:my+5},{x:mx-3,y:my+11},{x:mx,y:my+9},
    {x:mx+4,y:my+13},{x:mx+13,y:my+9}],"rgba(203,217,205,.9)",2.1);
  for(let i=0;i<5;i++){
   const angle=-Math.PI*.75+i*Math.PI/6;
   line(ctx,[{x:mx+Math.cos(angle)*9,y:my+1+Math.sin(angle)*8},
     {x:mx+Math.cos(angle)*13,y:my+1+Math.sin(angle)*11}],
     "rgba(238,178,103,.83)",1.2);
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
 // Calha e suportes de toldo seguem o plano da fachada, sem portal falso.
 line(ctx,[{x:dt.x,y:dt.y+2},{x:ct.x,y:ct.y+2}],
   "rgba(32,52,56,.79)",2.2);
 if(b.style==="workshop"||b.style==="market"||b.style==="community"){
  const ax=lerp(d.x,c.x,.46),ay=lerp(d.y,c.y,.46)-37;
  for(let n=0;n<3;n++)
   line(ctx,[{x:ax-23+n*13,y:ay+5+n*3},
      {x:ax-19+n*13,y:ay+13+n*3}],"rgba(40,38,33,.45)",.9);
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
 // Ventilação improvisada, painéis e antenas acrescentam alturas distintas.
 if(b.style==="housing"||b.style==="community"||b.style==="depot"||
    b.style==="workshop"||b.style==="market"){
  shape(ctx,[{x:roofCenter.x-20,y:roofCenter.y-5},
    {x:roofCenter.x-1,y:roofCenter.y-14},
    {x:roofCenter.x+17,y:roofCenter.y-4},
    {x:roofCenter.x-2,y:roofCenter.y+5}],
   "#24434c","rgba(143,201,205,.46)",1);
  line(ctx,[{x:roofCenter.x-10,y:roofCenter.y-10},
    {x:roofCenter.x+7,y:roofCenter.y+1}],
   "rgba(149,213,220,.55)",1);
  line(ctx,[{x:roofCenter.x-2,y:roofCenter.y-14},
    {x:roofCenter.x-1,y:roofCenter.y+5}],
   "rgba(149,213,220,.36)",1);
 }
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
 if(b.style==="factory"||b.style==="utility"||b.style==="canal"){
  const mastX=roofCenter.x+26,mastY=roofCenter.y-7;
  line(ctx,[{x:mastX,y:mastY+5},{x:mastX,y:mastY-32}],
    "#25343a",3);
  line(ctx,[{x:mastX-13,y:mastY-22},{x:mastX+13,y:mastY-22}],
    "rgba(201,183,155,.85)",2);
  line(ctx,[{x:mastX-9,y:mastY-28},{x:mastX+9,y:mastY-16}],
    "rgba(36,49,55,.86)",1);
  ellipse(ctx,mastX,mastY-32,2.4,2.4,"#e9b47b");
 }
 // Fios da rede local prendem-se aos beirais, com pequena curvatura.
 if(b.style==="market"||b.style==="community"||b.style==="workshop"){
  const p1={x:d.x+3,y:d.y-h*.62},p2={x:c.x-4,y:c.y-h*.62};
  ctx.beginPath();ctx.moveTo(p1.x,p1.y);
  ctx.quadraticCurveTo((p1.x+p2.x)/2,(p1.y+p2.y)/2+9,p2.x,p2.y);
  ctx.strokeStyle="rgba(18,30,37,.92)";ctx.lineWidth=2;ctx.stroke();
  for(let i=1;i<5;i++){
   const t=i/5;
   const px=lerp(p1.x,p2.x,t),py=lerp(p1.y,p2.y,t)+6;
   ctx.fillStyle=i%2?"#e7b47a":"#8ea9b0";
   ctx.fillRect(px-2,py,4,3);
  }
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
  // Filete luminoso legível em baixa resolução, sem filtro blur pesado.
  ctx.fillStyle=rgba(b.accent,.8);
  ctx.fillRect(labelX-37,labelY+6,74,1.5);
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
