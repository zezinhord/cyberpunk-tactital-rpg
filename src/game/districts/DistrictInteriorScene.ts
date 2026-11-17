import Phaser from "phaser";
import {INNER_BLUEPRINTS,INNER_WIDTH,INNER_HEIGHT,INNER_SPAWN,INNER_EXIT_AT,
 innerPath,innerApproach,innerBlock,type InnerId,type InnerProp} from "./interiors.ts";
import type {Tile} from "./catalog.ts";
import {isEconomyMode} from "../performance.ts";
import {audioDirector} from "../../audio/director.ts";
import {preloadCharacterSprites,createCharacterAnimations,getPlayerTexture,
 frameForDirection,ActorAnimationController,playIdle,type IsoDirection} from "../baixada/sprites.ts";
import type {OriginId} from "../character/origins.ts";
import type {TestAppearance} from "../test-arena/appearance.ts";

const W=1280,H=810,TW=50,TH=26,OX=630,OY=175;
type XY={x:number;y:number};
const project=(t:Tile):XY=>({x:OX+(t.x-t.y)*TW/2,y:OY+(t.x+t.y)*TH/2});
const dirs:readonly Tile[]=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
function shade(hex:number,scale:number):number{
 const rgb=(v:number)=>Math.max(0,Math.min(255,Math.round(v*scale)));
 return rgb((hex>>16)&255)<<16|rgb((hex>>8)&255)<<8|rgb(hex&255);
}
function diamond(g:Phaser.GameObjects.Graphics,p:XY,fill:number):void{
 g.fillStyle(fill,1).lineStyle(1,0x0d1a20,.45);
 g.beginPath();g.moveTo(p.x,p.y-TH/2);g.lineTo(p.x+TW/2,p.y);
 g.lineTo(p.x,p.y+TH/2);g.lineTo(p.x-TW/2,p.y);g.closePath();g.fillPath();g.strokePath();
}
function label(t:string):string{return t.length>26?t.slice(0,23)+"…":t;}
/** Interior real 2.5D, com atores, colisão validada e carga de um único mapa.
 * Não pré-carrega outras salas nem interfere no save dos distritos externos.
 */
