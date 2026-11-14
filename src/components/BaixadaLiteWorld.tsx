import {useEffect,useRef,useState} from "react";
import {ACTOR_TILES,BUILDINGS,GRID_HEIGHT,GRID_WIDTH,PLAYER_START,PROPS,
  sectorAt,isStreet,isIndustrialSector,isCommercialSector,type Tile,type SectorId} from "../game/baixada/layout";
import {canStand,route,approachRoute} from "../game/baixada/navigation";
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
function isoBlock(ctx:CanvasRenderingContext2D,p:{x:number;y:number},zoom:number,
 width:number,depth:number,height:number,roof:string,wall:string):void{
 const w=width*24*zoom,h=depth*12*zoom,up=Math.max(27,height*.65)*zoom;
 const left={x:p.x-w,y:p.y},right={x:p.x+w,y:p.y};
 const top={x:p.x,y:p.y-h},bottom={x:p.x,y:p.y+h};
 ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(bottom.x,bottom.y);
 ctx.lineTo(bottom.x,bottom.y-up);ctx.lineTo(left.x,left.y-up);ctx.closePath();
 ctx.fillStyle=wall;ctx.fill();
 ctx.beginPath();ctx.moveTo(bottom.x,bottom.y);ctx.lineTo(right.x,right.y);
 ctx.lineTo(right.x,right.y-up);ctx.lineTo(bottom.x,bottom.y-up);ctx.closePath();
 ctx.fillStyle="#263b41";ctx.fill();
 ctx.beginPath();ctx.moveTo(top.x,top.y-up);ctx.lineTo(right.x,right.y-up);
 ctx.lineTo(bottom.x,bottom.y-up);ctx.lineTo(left.x,left.y-up);ctx.closePath();
 ctx.fillStyle=roof;ctx.fill();
 ctx.strokeStyle="rgba(232,189,136,.36)";ctx.lineWidth=1;ctx.stroke();
}
/** A Baixada Android não cria Phaser.Game, WebGL, atlases nem texturas
 * 1960×1160. Usa somente um canvas com dimensões limitadas e renderização
 * sob demanda. A lógica de caminhada/colisão é a MESMA do Phaser.
 */
