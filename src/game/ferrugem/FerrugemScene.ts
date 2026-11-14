import Phaser from "phaser";
import type {OriginId} from "../character/origins";
import type {TestAppearance} from "../test-arena/appearance";
import {audioDirector} from "../../audio/director";
import {isEconomyMode} from "../performance";
import {
 preloadCharacterSprites,createCharacterAnimations,ActorAnimationController,
 getPlayerTexture,frameForDirection,type IsoDirection,
} from "../baixada/sprites";
import {
 FERRUGEM_WIDTH,FERRUGEM_HEIGHT,FERRUGEM_START,FACTORIES,FERRUGEM_ACTORS,
 isFerrugemWalkable,ferrugemPath,ferrugemApproach,
 type Cell,type IndustrialActor,
} from "./layout";

const WORLD_WIDTH=1536,WORLD_HEIGHT=900;
const TW=54,TH=28,OX=750,OY=155;
const directions:readonly Cell[]=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
type XY={x:number;y:number};
const center=(t:Cell):XY=>({x:OX+(t.x-t.y)*TW/2,y:OY+(t.x+t.y)*TH/2});
function facing(a:Cell,b:Cell):IsoDirection{
 return b.y<a.y?0:b.x>a.x?1:b.y>a.y?2:3;
}
/** Segunda zona de superfície. Cena leve, com todo o cenário estático
 * convertido a UMA textura; animações apenas para o protagonista.
 */
export class FerrugemScene extends Phaser.Scene{
 private readonly onInteract:(id:string)=>void;
 private readonly originId:OriginId;
 private appearance:TestAppearance;
 private player!:Phaser.GameObjects.Sprite;
 private anim?:ActorAnimationController;
 private tile:Cell={...FERRUGEM_START};
 private direction:IsoDirection=2;
 private moving=false;
 private pending:string|null=null;
 private queuedTarget:Cell|null=null;
 private queuedActor:string|null=null;
 private marker?:Phaser.GameObjects.Arc;
 private objectiveIndicator?:Phaser.GameObjects.Text;
 private objectiveActorId:string|null;

