import Phaser from "phaser";
import {drawDistrictSkyline,drawDistrictPavement,drawDistrictBuilding,drawDistrictInteractable} from "./art";
import {isEconomyMode} from "../performance";
import {audioDirector} from "../../audio/director";
import {preloadCharacterSprites,createCharacterAnimations,
 ActorAnimationController,getPlayerTexture,frameForDirection,
 type IsoDirection} from "../baixada/sprites";
import type {OriginId} from "../character/origins";
import type {TestAppearance} from "../test-arena/appearance";
import {DISTRICT_WIDTH,DISTRICT_HEIGHT,DISTRICT_SPAWN,NODE_TILES,NODE_NAMES,
 getDistrict,districtActorId,districtWalkable,districtPath,districtApproach,
 type Tile,type NodeSlot,type DistrictId,type DistrictSpec} from "./catalog";
const W=1560,H=940,TW=54,TH=28,OX=788,OY=164;
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
 constructor(id:DistrictId,onInteract:(id:string)=>void,origin:OriginId,
  appearance:TestAppearance,objective:NodeSlot|null=null,start?:Tile,
  onMove?:(tile:Tile,settled?:boolean)=>void){
  super({key:"District-"+id});
  this.id=id;this.spec=getDistrict(id);this.onInteract=onInteract;
  this.origin=origin;this.appearance=appearance;this.currentObjective=objective;
  if(start&&districtWalkable(id,start))this.tile={...start};
  this.onMove=onMove;
 }
 setAppearance(appearance:TestAppearance):void{
  if(this.appearance===appearance)return;
  this.appearance=appearance;
  this.anim?.setTexture(getPlayerTexture(this.origin,appearance));
 }
 setObjective(slot:NodeSlot|null):void{
  this.currentObjective=slot;this.updateObjectiveMarker();
 }
 preload():void{preloadCharacterSprites(this,this.origin,[]);}
 create():void{
  createCharacterAnimations(this);
  this.buildStaticMap();
  this.buildInteractables();
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
  this.marker=this.add.circle(p.x,p.y,8,0xffc684,.13)
    .setStrokeStyle(1.8,0xffdba9,.9).setDepth(p.y+.2).setVisible(false);
  const camera=this.cameras.main;
  camera.setBackgroundColor("#161923");
  camera.setBounds(0,0,W,H);
  this.updateZoom();this.scale.on("resize",this.updateZoom,this);
  camera.centerOn(p.x,p.y-37);
  camera.startFollow(this.player,true,.22,.22);
  this.input.on(Phaser.Input.Events.POINTER_DOWN,this.tap,this);
  this.input.keyboard?.on("keydown",this.keyDown,this);
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
   this.scale.off("resize",this.updateZoom,this);
   this.input.off(Phaser.Input.Events.POINTER_DOWN,this.tap,this);
   this.input.keyboard?.off("keydown",this.keyDown,this);
   this.anim?.dispose();
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
   const c=center({x,y}),road=y===10||x===11||x===19;
   const tone=road?s.lane:(x*3+y)%5===0?s.wall:s.ground;
   this.tileDiamond(g,c,tone,s.accent);
   drawDistrictPavement(g,this.id,c,{x,y},road);
   if(road&&(x+y)%6===0){
    g.lineStyle(1.1,s.accent,.53);
    g.beginPath();g.moveTo(c.x-6,c.y+1);g.lineTo(c.x+7,c.y+1);g.strokePath();
   }
  }
  // Fachadas/telhados por distrito, mesma malha de colisão e camadas de jogo.
  for(const [i,block] of s.blocks.entries())
   drawDistrictBuilding(g,this.id,s,block,center,i);
  const key="district-surface-"+this.id+"-v2";
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
 private buildInteractables():void{
  for(const slot of Object.keys(NODE_TILES) as NodeSlot[]){
   const c=center(NODE_TILES[slot]),g=this.add.graphics().setDepth(c.y+.5);
   drawDistrictInteractable(g,this.id,slot,c,this.spec);
   const text=slot==="guide"?this.spec.guideName.toUpperCase():NODE_NAMES[slot].toUpperCase();
   this.add.text(c.x,c.y-76,text,{
    fontFamily:"IBM Plex Mono,monospace",fontSize:"12px",color:"#f3e5ca",
    backgroundColor:"#0c1b25e3",padding:{x:5,y:3},
   }).setOrigin(.5).setDepth(c.y+130);
  }
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
    onUpdate:()=>this.player.setDepth(this.player.y+120),
    onComplete:()=>{
      if(++this.footstep%4===0)audioDirector.effect("step");
      this.onMove?.({...this.tile},false);
      advance();
    }});
  };
  advance();
 }
}
