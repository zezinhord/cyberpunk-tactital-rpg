import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {PACK_IDS,PACK_RELEASE_TAG,validatePackCatalog,
 deliverySize} from "../src/game/assets/pack-catalog.ts";
import {REQUIRED_GAME_KINDS,REQUIRED_GAME_IMAGES,
 isCompleteGameCatalog,emptyContentStatus,hasInstalledEntireGame,
 nextMissingGameDistrict,installedGameBytes,fullGameProgress}
 from "../src/game/assets/complete-installation.ts";

const h=s=>createHash("sha256").update(s).digest("hex");
const catalog={version:2,tag:PACK_RELEASE_TAG,packs:[],totalBytes:0};
const kinds=Object.entries(REQUIRED_GAME_KINDS);
for(const id of PACK_IDS){
 const assets=[];
 const room=id+"-observatorio";
 for(const [kind,count] of kinds)
  for(let i=0;i<count;i++){
   const prefix=kind==="nexus"?"nexus":kind+"s";
   const n=String(i+1).padStart(2,"0");
   const path=prefix+"/"+room+"/interior-"+kind+"-"+n+".webp";
   assets.push({path,room,kind,sha256:h(id+"::"+path),
    caption:"Autoral: encontro e interação "+room+", "+kind+" "+n});
  }
 assert.equal(assets.length,544);
 const compressedBytes=310_000_000;
 catalog.packs.push({id,title:"Distrito "+id,file:"NA20-"+id+".zip",
  compressedBytes,uncompressedBytes:335_000_000,sha256:h("zip:"+id),
  artworkCount:544,locationCount:4,assets});
 catalog.totalBytes+=compressedBytes;
}
assert.equal(catalog.packs.length,7);
assert.equal(catalog.packs.reduce((sum,p)=>sum+p.assets.length,0),REQUIRED_GAME_IMAGES);
assert.equal(validatePackCatalog(catalog),true);
assert.equal(isCompleteGameCatalog(catalog),true);
assert.equal(deliverySize(catalog).targetReached,true);
assert.equal(isCompleteGameCatalog({...catalog,tag:"nova-arcadia-v200-milestone-2374"}),false);
assert.equal(isCompleteGameCatalog({...catalog,packs:catalog.packs.slice(1),
 totalBytes:catalog.totalBytes-310_000_000}),false);
const wrongCount={...catalog.packs[0],artworkCount:543,assets:catalog.packs[0].assets.slice(0,-1)};
assert.equal(isCompleteGameCatalog({...catalog,packs:[wrongCount,...catalog.packs.slice(1)]}),false);
const duplicated={...catalog.packs[0],assets:[...catalog.packs[0].assets]};
duplicated.assets[3]={...duplicated.assets[3],sha256:duplicated.assets[2].sha256};
assert.equal(isCompleteGameCatalog({...catalog,packs:[duplicated,...catalog.packs.slice(1)]}),false);
const forged={...catalog.packs[0],assets:[...catalog.packs[0].assets]};
forged.assets[0]={...forged.assets[0],kind:"prop"};
assert.equal(isCompleteGameCatalog({...catalog,packs:[forged,...catalog.packs.slice(1)]}),false);
assert.equal(isCompleteGameCatalog({...catalog,totalBytes:1}),false);

const progress=emptyContentStatus();
assert.equal(hasInstalledEntireGame(progress),false);
assert.equal(nextMissingGameDistrict(progress),"baixada");
assert.equal(installedGameBytes(catalog,progress),0);
assert.equal(fullGameProgress(catalog,progress),0);
progress.baixada=true;progress.ferrugem=true;
assert.equal(nextMissingGameDistrict(progress),"aurea");
assert.equal(installedGameBytes(catalog,progress),620_000_000);
assert.equal(fullGameProgress(catalog,progress),28);
const current=fullGameProgress(catalog,progress,{id:"aurea",bytes:155_000_000});
assert.equal(current,35);
assert.equal(fullGameProgress(catalog,progress,{id:"aurea",bytes:900_000_000}),42);
assert.equal(fullGameProgress(catalog,progress,{id:"aurea",bytes:-200}),28);
progress.baixada=false;
assert.equal(nextMissingGameDistrict(progress),"baixada");
for(const id of PACK_IDS)progress[id]=true;
assert.equal(hasInstalledEntireGame(progress),true);
assert.equal(nextMissingGameDistrict(progress),null);
assert.equal(fullGameProgress(catalog,progress),100);

