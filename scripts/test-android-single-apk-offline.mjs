/** Signed Android WebView end-to-end acceptance test:
 * one 3+GB APK, offline activation, all seven verified districts and no
 * downloading any ZIPs. Uses Android emulator with disabled network.
 */
import {execFileSync,spawnSync} from "node:child_process";
const PACKAGE=process.env.NA_TEST_PACKAGE||"com.cyberpunk.tacticalrpg.qa201";
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
const adb=(...args)=>execFileSync("adb",args,{
 encoding:"utf8",timeout:12000,maxBuffer:4*1024*1024,
}).trim();
/** Heavy offline extraction can momentarily pause the emulator's adb daemon.
 * Retry ONLY transport timeouts/offline states, never Android assertion errors
 * or a persistent emulator crash. A dead emulator still fails the release.
 */
async function reliableAdb(...args){
 let failure;
 for(let attempt=0;attempt<3;attempt++){
  try{return adb(...args);}
  catch(error){
   failure=error;
   const message=String(error)+(error?.stderr?String(error.stderr):"");
   if(!/ETIMEDOUT|device offline|device not found|connection refused|no devices\/emulators/i.test(message))
    throw error;
   if(attempt<2)await sleep(1200*(attempt+1));
  }
 }
 throw Error("Android emulator/adb unavailable after 3 attempts on "+
  args.join(" ")+": "+String(failure));
}
let session=null;const diagnostic={package:PACKAGE};
async function browserSocket(url){
 const ws=new WebSocket(url),pending=new Map();let id=0,errors=[];
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});});
 ws.addEventListener("message",event=>{
  const item=JSON.parse(String(event.data));
  if(item.method==="Runtime.exceptionThrown")errors.push(item.params?.exceptionDetails?.text??"Webview error");
  const p=pending.get(item.id);
  if(p){pending.delete(item.id);item.error?p.reject(Error(item.error.message)):p.resolve(item.result);}
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const next=++id;pending.set(next,{resolve,reject});ws.send(JSON.stringify({id:next,method,params}));
 });
 await send("Runtime.enable");
 return {send,errors,close:()=>ws.close()};
}
try{
 let target=null;
 for(let attempt=0;attempt<100;attempt++){
  let pid=null;try{pid=adb("shell","pidof",PACKAGE).split(" ")[0];}catch{}
  if(!pid){await sleep(1000);continue;}
  try{
   spawnSync("adb",["forward","tcp:9222","localabstract:webview_devtools_remote_"+pid],{timeout:3500});
   const response=await fetch("http://127.0.0.1:9222/json",{signal:AbortSignal.timeout(2000)});
   if(response.ok){
    const tabs=await response.json();
    target=tabs.find(t=>t.type==="page"&&t.webSocketDebuggerUrl);
    if(target)break;
   }
  }catch{}
  await sleep(1000);
 }
 if(!target)throw Error("Could not attach to signed APK WebView");
 session=await browserSocket(target.webSocketDebuggerUrl);
 async function snapshot(expression){
  const d=await session.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(d.exceptionDetails)throw Error(d.exceptionDetails.text);
  return d.result?.value;
 }
 const state=()=>snapshot('(()=>{const root=document.querySelector(".na-install-root");return {gate:!!root,ready:!!document.querySelector(".na-title"),button:!!root?.querySelector(".na-install-actions .primary"),auto:!!root?.innerText?.includes("A preparação começou automaticamente"),embedded:!!root?.innerText?.includes("Todos os sete distritos"),error:root?.querySelector("[role=alert]")?.textContent?.slice(0,220)||"",text:root?.innerText?.slice(0,550)||""};})()');
 // Network is already disabled BEFORE Activity launch by the workflow.
 // There must be NO opt-in, skip, optional DLC or download action.
 let initial=null;
 for(let i=0;i<120;i++){
  initial=await state();
  if(initial?.error)throw Error("Automatic game provisioning failed: "+initial.error);
  if(initial?.ready)throw Error("Gameplay appeared before seven mandatory districts were prepared");
  if(initial?.auto&&initial?.gate&&initial?.embedded)break;
  await sleep(1000);
 }
 diagnostic.initial=initial;
 if(!initial?.auto||!initial?.embedded||initial?.button)
  throw Error("RC15 did not START required offline provisioning automatically: "+JSON.stringify(initial));
 const limit=20*60;let last;
 for(let i=0;i<limit;i++){
  last=await state();
  if(last?.error)throw Error("Complete game offline extraction failed: "+last.error);
  if(last?.ready){diagnostic.success=true;diagnostic.preparationSeconds=i;break;}
  if(i%30===0){console.log("NA_OFFLINE_INSTALL_PROGRESS",JSON.stringify({seconds:i,state:last}));}
  await sleep(1000);
 }
 diagnostic.final=last;
 if(!diagnostic.success)throw Error("Game did not reach playable title within 20 min offline: "+JSON.stringify(last));
 const check=await snapshot('(async()=>{const p=globalThis.Capacitor?.Plugins?.NovaAssetPacks; if(!p)return {error:"No native plugin"}; const ids=["baixada","ferrugem","aurea","subsolo","setor-zero","prisma","periferia"];const out=await Promise.all(ids.map(async id=>({id,...await p.status({id})})));return {count:out.length,verified:out.every(x=>x.installed&&typeof x.sha256==="string"&&x.sha256.length===64),details:out.map(x=>({id:x.id,storedBytes:x.storedBytes}))};})()');
 diagnostic.gameFiles=check;
 if(!check?.verified||check?.count!==7)throw Error("One APK did not install all 7 districts: "+JSON.stringify(check));
 // The RC16 APK passed the seven-district gate but forced Android into Lite.
 // This RC17 regression test actually enters exploration in the signed APK
 // while still offline and refuses a substitute city or missing original art.
 const until=async(expression,label,limit=120)=>{
  for(let i=0;i<limit;i++){
   const value=await snapshot(expression);
   if(value)return value;
   await sleep(600);
  }
  throw Error("Android signed APK did not reach "+label);
 };
 diagnostic.fullWorldPhase="start-new-character";
 await until('Boolean(document.querySelectorAll(".na-title-option")[1])',
   "character creation action");
 await snapshot('document.querySelectorAll(".na-title-option")[1].click();true');
 await until('Boolean(document.querySelector("#character-name"))',"character creation form");
 await snapshot(`(()=>{
   const e=document.querySelector("#character-name");
   const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;
   set.call(e,"Teste RC17 Completo");
   e.dispatchEvent(new Event("input",{bubbles:true}));
   document.querySelectorAll(".origin-card")[1].click();
   document.querySelectorAll(".class-grid .class-option")[6].click();
   return true;
 })()`);
 await until('Boolean(document.querySelector(".creation-shell .primary-button:not([disabled])"))',
   "valid character");
 await snapshot('document.querySelector(".creation-shell .primary-button").click();true');
 await until('Boolean(document.querySelector(".na-opening-screen"))',"official cinematic prologue");
 await snapshot('document.querySelector(\'button[aria-label="Pular prólogo com confirmação"]\').click();true');
 await until('Boolean(document.querySelector("#na-skip-opening-title"))',"canonical skip confirmation");
 await snapshot('document.querySelector(".na-cinema-confirm section div button:last-child").click();true');
 await until('Boolean(document.querySelector(".intro-shell .primary-button"))',"origin intro");
 await snapshot('document.querySelector(".intro-shell .primary-button").click();true');
 await until('Boolean(document.querySelector(\'.baixada-world[data-engine="phaser-full"][data-world-edition="complete"]\'))',
   "Phaser full world, NEVER Lite",150);
 const completed=await until(`(()=>{
   const host=document.querySelector('.baixada-world[data-engine="phaser-full"]');
   return host?.dataset.sceneState==="ready"&&host?.dataset.originalSprites==="true";
 })()`,"rendered complete city with original sprites",150);
 diagnostic.fullWorld=await snapshot(`(()=>{
   const host=document.querySelector('.baixada-world'),canvas=host?.querySelector('canvas');
   return {engine:host?.dataset.engine,edition:host?.dataset.worldEdition,
    renderer:host?.dataset.renderer,scene:host?.dataset.sceneState,
    originalSprites:host?.dataset.originalSprites,
    canvasWidth:canvas?.width,canvasHeight:canvas?.height,
    hasLiteRenderer:!!document.querySelector('.baixada-world[data-engine="native-2d"]')};
 })()`);
 if(!completed||diagnostic.fullWorld.engine!=="phaser-full"||
    diagnostic.fullWorld.edition!=="complete"||
    diagnostic.fullWorld.originalSprites!=="true"||
    diagnostic.fullWorld.hasLiteRenderer||diagnostic.fullWorld.canvasWidth<200||
    diagnostic.fullWorld.canvasHeight<150)
  throw Error("Lite or black map in offline APK: "+JSON.stringify(diagnostic.fullWorld));
 console.log("ANDROID_RC17_FULL_PHASER_NO_LITE_PASS",JSON.stringify(diagnostic.fullWorld));
 // Native insets follow the Android view-focus lifecycle. Do not assume
 // a log was emitted synchronously the instant the WebView becomes playable.
 // Keep the real two-bars-hidden assertion, with a bounded 8 s retry window.
 async function verifyImmersive(phase){
  let entries=[];
  for(let attempt=0;attempt<12;attempt++){
   const raw=await reliableAdb("shell","logcat","-d","-s","NovaArcadiaImmersive:I","*:S");
   entries=raw.split("\n").filter(x=>x.includes("NovaArcadiaImmersive")).slice(-20);
   if(entries.some(x=>x.includes("statusVisible=false")&&
     x.includes("navigationVisible=false")))return entries;
   if(attempt<11)await sleep(650);
  }
  throw Error("Android did not confirm native hidden bars during "+phase+
    ": "+JSON.stringify(entries));
 }
 diagnostic.resumePhase="check-immersive-before-HOME";
 diagnostic.immersiveLog=await verifyImmersive("initial launch");
 diagnostic.resumePhase="return-from-HOME";
 console.log("NA_OFFLINE_INSTALL_COMPLETE",JSON.stringify({
  preparationSeconds:diagnostic.preparationSeconds,verifiedDistricts:check.count,
  immersiveBeforeHome:true,
 }));
 await reliableAdb("shell","logcat","-c");
 await reliableAdb("shell","input","keyevent","KEYCODE_HOME");
 await sleep(1500);
 await reliableAdb("shell","am","start","-W","-n",
  PACKAGE+"/com.cyberpunk.tacticalrpg.MainActivity");
 await sleep(1800);
 // Returning from HOME may destroy the WebView/CDP socket even if Android
 // correctly restarts the game. Never use an old WebSocket after HOME.
 // Inspect actual Android foreground Activity and the fresh native insets log.
 diagnostic.resumePhase="confirm-activity-and-process";
 const resumedActivity=await reliableAdb("shell","dumpsys","activity","activities");
 diagnostic.afterResume={
  activityResumed:resumedActivity.includes(PACKAGE+"/com.cyberpunk.tacticalrpg.MainActivity"),
  pid:await reliableAdb("shell","pidof",PACKAGE),
 };
 if(!diagnostic.afterResume.activityResumed||!diagnostic.afterResume.pid)
  throw Error("Android Activity not resumed after returning from HOME");
 diagnostic.resumePhase="confirm-immersive-after-HOME";
 diagnostic.afterResume.immersiveLog=await verifyImmersive("returning from HOME");
 console.log("ANDROID_SINGLE_APK_AUTO_FULL_GAME_IMMERSIVE_PASS="+JSON.stringify(diagnostic));
}catch(e){
 const result=spawnSync("adb",["get-state"],{encoding:"utf8",timeout:4000});
 diagnostic.adbState={status:result.status,stdout:String(result.stdout??"").trim(),
  stderr:String(result.stderr??"").trim(),error:String(result.error??"")};
 if(!result.error&&result.status===0){
  try{diagnostic.activity=adb("shell","dumpsys","activity","activities")
    .split("\n").filter(x=>/ResumedActivity/.test(x));}catch{}
 }
 console.error("ANDROID_SINGLE_APK_OFFLINE_FULL_GAME_FAILED="+JSON.stringify({error:String(e),...diagnostic}));
 process.exitCode=1;
}finally{
 session?.close();try{spawnSync("adb",["forward","--remove","tcp:9222"],{timeout:4500});}catch{}
}
