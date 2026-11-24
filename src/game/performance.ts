/** Perfil local de gráficos, sem telemetria externa e sem depender do nome
 * específico do telefone. O perfil econômico é padrão em Android (inclui A07
 * e Redmi Note 12S), mas o jogador pode optar por 60 fps em Configurações.
 */
import type Phaser from "phaser";

export type GraphicsMode="economy"|"balanced";
export const GRAPHICS_MODE_KEY="cyberpunk-tactical-rpg.graphics-mode.v1";
export function isAndroidDevice():boolean{
 return typeof navigator!=="undefined"&&/Android/i.test(navigator.userAgent);
}
export function defaultGraphicsMode(android=isAndroidDevice()):GraphicsMode{
 return android?"economy":"balanced";
}
export function readGraphicsMode():GraphicsMode{
 try{
  const value=globalThis.localStorage?.getItem(GRAPHICS_MODE_KEY);
  if(value==="economy"||value==="balanced")return value;
 }catch{}
 return defaultGraphicsMode();
}
export function saveGraphicsMode(mode:GraphicsMode):boolean{
 if(mode!=="economy"&&mode!=="balanced")return false;
 try{
  if(!globalThis.localStorage)return false;
  globalThis.localStorage.setItem(GRAPHICS_MODE_KEY,mode);
  return true;
 }catch{return false;}
}
export function isEconomyMode():boolean{return readGraphicsMode()==="economy";}
/** Phaser 4: limita updates estáveis em Android, evita MSAA caro, preserva
 * suavização temporal de movimento (roundPixels desativado).
 * Alterar o perfil só vale para o próximo Phaser.Game criado.
 */
export function performanceGameConfig(mode:GraphicsMode=readGraphicsMode()):
 Pick<Phaser.Types.Core.GameConfig,"fps"|"render">{
 const economy=mode==="economy";
 return {
  fps:{target:economy?30:60,limit:economy?30:0},
  render:{
   antialias:!economy,
   antialiasGL:false,
   roundPixels:false,
   powerPreference:"default",
   batchSize:economy?2048:4096,
   preserveDrawingBuffer:false,
  },
 };
}