 constructor(onInteract:(id:string)=>void,originId:OriginId,appearance:TestAppearance,objectiveId:string|null=null){
  super({key:"FerrugemScene"});
  this.onInteract=onInteract;
  this.originId=originId;
  this.appearance=appearance;
  this.objectiveActorId=objectiveId;
 }
 setObjective(id:string|null):void{
  this.objectiveActorId=id;
  this.updateObjectiveMarker();
 }
 private updateObjectiveMarker():void{
  const actor=FERRUGEM_ACTORS.find(a=>a.id===this.objectiveActorId);
  if(!this.objectiveIndicator)return;
  if(!actor){this.objectiveIndicator.setVisible(false);return;}
  const c=center(actor.tile);
  this.objectiveIndicator.setPosition(c.x,c.y-106).setVisible(true);
 }
 setAppearance(value:TestAppearance):void{
  if(this.appearance===value)return;
  this.appearance=value;
  this.anim?.setTexture(getPlayerTexture(this.originId,value));
 }
 preload():void{preloadCharacterSprites(this,this.originId,[]);}
 create():void{
  createCharacterAnimations(this);
  this.drawFactoryDistrict();
  this.drawActors();
  this.objectiveIndicator=this.add.text(0,0,"◆ OBJETIVO ATUAL",{
   fontFamily:"IBM Plex Mono,monospace",fontSize:"12px",fontStyle:"bold",color:"#12232b",
   backgroundColor:"#f2c888",padding:{x:7,y:4},
  }).setOrigin(.5).setDepth(1500).setVisible(false);
  this.updateObjectiveMarker();
  const p=center(this.tile);
  const texture=getPlayerTexture(this.originId,this.appearance);
  this.player=this.add.sprite(p.x,p.y,texture,frameForDirection(texture,this.direction))
   .setOrigin(.5,.95).setScale(.92).setDepth(p.y+120);
  this.anim=new ActorAnimationController(this.player,texture,this.direction);
  this.marker=this.add.circle(p.x,p.y,8,0xe6b570,.15)
   .setStrokeStyle(2,0xffd8a4,.9).setDepth(p.y+.1).setVisible(false);
  const camera=this.cameras.main;
  camera.setBackgroundColor("#111921");
  camera.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT);
  this.applyZoom();
  this.scale.on("resize",this.applyZoom,this);
  camera.centerOn(p.x,p.y-38);
  camera.startFollow(this.player,true,.22,.22);
  this.input.on(Phaser.Input.Events.POINTER_DOWN,this.tap,this);
  this.input.keyboard?.on("keydown",this.keyDown,this);
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
   this.scale.off("resize",this.applyZoom,this);
   this.input.off(Phaser.Input.Events.POINTER_DOWN,this.tap,this);
   this.input.keyboard?.off("keydown",this.keyDown,this);
   this.anim?.dispose();
  });
 }
 private applyZoom():void{
  const ratio=Math.min(this.scale.width/960,this.scale.height/500);
  this.cameras.main.setZoom(Phaser.Math.Clamp(ratio,isEconomyMode()?.75:.85,isEconomyMode()?1.18:1.5));
 }
 private diamond(g:Phaser.GameObjects.Graphics,p:XY,color:number,edge:number):void{
  g.fillStyle(color,1);
  g.beginPath();g.moveTo(p.x,p.y-TH/2);g.lineTo(p.x+TW/2,p.y);
  g.lineTo(p.x,p.y+TH/2);g.lineTo(p.x-TW/2,p.y);g.closePath();g.fillPath();
  g.lineStyle(1,edge,.46);g.strokePath();
 }
 private drawFactoryDistrict():void{
  const g=this.add.graphics();
  g.fillStyle(0x111820);g.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
  // Silhuetas industriais profundas, chaminés e cabos.
  for(let i=0;i<11;i++){
   const x=94+i*132,height=80+(i*43)%110;
   g.fillStyle(i%3===0?0x22323a:0x1a2b35,.84);
   g.fillRect(x,90,70,height);
   g.fillStyle(0x51636b,.36);g.fillRect(x+18,35,16,70);
   g.fillStyle(0xc58258,.17);g.fillEllipse(x+30,35,50,19);
   g.lineStyle(2,0x77625a,.55);
   g.beginPath();g.moveTo(x-34,75);g.lineTo(x+90,75);g.strokePath();
  }
  g.lineStyle(4,0x8e6047,.45);
  g.beginPath();g.moveTo(30,130);g.lineTo(1480,130);g.strokePath();
  for(let y=0;y<FERRUGEM_HEIGHT;y++){
   for(let x=0;x<FERRUGEM_WIDTH;x++){
    const cell={x,y},p=center(cell),walkable=isFerrugemWalkable(cell);
    const road=y===9||x===11||x===19;
    const tone=road?(x+y)%2?0x465052:0x3e494d:
     walkable?(x*3+y)%3===0?0x3b4449:0x313d43:0x27343a;
    this.diamond(g,p,tone,road?0x927c63:0x63727a);
    if(walkable&&(x+y*3)%7===0){
     g.lineStyle(1,0xdda86e,.28);g.beginPath();
     g.moveTo(p.x-8,p.y+2);g.lineTo(p.x+9,p.y+2);g.strokePath();
    }
   }
  }
  for(const factory of FACTORIES){
   const p=center({x:factory.x+Math.floor(factory.w/2),y:factory.y+Math.floor(factory.h/2)});
   const w=Math.max(65,factory.w*28),h=Math.max(36,factory.h*18);
   g.fillStyle(0x14252b,.9);g.fillRoundedRect(p.x-w/2+8,p.y-h-12,w,h+12,4);
   g.fillStyle(factory.id==="alto-forno"?0x785241:0x526065,1);
   g.fillRoundedRect(p.x-w/2,p.y-h-28,w,h+15,5);
   g.fillStyle(0x2f3c42,.9);g.fillRoundedRect(p.x-w/2+8,p.y-h-36,w-16,17,2);
   g.lineStyle(3,0xcf9964,.85);
   g.beginPath();g.moveTo(p.x-w/2,p.y-h-9);g.lineTo(p.x+w/2,p.y-h-9);g.strokePath();
   for(let k=0;k<Math.floor(w/24);k++){
    g.fillStyle(0xe5a86c,k%2===0?.65:.22);
    g.fillRect(p.x-w/2+8+k*24,p.y-h+4,10,4);
   }
  }
  const staticId="ferrugem-industrial-map-v1";
  if(this.textures.exists(staticId))this.textures.remove(staticId);
  g.generateTexture(staticId,WORLD_WIDTH,WORLD_HEIGHT);
  g.destroy();
  this.add.image(0,0,staticId).setOrigin(0).setDepth(-100);
  this.add.text(810,49,"FERRUGEM // DISTRITO INDUSTRIAL",{
   fontFamily:"IBM Plex Mono,monospace",fontSize:"20px",fontStyle:"bold",color:"#f1d3a8",
   backgroundColor:"#101d24e0",padding:{x:14,y:7},
  }).setOrigin(.5).setDepth(1100);
  this.add.text(810,83,"REDE DE ENERGIA · TRABALHO · SUCATA · HELIX",{
   fontFamily:"IBM Plex Mono,monospace",fontSize:"11px",color:"#b9d2d2",
  }).setOrigin(.5).setDepth(1100);
  this.add.text(WORLD_WIDTH/2,WORLD_HEIGHT-65,
   "TOQUE PARA CAMINHAR · TOQUE NOS TERMINAIS E TRABALHADORES",{
    fontFamily:"IBM Plex Mono,monospace",fontSize:"11px",color:"#e2c8a2",
    backgroundColor:"#11222ae0",padding:{x:13,y:7},
   }).setOrigin(.5).setDepth(1100);
 }
 private drawActors():void{
  for(const actor of FERRUGEM_ACTORS){
   const p=center(actor.tile),g=this.add.graphics().setDepth(p.y+.55);
   g.fillStyle(0x08151a,.55);g.fillEllipse(p.x,p.y+4,43,12);
   if(actor.kind==="worker"){
    g.fillStyle(0x343e42);g.fillRoundedRect(p.x-10,p.y-46,20,43,5);
    g.fillStyle(0xd49b67);g.fillCircle(p.x,p.y-50,10);
    g.fillStyle(0x6d7671);g.fillRect(p.x-14,p.y-47,28,6);
    g.lineStyle(2,0xe4aa73,.8);
    g.beginPath();g.moveTo(p.x-8,p.y-27);g.lineTo(p.x+8,p.y-27);g.strokePath();
   }else if(actor.kind==="exit"){
    g.fillStyle(0x183037);g.fillRoundedRect(p.x-18,p.y-55,36,55,5);
    g.lineStyle(3,0xffcb88);g.strokeRoundedRect(p.x-18,p.y-55,36,55,5);
    g.fillStyle(0xffcb88,.75);g.fillRect(p.x-10,p.y-20,20,4);
   }else if(actor.kind==="evidence"){
    g.fillStyle(0x6f4a3c);g.fillRoundedRect(p.x-15,p.y-28,30,27,3);
    g.lineStyle(3,0xe5ad6b);g.strokeRoundedRect(p.x-15,p.y-28,30,27,3);
    g.lineStyle(2,0x2e3435,.6);
    g.beginPath();g.moveTo(p.x-15,p.y-18);g.lineTo(p.x+15,p.y-18);g.strokePath();
   }else{
    g.fillStyle(0x172c34);g.fillRoundedRect(p.x-14,p.y-43,28,42,3);
    g.lineStyle(2,0xe4ad76);g.strokeRoundedRect(p.x-14,p.y-43,28,42,3);
    g.fillStyle(0xe4ad76,.83);g.fillRect(p.x-9,p.y-34,18,16);
    g.fillStyle(0x263b41);g.fillRect(p.x-6,p.y-30,12,3);
    g.fillRect(p.x-6,p.y-24,8,3);
   }
   this.add.text(p.x,p.y-76,actor.title.toUpperCase(),{
    fontFamily:"IBM Plex Mono,monospace",fontSize:"10px",color:"#f7e1c0",
    backgroundColor:"#101a22e4",padding:{x:5,y:3},
   }).setOrigin(.5).setDepth(p.y+120);
  }
 }
 private approach(actor:IndustrialActor):void{
  const route=ferrugemApproach(this.tile,actor.tile);
  if(!route)return;
  if(route.length<2){
   this.marker?.setVisible(false);
   audioDirector.effect("interact");
   this.onInteract(actor.id);return;
  }
  this.pending=actor.id;this.walk(route);
 }
 private tap(pointer:Phaser.Input.Pointer):void{
  const p=pointer.positionToCamera(this.cameras.main) as XY;
  const actor=FERRUGEM_ACTORS.map(a=>{
   const c=center(a.tile),dx=p.x-c.x,dy=p.y-(c.y-23);
   return {a,d:Math.abs(dx)/32+Math.abs(dy)/50,
    hit:Math.abs(dx)<=36&&p.y>=c.y-90&&p.y<=c.y+18};
  }).filter(v=>v.hit).sort((a,b)=>a.d-b.d)[0];
  if(actor){
   if(this.moving){this.queuedActor=actor.a.id;this.queuedTarget=null;}
   else this.approach(actor.a);
   return;
  }
  const rx=(p.x-OX)/(TW/2),ry=(p.y-OY)/(TH/2);
  const target={x:Math.round((rx+ry)/2),y:Math.round((ry-rx)/2)};
  const c=center(target);
  if(Math.abs(p.x-c.x)/(TW/2)+Math.abs(p.y-c.y)/(TH/2)>1.1||
     !isFerrugemWalkable(target))return;
  this.marker?.setPosition(c.x,c.y).setDepth(c.y+.02).setVisible(true);
  if(this.moving){this.queuedTarget=target;this.queuedActor=null;return;}
  this.pending=null;
  const path=ferrugemPath(this.tile,target);
  if(path&&path.length>1)this.walk(path);else this.marker?.setVisible(false);
 }
 private keyDown(event:KeyboardEvent):void{
  const code=event.key.toLowerCase();
  const i=code==="w"||code==="arrowup"?0:code==="d"||code==="arrowright"?1:
   code==="s"||code==="arrowdown"?2:code==="a"||code==="arrowleft"?3:-1;
  if(i<0)return;
  const d=directions[i]!,target={x:this.tile.x+d.x,y:this.tile.y+d.y};
  if(!isFerrugemWalkable(target))return;
  if(this.moving){this.queuedTarget=target;this.queuedActor=null;return;}
  this.pending=null;
  const path=ferrugemPath(this.tile,target);
  if(path&&path.length>1)this.walk(path);
 }
 private walk(path:Cell[]):void{
  if(this.moving||path.length<2)return;
  this.moving=true;
  const steps=path.slice(1);
  const nextStep=():void=>{
   if(this.queuedActor){
    const actor=FERRUGEM_ACTORS.find(a=>a.id===this.queuedActor);
    this.queuedActor=null;this.queuedTarget=null;this.pending=null;this.moving=false;
    if(actor)this.approach(actor);else this.anim?.play("idle");
    return;
   }
   if(this.queuedTarget){
    const target=this.queuedTarget;
    this.queuedTarget=null;this.pending=null;
    const reroute=ferrugemPath(this.tile,target);
    steps.splice(0,steps.length,...(reroute?.slice(1)??[]));
   }
   const next=steps.shift();
   if(!next){
    this.moving=false;this.anim?.play("idle");this.marker?.setVisible(false);
    const id=this.pending;this.pending=null;
    if(id){audioDirector.effect("interact");this.onInteract(id);}
    return;
   }
   const previous=this.tile;
   const direction=facing(previous,next);
   this.direction=direction;this.anim?.setDirection(direction);this.anim?.play("walk");
   const p=center(next);
   this.tile={...next};
   this.tweens.add({targets:this.player,x:p.x,y:p.y,ease:"Linear",
    duration:previous.x!==next.x&&previous.y!==next.y?190:140,
    onUpdate:()=>this.player.setDepth(this.player.y+120),
    onComplete:nextStep});
  };
  nextStep();
 }
}
