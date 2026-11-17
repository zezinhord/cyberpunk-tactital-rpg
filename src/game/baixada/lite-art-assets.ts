/** Os MESMOS spritesheets 64x80 de Nova Arcádia usados pelo Phaser.
 * O renderizador Android carrega só duas apresentações da origem atual
 * e quatro skins NPC; não inicializa Phaser nem decodifica 12 origens.
 */
import corporateM from "../../assets/characters/player-corporativo-masculine.png";
import corporateF from "../../assets/characters/player-corporativo-feminine.png";
import baixadaM from "../../assets/characters/player-baixada-masculine.png";
import baixadaF from "../../assets/characters/player-baixada-feminine.png";
import gangueM from "../../assets/characters/player-gangue-masculine.png";
import gangueF from "../../assets/characters/player-gangue-feminine.png";
import militarM from "../../assets/characters/player-militar-masculine.png";
import militarF from "../../assets/characters/player-militar-feminine.png";
import pesquisadorM from "../../assets/characters/player-pesquisador-masculine.png";
import pesquisadorF from "../../assets/characters/player-pesquisador-feminine.png";
import nomadeM from "../../assets/characters/player-nomade-masculine.png";
import nomadeF from "../../assets/characters/player-nomade-feminine.png";
import nilo from "../../assets/characters/npc-nilo.png";
import joana from "../../assets/characters/npc-joana.png";
import saira from "../../assets/characters/npc-saira.png";
import teo from "../../assets/characters/npc-teo.png";
import lia from "../../assets/characters/npc-lia.png";
import ramon from "../../assets/characters/npc-ramon.png";
import duda from "../../assets/characters/npc-duda.png";
import iza from "../../assets/characters/npc-iza.png";
import tomas from "../../assets/characters/npc-tomas.png";
import davi from "../../assets/characters/npc-davi.png";
import marta from "../../assets/characters/npc-marta.png";
import celina from "../../assets/characters/npc-celina.png";
import mara from "../../assets/characters/npc-mara.png";
import iuri from "../../assets/characters/npc-iuri.png";
import kai from "../../assets/characters/npc-kai.png";
import dara from "../../assets/characters/npc-dara.png";
import type {OriginId} from "../character/origins";
import type {TestAppearance} from "../test-arena/appearance";

const ORIGINS:Readonly<Record<OriginId,Readonly<Record<TestAppearance,string>>>>={
 corporativo:{masculine:corporateM,feminine:corporateF},
 baixada:{masculine:baixadaM,feminine:baixadaF},
 gangue:{masculine:gangueM,feminine:gangueF},
 militar:{masculine:militarM,feminine:militarF},
 pesquisador:{masculine:pesquisadorM,feminine:pesquisadorF},
 nomade:{masculine:nomadeM,feminine:nomadeF},
};
export function getPlayerLiteSpriteUrl(origin:OriginId,appearance:TestAppearance):string{return ORIGINS[origin][appearance];}
// 11 NPCs da Baixada: 12 quadros por direção; os contatos regionais carregam somente na cena deles.
// Somente a origem ativa e os NPCs realmente usados são decodificados.
const NPCS:Readonly<Record<string,string>>={
 nilo,joana,saira,teo,
 lia,ramon,duda,iza,tomas,davi,marta,
};
export const LONG_NPC_SHEETS:ReadonlySet<string>=new Set(Object.keys(NPCS));
const PUBLIC_DECOR:Readonly<Record<string,string>>={
 market:"/assets/baixada/market-stall.svg",
 palm:"/assets/baixada/palm-tree.svg",
};
/** Direções do Phaser: N / E / S / O -> linhas NE / SE / SW / NW. */
const ROWS:Readonly<Record<number,number>>={0:3,1:0,2:1,3:2};
export interface LiteArtAssets{
 player:(presentation:TestAppearance)=>HTMLImageElement|null;
 npc:(name:string)=>HTMLImageElement|null;
 decor:(id:"market"|"palm")=>HTMLImageElement|null;
 loaded:()=>number;
 ready:()=>boolean;
 dispose:()=>void;
}
/** onReady nunca bloqueia a cena nem é chamado pelo React durante render.
 * Carregar imagens não força re-render da aplicação, só o Canvas desenha.
 */
export function createLiteArtAssets(origin:OriginId,onReady:()=>void):LiteArtAssets{
 const images=new Map<string,HTMLImageElement>();
 let disposed=false;
 const sources:Readonly<Record<string,string>>={
  playerMasculine:ORIGINS[origin].masculine,
  playerFeminine:ORIGINS[origin].feminine,
  ...NPCS,...PUBLIC_DECOR,
 };
 for(const [id,url] of Object.entries(sources)){
  const img=new Image();
  images.set(id,img);
  img.onload=()=>{if(!disposed)onReady();};
  img.onerror=()=>{if(!disposed)onReady();};
  img.src=url;
 }
 const get=(id:string):HTMLImageElement|null=>{
  const img=images.get(id);
  return img&&img.complete&&img.naturalWidth>0?img:null;
 };
 return {
  player:(presentation)=>get(presentation==="feminine"?"playerFeminine":"playerMasculine"),
  npc:(id)=>get(id),
  decor:(id)=>get(id),
  loaded:()=>[...images.values()].filter(i=>i.complete&&i.naturalWidth>0).length,
  ready:()=>get("playerMasculine")!==null&&get("playerFeminine")!==null&&
    get("nilo")!==null&&get("joana")!==null&&get("saira")!==null&&get("teo")!==null,
  dispose:()=>{
   disposed=true;
   for(const img of images.values()){img.onload=null;img.onerror=null;}
   images.clear();
  },
 };
}
export function drawLiteSprite(ctx:CanvasRenderingContext2D,img:HTMLImageElement|null,
 x:number,footY:number,options:{
  scale:number;direction?:0|1|2|3;frame?:number;columns?:number;
 }):boolean{
 if(!img)return false;
 const cols=options.columns??4;
 const col=Math.max(0,Math.min(cols-1,options.frame??0));
 const row=ROWS[options.direction??2]??1;
 const size=options.scale;
 ctx.save();
 ctx.imageSmoothingEnabled=false; // pixel-art original sem borrões na escala móvel
 ctx.drawImage(img,col*64,row*80,64,80,
  x-32*size,footY-76*size,64*size,80*size);
 ctx.restore();
 return true;
}
