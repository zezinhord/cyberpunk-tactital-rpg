/** Nova Arcádia — distribuição modular, sem pacotes de enchimento.
 * A presença de uma entrada aqui não significa que o pack existe.
 * Somente digests SHA-256 auditados e publicados habilitam download.
 */
export const PACK_RELEASE_TAG="nova-arcadia-v200-final-3gb-assets";
export const FIRST_MILESTONE_RELEASE_TAG="nova-arcadia-v200-milestone-1474";
export const SECOND_MILESTONE_RELEASE_TAG="nova-arcadia-v200-milestone-1774";
export const TRUSTED_RELEASE_TAGS=[
 FIRST_MILESTONE_RELEASE_TAG,SECOND_MILESTONE_RELEASE_TAG,PACK_RELEASE_TAG
] as const;
export function isTrustedReleaseTag(tag:unknown):tag is typeof TRUSTED_RELEASE_TAGS[number]{
 return typeof tag==="string"&&TRUSTED_RELEASE_TAGS.some(allowed=>allowed===tag);
}
export const PACK_IDS=[
 "baixada","ferrugem","aurea","subsolo","setor-zero","prisma","periferia",
] as const;
export type PackId=(typeof PACK_IDS)[number];
export interface AssetPackEntry{
 id:PackId;title:string;file:string;
 compressedBytes:number;uncompressedBytes:number;sha256:string;
 artworkCount:number;locationCount:number;
 /** Each path MUST correspond to a real in-game object, scene, or cinematic. */
 assets:ReadonlyArray<{path:string;room:string;kind:"mural"|"prop"|"dossier"|"cutscene"|"spritesheet";sha256:string;caption?:string}>;
}
export interface PackCatalog{
 version:2;tag:string;totalBytes:number;packs:readonly AssetPackEntry[];
}
export const EMPTY_CATALOG:Readonly<PackCatalog>={
 version:2,tag:PACK_RELEASE_TAG,totalBytes:0,packs:[],
};
export const BASELINE_APK_BYTES=1143503198;
export const FINAL_DELIVERY_MIN_BYTES=3_000_000_000;
export const RELEASE_ASSET_MAX_BYTES=2_147_483_648;
/** Do not let arbitrary remote URLs pass into a privileged native downloader. */
export function packDownloadUrl(id:PackId,tag:string=PACK_RELEASE_TAG):string{
 if(!isPackId(id)||!isTrustedReleaseTag(tag))throw new Error("Release de conteúdo não autorizado.");
 return "https://github.com/zezinhord/cyberpunk-tactital-rpg/releases/download/"+
  encodeURIComponent(tag)+"/NA20-"+encodeURIComponent(id)+".zip";
}
export function isPackId(raw:unknown):raw is PackId{
 return typeof raw==="string"&&PACK_IDS.some(id=>id===raw);
}
export function isAssetPath(raw:unknown):raw is string{
 return typeof raw==="string"&&raw.length>0&&raw.length<220&&
  /^(murals|props|dossiers|cutscenes|spritesheets)\/[a-z0-9-]+\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(png|webp|webm)$/.test(raw)&&
  !raw.includes("..");
}
const validSha=(s:unknown)=>typeof s==="string"&&/^[a-f0-9]{64}$/.test(s);
export function validatePackCatalog(raw:unknown):raw is PackCatalog{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const v=raw as Record<string,unknown>;
 if(v.version!==2||!isTrustedReleaseTag(v.tag)||!Array.isArray(v.packs)||
  !Number.isSafeInteger(v.totalBytes)||Number(v.totalBytes)<0||
  v.packs.length>PACK_IDS.length)return false;
 const ids=new Set<string>();
 let sum=0;
 for(const entry of v.packs){
  if(!entry||typeof entry!=="object"||Array.isArray(entry))return false;
  const p=entry as Record<string,unknown>;
  if(!isPackId(p.id)||ids.has(p.id)||p.file!=="NA20-"+p.id+".zip"||
   !validSha(p.sha256)||!Number.isSafeInteger(p.compressedBytes)||
   Number(p.compressedBytes)<1024||Number(p.compressedBytes)>=RELEASE_ASSET_MAX_BYTES||
   !Number.isSafeInteger(p.uncompressedBytes)||Number(p.uncompressedBytes)<1024||Number(p.uncompressedBytes)>2_200_000_000||
   !Number.isSafeInteger(p.artworkCount)||Number(p.artworkCount)<1||
   !Number.isSafeInteger(p.locationCount)||Number(p.locationCount)<1||
   !Array.isArray(p.assets)||p.assets.length!==p.artworkCount||
   typeof p.title!=="string"||p.title.length<3||p.title.length>80)return false;
  const paths=new Set<string>();
  for(const a of p.assets){
   if(!a||typeof a!=="object"||Array.isArray(a))return false;
   const item=a as Record<string,unknown>;
   if(!isAssetPath(item.path)||paths.has(item.path)||!validSha(item.sha256)||
    typeof item.room!=="string"||!item.room.startsWith(p.id+"-")||
    !["mural","prop","dossier","cutscene","spritesheet"].includes(String(item.kind))||
    (item.caption!==undefined&&(typeof item.caption!=="string"||item.caption.length>240)))return false;
   paths.add(item.path);
  }
  ids.add(p.id);sum+=Number(p.compressedBytes);
 }
 return sum===v.totalBytes;
}
export function deliverySize(catalog:PackCatalog,baseBytes=BASELINE_APK_BYTES):{
 totalBytes:number;shortfallBytes:number;targetReached:boolean}{
 const totalBytes=baseBytes+catalog.totalBytes;
 return {totalBytes,shortfallBytes:Math.max(0,FINAL_DELIVERY_MIN_BYTES-totalBytes),
  targetReached:totalBytes>=FINAL_DELIVERY_MIN_BYTES&&
    catalog.packs.length===PACK_IDS.length};
}
