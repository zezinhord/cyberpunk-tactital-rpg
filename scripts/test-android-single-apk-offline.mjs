/** Signed Android WebView end-to-end acceptance test:
 * one 3+GB APK, offline activation, all seven verified districts and no
 * downloading any ZIPs. Uses Android emulator with disabled network.
 */
import {execFileSync,spawnSync} from "node:child_process";
const PACKAGE=process.env.NA_TEST_PACKAGE||"com.cyberpunk.tacticalrpg.qa201";
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
const adb=(...args)=>execFileSync("adb",args,{encoding:"utf8",timeout:25000}).trim();
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
 // The Android status bar must remain hidden when the game regains focus.
 const barLogs=adb("shell","logcat","-d","-s","NovaArcadiaImmersive:I","*:S");
 diagnostic.immersiveLog=barLogs.split("\\n").filter(x=>x.includes("NovaArcadiaImmersive")).slice(-10);
 if(!diagnostic.immersiveLog.some(x=>x.includes("statusVisible=false")&&x.includes("navigationVisible=false")))
  throw Error("Android did not confirm fullscreen hidden system bars after launch: "+JSON.stringify(diagnostic.immersiveLog));
 adb("shell","input","keyevent","KEYCODE_HOME");
 await sleep(1500);
 adb("shell","am","start","-W","-n",PACKAGE+"/com.cyberpunk.tacticalrpg.MainActivity");
 await sleep(1800);
 const afterResume=await state();
 diagnostic.afterResume=afterResume;
 if(!afterResume?.ready)throw Error("Game did not recover after returning from Android HOME");
 const resumeLog=adb("shell","logcat","-d","-s","NovaArcadiaImmersive:I","*:S");
 if(!resumeLog.split("\\n").slice(-15).some(x=>x.includes("statusVisible=false")))
  throw Error("Status bar reappeared after returning to app");
 console.log("ANDROID_SINGLE_APK_AUTO_FULL_GAME_IMMERSIVE_PASS="+JSON.stringify(diagnostic));
}catch(e){
 try{diagnostic.activity=adb("shell","dumpsys","activity","activities").split("\n").filter(x=>/ResumedActivity/.test(x));}catch{}
 console.error("ANDROID_SINGLE_APK_OFFLINE_FULL_GAME_FAILED="+JSON.stringify({error:String(e),...diagnostic}));
 process.exitCode=1;
}finally{
 session?.close();try{spawnSync("adb",["forward","--remove","tcp:9222"],{timeout:4500});}catch{}
}
