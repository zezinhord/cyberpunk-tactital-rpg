/** Content-integrity contract for ONE mandatory Nova Arcádia game installation.
 * Physically split archives are an Android transport detail, never a DLC
 * entitlement. All 3,808 authenticated artworks are required before gameplay.
 * This module is pure so release and mobile tests can share these invariants.
 */
import {PACK_IDS,PACK_RELEASE_TAG,deliverySize,validatePackCatalog,
 type PackId,type PackCatalog} from "./pack-catalog.ts";
export const REQUIRED_GAME_IMAGES=3808;
export const REQUIRED_GAME_DISTRICTS=7;
export const REQUIRED_GAME_KINDS=Object.freeze({
 mural:4,prop:12,dossier:48,cutscene:64,spritesheet:96,
 route:80,evac:64,shelter:80,nexus:96,
} as const);
export type GameContentStatus=Readonly<Record<PackId,boolean>>;
export function emptyContentStatus():Record<PackId,boolean>{
 return Object.fromEntries(PACK_IDS.map(id=>[id,false])) as Record<PackId,boolean>;
}
/** Do not admit an incomplete or old checkpoint catalog to mandatory install. */
export function isCompleteGameCatalog(raw:unknown):raw is PackCatalog{
 if(!validatePackCatalog(raw))return false;
 const catalog=raw as PackCatalog;
 if(catalog.tag!==PACK_RELEASE_TAG||
    catalog.packs.length!==REQUIRED_GAME_DISTRICTS||
    !deliverySize(catalog).targetReached||
    catalog.packs.reduce((n,p)=>n+p.artworkCount,0)!==REQUIRED_GAME_IMAGES)return false;
 const seen=new Set<string>();
 for(const pack of catalog.packs){
  if(pack.locationCount!==4||pack.artworkCount!==544)return false;
  const kinds=new Map<string,number>();
  for(const asset of pack.assets){
   if(seen.has(asset.sha256))return false;
   seen.add(asset.sha256);
   kinds.set(asset.kind,(kinds.get(asset.kind)??0)+1);
   const prefix=asset.kind==="nexus"?"nexus":asset.kind+"s";
   if(!asset.path.startsWith(prefix+"/"+asset.room+"/"))return false;
  }
  for(const [kind,required] of Object.entries(REQUIRED_GAME_KINDS))
   if(kinds.get(kind)!==required)return false;
 }
 return seen.size===REQUIRED_GAME_IMAGES;
}
export function nextMissingGameDistrict(status:GameContentStatus):PackId|null{
 return PACK_IDS.find(id=>status[id]!==true)??null;
}
export function hasInstalledEntireGame(status:GameContentStatus):boolean{
 return nextMissingGameDistrict(status)===null;
}
export function installedGameBytes(catalog:PackCatalog,status:GameContentStatus):number{
 return catalog.packs.reduce((sum,p)=>sum+(status[p.id]?p.compressedBytes:0),0);
}
export function fullGameProgress(catalog:PackCatalog,status:GameContentStatus,
 transfer?:{id:PackId;bytes:number}|null):number{
 if(catalog.totalBytes<=0)return 0;
 const current=transfer&&!status[transfer.id]?
  Math.min(Math.max(0,transfer.bytes),catalog.packs.find(p=>p.id===transfer.id)?.compressedBytes??0):0;
 return Math.min(100,Math.floor(100*(installedGameBytes(catalog,status)+current)/catalog.totalBytes));
}
