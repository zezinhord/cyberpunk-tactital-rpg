import {useEffect,useRef,useState} from "react";
import {ACTOR_TILES,BUILDINGS,GRID_HEIGHT,GRID_WIDTH,PLAYER_START,PROPS,ROAMING_NPCS,
  sectorAt,isStreet,isIndustrialSector,isCommercialSector,type Tile,type SectorId,
  type BuildingSpec} from "../game/baixada/layout";
import {paintCityBackground,drawCityBuilding,drawCityProp,tileWorld,
  type PropKind,type Point} from "../game/baixada/lite-city-art";
import {createLiteArtAssets,drawLiteSprite,LONG_NPC_SHEETS,type LiteArtAssets} from "../game/baixada/lite-art-assets";
import {canStand,route,approachRoute} from "../game/baixada/navigation";
import {smoothCamera,interpolateWalk} from "../game/baixada/motion";
import {loadWorldLocation,saveWorldLocation} from "../game/baixada/location";
import type {OriginId} from "../game/character";
import type {TestAppearance} from "../game/test-arena/appearance";

interface Props{
 onInteract:(id:string)=>void;
 originId:OriginId;appearance:TestAppearance;characterId:string;
 onSectorChange?:(sector:SectorId)=>void;
 onNearbyAccess?:(actorId:string|null)=>void;
}
const ACTORS:ReadonlyArray<{id:string;tile:Tile;label:string;person:boolean}>= [
 {id:"vendedor",tile:ACTOR_TILES.vendedor,label:"NILO",person:true},
 {id:"moradora",tile:ACTOR_TILES.moradora,label:"JOANA",person:true},
 {id:"saira",tile:ACTOR_TILES.saira,label:"SAIRA",person:true},
 {id:"enter-clinic",tile:ACTOR_TILES["enter-clinic"],label:"CLÍNICA",person:false},
 {id:"enter-workshop",tile:ACTOR_TILES["enter-workshop"],label:"OFICINA",person:false},
 {id:"enter-canal-gallery",tile:ACTOR_TILES["enter-canal-gallery"],label:"GALERIA",person:false},
 {id:"terminal-canal",tile:ACTOR_TILES["terminal-canal"],label:"TERMINAL",person:false},
 {id:"patio-console",tile:ACTOR_TILES["patio-console"],label:"CONSOLE V-09",person:false},
 {id:"patio-sentinel",tile:ACTOR_TILES["patio-sentinel"],label:"SENTINELA",person:true},
 {id:"feira-corretor",tile:ACTOR_TILES["feira-corretor"],label:"DAVI",person:true},
 {id:"feira-ajuda",tile:ACTOR_TILES["feira-ajuda"],label:"MARTA",person:true},
 {id:"feira-archive",tile:ACTOR_TILES["feira-archive"],label:"BOLETINS",person:false},
 {id:"enter-sewer-drain",tile:ACTOR_TILES["enter-sewer-drain"],label:"ESGOTO -01",person:false},
 {id:"enter-sewer-deep",tile:ACTOR_TILES["enter-sewer-deep"],label:"ESGOTO -02",person:false},
 {id:"enter-ferrugem",tile:ACTOR_TILES["enter-ferrugem"],label:"FERRUGEM",person:false},
 {id:"enter-city-transit",tile:ACTOR_TILES["enter-city-transit"],label:"TRANSPORTE",person:false},
 ...ROAMING_NPCS.map(n=>({id:n.id,tile:n.route[0],label:n.name.toUpperCase(),person:true})),
];
const TILE_W=48,TILE_H=24,ORIGIN_X=850,ORIGIN_Y=135;
const center=(p:Tile):{x:number;y:number}=>({
 x:ORIGIN_X+(p.x-p.y)*TILE_W/2,
 y:ORIGIN_Y+(p.x+p.y)*TILE_H/2,
});
const ACCESS=["enter-sewer-drain","enter-sewer-deep","enter-ferrugem","enter-city-transit"] as const;
const distance=(a:Tile,b:Tile):number=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
type Step={from:Tile;to:Tile;start:number;duration:number};
type Motion={position:Tile;steps:Tile[];step:Step|null;pendingActor:string|null};
type View={width:number;height:number;zoom:number;offsetX:number;offsetY:number};
function getView(width:number,height:number,world:{x:number;y:number}):View{
 const zoom=Math.max(.76,Math.min(1.22,Math.min(width/930,height/475)*1.08));
 return {width,height,zoom,offsetX:width/2-world.x*zoom,
  offsetY:height*.53-world.y*zoom};
}
function project(view:View,p:{x:number;y:number}):{x:number;y:number}{
 return {x:view.offsetX+p.x*view.zoom,y:view.offsetY+p.y*view.zoom};
}
function diamond(ctx:CanvasRenderingContext2D,p:{x:number;y:number},zoom:number,
 fill:string,stroke:string):void{
 const a=24*zoom,b=12*zoom;
 ctx.beginPath();ctx.moveTo(p.x,p.y-b);ctx.lineTo(p.x+a,p.y);
 ctx.lineTo(p.x,p.y+b);ctx.lineTo(p.x-a,p.y);ctx.closePath();
 ctx.fillStyle=fill;ctx.fill();
 ctx.lineWidth=.8;ctx.strokeStyle=stroke;ctx.stroke();
}
/** Elementos ordenados por profundidade, construídos uma única vez.
 * O primeiro plano cobre os objetos ao fundo como no Phaser original.
 */
