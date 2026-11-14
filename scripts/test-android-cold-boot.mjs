/** Teste de BOOT FRIO Android sem cache de Phaser, sem personagens salvos.
 * Reproduz o problema observado no Galaxy/Redmi: após criar personagem,
 * a Baixada deve desenhar no primeiro carregamento, nunca ficar em overlay.
 */
import {spawn,spawnSync} from "node:child_process";
import {mkdtemp,mkdir,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";

const URL="http://127.0.0.1:4175",DEBUG=9245;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(callback,label,tries=90){
 for(let i=0;i<tries;i++){
  try{const result=await callback();if(result)return result;}catch{}
  await sleep(250);
 }
 throw new Error("Android cold boot não avançou: "+label);
}
function browserCommand(){
 for(const name of ["chromium","chromium-browser","google-chrome","google-chrome-stable"]){
  const x=spawnSync("which",[name],{encoding:"utf8"});
  if(x.status===0)return x.stdout.trim();
 }
 throw new Error("Chromium ausente no QA");
}
async function session(wsUrl){
 const ws=new WebSocket(wsUrl),requests=new Map();
 let next=0;
 await new Promise((resolve,reject)=>{
  ws.addEventListener("open",resolve,{once:true});
  ws.addEventListener("error",reject,{once:true});
 });
 ws.addEventListener("message",e=>{
  const message=JSON.parse(String(e.data)),pending=requests.get(message.id);
  if(!pending)return;
  requests.delete(message.id);
  if(message.error)pending.reject(new Error(message.error.message));
  else pending.resolve(message.result);
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++next;requests.set(id,{resolve,reject});
  ws.send(JSON.stringify({id,method,params}));
 });
 return {send,close:()=>ws.close()};
}
let preview,browser,cdp;
try{
 preview=spawn("npm",["run","preview","--","--host","127.0.0.1","--port","4175"],{
  stdio:"ignore",detached:true,
 });
 await until(async()=>{const resp=await fetch(URL);return resp.ok;},"servidor de preview");
 const dir=await mkdtemp(path.join(tmpdir(),"na-android-cold-"));
 browser=spawn(browserCommand(),[
  "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
  "--no-first-run","--disable-extensions","--remote-allow-origins=*",
  "--remote-debugging-port="+DEBUG,"--user-data-dir="+dir,"about:blank",
 ],{stdio:"ignore",detached:true});
 const tab=await until(async()=>{
  const resp=await fetch("http://127.0.0.1:"+DEBUG+"/json");
  const tabs=await resp.json();
  return tabs.find(x=>x.type==="page"&&x.webSocketDebuggerUrl);
 },"tab Chromium Android");
 cdp=await session(tab.webSocketDebuggerUrl);
 const send=cdp.send;
 const evalJS=async script=>{
  const result=await send("Runtime.evaluate",{
   expression:script,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)
   throw new Error("Erro JS Android: "+JSON.stringify(result.exceptionDetails));
  return result.result?.value;
 };
 const has=selector=>evalJS("Boolean(document.querySelector("+JSON.stringify(selector)+"))");
 await send("Page.enable");
 await send("Runtime.enable");
 await send("Emulation.setUserAgentOverride",{userAgent:
  "Mozilla/5.0 (Linux; Android 15; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"});
 await send("Emulation.setDeviceMetricsOverride",{
  width:914,height:411,deviceScaleFactor:1.5,mobile:true,
  screenOrientation:{type:"landscapePrimary",angle:90},
 });
 // Não limpar cache porque este perfil é NOVO: emula instalação limpa.
 await send("Page.navigate",{url:URL});
 await until(()=>has(".na-title-option"),"tela principal nova");
 await evalJS('document.querySelectorAll(".na-title-option")[1].click();true');
 await until(()=>has("#character-name"),"criação inicial");
 await evalJS(`(()=>{
  const e=document.querySelector("#character-name");
  const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;
  setter.call(e,"Teste Android Frio");
  e.dispatchEvent(new Event("input",{bubbles:true}));
  document.querySelectorAll(".origin-card")[1].click();
  document.querySelectorAll(".class-grid .class-option")[6].click();
  return true;
 })()`);
 await until(()=>has(".creation-shell .primary-button:not([disabled])"),
  "nome e classe no Android");
 await evalJS('document.querySelector(".creation-shell .primary-button").click();true');
 await until(()=>has(".na-opening-screen"),"abertura cinematográfica");
 await evalJS('document.querySelector(".na-opening-top button").click();true');
 await until(()=>has(".intro-shell .primary-button"),"introdução da origem");
 await evalJS('document.querySelector(".intro-shell .primary-button").click();true');
 await until(()=>has(".baixada-world[data-engine=native-2d]"),"motor independente Android");
 await until(()=>evalJS('document.querySelector(".baixada-world")?.dataset.sceneState==="ready"'),
  "mapa nativo realmente desenhado",40);
 const metrics=await evalJS(`(()=>{
   const host=document.querySelector(".baixada-world");
   const canvas=host.querySelector("canvas"),ctx=canvas.getContext("2d");
   if(!ctx)return {error:"Canvas 2D ausente"};
   const colors=new Set();
   for(let y=1;y<6;y++)for(let x=1;x<8;x++){
    const rgb=ctx.getImageData(Math.floor(canvas.width*x/8),
      Math.floor(canvas.height*y/6),1,1).data;
    colors.add(rgb[0]+","+rgb[1]+","+rgb[2]);
   }
   return {engine:host.dataset.engine,ready:host.dataset.sceneState,
    colors:colors.size,bytes:canvas.width*canvas.height*4,
    w:host.clientWidth,h:host.clientHeight,
    loading:!!host.querySelector(".na-world-startup"),
    saved:!!localStorage.getItem("cyberpunk-tactical-rpg.character.v1")};
 })()`);
 if(metrics.error||metrics.engine!=="native-2d"||metrics.ready!=="ready"||
    metrics.colors<5||metrics.bytes>4_500_000||metrics.w<600||metrics.h<300||
    metrics.loading||!metrics.saved)
   throw new Error("Android voltou ao mapa vazio: "+JSON.stringify(metrics));
 await mkdir("qa",{recursive:true});
 const png=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
 await writeFile("qa/baixada-android-boot-frio-914x411.png",Buffer.from(png.data,"base64"));
 // Navegação deve continuar operante após primeiro boot do APK.
 await send("Input.dispatchKeyEvent",{
  type:"keyDown",key:"d",code:"KeyD",windowsVirtualKeyCode:68,nativeVirtualKeyCode:68});
 await send("Input.dispatchKeyEvent",{
  type:"keyUp",key:"d",code:"KeyD",windowsVirtualKeyCode:68,nativeVirtualKeyCode:68});
 await until(()=>evalJS(`(()=>{
  const c=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
  const at=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.world-location.v068."+c.id));
  return at.x===7&&at.y===9;
 })()`),"movimento e save em boot frio",30);
 console.log("Android frio aprovado: mapa nativo em primeira abertura, "+
   metrics.colors+" cores, "+metrics.bytes+" bytes de canvas; toque e posição prontos.");
}finally{
 cdp?.close();
 for(const child of [browser,preview])if(child?.pid){
  try{process.kill(-child.pid,"SIGTERM");}catch{try{child.kill();}catch{}}
 }
}
