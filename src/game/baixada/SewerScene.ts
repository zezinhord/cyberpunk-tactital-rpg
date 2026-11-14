import Phaser from "phaser";
import type {OriginId} from "../character/origins";
import type {TestAppearance} from "../test-arena/appearance";
import {audioDirector} from "../../audio/director";
import {
 createCharacterAnimations,ActorAnimationController,getPlayerTexture,
 frameForDirection,preloadCharacterSprites,type IsoDirection,
} from "./sprites";
import {
 SEWER_MAPS,sewerApproach,sewerRoute,sewerWalkable,sewerWater,sewerKey,
 type SewerId,type SewerTile,type SewerActor,
} from "./sewer-layout";
import type {SewerProgress} from "../story/sewer-v09";

const WORLD_WIDTH=1450;
const WORLD_HEIGHT=890;
const TILE_W=54;
const TILE_H=28;
const ORIGIN_X=700;
const ORIGIN_Y=151;
const ISO_DIRECTIONS:readonly SewerTile[]=[
 {x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0},
];
const COLORS={
 wall:0x15262d,wallHigh:0x3d5154,concrete:0x364447,concreteAlt:0x303d41,
 metal:0x667472,water:0x16444c,waterLight:0x458b90,
 amber:0xf0bc78,orange:0xd2905a,shadow:0x071318,
};
type XY={x:number;y:number};
function center(tile:SewerTile):XY{
 return {x:ORIGIN_X+(tile.x-tile.y)*TILE_W/2,
   y:ORIGIN_Y+(tile.x+tile.y)*TILE_H/2};
}
function facing(from:SewerTile,to:SewerTile):IsoDirection{
 return to.y<from.y?0:to.x>from.x?1:to.y>from.y?2:3;
}
/** Cada mapa é explorável e 100% offline.
 * Uma cena Phaser é instanciada por área, evitando manter mapas 3D em memória.
 */
export class SewerScene extends Phaser.Scene{
 private readonly area:SewerId;
 private readonly originId:OriginId;
 private readonly onInteract:(id:string)=>void;
 private appearance:TestAppearance;
 private progress:SewerProgress;
 private player!:Phaser.GameObjects.Sprite;
 private animator?:ActorAnimationController;
 private playerTile:SewerTile;
 private direction:IsoDirection=2;
 private moving=false;
 private pending:string|null=null;
 private gateLabel?:Phaser.GameObjects.Text;