type DrawLayer=
 |{kind:"building";depth:number;pos:Point;building:BuildingSpec}
 |{kind:"prop";depth:number;pos:Point;tile:Tile;prop:PropKind}
 |{kind:"actor";depth:number;pos:Point;actor:(typeof ACTORS)[number]};
const ACTOR_SKIN:Readonly<Record<string,string>>={
 vendedor:"nilo",moradora:"joana",saira:"saira",
 "patio-sentinel":"teo","feira-corretor":"davi","feira-ajuda":"marta",
 lia:"lia",ramon:"ramon",duda:"duda",iza:"iza",tomas:"tomas",
};

/** A Baixada Android não cria Phaser.Game, WebGL, atlases nem texturas
 * 1960×1160. Usa somente um canvas com dimensões limitadas e renderização
 * sob demanda. A lógica de caminhada/colisão é a MESMA do Phaser.
 */
export default function BaixadaLiteWorld({onInteract,originId,appearance,characterId,
  onSectorChange,onNearbyAccess}:Props){
 const hostRef=useRef<HTMLDivElement>(null);
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const callbacks=useRef({onInteract,onSectorChange,onNearbyAccess});
 callbacks.current={onInteract,onSectorChange,onNearbyAccess};
 const presentation=useRef(appearance);
 presentation.current=appearance;
 const [status,setStatus]=useState<"loading"|"ready"|"failed">("loading");
 const [error,setError]=useState("");
 const [reboot,setReboot]=useState(0);
 const scene=useRef<{
   go:(tile:Tile,actor?:string)=>void;frame:()=>void;
 }|null>(null);
 useEffect(()=>{
  const host=hostRef.current,canvas=canvasRef.current;
  if(!host||!canvas)return;
  let disposed=false,context:CanvasRenderingContext2D|null=null;
  let frameId=0,painted=false,lastSave=0,lastRender=0,lastTick=0,suspendedAt=0;
  let width=0,height=0;
  let motion:Motion={
   position:loadWorldLocation(characterId),steps:[],step:null,pendingActor:null,
  };
  if(!canStand(motion.position))motion.position={...PLAYER_START};
  let renderPosition:{x:number;y:number}=center(motion.position);
  let cameraPosition:{x:number;y:number}={...renderPosition};
  let view=getView(900,440,cameraPosition);
  let marker:Tile|null=null;
  const actorById=new Map(ACTORS.map(a=>[a.id,a]));
  let art:LiteArtAssets|null=null;
  let facing:0|1|2|3=2;
  const layers:DrawLayer[]=[
    ...BUILDINGS.map(b=>({
      kind:"building" as const,building:b,
      pos:tileWorld({x:b.x+b.width,y:b.y+b.depth}),
      depth:tileWorld({x:b.x+b.width,y:b.y+b.depth}).y+.04,
    })),
    ...(Object.keys(PROPS) as PropKind[]).flatMap(prop=>
      PROPS[prop].map(tile=>({kind:"prop" as const,prop,tile,pos:tileWorld(tile),
        depth:tileWorld(tile).y+.12}))),
    ...ACTORS.map(actor=>({kind:"actor" as const,actor,
      pos:tileWorld(actor.tile),depth:tileWorld(actor.tile).y+.2})),
  ].sort((a,b)=>a.depth-b.depth);
  const notify=(tile:Tile,settled:boolean)=>{
   const now=Date.now();
   if(settled||now-lastSave>=1200){
    saveWorldLocation(characterId,tile);
    lastSave=now;
   }
   callbacks.current.onSectorChange?.(sectorAt(tile));
   const near=ACCESS.find(id=>distance(tile,ACTOR_TILES[id])<=2);
   callbacks.current.onNearbyAccess?.(near??null);
  };
  const paint=()=>{
   if(!context||disposed)return;
   const ctx=context;
   ctx.setTransform(canvas.width/Math.max(1,width),0,0,
     canvas.height/Math.max(1,height),0,0);
   ctx.fillStyle="#12212b";ctx.fillRect(0,0,width,height);
   paintCityBackground(ctx,width,height);
   // Segue a posição interpolada do avatar para caminhar sem saltos de câmera.
   view=getView(width,height,cameraPosition);
   // Continuidade urbana além da borda física do mapa.
   // É SOMENTE decoração: canStand() continua proibindo sair do grid.
   // Inverter a projeção limita o laço aos losangos efetivamente visíveis,
   // evitando varrer milhares de tiles fora da tela em Android de entrada.
   const screenTile=(px:number,py:number):Tile=>{
     const wx=(px-view.offsetX)/view.zoom;
     const wy=(py-view.offsetY)/view.zoom;
     const rx=(wx-ORIGIN_X)/(TILE_W/2),ry=(wy-ORIGIN_Y)/(TILE_H/2);
     return {x:(rx+ry)/2,y:(ry-rx)/2};
   };
   const bounds=[screenTile(-80,-90),screenTile(width+80,-90),
     screenTile(-80,height+90),screenTile(width+80,height+90)];
   const minX=Math.max(-35,Math.floor(Math.min(...bounds.map(v=>v.x)))-2);
   const maxX=Math.min(GRID_WIDTH+35,Math.ceil(Math.max(...bounds.map(v=>v.x)))+2);
   const minY=Math.max(-35,Math.floor(Math.min(...bounds.map(v=>v.y)))-2);
   const maxY=Math.min(GRID_HEIGHT+35,Math.ceil(Math.max(...bounds.map(v=>v.y)))+2);
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
     const p=project(view,center({x,y}));
     if(p.x< -50||p.x>width+50||p.y< -45||p.y>height+45)continue;
     const outside=x<0||y<0||x>=GRID_WIDTH||y>=GRID_HEIGHT;
     const industrial=isIndustrialSector({x,y});
     const commercial=isCommercialSector({x,y});
     const road=!outside&&isStreet({x,y});
     const shade=((x*7+y*11)%5+5)%5;
     const palette=outside
       ? ["#2b3739","#303b3b","#34403f","#303d3d","#2d393b"]
       : commercial
       ? road?["#534c44","#554a41","#594f44","#53463d","#514941"]:
         ["#6b6152","#6d6253","#665d4e","#716253","#686052"]
       : industrial
       ? road?["#393e40","#394044","#3f4242","#363e41","#414849"]:
         ["#514d44","#555247","#4c4d48","#54504a","#524e46"]
       : road?["#424846","#3d4747","#404b48","#424846","#3e4747"]:
         ["#475046","#424c45","#4a4e43","#485046","#435048"];
     diamond(ctx,p,view.zoom,palette[shade]??"#424846",
       outside?"rgba(93,119,119,.1)":"rgba(108,130,121,.19)");
     if(outside){
       // Pavimento de continuidade mais apagado, sem indicar nova rota.
       if((x*13+y*7)%29===0){
         ctx.strokeStyle="rgba(164,148,127,.13)";ctx.lineWidth=.8;
         ctx.beginPath();ctx.moveTo(p.x-7*view.zoom,p.y);
         ctx.lineTo(p.x+5*view.zoom,p.y+3*view.zoom);ctx.stroke();
       }
       continue;
     }
     if(!road&&shade===2&&canStand({x,y})){
       ctx.fillStyle="rgba(174,191,162,.12)";
       ctx.fillRect(p.x-6*view.zoom,p.y+1*view.zoom,12*view.zoom,2*view.zoom);
     }
     if(road&&(x+y)%7===0){
       // Pintura desgastada: a rua permanece legível sem cobrir o piso.
       ctx.strokeStyle="rgba(239,204,132,.48)";
       ctx.lineWidth=Math.max(.7,view.zoom);
       ctx.beginPath();ctx.moveTo(p.x-7*view.zoom,p.y+3*view.zoom);
       ctx.lineTo(p.x+7*view.zoom,p.y+3*view.zoom);ctx.stroke();
     }
     // Reflexos de chuva tropical, remendos e drenos procedurais estáticos.
     // Calculados só para os tiles visíveis: nenhum shader, filtro ou textura
     // 1960×1160 armazenada no aparelho.
     if(road&&(x*11+y*13)%17===0){
       ctx.beginPath();
       ctx.ellipse(p.x+2*view.zoom,p.y+4*view.zoom,
         11*view.zoom,3.2*view.zoom,-.08,0,Math.PI*2);
       ctx.fillStyle="rgba(101,174,181,.22)";ctx.fill();
       ctx.strokeStyle="rgba(196,205,179,.18)";
       ctx.lineWidth=.8;ctx.stroke();
     }
     if(road&&(x*7+y*3)%23===0){
       ctx.strokeStyle="rgba(15,28,32,.63)";ctx.lineWidth=2*view.zoom;
       ctx.beginPath();ctx.moveTo(p.x-7*view.zoom,p.y-1*view.zoom);
       ctx.lineTo(p.x+5*view.zoom,p.y+4*view.zoom);ctx.stroke();
       ctx.strokeStyle="rgba(229,167,101,.37)";ctx.lineWidth=.8;
       ctx.beginPath();ctx.moveTo(p.x-5*view.zoom,p.y+1*view.zoom);
       ctx.lineTo(p.x+8*view.zoom,p.y+5*view.zoom);ctx.stroke();
     }
     if(!road&&(x*5+y*9)%19===0){
       ctx.strokeStyle="rgba(187,159,110,.3)";ctx.lineWidth=.9;
       ctx.beginPath();ctx.moveTo(p.x-6*view.zoom,p.y-2*view.zoom);
       ctx.lineTo(p.x+3*view.zoom,p.y+2*view.zoom);ctx.stroke();
     }
   }
   // Renderização Canvas 2D da mesma arquitetura, sprites e props Phaser.
   // A câmera e a projeção compartilham a geometria do mapa original;
   // não há textura única gigantesca nem carregamento de sprites ociosos.
   const visible=layers.filter(layer=>{
     const p=project(view,layer.pos);
     return p.x>=-205&&p.x<=width+205&&p.y>=-245&&p.y<=height+215;
   });
   ctx.save();
   ctx.translate(view.offsetX,view.offsetY);
   ctx.scale(view.zoom,view.zoom);
   const drawHero=()=>{
     const x=renderPosition.x,y=renderPosition.y;
     ctx.fillStyle="rgba(3,11,17,.6)";
     ctx.beginPath();ctx.ellipse(x,y+3,17,6,0,0,Math.PI*2);ctx.fill();
     const walking=motion.step!==null;
     const frame=walking?Math.floor(performance.now()/126)%4:0;
     const original=drawLiteSprite(ctx,art?.player(presentation.current)??null,x,y,
       {scale:.94,direction:facing,frame,columns:12});
     host.dataset.heroSprite=original?"loaded":"pending";
     if(!original){
       // Silhueta apenas durante o download local da skin do próprio APK.
       ctx.fillStyle="#00a9ba";ctx.fillRect(x-8,y-32,16,25);
       ctx.fillStyle="#bb9070";ctx.fillRect(x-6,y-42,12,12);
     }
     ctx.strokeStyle="#00d7f0";ctx.lineWidth=1.7;
     ctx.beginPath();ctx.ellipse(x,y+2,17,8,0,0,Math.PI*2);ctx.stroke();
   };
   const drawActor=(actor:(typeof ACTORS)[number])=>{
     const p=tileWorld(actor.tile),x=p.x,y=p.y;
     ctx.fillStyle="rgba(4,13,19,.5)";
     ctx.beginPath();ctx.ellipse(x,y+2,14,4,0,0,Math.PI*2);ctx.fill();
     const skin=ACTOR_SKIN[actor.id];
     if(actor.person){
       const drawn=drawLiteSprite(ctx,skin?art?.npc(skin)??null:null,x,y,
         {scale:.86,direction:2,frame:0,
          columns:skin&&LONG_NPC_SHEETS.has(skin)?12:4});
       if(!drawn){
         ctx.fillStyle=actor.id==="patio-sentinel"?"#9b4a67":"#59838c";
         ctx.fillRect(x-8,y-31,16,26);
         ctx.fillStyle="#d3aa88";ctx.fillRect(x-6,y-41,12,11);
       }
       if(actor.id==="patio-sentinel"){
         ctx.strokeStyle="#ff5c92";ctx.lineWidth=1.8;
         ctx.beginPath();ctx.ellipse(x,y,14,7,0,0,Math.PI*2);ctx.stroke();
       }
     }else if(actor.id==="enter-sewer-drain"||actor.id==="enter-sewer-deep"){
       // Bocas de drenagem niveladas com o asfalto, não portas no vazio.
       ctx.fillStyle="rgba(3,10,14,.6)";
       ctx.beginPath();ctx.ellipse(x,y+2,22,10,0,0,Math.PI*2);ctx.fill();
       ctx.fillStyle="#273b40";ctx.beginPath();
       ctx.ellipse(x,y-1,20,9,0,0,Math.PI*2);ctx.fill();
       ctx.strokeStyle="#e4b273";ctx.lineWidth=2;
       ctx.beginPath();ctx.ellipse(x,y-1,20,9,0,0,Math.PI*2);ctx.stroke();
       ctx.strokeStyle="rgba(171,193,186,.7)";ctx.lineWidth=1.7;
       for(let i=-2;i<=2;i++){
         ctx.beginPath();ctx.moveTo(x-11+i*5,y-5);
         ctx.lineTo(x-11+i*5,y+4);ctx.stroke();
       }
       ctx.fillStyle="#e4b273";ctx.fillRect(x-3,y-17,6,3);
     }else if(actor.id==="enter-city-transit"){
       // Quiosque de transporte com pedestal, tela e marcador de rota.
       ctx.fillStyle="#152930";ctx.fillRect(x-18,y-49,36,46);
       ctx.fillStyle="#4a5d5e";ctx.fillRect(x-14,y-44,28,31);
       ctx.fillStyle="#a6b5a5";ctx.fillRect(x-11,y-41,22,20);
       ctx.fillStyle="#253d47";ctx.fillRect(x-9,y-39,18,16);
       ctx.strokeStyle="#e9b676";ctx.lineWidth=2;
       ctx.strokeRect(x-18,y-49,36,46);
       ctx.fillStyle="#e9b676";ctx.fillRect(x-15,y-55,30,6);
       ctx.fillStyle="#f5d5a2";ctx.font="bold 7px monospace";
       ctx.textAlign="center";ctx.fillText("NA // 07",x,y-51);
       ctx.fillStyle="#8bc1c8";ctx.fillRect(x-6,y-36,12,2);
       for(let i=0;i<3;i++)ctx.fillRect(x-7+i*6,y-31,3,4);
       ctx.fillStyle="#34494b";ctx.fillRect(x-22,y-3,44,6);
       ctx.textAlign="start";
     }else if(actor.id==="enter-ferrugem"){
       // Pórtico industrial de passagem, com sinalização de risco.
       ctx.fillStyle="#29373a";
       ctx.fillRect(x-23,y-49,7,49);ctx.fillRect(x+16,y-49,7,49);
       ctx.fillRect(x-23,y-49,46,8);
       ctx.strokeStyle="#cfa069";ctx.lineWidth=2;
       ctx.strokeRect(x-23,y-49,46,8);
       for(let i=0;i<5;i++){
         ctx.fillStyle=i%2?"#17232a":"#e0a96c";
         ctx.fillRect(x-18+i*8,y-48,7,5);
       }
       ctx.strokeStyle="rgba(196,206,193,.5)";
       ctx.beginPath();ctx.moveTo(x-15,y-13);ctx.lineTo(x+15,y-13);
       ctx.stroke();
       ctx.fillStyle="#e0b47a";ctx.fillRect(x-11,y-36,22,3);
     }else if(actor.id==="feira-archive"){
       // Painel de boletins comunitários no Mercado dos Cabos.
       ctx.fillStyle="#1a3036";ctx.fillRect(x-20,y-42,40,38);
       ctx.strokeStyle="#d2aa76";ctx.lineWidth=2;
       ctx.strokeRect(x-20,y-42,40,38);
       ctx.fillStyle="#d9bd94";ctx.fillRect(x-16,y-37,14,22);
       ctx.fillStyle="#a2b0a5";ctx.fillRect(x+1,y-34,14,17);
       ctx.fillStyle="#6b4b4b";ctx.fillRect(x+4,y-29,9,2);
       ctx.fillStyle="#3e5154";ctx.fillRect(x-12,y-32,6,2);
       ctx.fillStyle="#c99466";ctx.fillRect(x-10,y-24,6,3);
       ctx.fillStyle="#28383e";ctx.fillRect(x-16,y-4,4,9);
       ctx.fillRect(x+12,y-4,4,9);
     }else if(/terminal|console/.test(actor.id)){
       // Console inclinado com monitor e teclado, sem portal fictício.
       ctx.fillStyle="#192c32";ctx.fillRect(x-14,y-28,28,23);
       ctx.fillStyle="#354a50";ctx.fillRect(x-18,y-43,36,27);
       ctx.strokeStyle="#eab879";ctx.lineWidth=2;
       ctx.strokeRect(x-18,y-43,36,27);
       ctx.fillStyle="#83b2b9";ctx.fillRect(x-14,y-39,28,17);
       ctx.fillStyle="#1c3a44";ctx.fillRect(x-12,y-37,24,13);
       ctx.fillStyle="#e6c08d";
       for(let i=0;i<3;i++)ctx.fillRect(x-9,y-33+i*4,15-i*3,1);
       ctx.fillStyle="#a58565";ctx.fillRect(x-16,y-14,32,5);
     }else{
       // Portas de acesso com soleira física e cobertura contextual.
       ctx.fillStyle="#323d3c";ctx.fillRect(x-17,y-5,34,7);
       ctx.fillStyle="#1b3036";ctx.fillRect(x-12,y-37,24,33);
       ctx.strokeStyle="#e4b273";ctx.lineWidth=1.7;
       ctx.strokeRect(x-12,y-37,24,33);
       ctx.fillStyle="#506769";ctx.fillRect(x-9,y-34,18,27);
       ctx.fillStyle="#14282f";ctx.fillRect(x-7,y-32,14,25);
       ctx.fillStyle="#e9b976";ctx.fillRect(x+3,y-20,3,4);
       ctx.fillStyle="#ac805a";ctx.fillRect(x-16,y-42,32,6);
       ctx.strokeStyle="#e4b273";ctx.strokeRect(x-16,y-42,32,6);
     }
     if(distance(motion.position,actor.tile)<=3){
       const label=actor.label;
       ctx.font="bold 10px monospace";
       const labelWidth=ctx.measureText(label).width;
       ctx.fillStyle="rgba(11,26,32,.94)";
       ctx.fillRect(x-labelWidth/2-6,y-65,labelWidth+12,17);
       ctx.strokeStyle=actor.id==="patio-sentinel"?"#e85e89":"rgba(238,182,109,.61)";
       ctx.lineWidth=.9;ctx.strokeRect(x-labelWidth/2-6,y-65,labelWidth+12,17);
       ctx.textAlign="center";ctx.textBaseline="middle";
       ctx.fillStyle="#f0e6d2";ctx.fillText(label,x,y-56);
       ctx.textAlign="start";ctx.textBaseline="alphabetic";
     }
   };
   if(marker){
     const m=tileWorld(marker);
     ctx.strokeStyle="#ecc78c";ctx.lineWidth=1.7;
     ctx.beginPath();ctx.ellipse(m.x,m.y,12,6,0,0,Math.PI*2);ctx.stroke();
   }
   let heroDrawn=false;
   for(const layer of visible){
     if(!heroDrawn&&renderPosition.y<=layer.depth){
       drawHero();heroDrawn=true;
     }
     if(layer.kind==="building")drawCityBuilding(ctx,layer.building);
     else if(layer.kind==="prop"&&art)drawCityProp(ctx,layer.prop,layer.tile,art);
     else if(layer.kind==="actor")drawActor(layer.actor);
   }
   if(!heroDrawn)drawHero();
   ctx.restore();
   if(!painted){painted=true;setStatus("ready");setError("");}
  };
  const schedule=()=>{
   if(disposed||frameId||document.hidden)return;
   frameId=requestAnimationFrame((now)=>{frameId=0;tick(now);});
  };
  const startStep=(now:number)=>{
    const next=motion.steps.shift();
    if(!next){
      motion.step=null;marker=null;
      notify(motion.position,true);
      const actor=motion.pendingActor;
      motion.pendingActor=null;
      if(actor&&distance(motion.position,actorById.get(actor)?.tile??motion.position)<=1)
        callbacks.current.onInteract(actor);
      return;
    }
    const dx=next.x-motion.position.x,dy=next.y-motion.position.y;
    facing=dy<0?0:dx>0?1:dy>0?2:3;
    motion.step={from:{...motion.position},to:next,start:now,
      duration:dx!==0&&dy!==0?195:150};
  };
  const tick=(now:number)=>{
    if(disposed)return;
    const deltaMs=lastTick?Math.max(0,Math.min(64,now-lastTick)):16.67;
    lastTick=now;
    if(motion.step){
      const step=motion.step;
      const portion=Math.max(0,Math.min(1,(now-step.start)/step.duration));
      const a=center(step.from),b=center(step.to);
      renderPosition=interpolateWalk(a,b,now-step.start,step.duration);
      if(portion>=1){
        motion.position=step.to;
        renderPosition=center(motion.position);
        motion.step=null;
        notify(motion.position,false);
        startStep(now);
      }
    }
    cameraPosition=smoothCamera(cameraPosition,renderPosition,deltaMs);
    const cameraMoving=Math.abs(cameraPosition.x-renderPosition.x)>0.35||
      Math.abs(cameraPosition.y-renderPosition.y)>0.35;
    // Não desenha 60 vezes/s em Android econômico: mantemos interpolação
    // contínua e renderizamos até 30 FPS, sem GPU nem bitmaps full-world.
    // Ao terminar a caminhada pintamos sempre a posição final, mesmo que
    // o próximo frame ocorra antes de 33 ms.
    if(now-lastRender>=33||!painted||(!motion.step&&!cameraMoving)){
     lastRender=now;
     try{paint();}catch(e){
      setStatus("failed");setError("O desenho leve encontrou um erro: "+String(e).slice(0,95));
      return;
     }
    }
    if(motion.step||cameraMoving)schedule();
  };
  const go=(destination:Tile,actor?:string)=>{
    const start=motion.step?.to??motion.position;
    const target=actor?actorById.get(actor)?.tile:null;
    const path=target?approachRoute(start,target):route(start,destination);
    if(!path)return;
    motion.steps=path.slice(1);
    motion.pendingActor=actor??null;
    marker=target??destination;
    if(!motion.step)startStep(performance.now());
    schedule();
  };
  const sizing=()=>{
    if(disposed)return;
    width=Math.max(320,host.clientWidth||900);
    height=Math.max(250,host.clientHeight||440);
    // 1280×720px máximo: nenhum atlas full-world 1960×1160 ou WebGL.
    const ratio=Math.min(1.25,1280/width,720/height,
      Math.max(1,window.devicePixelRatio||1));
    const nextWidth=Math.max(320,Math.floor(width*ratio));
    const nextHeight=Math.max(250,Math.floor(height*ratio));
    // Alterar canvas.width/height APAGA todo o framebuffer, mesmo quando o
    // tamanho é idêntico. ResizeObserver costuma disparar mais de uma vez
    // por frame no WebView e deixava a cena uniformemente preta.
    if(canvas.width!==nextWidth||canvas.height!==nextHeight){
      canvas.width=nextWidth;canvas.height=nextHeight;
      // Desenhar imediatamente após reset evita frame em branco.
      paint();
    }else if(!painted)paint();
    schedule();
  };
  const pointer=(event:PointerEvent)=>{
    event.preventDefault();
    const bounds=canvas.getBoundingClientRect();
    const point={x:event.clientX-bounds.left,y:event.clientY-bounds.top};
    // Hit testing MUST use the camera that rendered the last frame.
    // The smoothed camera lags behind the avatar while walking; using
    // renderPosition targets a different tile from the one the player taps.
    const v=getView(width,height,cameraPosition);
    const nearest=ACTORS.map(a=>({a,p:project(v,center(a.tile))}))
      .filter(({p})=>Math.abs(point.x-p.x)<36&&point.y>p.y-76&&point.y<p.y+18)
      .sort((a,b)=>Math.abs(a.p.x-point.x)+Math.abs(a.p.y-28-point.y)-
         Math.abs(b.p.x-point.x)-Math.abs(b.p.y-28-point.y))[0];
    if(nearest){go(motion.position,nearest.a.id);return;}
    const realX=(point.x-v.offsetX)/v.zoom;
    const realY=(point.y-v.offsetY)/v.zoom;
    const rx=(realX-ORIGIN_X)/(TILE_W/2);
    const ry=(realY-ORIGIN_Y)/(TILE_H/2);
    const target={x:Math.round((rx+ry)/2),y:Math.round((ry-rx)/2)};
    if(canStand(target))go(target);
  };
  const keydown=(event:KeyboardEvent)=>{
    const dirs:Record<string,Tile>={
     arrowup:{x:0,y:-1},w:{x:0,y:-1},
     arrowright:{x:1,y:0},d:{x:1,y:0},
     arrowdown:{x:0,y:1},s:{x:0,y:1},
     arrowleft:{x:-1,y:0},a:{x:-1,y:0},
    };
    const d=dirs[event.key.toLowerCase()];if(!d)return;
    event.preventDefault();
    const start=motion.steps.at(-1)??motion.step?.to??motion.position;
    const target={x:start.x+d.x,y:start.y+d.y};
    if(canStand(target))go(target);
  };
  let observer:ResizeObserver|null=null;
  const visibility=()=>{
    if(document.hidden){
      suspendedAt=performance.now();
      if(frameId)cancelAnimationFrame(frameId);
      frameId=0;
    }else{
      // Animação congela enquanto aplicativo está em segundo plano.
      if(suspendedAt&&motion.step)
        motion.step.start+=Math.max(0,performance.now()-suspendedAt);
      suspendedAt=0;lastTick=0;schedule();
    }
  };
  const watchdog=setTimeout(()=>{
    if(disposed||painted)return;
    setStatus("failed");
    setError("A tela não conseguiu desenhar o primeiro quadro. Use Tentar abrir novamente.");
  },6000);
  try{
    context=canvas.getContext("2d",{alpha:false});
    if(!context)throw new Error("Canvas 2D indisponível neste Android");
    notify(motion.position,true);
    canvas.addEventListener("pointerdown",pointer,{passive:false});
    window.addEventListener("keydown",keydown);
    document.addEventListener("visibilitychange",visibility);
    if(typeof ResizeObserver!=="undefined"){
      observer=new ResizeObserver(sizing);observer.observe(host);
    }else window.addEventListener("resize",sizing);
    scene.current={go,frame:schedule};
    art=createLiteArtAssets(originId,()=>{
      if(disposed)return;
      host.dataset.artLoaded=String(art?.loaded()??0);
      host.dataset.artReady=art?.ready()?"true":"false";
      schedule();
    });
    host.dataset.artLoaded=String(art.loaded());
    host.dataset.artReady=art.ready()?"true":"false";
    sizing();
  }catch(e){
    setStatus("failed");
    setError("O mapa leve não pôde ser aberto: "+String(e).slice(0,95));
  }
  return ()=>{
    disposed=true;
    if(frameId)cancelAnimationFrame(frameId);
    clearTimeout(watchdog);
    observer?.disconnect();
    window.removeEventListener("resize",sizing);
    canvas.removeEventListener("pointerdown",pointer);
    window.removeEventListener("keydown",keydown);
    document.removeEventListener("visibilitychange",visibility);
    scene.current=null;
    art?.dispose();
    // Preservar o último tile confirmado mesmo após fechamento inesperado.
    notify(motion.position,true);
  };
 },[characterId,originId,reboot]);
 useEffect(()=>{scene.current?.frame();},[appearance]);
 const restart=()=>{setStatus("loading");setError("");setReboot(n=>n+1);};
 return <div className="baixada-world na-world-host" ref={hostRef}
   data-renderer="canvas" data-engine="native-2d"
   data-art-style="restored-phaser" data-scene-state={status}
   aria-label="Mapa leve e interativo da Baixada em Android">
   <canvas ref={canvasRef} tabIndex={0} style={{width:"100%",height:"100%",
     display:"block",touchAction:"none"}} aria-label="Toque no chão para caminhar; toque nos habitantes e terminais para interagir"/>
   {status==="loading"&&<div className="na-world-startup" role="status">
      <strong>Preparando mapa leve da Baixada</strong>
      <span>Desenho local sem Phaser ou WebGL. Seus dados estão preservados.</span>
   </div>}
   {status==="failed"&&<div className="na-world-startup" role="alert">
     <strong>Falha no mapa leve da Baixada</strong><span>{error}</span>
     <button type="button" onClick={restart}>Tentar abrir novamente</button>
   </div>}
 </div>;
}
