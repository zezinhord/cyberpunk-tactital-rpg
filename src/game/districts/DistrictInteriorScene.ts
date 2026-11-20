import Phaser from "phaser";
import {INNER_BLUEPRINTS,INNER_WIDTH,INNER_HEIGHT,INNER_SPAWN,INNER_EXIT_AT,
 innerPath,innerApproach,innerBlock,type InnerId,type InnerProp} from "./interiors.ts";
import type {Tile} from "./catalog.ts";
import {isEconomyMode} from "../performance.ts";
import {isV20IllustratedRoom,environmentArtKey,environmentArtUrl}
  from "./v20-illustrations.ts";
import {packAssetUrl} from "../assets/native-pack-manager.ts";
import {audioDirector} from "../../audio/director.ts";
import {preloadCharacterSprites,createCharacterAnimations,getPlayerTexture,
 frameForDirection,ActorAnimationController,playIdle,type IsoDirection} from "../baixada/sprites.ts";
import type {OriginId} from "../character/origins.ts";
import type {TestAppearance} from "../test-arena/appearance.ts";

const W=1280,H=810,TW=50,TH=26,OX=630,OY=175;
type XY={x:number;y:number};
const project=(t:Tile):XY=>({x:OX+(t.x-t.y)*TW/2,y:OY+(t.x+t.y)*TH/2});
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
  // All 112 illustrations remain on disk. Only this room's mural and
  // three physical evidence sprites are decoded into RAM when entered.
  if(isV20IllustratedRoom(this.id)){
    this.load.image(environmentArtKey(this.id),
      packAssetUrl(this.id,"mural")??environmentArtUrl(this.id));
    for(const prop of blueprint.props)
      this.load.image(environmentArtKey(this.id,prop.id),
        packAssetUrl(this.id,"prop",prop.id)??environmentArtUrl(this.id,prop.id));
  }
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
   // Release exactly the room's four illustrations on exit (not 112 at boot).
   if(isV20IllustratedRoom(this.id)){
     const ids=[environmentArtKey(this.id),
       ...INNER_BLUEPRINTS[this.id].props.map(p=>environmentArtKey(this.id,p.id))];
     for(const key of ids)if(this.textures.exists(key))this.textures.remove(key);
   }
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
  // Painéis arquitetônicos originais de cada bairro, junto às paredes.
  // Estão atrás dos atores e não adicionam colisões fictícias nem atlases.
  this.paintIdentity(g);
  g.generateTexture(this.staticKey,W,H);g.destroy();
  this.add.image(0,0,this.staticKey).setOrigin(0).setDepth(-300);
  // The mural covers ONLY the back wall; not tiles or navigation targets.
  // If an asset cannot be loaded, the existing Phaser mural is the fallback.
  if(isV20IllustratedRoom(this.id)&&
     this.textures.exists(environmentArtKey(this.id))){
    this.add.image(48,86,environmentArtKey(this.id))
      .setOrigin(0).setDisplaySize(W-96,98).setDepth(-299);
  }
  this.add.text(W/2,55,bp.title.toUpperCase(),{
   fontFamily:"IBM Plex Mono,monospace",fontSize:"23px",fontStyle:"bold",
   color:"#f5e3c5",backgroundColor:"#101f28ee",padding:{x:13,y:7},
  }).setOrigin(.5).setDepth(1700);
  this.add.text(W/2,88,bp.subtitle,{
   fontFamily:"IBM Plex Mono,monospace",fontSize:"12px",
   color:"#cfdfdd",backgroundColor:"#15252dce",padding:{x:9,y:4},
  }).setOrigin(.5).setDepth(1700);
 }
 private paintIdentity(g:Phaser.GameObjects.Graphics):void{
  const bp=INNER_BLUEPRINTS[this.id],t=bp.accent;
  if(this.id==="baixada-community"){
    // Mural de depoimentos, patchwork de famílias e lençóis reaproveitados.
    g.fillStyle(0x364e49,.94).fillRect(380,117,510,65);
    g.lineStyle(3,0xe8c18b,.7).strokeRect(380,117,510,65);
    for(let i=0;i<20;i++){
      const x=390+i*24,y=128+(i%3)*9;
      g.fillStyle(i%4===0?0xc39d72:i%4===1?0x6b9290:
        i%4===2?0x94736f:0xa9ae8b,.85).fillRect(x,y,19,12);
      g.lineStyle(1,0x172a29,.65).strokeRect(x,y,19,12);
    }
    for(let i=0;i<6;i++){
      g.lineStyle(2,0xdcb98a,.6);
      g.beginPath().moveTo(220+i*165,127).lineTo(263+i*165,144).strokePath();
    }
  }else if(this.id==="ferrugem-foundry"){
    // Fornalhas ativas, válvulas e placas de segurança de cobre industrial.
    for(let i=0;i<4;i++){
      const x=120+i*286;
      g.fillStyle(0x2f3436,1).fillRoundedRect(x,111,115,75,7);
      g.fillStyle(0x8d4e33,.95).fillRoundedRect(x+15,130,83,51,4);
      g.fillStyle(0xec9d54,.63).fillEllipse(x+55,158,68,23);
      g.fillStyle(0x2a3034,.94).fillRect(x+12,141,90,6);
      for(let n=0;n<4;n++)g.fillStyle(n%2?0x252e34:0xe5ae60,.78)
        .fillRect(x+6+n*26,113,17,6);
      g.lineStyle(5,t,.38).beginPath().moveTo(x+52,115).lineTo(x+52,84).strokePath();
    }
  }else if(this.id==="aurea-archive"){
    // Torre de servidores: porta-eclusa, painéis ópticos e relógio de rede.
    for(let i=0;i<7;i++){
      const x=80+i*164;
      g.fillStyle(0x20313e,.97).fillRoundedRect(x,118,104,68,5);
      g.lineStyle(2,0x82adbe,.75).strokeRoundedRect(x,118,104,68,5);
      for(let j=0;j<5;j++){
        g.fillStyle(j%2?0x5f8797:0x142936,.9).fillRect(x+11,127+j*10,80,7);
        for(let k=0;k<3;k++)g.fillStyle(k===0?0x93c9d8:0xc0a372,.7)
          .fillRect(x+15+k*9,130+j*10,4,3);
      }
    }
  }else if(this.id==="subsolo-hideout"){
    // Túneis em arco e manta hidráulica com infiltrações.
    for(let i=0;i<7;i++){
      const x=70+i*180;
      g.lineStyle(8,0x203942,.95);
      g.beginPath().moveTo(x,190).lineTo(x,128)
       .lineTo(x+80,109).lineTo(x+160,128).lineTo(x+160,190).strokePath();
      g.lineStyle(3,0xd1a871,.53);
      g.beginPath().moveTo(x+9,190).lineTo(x+9,135)
       .lineTo(x+80,120).lineTo(x+151,135).lineTo(x+151,190).strokePath();
    }
    g.fillStyle(0x31636d,.31).fillRect(0,174,W,13);
  }else if(this.id==="setor-zero-lab"){
    // Câmaras de isolamento lacradas em acrílico translúcido.
    for(let i=0;i<6;i++){
      const x=97+i*202;
      g.fillStyle(0x343342,.98).fillRoundedRect(x,107,116,81,13);
      g.lineStyle(3,0xe8a875,.67).strokeRoundedRect(x,107,116,81,13);
      g.fillStyle(0x77909c,.29).fillRoundedRect(x+12,115,91,64,17);
      g.lineStyle(1,0x9fb2b8,.52).strokeRoundedRect(x+12,115,91,64,17);
      for(let j=0;j<4;j++){
        g.lineStyle(2,j%2?0xe4ba90:0x8b5b70,.5);
        g.beginPath().moveTo(x+22+j*20,121).lineTo(x+22+j*20,166).strokePath();
      }
    }
  }else if(this.id==="prisma-backstage"){
    // Palco alternativo: cortinas, linha de refletores e estrutura de som.
    g.fillStyle(0x41273d,.97).fillRect(0,105,W,95);
    for(let i=0;i<12;i++){
      const x=i*117;
      g.fillStyle(i%3===0?0x76435d:0x5c3455,.88)
       .fillRect(x,111,103,81);
      g.lineStyle(3,i%2?0xe698bf:0x96b5cd,.61);
      g.beginPath().moveTo(x+14,122).lineTo(x+14,188).strokePath();
    }
    g.lineStyle(6,0xacc1c3,.77).beginPath().moveTo(15,110)
      .lineTo(W-15,110).strokePath();
    for(let i=0;i<11;i++){
      const x=45+i*119;
      g.fillStyle(i%3===0?0xf5afcf:i%3===1?0x91b2d1:0xefbf88,.75)
       .fillCircle(x,110,7);
    }
  }else if(this.id==="periferia-waterworks"){
    // Cisternas tubulares e placas solares: preservação de água fora da rede.
    for(let i=0;i<5;i++){
      const x=122+i*242;
      g.fillStyle(0x384a49,.94).fillRoundedRect(x,118,109,70,20);
      g.lineStyle(3,0xd9bd83,.79).strokeRoundedRect(x,118,109,70,20);
      for(let n=0;n<4;n++)g.lineStyle(2,0x99a99f,.59)
       .beginPath().moveTo(x+22+n*20,124).lineTo(x+22+n*20,180).strokePath();
      g.fillStyle(0x355567,.92).fillRect(x+122,127,76,40);
      g.lineStyle(2,0xa9c0bc,.66).strokeRect(x+122,127,76,40);
      for(let n=1;n<4;n++)g.lineStyle(1,0x82b0bd,.53).beginPath()
        .moveTo(x+122+n*19,127).lineTo(x+122+n*19,167).strokePath();
    }
  }else{
    // Expansão 2.0: arquitetura própria por zona, desenhada uma única vez
    // no Canvas do mapa, sem carregar dezenas de texturas no boot do Android.
    // O id define uma composição reproduzível, distinta do mapa vizinho.
    const seed=[...bp.id].reduce((n,ch)=>((n*31+ch.charCodeAt(0))>>>0),17);
    const isIndustrial=bp.texture==="rust";
    const isFlood=bp.texture==="flood";
    const isNeon=bp.texture==="festival";
    const isSterile=bp.texture==="sterile";
    const isGarden=bp.texture==="green";
    const panels=5+(seed%3);
    for(let i=0;i<panels;i++){
      const x=42+i*Math.floor((W-95)/panels)+(seed%19);
      const y=105+(i*7+seed)%22;
      const width=90+((seed>>>((i%4)*4))%35);
      if(isIndustrial){
        g.fillStyle(shade(bp.wall,.61),.98).fillRoundedRect(x,y,width,89,5);
        g.fillStyle(shade(bp.accent,.80),.69).fillRect(x+12,y+14,width-24,8);
        g.fillStyle(0x29333a,.90).fillRect(x+15,y+32,width-30,48);
        for(let j=0;j<3;j++)g.lineStyle(3,bp.accent,.5)
          .beginPath().moveTo(x+18+j*25,y+33).lineTo(x+18+j*25,y+78).strokePath();
      }else if(isFlood){
        g.lineStyle(8,shade(bp.wall,.62),.91).beginPath()
          .moveTo(x,y+90).lineTo(x,y+23).lineTo(x+width/2,y+2)
          .lineTo(x+width,y+23).lineTo(x+width,y+90).strokePath();
        g.lineStyle(2,bp.accent,.55).beginPath()
          .moveTo(x+8,y+78).lineTo(x+8,y+25).lineTo(x+width/2,y+12)
          .lineTo(x+width-8,y+25).strokePath();
      }else if(isNeon){
        g.fillStyle(shade(bp.wall,.65),.93).fillRect(x,y,width,87);
        g.fillStyle(bp.accent,.26).fillRect(x+6,y+11,width-12,49);
        for(let j=0;j<4;j++)
          g.lineStyle(2,j%2?0xacc2ce:bp.accent,.67)
           .beginPath().moveTo(x+14+j*23,y+12).lineTo(x+14+j*23,y+76).strokePath();
      }else if(isSterile){
        g.fillStyle(0x1c303e,.97).fillRoundedRect(x,y,width,86,6);
        g.lineStyle(2,bp.accent,.68).strokeRoundedRect(x,y,width,86,6);
        for(let j=0;j<5;j++){
          g.fillStyle(j%2?shade(bp.wall,.75):0x182a38,.91)
            .fillRect(x+10,y+10+j*13,width-20,9);
          g.fillStyle(bp.accent,.68).fillRect(x+16,y+13+j*13,5+(seed+j*7)%27,3);
        }
      }else if(isGarden){
        g.fillStyle(shade(bp.wall,.71),.97).fillRoundedRect(x,y,width,80,11);
        g.lineStyle(2,bp.accent,.76).strokeRoundedRect(x,y,width,80,11);
        for(let j=0;j<4;j++){
          g.lineStyle(3,0x78998a,.57).beginPath().moveTo(x+17+j*22,y+69)
            .lineTo(x+17+j*22,y+22).strokePath();
          g.fillStyle(j%2?0x9dab84:0xc1b18e,.76)
            .fillEllipse(x+23+j*22,y+23,25,10);
        }
      }
    }
    // Painel frontal informa a função do espaço sem criar um colisor falso.
    const sx=80+(seed%3)*64;
    g.fillStyle(0x11262f,.90).fillRoundedRect(sx,199,235,48,5);
    g.lineStyle(2,t,.7).strokeRoundedRect(sx,199,235,48,5);
    for(let i=0;i<4;i++)
      g.fillStyle(t,.43+(i%2)*.18).fillRect(sx+14,210+i*8,
        45+((seed>>>i)&31)*3,3);
  }
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
  if(isV20IllustratedRoom(this.id)&&
     this.textures.exists(environmentArtKey(this.id,prop.id)))
    this.add.image(p.x,p.y-2,environmentArtKey(this.id,prop.id))
      .setOrigin(.5,1).setDisplaySize(49,58).setDepth(p.y+129);
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