export class DistrictInteriorScene extends Phaser.Scene{
 private readonly id:InnerId;
 private readonly origin:OriginId;private appearance:TestAppearance;
 private readonly interact:(id:string)=>void;
 private tile:Tile={...INNER_SPAWN};
 private hero!:Phaser.GameObjects.Sprite;
 private animator?:ActorAnimationController;
 private pending:string|null=null;
 private walking=false;
 private queued:Tile|null=null;
 private staticKey:string;
 constructor(id:InnerId,interact:(id:string)=>void,origin:OriginId,appearance:TestAppearance){
  super({key:"NovaArcadia-Interior-"+id});this.id=id;this.interact=interact;
  this.origin=origin;this.appearance=appearance;
  this.staticKey="na-interior-map-"+id+"-v081";
 }
 setAppearance(p:TestAppearance):void{
  if(p===this.appearance)return;this.appearance=p;
  this.animator?.setTexture(getPlayerTexture(this.origin,p));
 }
 preload():void{
  const blueprint=INNER_BLUEPRINTS[this.id];
  preloadCharacterSprites(this,this.origin,[blueprint.guideTexture]);
 }
 create():void{
  createCharacterAnimations(this);
  this.buildMap();this.addCharacters();this.addInteractables();
  const start=project(this.tile);
  const tex=getPlayerTexture(this.origin,this.appearance);
  this.hero=this.add.sprite(start.x,start.y,tex,frameForDirection(tex,2))
   .setOrigin(.5,.95).setScale(.89).setDepth(start.y+122);
  this.animator=new ActorAnimationController(this.hero,tex,2);
  this.cameras.main.setBounds(0,0,W,H);
  this.adjustZoom();this.scale.on("resize",this.adjustZoom,this);
  this.cameras.main.startFollow(this.hero,true,.17,.17);
  this.cameras.main.centerOn(start.x,start.y-32);
  this.input.on(Phaser.Input.Events.POINTER_DOWN,this.tap,this);
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
   this.input.off(Phaser.Input.Events.POINTER_DOWN,this.tap,this);
   this.scale.off("resize",this.adjustZoom,this);
   this.animator?.dispose();this.tweens.killAll();
   if(this.textures.exists(this.staticKey))this.textures.remove(this.staticKey);
  });
  this.game.canvas?.setAttribute("data-nova-arcadia-interior",this.id);
 }
 private adjustZoom():void{
  const ratio=Math.min(this.scale.width/960,this.scale.height/510);
  this.cameras.main.setZoom(Phaser.Math.Clamp(ratio,isEconomyMode()?.72:.82,
   isEconomyMode()?1.15:1.5));
 }
 private buildMap():void{
  const bp=INNER_BLUEPRINTS[this.id],g=this.add.graphics();
  g.fillStyle(bp.shadow,1).fillRect(0,0,W,H);
  // Habilitar a identidade do espaço sem poluir a rua com obstáculos falsos.
  const wallpaper=shade(bp.wall,.70);
  g.fillStyle(wallpaper,1).fillRect(0,85,W,87);
  const back=shade(bp.wall,.9);
  for(let i=0;i<24;i++){
   const x=24+i*56;
   g.fillStyle(shade(bp.wall,i%3===0?1.18:.78),.58);
   g.fillRect(x,94,4,82);
   if(i%4===0)g.fillStyle(bp.accent,.31).fillRect(x+13,106,31,4);
  }
  for(let y=0;y<INNER_HEIGHT;y++)for(let x=0;x<INNER_WIDTH;x++){
   const at={x,y},p=project(at);
   const tone=(x+y)%2===0?bp.floor:shade(bp.floor,.91);
   diamond(g,p,tone);
   if((x*7+y*3)%8===0){
    g.lineStyle(.85,bp.accent,.26);
    g.beginPath().moveTo(p.x-8,p.y+3).lineTo(p.x+10,p.y+3).strokePath();
   }
   if(bp.texture==="flood"&&y>=10&&x%3!==0){
    g.fillStyle(0x507b84,.27).fillEllipse(p.x,p.y+5,22,5);
   }else if(bp.texture==="rust"&&x%5===0&&y%3===0){
    g.fillStyle(0xe1a16b,.26).fillCircle(p.x+7,p.y+2,2.8);
   }else if(bp.texture==="festival"&&(x+y)%6===0){
    g.fillStyle(bp.accent,.18).fillCircle(p.x,p.y,4.2);
   }else if(bp.texture==="sterile"&&(x+y)%7===0){
    g.fillStyle(bp.accent,.3).fillRect(p.x-6,p.y-2,11,1.4);
   }else if(bp.texture==="green"&&(x*3+y)%7===0){
    g.fillStyle(0xbca480,.35).fillEllipse(p.x+4,p.y-1,7,2.5);
   }
  }
  // Pisos elevados, bancadas e divisórias, com geometria de colisão real.
  for(const at of bp.obstacles){
   const p=project(at);
   g.fillStyle(0x091a21,.4).fillEllipse(p.x,p.y+5,39,13);
   g.fillStyle(shade(bp.wall,.7),1).fillRect(p.x-19,p.y-36,38,34);
   g.fillStyle(shade(bp.wall,1.18),1).fillRect(p.x-21,p.y-42,42,8);
   g.lineStyle(2,bp.accent,.38).strokeRect(p.x-21,p.y-42,42,8);
   if((at.x+at.y)%2)g.fillStyle(bp.accent,.48).fillRect(p.x-14,p.y-27,28,3);
  }
  // Cada função urbana possui fachadas e luz próprias, sem uso de verde
  // narrativo fora dos arquivos controlados pelo Éden.
  if(bp.texture==="flood"||bp.texture==="rust"){
   for(let i=0;i<7;i++){
    const x=120+i*146,y=108+(i%2)*19;
    g.lineStyle(i%2?5:9,bp.accent,.31);
    g.beginPath().moveTo(x,y).lineTo(x+95,y).lineTo(x+95,y+31).strokePath();
    g.fillStyle(bp.accent,.4).fillCircle(x+95,y+31,3);
   }
  }else if(bp.texture==="green"){
   for(let i=0;i<17;i++){
    const x=45+i*72,y=155+(i%3)*4;
    g.lineStyle(2,0x517f61,.58);
    g.beginPath().moveTo(x,y+23).lineTo(x+7,y+7).strokePath();
    g.fillStyle(i%2?0x7aa077:0xa99c62,.72).fillEllipse(x+4,y+9,9,6);
   }
  }else if(bp.texture==="festival"){
   for(let i=0;i<18;i++){
    const x=40+i*65,y=116+(i%3)*4;
    g.fillStyle(i%3===0?0xf39ec7:i%3===1?0x83b7cf:0xf4bf76,.73)
     .fillRect(x,y,29,4).fillCircle(x+8,y-10,2);
   }
  }else{
   for(let i=0;i<9;i++){
    const x=72+i*137,y=120;
    g.fillStyle(0x162c36,.87).fillRect(x,y,58,38);
    g.lineStyle(2,bp.accent,.71).strokeRect(x,y,58,38);
    for(let n=0;n<3;n++)g.fillStyle(bp.accent,.55).fillRect(x+7,y+7+n*9,25+n*5,2);
   }
  }
  g.generateTexture(this.staticKey,W,H);g.destroy();
  this.add.image(0,0,this.staticKey).setOrigin(0).setDepth(-300);
  this.add.text(W/2,55,bp.title.toUpperCase(),{
   fontFamily:"IBM Plex Mono,monospace",fontSize:"23px",fontStyle:"bold",
   color:"#f5e3c5",backgroundColor:"#101f28ee",padding:{x:13,y:7},
  }).setOrigin(.5).setDepth(1700);
  this.add.text(W/2,88,bp.subtitle,{
   fontFamily:"IBM Plex Mono,monospace",fontSize:"12px",
   color:"#cfdfdd",backgroundColor:"#15252dce",padding:{x:9,y:4},
  }).setOrigin(.5).setDepth(1700);
 }
 private createPropGraphic(p:XY,prop:InnerProp):void{
  const bp=INNER_BLUEPRINTS[this.id],g=this.add.graphics().setDepth(p.y+125);
  g.fillStyle(0x07121a,.45).fillEllipse(p.x,p.y+3,41,12);
  const core=prop.kind==="archive"?0x2b4952:prop.kind==="cache"?0x5c4a36:0x324047;
  const height=prop.kind==="archive"?66:prop.kind==="machine"?53:38;
  g.fillStyle(core,1).fillRoundedRect(p.x-22,p.y-height,44,height-2,5);
  g.lineStyle(2,bp.accent,.85).strokeRoundedRect(p.x-22,p.y-height,44,height-2,5);
  if(prop.kind==="archive"){
   g.fillStyle(0x122732,1).fillRect(p.x-16,p.y-height+8,32,31);
   g.fillStyle(bp.accent,.7).fillRect(p.x-12,p.y-height+12,24,4);
   for(let i=0;i<3;i++)g.fillStyle(bp.accent,.5).fillRect(p.x-12,p.y-height+20+i*6,13+i*4,2);
  }else if(prop.kind==="cache"){
   g.fillStyle(shade(bp.accent,.75),.8).fillRect(p.x-15,p.y-height+11,30,6);
   g.lineStyle(2,bp.accent,.7).strokeRect(p.x-16,p.y-height+7,32,12);
  }else{
   g.fillStyle(0x132a33,1).fillCircle(p.x,p.y-height+25,14);
   g.lineStyle(2,bp.accent,.73).strokeCircle(p.x,p.y-height+25,12);
   g.fillStyle(bp.accent,.45).fillCircle(p.x,p.y-height+25,5);
  }
  this.add.text(p.x,p.y-height-11,label(prop.title).toUpperCase(),{
   fontFamily:"IBM Plex Mono,monospace",fontSize:"12px",
   color:"#f6ddae",backgroundColor:"#101c25ed",padding:{x:5,y:3},
  }).setOrigin(.5).setDepth(p.y+148);
 }
 private addCharacters():void{
  const bp=INNER_BLUEPRINTS[this.id],c=project(bp.guideAt),tex=bp.guideTexture;
  const npc=this.add.sprite(c.x,c.y,tex,frameForDirection(tex,2))
   .setOrigin(.5,.95).setScale(.90).setDepth(c.y+133);
  playIdle(npc,tex,2);
  this.add.text(c.x,c.y-76,bp.guide.toUpperCase(),{
   fontFamily:"IBM Plex Mono,monospace",fontSize:"12px",fontStyle:"bold",
   color:"#fff0d1",backgroundColor:"#152229ed",padding:{x:6,y:3},
  }).setOrigin(.5).setDepth(c.y+150);
  if(!isEconomyMode())this.tweens.add({targets:npc,y:c.y-2,duration:1450,
    yoyo:true,repeat:-1,ease:"Sine.easeInOut"});
 }
 private addInteractables():void{
  const bp=INNER_BLUEPRINTS[this.id];
  for(const prop of bp.props)this.createPropGraphic(project(prop.at),prop);
  const p=project(INNER_EXIT_AT),g=this.add.graphics().setDepth(p.y+124);
  g.fillStyle(0x10272f,1).fillRoundedRect(p.x-22,p.y-50,44,48,3);
  g.lineStyle(3,bp.accent,.95).strokeRoundedRect(p.x-22,p.y-50,44,48,3);
  g.fillStyle(bp.accent,.8).fillRect(p.x-8,p.y-32,16,3);
  this.add.text(p.x,p.y-59,"RETORNAR",{
   fontFamily:"IBM Plex Mono,monospace",fontSize:"13px",
   color:"#ffddb1",backgroundColor:"#15232af0",padding:{x:5,y:3},
  }).setOrigin(.5).setDepth(p.y+146);
 }
 private tap(pointer:Phaser.Input.Pointer):void{
  const p=pointer.positionToCamera(this.cameras.main) as XY;
  const bp=INNER_BLUEPRINTS[this.id];
  const actors:[string,Tile][]=[
   ["interior-"+this.id+"-guide",bp.guideAt],
   ...bp.props.map(prop=>["interior-"+this.id+"-"+prop.id,prop.at] as [string,Tile]),
   ["interior-"+this.id+"-exit",INNER_EXIT_AT],
  ];
  const actor=actors.find(([,at])=>{
   const pos=project(at);
   return Math.abs(p.x-pos.x)<31&&p.y>pos.y-90&&p.y<pos.y+13;
  });
  if(actor){
   const route=innerApproach(this.id,this.tile,actor[1]);
   if(!route)return;
   if(this.walking){this.queued=route.at(-1)!;this.pending=actor[0];return;}
   if(route.length<=1){audioDirector.effect("interact");this.interact(actor[0]);return;}
   this.pending=actor[0];this.travel(route);return;
  }
  // Inverse isométrica: linhas diamante; caminho mais próximo para toque.
  const dx=p.x-OX,dy=p.y-OY;
  const x=Math.round(dx/TW+dy/TH),y=Math.round(dy/TH-dx/TW);
  if(innerBlock(this.id,{x,y}))return;
  const route=innerPath(this.id,this.tile,{x,y});
  if(!route)return;
  if(this.walking){this.queued={x,y};this.pending=null;return;}
  this.travel(route);
 }
 private travel(path:readonly Tile[]):void{
  if(path.length<2){
   const id=this.pending;this.pending=null;
   if(id)this.interact(id);return;
  }
  this.walking=true;this.animator?.play("walk");
  let index=1;
  const next=()=>{
   if(!this.hero?.active)return;
   if(index>=path.length){
    this.walking=false;this.animator?.play("idle");
    const id=this.pending;this.pending=null;
    if(id){audioDirector.effect("interact");this.interact(id);}
    const goal=this.queued;this.queued=null;
    if(goal){
     const p=innerPath(this.id,this.tile,goal);
     if(p)this.travel(p);
    }
    return;
   }
   const tile=path[index++]!,point=project(tile);
   const direction:IsoDirection=tile.y<this.tile.y?0:
     tile.x>this.tile.x?1:tile.y>this.tile.y?2:3;
   this.tile=tile;this.animator?.setDirection(direction);
   this.tweens.add({targets:this.hero,x:point.x,y:point.y,duration:125,
    ease:"Linear",onUpdate:()=>this.hero.setDepth(this.hero.y+122),
    onComplete:()=>{audioDirector.effect("step");next()}});
  };
  next();
 }
}
