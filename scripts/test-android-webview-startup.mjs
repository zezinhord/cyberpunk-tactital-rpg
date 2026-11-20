/** Testa a WebView instalada no Android/emulador, não o Chrome desktop. */
import {execFileSync,spawnSync} from "node:child_process";
const PACKAGE=process.env.NA_TEST_PACKAGE||"com.cyberpunk.tacticalrpg.qa100";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const adb=(...args)=>execFileSync("adb",args,{encoding:"utf8",timeout:20000}).trim();
const d={};let session=null;
function snapshot(){
 try{d.activity=adb("shell","dumpsys","activity","activities").split("\n").filter(s=>/mResumed|topResumed|ResumedActivity/.test(s)).slice(0,8);}catch(e){d.activity=String(e);}
 try{d.pid=adb("shell","pidof",PACKAGE);}catch{d.pid="not running";}
 try{d.webviewSockets=adb("shell","cat","/proc/net/unix").split("\n").filter(s=>s.includes("webview_devtools_remote")).slice(0,6);}catch{}
}
async function connect(url){
 const ws=new WebSocket(url),pending=new Map();let id=0;
 const exceptions=[],consoleErrors=[];
 await new Promise((ok,fail)=>{ws.addEventListener("open",ok,{once:true});ws.addEventListener("error",fail,{once:true});});
 ws.addEventListener("message",ev=>{
  const m=JSON.parse(String(ev.data));
  if(m.method==="Runtime.exceptionThrown")exceptions.push(m.params?.exceptionDetails?.exception?.description??m.params?.exceptionDetails?.text);
  if(m.method==="Runtime.consoleAPICalled"&&m.params?.type==="error")consoleErrors.push(m.params?.args?.map(a=>a.value??a.description).join(" "));
  const p=pending.get(m.id);
  if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{const next=++id;pending.set(next,{resolve,reject});ws.send(JSON.stringify({id:next,method,params}));});
 await send("Runtime.enable");
 await send("Page.enable");
 return {send,exceptions,consoleErrors,close:()=>ws.close()};
}
try{
 const started=Date.now();let pid="",target=null;
 for(let i=0;i<75;i++){
  try{pid=adb("shell","pidof",PACKAGE).split(" ")[0];}catch{}
  if(!pid){await sleep(1000);continue;}
  try{
   spawnSync("adb",["forward","tcp:9222","localabstract:webview_devtools_remote_"+pid],{timeout:4000});
   const response=await fetch("http://127.0.0.1:9222/json",{signal:AbortSignal.timeout(1500)});
   if(response.ok){const tabs=await response.json();target=tabs.find(t=>t.type==="page"&&t.webSocketDebuggerUrl);if(target)break;}
  }catch{}
  await sleep(1000);
 }
 snapshot();
 if(!target)throw Error("WebView DevTools não disponível: verificar captura e logs do Android");
 session=await connect(target.webSocketDebuggerUrl);
 let last={};
 const expression='(()=>{const root=document.getElementById("root");return {href:location.href,title:document.title,readyState:document.readyState,nodes:root?.children.length??0,text:document.body?.innerText?.slice(0,850)??"",hasTitle:!!document.querySelector(".na-title"),hasError:!!document.querySelector("[role=alert]")};})()';
 for(let i=0;i<35;i++){
  const result=await session.send("Runtime.evaluate",{expression,returnByValue:true});
  last=result.result?.value??{exception:result.exceptionDetails?.text};
  if(last.hasTitle){d.success=true;d.firstFrameMs=Date.now()-started;break;}
  await sleep(500);
 }
 d.document=last;d.errors=session.consoleErrors;d.exceptions=session.exceptions;
 if(!d.success)throw Error("O menu de Nova Arcádia não apareceu na WebView do Android");
 console.log("ANDROID_WEBVIEW_BOOT_OK="+JSON.stringify(d));
}catch(error){
 snapshot();console.error("ANDROID_WEBVIEW_BOOT_FAILED="+JSON.stringify({error:String(error),...d}));process.exitCode=1;
}finally{
 session?.close();try{spawnSync("adb",["forward","--remove","tcp:9222"],{timeout:4000});}catch{}
}
