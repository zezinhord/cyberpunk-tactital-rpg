/** Capacitor 8 client for *verified* app-private Android asset packs.
 * Retains bundled RC4 art when a pack has not been installed.
 * No automatically downloaded 3GB; the player must explicitly opt in.
 */
import {Capacitor,registerPlugin,type PluginListenerHandle} from "@capacitor/core";
import {EMPTY_CATALOG,type AssetPackEntry,type PackCatalog,PACK_IDS,
 deliverySize,packDownloadUrl,validatePackCatalog,isPackId,isAssetPath,
 type PackId} from "./pack-catalog.ts";
import {FINAL_ASSET_CATALOG} from "./published-packs.ts";

const URI_PREFIX="cyberpunk-tactical-rpg.v2.pack-base.";
interface NativePackProgress{id:string;stage:string;bytes:number;total:number}
interface NativePackStatus{id:string;installed:boolean;sha256?:string;
 storedBytes:number;freeBytes:number;stage?:string;bytes?:number;total?:number}
interface NativePackInstall{id:string;installed:true;storedBytes:number;baseUri:string}
interface NativePackApi{
 status(options:{id:PackId}):Promise<NativePackStatus>;
 install(options:{id:PackId;releaseTag:string;sha256:string;compressedBytes:number;
  uncompressedBytes:number;artworkCount:number}):Promise<NativePackInstall>;
 asset(options:{id:PackId;path:string}):Promise<{uri:string;bytes:number}>;
 remove(options:{id:PackId}):Promise<{removedBytes:number}>;
 addListener(eventName:"progress",
  callback:(progress:NativePackProgress)=>void):Promise<PluginListenerHandle>;
}
const plugin=registerPlugin<NativePackApi>("NovaAssetPacks");
export interface PackInstallStatus{
 id:PackId;available:boolean;installed:boolean;expectedBytes:number;
 installedBytes:number;freeBytes:number;
}
export function verifiedCatalog():PackCatalog{
 return validatePackCatalog(FINAL_ASSET_CATALOG)?FINAL_ASSET_CATALOG:EMPTY_CATALOG;
}
export function hasCompleteThreeGigRelease():boolean{
 return deliverySize(verifiedCatalog()).targetReached;
}
export function nativePackPlatform():boolean{
 return Capacitor.isNativePlatform()&&Capacitor.getPlatform()==="android";
}
const trustedBaseUri=(value:unknown):value is string=>
 typeof value==="string"&&
 /^file:\/\/\/data\/(?:user\/\d+|data)\/com\.cyberpunk\.tacticalrpg\.qa20[01]\/files\/na-expansion-packs\/[a-z0-9-]+\/$/.test(value);
export function packForRoom(room:string):AssetPackEntry|null{
 const catalog=verifiedCatalog();
 const pack=catalog.packs.find(p=>room.startsWith(p.id+"-"));
 return pack??null;
}
export function packAssetUrl(room:string,kind:"mural"|"prop"|"dossier"|"cutscene"|"spritesheet"|"route",pathHint?:string):string|null{
 if(!nativePackPlatform())return null;
 const pack=packForRoom(room);
 if(!pack)return null;
 const raw=globalThis.localStorage?.getItem(URI_PREFIX+pack.id);
 if(!raw||!trustedBaseUri(raw))return null;
 const entry=pack.assets.find(a=>a.room===room&&a.kind===kind&&
  (pathHint===undefined||a.path.includes(pathHint)));
 if(!entry||!isAssetPath(entry.path))return null;
 return Capacitor.convertFileSrc(raw+entry.path);
}
export async function inspectPack(id:PackId):Promise<PackInstallStatus>{
 const pack=verifiedCatalog().packs.find(x=>x.id===id);
 if(!nativePackPlatform()||!pack)
  return {id,available:!!pack,installed:false,expectedBytes:pack?.compressedBytes??0,
   installedBytes:0,freeBytes:0};
 const value=await plugin.status({id});
 const installed=value.installed===true&&value.sha256===pack.sha256;
 if(!installed)globalThis.localStorage?.removeItem(URI_PREFIX+id);
 return {id,available:true,installed,expectedBytes:pack.compressedBytes,
  installedBytes:installed?value.storedBytes:0,freeBytes:value.freeBytes};
}
export async function installDistrictPack(id:PackId,
 onProgress?:(progress:NativePackProgress)=>void):Promise<PackInstallStatus>{
 if(!nativePackPlatform())throw new Error("Pacotes adicionais exigem Android.");
 if(!isPackId(id))throw new Error("Distrito inválido.");
 const pack=verifiedCatalog().packs.find(p=>p.id===id);
 if(!pack)throw new Error("Este conteúdo ainda não foi publicado e auditado.");
 // URL is fixed by the native plugin and never controlled by the caller.
 if(!packDownloadUrl(pack.id,verifiedCatalog().tag).startsWith("https://github.com/"))
  throw new Error("Origem de download não confiável.");
 const listener=onProgress?await plugin.addListener("progress",onProgress):null;
 try{
  const result=await plugin.install({
   id,releaseTag:verifiedCatalog().tag,sha256:pack.sha256,compressedBytes:pack.compressedBytes,
   uncompressedBytes:pack.uncompressedBytes,artworkCount:pack.artworkCount,
  });
  if(!result.installed||!trustedBaseUri(result.baseUri))
   throw new Error("O instalador não confirmou um diretório válido.");
  // Only update the local asset resolver after native SHA verification.
  globalThis.localStorage?.setItem(URI_PREFIX+id,result.baseUri);
  return await inspectPack(id);
 }finally{await listener?.remove();}
}
export async function removeDistrictPack(id:PackId):Promise<void>{
 if(!nativePackPlatform())return;
 await plugin.remove({id});
 globalThis.localStorage?.removeItem(URI_PREFIX+id);
}
export function formatAssetSize(bytes:number):string{
 return bytes>=1_000_000_000?(bytes/1_000_000_000).toFixed(2)+" GB":
 bytes>=1_000_000?(bytes/1_000_000).toFixed(1)+" MB":
 (bytes/1_000).toFixed(1)+" KB";
}
export const PUBLISHED_DISTRICTS:readonly PackId[]=PACK_IDS.filter(
 id=>verifiedCatalog().packs.some(p=>p.id===id));
