import Phaser from "phaser";
import {drawDistrictSkyline,drawDistrictPavement,drawDistrictBuilding,drawDistrictInteractable,DISTRICT_ART} from "./art";
import {DISTRICT_GUIDE_TEXTURE} from "./guide-textures";
import {isEconomyMode} from "../performance";
import type {CinematicCameraFocus} from "../story/cinematic-camera.ts";
import {audioDirector} from "../../audio/director";
import {citizensForDistrict,chooseDistrictCitizenStep,districtCitizenSpeech,
 type DistrictCitizenSpec} from "../ai/district-citizens.ts";
import type {NpcAttitude} from "../ai/faction-reactivity.ts";
import {preloadCharacterSprites,createCharacterAnimations,
 ActorAnimationController,getPlayerTexture,frameForDirection,playIdle,playWalk,
 type IsoDirection} from "../baixada/sprites";
import type {OriginId} from "../character/origins";
import type {TestAppearance} from "../test-arena/appearance";
import {DISTRICT_WIDTH,DISTRICT_HEIGHT,DISTRICT_SPAWN,NODE_TILES,NODE_NAMES,
 getDistrict,districtActorId,districtWalkable,districtPath,districtApproach,districtRoad,
 type Tile,type NodeSlot,type DistrictId,type DistrictSpec} from "./catalog";
const W=1660,H=1040,TW=54,TH=28,OX=815,OY=164;
type Point={x:number;y:number};
const center=(p:Tile):Point=>({x:OX+(p.x-p.y)*TW/2,y:OY+(p.x+p.y)*TH/2});
const cardinal:readonly Tile[]=[
 {x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0},
];
function facing(from:Tile,to:Tile):IsoDirection{
 return to.y<from.y?0:to.x>from.x?1:to.y>from.y?2:3;
}
/** Arestas seguras, uma textura de fundo por distrito e caminho sob demanda.
 * Em modo economia o FPS fica travado no Phaser, sem shaders persistentes.
 */