 constructor(area:SewerId,onInteract:(id:string)=>void,originId:OriginId,
   appearance:TestAppearance,progress:SewerProgress,returnFromDeep=false){
   super({key:"Sewer-"+area});
   this.area=area;
   this.onInteract=onInteract;
   this.originId=originId;
   this.appearance=appearance;
   this.progress=progress;
   const m=SEWER_MAPS[area];
   this.playerTile=area==="sewer-drain"&&returnFromDeep&&m.fromDeep?
     {...m.fromDeep}:{...m.entry};
 }
 setAppearance(value:TestAppearance):void{
  if(this.appearance===value)return;
  this.appearance=value;
  this.animator?.setTexture(getPlayerTexture(this.originId,value));
 }
 setProgress(progress:SewerProgress):void{
  this.progress=progress;
  this.gateLabel?.setText(progress.gateOpened?"COMPORTA 04 · ABERTA":"COMPORTA 04 · FECHADA");
 }
 preload():void{preloadCharacterSprites(this);}
 create():void{
  createCharacterAnimations(this);
  this.drawLevel();
  this.drawActors();
  this.createPlayer();
  const camera=this.cameras.main;
  camera.setBackgroundColor("#08141b");
  camera.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT);
  this.updateCamera();
  this.scale.on("resize",this.updateCamera,this);
  camera.centerOn(this.player.x,this.player.y-25);
  camera.startFollow(this.player,true,.13,.13);
  this.input.on(Phaser.Input.Events.POINTER_DOWN,this.handleTap,this);
  this.input.keyboard?.on("keydown",this.handleKeyboard,this);
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
   this.scale.off("resize",this.updateCamera,this);
   this.input.off(Phaser.Input.Events.POINTER_DOWN,this.handleTap,this);
   this.input.keyboard?.off("keydown",this.handleKeyboard,this);
   this.animator?.dispose();
  });
 }
 private updateCamera():void{
  this.cameras.main.setZoom(Phaser.Math.Clamp(
   Math.min(this.scale.width/960,this.scale.height/500),.8,1.45));
 }
 private diamond(g:Phaser.GameObjects.Graphics,p:XY,fill:number,stroke:number,alpha=1):void{
  g.fillStyle(fill,alpha);
  g.beginPath();g.moveTo(p.x,p.y-TILE_H/2);
  g.lineTo(p.x+TILE_W/2,p.y);g.lineTo(p.x,p.y+TILE_H/2);
  g.lineTo(p.x-TILE_W/2,p.y);g.closePath();g.fillPath();
  g.lineStyle(1,stroke,.6);g.strokePath();
 }
 private drawLevel():void{
  const m=SEWER_MAPS[this.area];
  const backdrop=this.add.graphics().setDepth(-100);
  backdrop.fillGradientStyle(0x07131a,0x07131a,0x26383c,0x101b23,1);
  backdrop.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
  backdrop.fillStyle(COLORS.waterLight,.05);
  backdrop.fillEllipse(ORIGIN_X,330,840,530);
  // Abóbada e tubulações: paredes de concreto com profundidade industrial.
  for(let n=0;n<10;n++){
   const x=180+n*128;
   backdrop.fillStyle(n%2?0x213239:0x182b33,1);
   backdrop.fillRect(x,42,14,175+(n%4)*27);
   backdrop.lineStyle(4,n%3===0?COLORS.orange:COLORS.metal,.48);
   backdrop.beginPath();backdrop.moveTo(x-18,54+n%3*12);
   backdrop.lineTo(x+103,54+n%3*12);backdrop.strokePath();
  }
  const floor=this.add.graphics().setDepth(-25);
  for(let depth=0;depth<m.width+m.height;depth++){
   for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++){
    if(x+y!==depth)continue;
    const tile={x,y},p=center(tile),water=sewerWater(this.area,tile);
    const solid=!sewerWalkable(this.area,tile);
    const palette=this.area==="sewer-drain"?
     [0x304449,0x354449,0x2c3c42,0x35484d]:
     [0x353c40,0x394547,0x2f3c43,0x3c4547];
    const tone=palette[(x*3+y*5)%palette.length]??COLORS.concrete;
    this.diamond(floor,p,water?COLORS.water:solid?0x26363a:tone,
      water?0x37818a:0x70817c,water?1:1);
    if(water){
     floor.lineStyle(1,COLORS.waterLight,.56);
     floor.beginPath();floor.moveTo(p.x-10,p.y-1);
     floor.lineTo(p.x+11,p.y-1);floor.strokePath();
    }else if(!solid&&(x+y)%5===0){
     floor.lineStyle(2,COLORS.metal,.32);
     floor.beginPath();floor.moveTo(p.x-10,p.y+2);
     floor.lineTo(p.x+9,p.y+2);floor.strokePath();
    }
    if(solid&&!water&&x>0&&y>0&&x<m.width-1&&y<m.height-1){
     floor.fillStyle(0x19272c,.8);floor.fillRoundedRect(p.x-10,p.y-16,20,14,2);
     floor.lineStyle(2,0x7d7763,.35);floor.strokeRoundedRect(p.x-10,p.y-16,20,14,2);
     floor.lineStyle(1,COLORS.metal,.4);
     floor.beginPath();floor.moveTo(p.x-8,p.y-11);floor.lineTo(p.x+8,p.y-11);floor.strokePath();
    }
    if(m.bridges.includes(x)&&y===m.waterRow){
     floor.lineStyle(3,COLORS.orange,.9);
     floor.beginPath();floor.moveTo(p.x-22,p.y+7);floor.lineTo(p.x+22,p.y-7);floor.strokePath();
     floor.fillStyle(0xb0a793,.8);floor.fillCircle(p.x,p.y,3);
    }
   }
  }
  const front=this.add.graphics().setDepth(25);
  // Sombras e tubos acima dos túneis, fora das células caminháveis.
  for(let k=0;k<6;k++){
   const x=240+k*172;
   front.fillStyle(0x17262e,.75);front.fillRoundedRect(x,86,90,10,4);
   front.fillStyle(0xc5a06b,.4);front.fillCircle(x+8,91,3);
  }
  const title=this.add.text(WORLD_WIDTH/2,54,m.name.toUpperCase(),{
   fontFamily:"IBM Plex Mono,monospace",fontSize:"22px",color:"#edd2a3",
   backgroundColor:"#10202bdc",padding:{x:16,y:7},fontStyle:"bold",
  }).setOrigin(.5).setDepth(1200);
  title.setShadow(0,3,"#000000",4);
  this.add.text(WORLD_WIDTH/2,89,m.subtitle,{
   fontFamily:"IBM Plex Mono,monospace",fontSize:"12px",color:"#a8c1bd",
  }).setOrigin(.5).setDepth(1200);
  this.add.text(WORLD_WIDTH/2,WORLD_HEIGHT-51,
   "TOQUE NO PISO PARA CAMINHAR · TOQUE NOS TERMINAIS PARA INTERAGIR",{
    fontFamily:"IBM Plex Mono,monospace",fontSize:"11px",color:"#b7c6bf",
    backgroundColor:"#0d2028d9",padding:{x:11,y:7},
   }).setOrigin(.5).setDepth(1100);
 }
 private drawActors():void{
  const m=SEWER_MAPS[this.area];
  for(const actor of m.actors){
   const p=center(actor.tile),g=this.add.graphics().setDepth(p.y+.5);
   g.fillStyle(0x071116,.6);g.fillEllipse(p.x+2,p.y+2,43,12);
   if(actor.kind==="door"){
    g.fillStyle(0x111e22,1);g.fillRoundedRect(p.x-19,p.y-48,38,49,5);
    g.lineStyle(3,actor.id==="sewer-gate"?COLORS.orange:COLORS.amber,.95);
    g.strokeRoundedRect(p.x-19,p.y-48,38,49,5);
    g.fillStyle(0x7a6651,.67);g.fillRect(p.x-11,p.y-37,22,25);
    g.lineStyle(2,0x2b3231,.92);
    g.beginPath();g.moveTo(p.x-11,p.y-16);g.lineTo(p.x+11,p.y-34);g.strokePath();
   }else{
    g.fillStyle(actor.kind==="evidence"?0x5c493b:0x15252c,1);
    g.fillRoundedRect(p.x-14,p.y-42,28,39,4);
    g.lineStyle(2,actor.kind==="evidence"?0xe2a76c:0xe9bd7b,.95);
    g.strokeRoundedRect(p.x-14,p.y-42,28,39,4);
    g.fillStyle(COLORS.amber,.85);g.fillRect(p.x-9,p.y-35,18,3);
    g.fillRect(p.x-9,p.y-27,12,3);g.fillRect(p.x-9,p.y-19,16,3);
   }
   const label=this.add.text(p.x,p.y-62,actor.label.toUpperCase(),{
    fontFamily:"IBM Plex Mono,monospace",fontSize:"12px",
    color:actor.kind==="evidence"?"#f7cb8c":"#f5e1ba",
    backgroundColor:"#0b1b23e9",padding:{x:6,y:4},
   }).setOrigin(.5).setDepth(p.y+120);
   if(actor.id==="sewer-gate"){
    this.gateLabel=label;
    this.gateLabel.setText(this.progress.gateOpened?"COMPORTA 04 · ABERTA":"COMPORTA 04 · FECHADA");
   }
   // Toques sobre a própria sprite, rótulo ou terminal disparam aproximação.
  }
 }
 private createPlayer():void{
  const p=center(this.playerTile);
  const texture=getPlayerTexture(this.originId,this.appearance);
  this.add.ellipse(p.x,p.y+3,23,8,0x050d12,.57).setDepth(p.y-.1);
  this.player=this.add.sprite(p.x,p.y,texture,frameForDirection(texture,this.direction))
   .setOrigin(.5,.95).setScale(.93).setDepth(p.y+100);
  this.animator=new ActorAnimationController(this.player,texture,this.direction);
 }
 private approach(actor:SewerActor):void{
  const path=sewerApproach(this.area,this.playerTile,actor.tile);
  if(!path)return;
  if(path.length<=1){audioDirector.effect("interact");this.onInteract(actor.id);return;}
  this.pending=actor.id;
  this.walkPath(path);
 }
 private handleTap(pointer:Phaser.Input.Pointer):void{
  if(this.moving)return;
  const p=pointer.positionToCamera(this.cameras.main) as XY;
  const near=SEWER_MAPS[this.area].actors.map(actor=>{
   const c=center(actor.tile);
   const dy=p.y-(c.y-26),dx=p.x-c.x;
   return {actor,score:Math.abs(dx)/31+Math.abs(dy)/60,
     hit:Math.abs(dx)<=37&&p.y>=c.y-91&&p.y<=c.y+17};
  }).filter(item=>item.hit).sort((a,b)=>a.score-b.score)[0];
  if(near){this.approach(near.actor);return;}
  const rx=(p.x-ORIGIN_X)/(TILE_W/2),ry=(p.y-ORIGIN_Y)/(TILE_H/2);
  const tile={x:Math.round((rx+ry)/2),y:Math.round((ry-rx)/2)};
  const c=center(tile);
  if(Math.abs(p.x-c.x)/(TILE_W/2)+Math.abs(p.y-c.y)/(TILE_H/2)>1.1)return;
  const path=sewerRoute(this.area,this.playerTile,tile);
  if(path)this.walkPath(path);
 }
 private handleKeyboard(event:KeyboardEvent):void{
  if(this.moving)return;
  const k=event.key.toLowerCase();
  const d:IsoDirection|undefined=k==="w"||k==="arrowup"?0:k==="d"||k==="arrowright"?1:
   k==="s"||k==="arrowdown"?2:k==="a"||k==="arrowleft"?3:undefined;
  if(d===undefined)return;
  const delta=ISO_DIRECTIONS[d]!;
  const dest={x:this.playerTile.x+delta.x,y:this.playerTile.y+delta.y};
  const path=sewerRoute(this.area,this.playerTile,dest);
  if(path)this.walkPath(path);
 }
 private walkPath(path:SewerTile[]):void{
  if(path.length<2||this.moving)return;
  this.moving=true;
  const steps=path.slice(1);
  const nextStep=():void=>{
   const next=steps.shift();
   if(!next){
    this.moving=false;
    this.animator?.play("idle");
    const interaction=this.pending;this.pending=null;
    if(interaction){audioDirector.effect("interact");this.onInteract(interaction);}
    return;
   }
   const facingNext=facing(this.playerTile,next);
   this.direction=facingNext;
   this.animator?.setDirection(facingNext);
   this.animator?.play("walk");
   const p=center(next);
   this.playerTile={...next};
   this.tweens.add({targets:this.player,x:p.x,y:p.y,duration:166,ease:"Sine.easeInOut",
     onUpdate:()=>this.player.setDepth(this.player.y+100),
     onComplete:nextStep});
  };
  nextStep();
 }
}