export default function BaixadaLiteWorld({onInteract,appearance,characterId,
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
  let frameId=0,painted=false,lastSave=0,lastTick=0;
  let width=0,height=0;
  let motion:Motion={
   position:loadWorldLocation(characterId),steps:[],step:null,pendingActor:null,
  };
  if(!canStand(motion.position))motion.position={...PLAYER_START};
  let renderPosition:{x:number;y:number}=center(motion.position);
  let view=getView(900,440,renderPosition);
  let marker:Tile|null=null;
  const actorById=new Map(ACTORS.map(a=>[a.id,a]));
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
   // Distância e relevo: uma paisagem própria, mesmo com economia de memória.
   const sky=ctx.createLinearGradient(0,0,0,height);
   sky.addColorStop(0,"#132936");sky.addColorStop(.55,"#314042");
   sky.addColorStop(1,"#3b3835");
   ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
   ctx.fillStyle="rgba(238,162,89,.15)";
   ctx.beginPath();ctx.arc(width*.72,height*.22,74,0,Math.PI*2);ctx.fill();
   for(let i=0;i<18;i++){
     const x=(i*91+32)%(width+70);
     ctx.fillStyle=i%3===0?"rgba(15,31,36,.75)":"rgba(28,48,53,.78)";
     ctx.fillRect(x,height*.28-35-(i*29)%77,45+(i%3)*12,height*.42);
   }
   // Segue a posição interpolada do avatar para caminhar sem saltos de câmera.
   view=getView(width,height,renderPosition);
   for(let y=0;y<GRID_HEIGHT;y++)for(let x=0;x<GRID_WIDTH;x++){
     const p=project(view,center({x,y}));
     if(p.x< -50||p.x>width+50||p.y< -45||p.y>height+45)continue;
     const industrial=isIndustrialSector({x,y});
     const commercial=isCommercialSector({x,y});
     const road=isStreet({x,y});
     const shade=(x*7+y*11)%4;
     const tone=road?(shade===0?"#646460":"#515c58"):
       industrial?"#565d56":commercial?"#726352":"#51665e";
     diamond(ctx,p,view.zoom,tone,"rgba(166,180,165,.29)");
     if(road&&(x+y)%7===0){
       ctx.strokeStyle="rgba(239,204,132,.48)";
       ctx.beginPath();ctx.moveTo(p.x-7*view.zoom,p.y+3*view.zoom);
       ctx.lineTo(p.x+7*view.zoom,p.y+3*view.zoom);ctx.stroke();
     }
   }
   // Edifícios: volumes geométricos gerados por desenho vetorial em tempo real.
   const blocks=BUILDINGS.map(b=>({b,p:project(view,center({
     x:b.x+Math.floor(b.width/2),y:b.y+Math.floor(b.depth/2)
   }))})).sort((a,b)=>a.p.y-b.p.y);
   for(const {b,p} of blocks){
     if(p.x< -180||p.x>width+180||p.y< -170||p.y>height+160)continue;
     isoBlock(ctx,p,view.zoom,b.width,b.depth,b.height,
       "#"+b.roof.toString(16).padStart(6,"0"),
       "#"+b.wall.toString(16).padStart(6,"0"));
     if(b.sign&&view.zoom>=.83){
       ctx.font="bold "+Math.max(10,Math.floor(10*view.zoom))+"px monospace";
       ctx.fillStyle="#f0d5ad";
       ctx.fillText(b.sign,p.x-40*view.zoom,p.y-b.height*.63*view.zoom-6);
     }
   }
   for(const point of PROPS.marketStalls){
     const p=project(view,center(point));if(p.x<0||p.x>width||p.y<0||p.y>height)continue;
     ctx.fillStyle="#715346";ctx.fillRect(p.x-13,p.y-20,26,20);
     ctx.fillStyle="#e0b078";ctx.fillRect(p.x-16,p.y-25,32,7);
   }
   for(const point of PROPS.palms){
     const p=project(view,center(point));if(p.x<0||p.x>width||p.y<0||p.y>height)continue;
     ctx.strokeStyle="#947b5b";ctx.lineWidth=3*view.zoom;
     ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-3,p.y-28*view.zoom);ctx.stroke();
     ctx.fillStyle="#648373";
     ctx.beginPath();ctx.ellipse(p.x-3,p.y-30*view.zoom,18*view.zoom,7*view.zoom,-.25,0,Math.PI*2);ctx.fill();
   }
   // NPCs, acessos e terminais do mesmo catálogo de colisões do Phaser.
   const visibleActors=ACTORS.map(a=>({a,p:project(view,center(a.tile))}))
      .filter(({p})=>p.x> -75&&p.x<width+75&&p.y> -100&&p.y<height+80)
      .sort((a,b)=>a.p.y-b.p.y);
   for(const {a,p} of visibleActors){
     ctx.fillStyle="rgba(2,10,16,.48)";
     ctx.beginPath();ctx.ellipse(p.x,p.y+2,15*view.zoom,5*view.zoom,0,0,Math.PI*2);ctx.fill();
     if(a.person){
       ctx.fillStyle=a.id==="patio-sentinel"?"#a94f69":"#56858b";
       ctx.fillRect(p.x-8*view.zoom,p.y-31*view.zoom,16*view.zoom,26*view.zoom);
       ctx.fillStyle="#d6ad8a";
       ctx.beginPath();ctx.arc(p.x,p.y-38*view.zoom,7*view.zoom,0,Math.PI*2);ctx.fill();
     }else{
       ctx.fillStyle="#1c3139";
       ctx.fillRect(p.x-11*view.zoom,p.y-37*view.zoom,22*view.zoom,35*view.zoom);
       ctx.strokeStyle="#efb879";ctx.lineWidth=2;
       ctx.strokeRect(p.x-11*view.zoom,p.y-37*view.zoom,22*view.zoom,35*view.zoom);
       ctx.fillStyle="#edbd83";ctx.fillRect(p.x-7*view.zoom,p.y-30*view.zoom,14*view.zoom,4*view.zoom);
     }
     if(distance(motion.position,a.tile)<=5){
       ctx.font="bold 11px monospace";const labelWidth=ctx.measureText(a.label).width;
       ctx.fillStyle="rgba(15,25,31,.94)";
       ctx.fillRect(p.x-labelWidth/2-5,p.y-59*view.zoom-13,labelWidth+10,17);
       ctx.fillStyle="#f7ddb8";ctx.fillText(a.label,p.x-labelWidth/2,p.y-59*view.zoom);
     }
   }
   if(marker){
     const p=project(view,center(marker));
     ctx.strokeStyle="#eecb88";ctx.lineWidth=2;
     ctx.beginPath();ctx.ellipse(p.x,p.y,12*view.zoom,6*view.zoom,0,0,Math.PI*2);ctx.stroke();
   }
   const avatar=project(view,renderPosition);
   const cy=avatar.y;
   ctx.fillStyle="rgba(3,11,17,.63)";
   ctx.beginPath();ctx.ellipse(avatar.x,cy+4,15*view.zoom,5*view.zoom,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#00c8db";ctx.fillRect(avatar.x-8*view.zoom,cy-30*view.zoom,16*view.zoom,27*view.zoom);
   ctx.fillStyle=presentation.current==="feminine"?"#e3a87e":"#bd9c83";
   ctx.beginPath();ctx.arc(avatar.x,cy-39*view.zoom,8*view.zoom,0,Math.PI*2);ctx.fill();
   ctx.fillStyle="#1d343d";ctx.fillRect(avatar.x-8*view.zoom,cy-43*view.zoom,16*view.zoom,6*view.zoom);
   ctx.fillStyle="#f2cc8b";ctx.fillRect(avatar.x-5*view.zoom,cy-40*view.zoom,10*view.zoom,2*view.zoom);
   ctx.strokeStyle="#00e5ff";ctx.lineWidth=1.4;
   ctx.beginPath();ctx.ellipse(avatar.x,cy+2,17*view.zoom,8*view.zoom,0,0,Math.PI*2);ctx.stroke();
   if(!painted){painted=true;setStatus("ready");setError("");}
  };
  const schedule=()=>{
   if(disposed||frameId)return;
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
    motion.step={from:{...motion.position},to:next,start:now,
      duration:next.x!==motion.position.x&&next.y!==motion.position.y?195:150};
  };
  const tick=(now:number)=>{
    if(disposed)return;
    if(motion.step){
      const step=motion.step;
      const portion=Math.max(0,Math.min(1,(now-step.start)/step.duration));
      const a=center(step.from),b=center(step.to);
      renderPosition={x:a.x+(b.x-a.x)*portion,y:a.y+(b.y-a.y)*portion};
      if(portion>=1){
        motion.position=step.to;
        renderPosition=center(motion.position);
        motion.step=null;
        notify(motion.position,false);
        startStep(now);
      }
    }
    // O loop só permanece ativo enquanto o avatar realmente se desloca.
    try{paint();}catch(e){
      setStatus("failed");setError("O desenho leve encontrou um erro: "+String(e).slice(0,95));
      return;
    }
    if(motion.step)schedule();
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
    canvas.width=Math.max(320,Math.floor(width*ratio));
    canvas.height=Math.max(250,Math.floor(height*ratio));
    schedule();
  };
  const pointer=(event:PointerEvent)=>{
    event.preventDefault();
    const bounds=canvas.getBoundingClientRect();
    const point={x:event.clientX-bounds.left,y:event.clientY-bounds.top};
    const v=getView(width,height,renderPosition);
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
  try{
    context=canvas.getContext("2d",{alpha:false});
    if(!context)throw new Error("Canvas 2D indisponível neste Android");
    notify(motion.position,true);
    canvas.addEventListener("pointerdown",pointer,{passive:false});
    window.addEventListener("keydown",keydown);
    if(typeof ResizeObserver!=="undefined"){
      observer=new ResizeObserver(sizing);observer.observe(host);
    }else window.addEventListener("resize",sizing);
    scene.current={go,frame:schedule};
    sizing();
  }catch(e){
    setStatus("failed");
    setError("O mapa leve não pôde ser aberto: "+String(e).slice(0,95));
  }
  return ()=>{
    disposed=true;
    if(frameId)cancelAnimationFrame(frameId);
    observer?.disconnect();
    window.removeEventListener("resize",sizing);
    canvas.removeEventListener("pointerdown",pointer);
    window.removeEventListener("keydown",keydown);
    scene.current=null;
    // Preservar o último tile confirmado mesmo após fechamento inesperado.
    notify(motion.position,true);
  };
 },[characterId,reboot]);
 useEffect(()=>{scene.current?.frame();},[appearance]);
 const restart=()=>{setStatus("loading");setError("");setReboot(n=>n+1);};
 return <div className="baixada-world na-world-host" ref={hostRef}
   data-renderer="canvas" data-scene-state={status}
   aria-label="Mapa leve e interativo da Baixada em Android">
   <canvas ref={canvasRef} tabIndex={0} style={{width:"100%",height:"100%",
     display:"block",touchAction:"none"}} aria-label="Toque no chão para caminhar; toque nos habitantes e terminais para interagir"/>
   {status==="failed"&&<div className="na-world-startup" role="alert">
     <strong>Falha no mapa leve da Baixada</strong><span>{error}</span>
     <button type="button" onClick={restart}>Tentar abrir novamente</button>
   </div>}
 </div>;
}