export class DistrictScene extends Phaser.Scene{
 private readonly id:DistrictId;
 private readonly spec:DistrictSpec;
 private readonly origin:OriginId;
 private appearance:TestAppearance;
 private readonly onInteract:(id:string)=>void;
 private readonly onMove?:(tile:Tile,settled?:boolean)=>void;
 private tile:Tile={...DISTRICT_SPAWN};
 private player!:Phaser.GameObjects.Sprite;
 private anim?:ActorAnimationController;
 private marker?:Phaser.GameObjects.Arc;
 private objective?:Phaser.GameObjects.Text;
 private currentObjective:NodeSlot|null;
 private moving=false;
 private pending:string|null=null;
 private queuedTarget:Tile|null=null;
 private queuedActor:NodeSlot|null=null;
 private footstep=0;
 private buildingLayers:{image:Phaser.GameObjects.Image;x:number;y:number;w:number;h:number}[]=[];
 private buildingTextureKeys:string[]=[];
 private coverMarker?:Phaser.GameObjects.Arc;
 private cinematicFocus:CinematicCameraFocus|null=null;
 private residents:Array<{spec:DistrictCitizenSpec;tile:Tile;
   visual:Phaser.GameObjects.Sprite;busy:boolean}>=[];
 private citizenSpeech?:Phaser.GameObjects.Text;
 private citizenTimer?:Phaser.Time.TimerEvent;
 private citizenTicks=0;
 private localAttitude:NpcAttitude;
 constructor(id:DistrictId,onInteract:(id:string)=>void,origin:OriginId,
  appearance:TestAppearance,objective:NodeSlot|null=null,start?:Tile,
  onMove?:(tile:Tile,settled?:boolean)=>void,
  attitude:NpcAttitude="neutral"){
  super({key:"District-"+id});
  this.id=id;this.spec=getDistrict(id);this.onInteract=onInteract;
  this.origin=origin;this.appearance=appearance;this.currentObjective=objective;
  if(start&&districtWalkable(id,start))this.tile={...start};
  this.onMove=onMove;this.localAttitude=attitude;
 }
 setAppearance(appearance:TestAppearance):void{
  if(this.appearance===appearance)return;
  this.appearance=appearance;
  this.anim?.setTexture(getPlayerTexture(this.origin,appearance));
 }
 /** A dialogue camera never changes walkability, player position or saves. */
 setCinematicFocus(focus:CinematicCameraFocus|null):void{
  if(this.cinematicFocus===focus)return;
  this.cinematicFocus=focus;
  if(!this.player||!this.sys.isActive())return;
  const camera=this.cameras.main;
  if(focus===null){
   camera.startFollow(this.player,true,.22,.22);
   this.updateZoom();
   return;
  }
  const spot=focus==="guide"?NODE_TILES.guide:
   focus==="objective"&&this.currentObjective?
     NODE_TILES[this.currentObjective]:this.tile;
  const p=center(spot);
  const reduced=typeof window!=="undefined"&&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches||
    (typeof localStorage!=="undefined"&&localStorage.getItem(
      "cyberpunk-tactical-rpg.settings.reduce-motion.v1")==="true");
  camera.stopFollow();
  camera.pan(p.x,p.y-50,reduced?0:690,"Sine.easeInOut",true);
  camera.zoomTo(Math.min(camera.zoom*1.10,1.48),
   reduced?0:590,"Sine.easeInOut",true);
 }
 setObjective(slot:NodeSlot|null):void{
  this.currentObjective=slot;this.updateObjectiveMarker();
 }
 setReaction(attitude:NpcAttitude):void{
  this.localAttitude=attitude;
  this.updateCitizenSpeech();
 }
 preload():void{
  preloadCharacterSprites(this,this.origin,[
    DISTRICT_GUIDE_TEXTURE[this.id],
    ...citizensForDistrict(this.id).map(citizen=>citizen.texture),
  ]);
 }
 create():void{
  createCharacterAnimations(this);
  this.buildStaticMap();
  this.buildBuildingLayers();
  this.buildInteractables();
  this.buildCitizens();
  this.objective=this.add.text(0,0,"◆ OBJETIVO ATUAL",{
    fontFamily:"IBM Plex Mono,monospace",fontSize:"12px",fontStyle:"bold",
    color:"#18222c",backgroundColor:"#f3c58a",padding:{x:7,y:4},
  }).setOrigin(.5).setDepth(1800).setVisible(false);
  this.updateObjectiveMarker();
  const p=center(this.tile);
  const texture=getPlayerTexture(this.origin,this.appearance);
  this.player=this.add.sprite(p.x,p.y,texture,frameForDirection(texture,2))
    .setOrigin(.5,.95).setScale(.92).setDepth(p.y+120);
  this.anim=new ActorAnimationController(this.player,texture,2);
  this.coverMarker=this.add.circle(p.x,p.y-47,6,0x00e5ff,.12)
    .setStrokeStyle(2,0x00e5ff,.94).setDepth(1810).setVisible(false);
  this.updateBuildingOcclusion();
  this.game.canvas?.setAttribute("data-district-art","v076-"+this.id);
  this.game.canvas?.setAttribute("data-district-guide",DISTRICT_GUIDE_TEXTURE[this.id]);
  this.marker=this.add.circle(p.x,p.y,8,0xffc684,.13)
    .setStrokeStyle(1.8,0xffdba9,.9).setDepth(p.y+.2).setVisible(false);
  const camera=this.cameras.main;
  camera.setBackgroundColor("#161923");
  camera.setBounds(0,0,W,H);
  this.updateZoom();this.scale.on("resize",this.updateZoom,this);
  camera.centerOn(p.x,p.y-37);
  camera.startFollow(this.player,true,.22,.22);
  if(this.cinematicFocus){
   const cue=this.cinematicFocus;this.cinematicFocus=null;
   this.setCinematicFocus(cue);
  }
  this.input.on(Phaser.Input.Events.POINTER_DOWN,this.tap,this);
  this.input.keyboard?.on("keydown",this.keyDown,this);
  this.citizenTimer=this.time.addEvent({delay:1500,loop:true,
    callback:()=>this.tickCitizens()});
  this.updateCitizenSpeech();
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
   this.scale.off("resize",this.updateZoom,this);
   this.input.off(Phaser.Input.Events.POINTER_DOWN,this.tap,this);
   this.input.keyboard?.off("keydown",this.keyDown,this);
   this.anim?.dispose();
   this.citizenTimer?.remove(false);
   this.residents=[];this.citizenSpeech=undefined;
   for(const key of this.buildingTextureKeys)
    if(this.textures.exists(key))this.textures.remove(key);
   this.buildingTextureKeys=[];this.buildingLayers=[];
  });
 }
 private updateObjectiveMarker():void{
  if(!this.objective)return;
  const slot=this.currentObjective;
  if(!slot){this.objective.setVisible(false);return;}
  const c=center(NODE_TILES[slot]);
  this.objective.setPosition(c.x,c.y-94).setVisible(true);
 }
 private updateZoom():void{
  const r=Math.min(this.scale.width/960,this.scale.height/505);
  this.cameras.main.setZoom(Phaser.Math.Clamp(r,isEconomyMode()?.72:.85,
   isEconomyMode()?1.18:1.5));
 }
 private tileDiamond(g:Phaser.GameObjects.Graphics,c:Point,fill:number,stroke:number):void{
  g.fillStyle(fill,1);g.lineStyle(1,stroke,.35);
  g.beginPath();g.moveTo(c.x,c.y-TH/2);g.lineTo(c.x+TW/2,c.y);
  g.lineTo(c.x,c.y+TH/2);g.lineTo(c.x-TW/2,c.y);
  g.closePath();g.fillPath();g.strokePath();
 }
 private buildStaticMap():void{
  const g=this.add.graphics(),s=this.spec;
  drawDistrictSkyline(g,this.id,s,W,H);
  for(let y=0;y<DISTRICT_HEIGHT;y++)for(let x=0;x<DISTRICT_WIDTH;x++){
   const c=center({x,y}),road=districtRoad(this.id,{x,y});
   const tone=road?s.lane:(x*3+y)%5===0?s.wall:s.ground;
   this.tileDiamond(g,c,tone,s.accent);
   drawDistrictPavement(g,this.id,c,{x,y},road);
   if(road&&(x+y)%6===0){
    g.lineStyle(1.1,s.accent,.53);
    g.beginPath();g.moveTo(c.x-6,c.y+1);g.lineTo(c.x+7,c.y+1);g.strokePath();
   }
  }
  // O fundo é exclusivo para piso e horizonte; edifícios têm profundidade própria.
  const key="district-surface-"+this.id+"-v080";
  if(this.textures.exists(key))this.textures.remove(key);
  g.generateTexture(key,W,H);
  g.destroy();
  this.add.image(0,0,key).setOrigin(0).setDepth(-100);
  this.add.text(W/2,52,s.name.toUpperCase()+" // NOVA ARCÁDIA",{
   fontFamily:"IBM Plex Mono,monospace",fontStyle:"bold",fontSize:"21px",
   color:"#fae4c3",backgroundColor:"#151e2be8",padding:{x:14,y:9},
  }).setDepth(1600).setOrigin(.5);
  this.add.text(W/2,89,s.subtitle,{
   fontFamily:"IBM Plex Mono,monospace",fontSize:"12px",color:"#e4d2b7",
   backgroundColor:"#161d28dd",padding:{x:10,y:4},
  }).setDepth(1600).setOrigin(.5);
 }
  /** Texturas de 1 bloco por vez, recortadas e ordenadas pela face frontal.
  * O motor evita redesenhar muitos polígonos em todos os frames Android.
  */
 private buildBuildingLayers():void{
  for(const [i,block] of this.spec.blocks.entries()){
   const v=[
    center({x:block.x-.5,y:block.y-.5}),
    center({x:block.x+block.w-.5,y:block.y-.5}),
    center({x:block.x+block.w-.5,y:block.y+block.h-.5}),
    center({x:block.x-.5,y:block.y+block.h-.5}),
   ];
   const left=Math.min(...v.map(q=>q.x)),right=Math.max(...v.map(q=>q.x));
   const top=Math.min(...v.map(q=>q.y)),bottom=Math.max(...v.map(q=>q.y));
   const x0=Math.floor(left-84),y0=Math.floor(top-DISTRICT_ART[this.id].roofRise-116);
   const width=Math.ceil(right-x0+84),height=Math.ceil(bottom-y0+45);
   const key="district-building-v076-"+this.id+"-"+i;
   if(this.textures.exists(key))this.textures.remove(key);
   const g=this.add.graphics();
   const project=(tile:Tile):Point=>{
    const q=center(tile);return {x:q.x-x0,y:q.y-y0};
   };
   drawDistrictBuilding(g,this.id,this.spec,block,project,i);
   g.generateTexture(key,width,height);
   g.destroy();
   const foot=v[2]!;
   const image=this.add.image(x0,y0,key).setOrigin(0).setDepth(foot.y+117);
   this.buildingLayers.push({image,x:x0,y:y0,w:width,h:height});
   this.buildingTextureKeys.push(key);
  }
 }
 private updateBuildingOcclusion():void{
  if(!this.player)return;
  const x=this.player.x,y=this.player.y;
  let covered=false;
  for(const l of this.buildingLayers){
   // Primeiro QA v076: alfa em prédios inteiros apagava a arquitetura.
   // Deixar o volume opaco; não sacrificar a estética para exibir o herói.
   l.image.setAlpha(1);
   const depthGap=l.image.depth-this.player.depth;
   const inFootprint=x>l.x+92&&x<l.x+l.w-92;
   const nearWall=y>l.y+75&&y<l.y+l.h-30;
   if(depthGap>0&&depthGap<80&&inFootprint&&nearWall)covered=true;
  }
  // O marcador ciano indica a posição caso o avatar esteja encoberto.
  this.coverMarker?.setPosition(x,y-47).setVisible(covered);
 }
 private buildInteractables():void{
  for(const slot of Object.keys(NODE_TILES) as NodeSlot[]){
   const c=center(NODE_TILES[slot]),g=this.add.graphics().setDepth(c.y+116);
   if(slot==="guide"){
    const texture=DISTRICT_GUIDE_TEXTURE[this.id];
    const sprite=this.add.sprite(c.x,c.y,texture,frameForDirection(texture,2))
      .setOrigin(.5,.95).setScale(.92).setDepth(c.y+120);
    playIdle(sprite,texture,2);
   }else drawDistrictInteractable(g,this.id,slot,c,this.spec);
   const text=slot==="guide"?this.spec.guideName.toUpperCase():NODE_NAMES[slot].toUpperCase();
   this.add.text(c.x,c.y-76,text,{
    fontFamily:"IBM Plex Mono,monospace",fontSize:"12px",color:"#f3e5ca",
    backgroundColor:"#0c1b25e3",padding:{x:5,y:3},
   }).setOrigin(.5).setDepth(c.y+130);
  }
 }
 /** Real district residents, independent from mission contacts and
  * managed with the same collision predicates as the player.
  * Faraway citizens do not cause expensive pathfinding or frame updates.
  */
 private buildCitizens():void{
  for(const spec of citizensForDistrict(this.id)){
   if(!districtWalkable(this.id,spec.home))continue;
   const p=center(spec.home);
   const visual=this.add.sprite(p.x,p.y,spec.texture,frameForDirection(spec.texture,2))
     .setOrigin(.5,.95).setScale(.76).setDepth(p.y+119);
   playIdle(visual,spec.texture,2);
   this.residents.push({spec,tile:{...spec.home},visual,busy:false});
  }
  this.citizenSpeech=this.add.text(0,0,"",{
   fontFamily:"IBM Plex Mono,monospace",fontSize:"11px",color:"#f6e6c9",
   backgroundColor:"#152831e8",padding:{x:7,y:5},
   wordWrap:{width:225},
  }).setOrigin(.5,1).setDepth(1805).setVisible(false);
 }
 private updateCitizenSpeech():void{
  if(!this.citizenSpeech||!this.player)return;
  const nearest=this.residents.map(resident=>({
   resident,distance:Math.abs(resident.tile.x-this.tile.x)+
     Math.abs(resident.tile.y-this.tile.y),
  })).sort((a,b)=>a.distance-b.distance)[0];
  if(!nearest||nearest.distance>4){
   this.citizenSpeech.setVisible(false);return;
  }
  const at=center(nearest.resident.tile);
  this.citizenSpeech.setText(nearest.resident.spec.name+": "+
    districtCitizenSpeech(nearest.resident.spec,this.localAttitude))
    .setPosition(at.x,at.y-92).setVisible(true);
 }
 private tickCitizens():void{
  this.citizenTicks++;
  const occupied=new Set<string>(this.residents.map(c=>c.tile.x+","+c.tile.y));
  occupied.add(this.tile.x+","+this.tile.y);
  for(const resident of this.residents){
   if(resident.busy)continue;
   occupied.delete(resident.tile.x+","+resident.tile.y);
   const next=chooseDistrictCitizenStep(this.id,resident.spec,resident.tile,
     this.tile,this.citizenTicks,occupied,this.localAttitude);
   occupied.add(next.x+","+next.y);
   if(next.x===resident.tile.x&&next.y===resident.tile.y)continue;
   const direction=facing(resident.tile,next),p=center(next);
   resident.tile=next;resident.busy=true;
   playWalk(resident.visual,resident.spec.texture,direction);
   this.tweens.add({targets:resident.visual,x:p.x,y:p.y,
    duration:560,ease:"Sine.easeInOut",
    onUpdate:()=>resident.visual.setDepth(resident.visual.y+119),
    onComplete:()=>{
     resident.busy=false;
     playIdle(resident.visual,resident.spec.texture,direction);
     this.updateCitizenSpeech();
    }});
  }
  this.updateCitizenSpeech();
 }
 private approach(slot:NodeSlot):void{
  const target=NODE_TILES[slot],path=districtApproach(this.id,this.tile,target);
  if(!path)return;
  if(path.length<2){
   this.marker?.setVisible(false);
   audioDirector.effect("interact");
   this.onInteract(districtActorId(this.id,slot));return;
  }
  this.pending=districtActorId(this.id,slot);this.walk(path);
 }
 private tap(pointer:Phaser.Input.Pointer):void{
  const point=pointer.positionToCamera(this.cameras.main) as Point;
  const actor=(Object.keys(NODE_TILES) as NodeSlot[]).map(slot=>{
   const c=center(NODE_TILES[slot]),d=Math.abs(point.x-c.x)/36+
     Math.abs(point.y-(c.y-25))/51;
   return {slot,d,hit:Math.abs(point.x-c.x)<=36&&
     point.y>=c.y-92&&point.y<=c.y+17};
  }).filter(x=>x.hit).sort((a,b)=>a.d-b.d)[0];
  if(actor){
   if(this.moving){this.queuedActor=actor.slot;this.queuedTarget=null;}
   else this.approach(actor.slot);
   return;
  }
  const rx=(point.x-OX)/(TW/2),ry=(point.y-OY)/(TH/2);
  const target={x:Math.round((rx+ry)/2),y:Math.round((ry-rx)/2)};
  const c=center(target);
  if(Math.abs(point.x-c.x)/(TW/2)+Math.abs(point.y-c.y)/(TH/2)>1.10||
    !districtWalkable(this.id,target))return;
  this.marker?.setPosition(c.x,c.y).setDepth(c.y+.3).setVisible(true);
  if(this.moving){this.queuedTarget=target;this.queuedActor=null;return;}
  this.pending=null;
  const path=districtPath(this.id,this.tile,target);
  if(path&&path.length>1)this.walk(path);
  else this.marker?.setVisible(false);
 }
 private keyDown(e:KeyboardEvent):void{
  const key=e.key.toLowerCase();
  const i=key==="w"||key==="arrowup"?0:key==="d"||key==="arrowright"?1:
   key==="s"||key==="arrowdown"?2:key==="a"||key==="arrowleft"?3:-1;
  if(i<0)return;
  const d=cardinal[i]!,next={x:this.tile.x+d.x,y:this.tile.y+d.y};
  if(!districtWalkable(this.id,next))return;
  if(this.moving){this.queuedTarget=next;this.queuedActor=null;return;}
  this.pending=null;
  const path=districtPath(this.id,this.tile,next);
  if(path&&path.length>1)this.walk(path);
 }
 private walk(path:Tile[]):void{
  if(this.moving||path.length<2)return;
  this.moving=true;
  const steps=path.slice(1);
  const advance=():void=>{
   if(this.queuedActor){
    const actor=this.queuedActor;
    this.queuedActor=null;this.queuedTarget=null;this.moving=false;this.pending=null;
    this.approach(actor);return;
   }
   if(this.queuedTarget){
    const target=this.queuedTarget;this.queuedTarget=null;this.pending=null;
    const alternate=districtPath(this.id,this.tile,target);
    steps.splice(0,steps.length,...(alternate?.slice(1)??[]));
   }
   const next=steps.shift();
   if(!next){
    this.moving=false;this.anim?.play("idle");this.marker?.setVisible(false);
    this.onMove?.({...this.tile},true);
    const id=this.pending;this.pending=null;
    if(id){audioDirector.effect("interact");this.onInteract(id);}
    return;
   }
   const previous=this.tile;const direction=facing(previous,next);
   this.anim?.setDirection(direction);this.anim?.play("walk");
   const p=center(next);this.tile={...next};
   this.tweens.add({targets:this.player,x:p.x,y:p.y,
    duration:next.x!==previous.x&&next.y!==previous.y?195:140,ease:"Linear",
    onUpdate:()=>{this.player.setDepth(this.player.y+120);this.updateBuildingOcclusion();},
    onComplete:()=>{
      if(++this.footstep%4===0)audioDirector.effect("step");
      this.onMove?.({...this.tile},false);
      this.updateCitizenSpeech();
      advance();
    }});
  };
  advance();
 }
}
