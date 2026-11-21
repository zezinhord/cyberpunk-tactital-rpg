import assert from "node:assert/strict";
import {BASELINE_APK_BYTES,FINAL_DELIVERY_MIN_BYTES,
 EMPTY_CATALOG,PACK_IDS,PACK_RELEASE_TAG,FIRST_MILESTONE_RELEASE_TAG,SECOND_MILESTONE_RELEASE_TAG,THIRD_MILESTONE_RELEASE_TAG,isTrustedReleaseTag,
 packDownloadUrl,isPackId,isAssetPath,validatePackCatalog,deliverySize}
 from "../src/game/assets/pack-catalog.ts";
const sha="a".repeat(64);
assert.equal(PACK_IDS.length,7);
assert.equal(new Set(PACK_IDS).size,7);
assert.equal(validatePackCatalog(EMPTY_CATALOG),true);
assert.equal(deliverySize(EMPTY_CATALOG).targetReached,false);
assert.equal(deliverySize(EMPTY_CATALOG).shortfallBytes,
 FINAL_DELIVERY_MIN_BYTES-BASELINE_APK_BYTES);
assert.equal(isPackId("setor-zero"),true);
assert.equal(isPackId("../injections"),false);
assert.equal(isAssetPath("murals/baixada-observatorio/wall.webp"),true);
assert.equal(isAssetPath("props/prisma-radio/document.png"),true);
for(const invalid of ["../../app.js","murals/baixada/../bad.webp",
 "props/fake.svg","http://evil.site/file.png","murals/baixada/thing.json"])
 assert.equal(isAssetPath(invalid),false,invalid);
for(const id of PACK_IDS)
 assert.ok(packDownloadUrl(id).endsWith("/NA20-"+id+".zip"));
function candidate(compressedBytes=280_000_000){
 const packs=PACK_IDS.map((id,i)=>({
  id,title:"Distrito "+id,file:"NA20-"+id+".zip",
  compressedBytes,uncompressedBytes:compressedBytes-450,
  sha256:(i.toString(16).repeat(64)).slice(0,64),
  artworkCount:1,locationCount:1,
  assets:[{path:"murals/"+id+"-interior/map.webp",
   room:id+"-interior",kind:"mural",sha256:sha}],
 }));
 return {version:2,tag:PACK_RELEASE_TAG,
  totalBytes:packs.reduce((sum,p)=>sum+p.compressedBytes,0),packs};
}
const done=candidate();
assert.equal(validatePackCatalog(done),true);
const firstMilestone={...done,tag:FIRST_MILESTONE_RELEASE_TAG};
assert.equal(validatePackCatalog(firstMilestone),true);
assert.equal(isTrustedReleaseTag(FIRST_MILESTONE_RELEASE_TAG),true);
assert.equal(isTrustedReleaseTag(SECOND_MILESTONE_RELEASE_TAG),true);
assert.equal(isTrustedReleaseTag(THIRD_MILESTONE_RELEASE_TAG),true);
assert.equal(validatePackCatalog({...done,tag:THIRD_MILESTONE_RELEASE_TAG}),true);
assert.ok(packDownloadUrl("prisma",THIRD_MILESTONE_RELEASE_TAG)
 .includes("/releases/download/nova-arcadia-v200-milestone-2074/"));
assert.equal(isAssetPath("routes/baixada-observatorio/patrulha-01.webp"),true);

assert.equal(validatePackCatalog({...done,tag:SECOND_MILESTONE_RELEASE_TAG}),true);
assert.ok(packDownloadUrl("aurea",SECOND_MILESTONE_RELEASE_TAG)
 .includes("/releases/download/nova-arcadia-v200-milestone-1774/"));

assert.equal(isTrustedReleaseTag("../unsafe"),false);
assert.ok(packDownloadUrl("baixada",FIRST_MILESTONE_RELEASE_TAG)
 .includes("/releases/download/nova-arcadia-v200-milestone-1474/"));
assert.throws(()=>packDownloadUrl("baixada","../evil"));

assert.equal(deliverySize(done).targetReached,true);
assert.equal(deliverySize(done).shortfallBytes,0);
assert.ok(deliverySize(done).totalBytes>3_000_000_000,
 "Only manifest backed byte counts can unlock the final release gate");
const tooSmall=candidate(120_000_000);
assert.equal(validatePackCatalog(tooSmall),true);
assert.equal(deliverySize(tooSmall).targetReached,false);
const oneDistrict={...done,packs:done.packs.slice(0,1),
 totalBytes:done.packs[0].compressedBytes};
assert.equal(validatePackCatalog(oneDistrict),true);
assert.equal(deliverySize(oneDistrict).targetReached,false);
assert.equal(validatePackCatalog({...done,totalBytes:1}),false);
assert.equal(validatePackCatalog({...done,tag:"../unsafe"}),false);
assert.equal(validatePackCatalog({...done,packs:[...done.packs,done.packs[0]]}),false);
assert.equal(validatePackCatalog({...done,packs:[{...done.packs[0],
 compressedBytes:2_147_483_648},...done.packs.slice(1)]}),false);
assert.equal(validatePackCatalog({...done,packs:[{...done.packs[0],
 assets:[{...done.packs[0].assets[0],path:"../../thing.webp"}]},...done.packs.slice(1)]}),false);
assert.equal(validatePackCatalog({...done,packs:[{...done.packs[0],
 sha256:"unverified"},...done.packs.slice(1)]}),false);
console.log("Seven real pack metadata slots, path/URL validation, GitHub per-file cap and exact >=3GB release gate checked.");