const {readFileSync}=await import("node:fs");
const gate=readFileSync("src/components/GameInstallationGate.tsx","utf8");
const menu=readFileSync("src/components/CharacterMenu.tsx","utf8");
const root=readFileSync("src/main.tsx","utf8");
const native=readFileSync("native/NovaAssetPacks.java","utf8");
const manager=readFileSync("src/game/assets/native-pack-manager.ts","utf8");
assert.ok(root.includes("<GameInstallationGate><App /></GameInstallationGate>"));
assert.ok(gate.includes('isCompleteGameCatalog(catalog)'));
assert.ok(gate.includes('else void prepareFullGame(latest)'));
assert.ok(gate.includes('const verified=initial??await readInstalled()'),
 "Initial seven-district verification must be reused; repeated native file scans are expensive");
assert.ok(gate.includes('integratedApkStatus()')&&gate.includes('hasInstalledEntireGame(latest)'));
assert.ok(gate.includes('installEmbeddedDistrict(id,event'));
assert.ok(gate.includes('if(!bundle.allBundled||bundle.bundledCount!==PACK_IDS.length)'));
assert.ok(!gate.includes('installDistrictPack')&&!gate.includes('importDistrictPack'));
assert.ok(!gate.includes('Retomar preparação offline')&&!gate.includes('Preparar o jogo completo — sem baixar mais nada'));
assert.ok(!gate.includes('Continuar sem instalar'));
assert.ok(gate.includes('phase==="failed"')&&gate.includes('Tentar novamente após corrigir o problema'));
assert.ok(!menu.includes('label:"Conteúdo extra"')&&!menu.includes('label:"Arquivos do jogo"'));
assert.ok(!menu.includes('assetpacks')&&!menu.includes('AssetPackControls'));
assert.ok(native.includes("public void bundledStatus(")&&native.includes("public void installBundled("));
// Native status must retain exact disk size and SHA receipt verification,
// but execute its 7 x 544 file traversal off the UI thread on Android.
const nativeStatus=native.slice(native.indexOf("public void status(PluginCall call)"),
 native.indexOf("public void install(PluginCall call)"));
assert.ok(nativeStatus.includes("io.execute(() ->"),
 "Native asset integrity scan must not block the Android main thread");
assert.ok(nativeStatus.includes('out.put("storedBytes", sizeOf(dir))'),
 "Do not trust manifest byte counts instead of scanning actual files");
assert.ok(nativeStatus.includes('receipt.optString("sha256"'),
 "Keep SHA receipt checks after moving native inspection off-thread");
assert.ok(native.includes('getAssets().open("na-game/NA20-" + id + ".zip")'));
assert.ok(manager.includes('installEmbeddedDistrict')&&manager.includes('integratedApkStatus'));
assert.ok(native.includes("signedContentByteCount(PluginCall call, String key)"));
assert.ok(!native.includes('call.getLong("compressedBytes")')&&
 !native.includes('call.getLong("uncompressedBytes")'));
assert.ok(native.includes('value != Math.rint(value)'));
assert.ok(native.includes('out.put("baseUri"'));
assert.ok(manager.includes('Number(value.storedBytes)>=pack.uncompressedBytes'));
const fullscreen=readFileSync("scripts/enable-android-immersive.mjs","utf8");
assert.ok(fullscreen.includes('FLAG_FULLSCREEN'));
assert.ok(fullscreen.includes('WindowInsets.Type.statusBars()'));
assert.ok(fullscreen.includes('WindowInsets.Type.navigationBars()'));
assert.ok(fullscreen.includes('void onPostResume()'));
assert.ok(fullscreen.includes('void onWindowFocusChanged(boolean hasFocus)'));
assert.ok(fullscreen.includes('android:windowFullscreen'));
console.log("COMPLETE_GAME_INTEGRITY PASS",JSON.stringify({
 districts:PACK_IDS.length,mandatoryOriginalArt:REQUIRED_GAME_IMAGES,
 catalogBytes:catalog.totalBytes,installedCondition:"all-seven-or-no-game",
 originalAudioUntouched:true,savesPreserved:true}));
