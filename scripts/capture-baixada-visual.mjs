/** Captura real da interface Phaser, sem Playwright nem dependências externas.
 * A captura é bloqueante após retries; não aprovar build com erro em runtime.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const URL = "http://127.0.0.1:4173";
const DEBUG_PORT = 9232;
const OUT = "qa/baixada-1600x720.png";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function poll(callback, description, attempts = 90) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      last = await callback();
      if (last) return last;
    } catch { /* browser or server is still booting */ }
    await sleep(250);
  }
  throw new Error("QA visual: não foi possível aguardar " + description + ". Último resultado: " + String(last));
}

function findChrome() {
  for (const name of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    const result = spawnSync("which", [name], { encoding: "utf8" });
    if (result.status === 0) return result.stdout.trim();
  }
  throw new Error("QA visual: Chromium não instalado no runner.");
}

function createSession(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    const exceptions = [];
    ws.addEventListener("open", () => resolve({
      exceptions,
      send(method, params = {}) {
        return new Promise((resolveCall, rejectCall) => {
          const next = ++id;
          pending.set(next, { resolveCall, rejectCall });
          ws.send(JSON.stringify({ id: next, method, params }));
        });
      },
      close: () => ws.close(),
    }), { once: true });
    ws.addEventListener("error", () => reject(new Error("CDP WebSocket indisponível.")), { once: true });
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.method === "Runtime.exceptionThrown") {
        const error = msg.params?.exceptionDetails?.exception?.description
          ?? msg.params?.exceptionDetails?.text ?? "exceção desconhecida";
        exceptions.push(error);
      }
      if (!msg.id || !pending.has(msg.id)) return;
      const { resolveCall, rejectCall } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rejectCall(new Error(msg.error.message)) : resolveCall(msg.result);
    });
  });
}

let server, browser, session;
try {
  server = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", "4173"], {
    stdio: "ignore", detached: true,
  });
  await poll(async () => (await fetch(URL)).ok, "servidor de prévia");

  const userDataDir = await mkdtemp(path.join(tmpdir(), "na-cdp-"));
  browser = spawn(findChrome(), [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    "--no-first-run", "--no-default-browser-check", "--disable-extensions",
    "--remote-allow-origins=*", "--remote-debugging-port=" + DEBUG_PORT,
    "--user-data-dir=" + userDataDir, "about:blank",
  ], { stdio: "ignore", detached: true });

  const tab = await poll(async () => {
    const r = await fetch("http://127.0.0.1:" + DEBUG_PORT + "/json");
    const tabs = await r.json();
    return tabs.find((x) => x.type === "page" && x.webSocketDebuggerUrl);
  }, "aba Chromium");
  session = await createSession(tab.webSocketDebuggerUrl);
  const send = (method, params) => session.send(method, params);
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result?.value;
  };
  const has = (selector) => evaluate("Boolean(document.querySelector(" + JSON.stringify(selector) + "))");

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1600, height: 720, deviceScaleFactor: 1, mobile: true,
    screenOrientation: { type: "landscapePrimary", angle: 90 },
  });
  await send("Page.navigate", { url: URL });
  await poll(() => has(".na-title-option"), "menu inicial React");
  await evaluate('document.querySelectorAll(".na-title-option")[1].click();true');
  await poll(() => has("#character-name"), "formulário do protagonista");

  await evaluate('(()=>{const e=document.querySelector("#character-name");const p=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value");p.set.call(e,"Visual QA");e.dispatchEvent(new Event("input",{bubbles:true}));return true;})()');
  // A origem Baixada e a classe Corporativo são escolhas distintas, verificadas
  // sem reiniciar o protagonista nem exigir origem/classe com mesmo identificador.
  await poll(() => evaluate('document.querySelectorAll(".class-grid .class-option").length===11'),"11 classes oficiais");
  await evaluate('document.querySelectorAll(".origin-card")[1].click();true');
  await evaluate('document.querySelectorAll(".class-grid .class-option")[6].click();true');
  await poll(() => evaluate('document.querySelectorAll(".class-grid .class-option")[6].getAttribute("aria-pressed")==="true"'),"classe Corpo selecionada");
  await poll(() => evaluate('Boolean(document.querySelector(".creation-shell .primary-button:not([disabled])"))'),"nome e classe validados");
  await evaluate('document.querySelector(".class-grid").scrollIntoView({block:"center"});true');
  await sleep(400);
  const classSelectionShot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await mkdir("qa",{recursive:true});
  await writeFile("qa/selecionar-11-classes-1600x720.png",Buffer.from(classSelectionShot.data,"base64"));
  await evaluate('document.querySelector(".creation-shell .primary-button").click();true');
  const identity=await evaluate(`(()=>{
    const raw=localStorage.getItem("cyberpunk-tactical-rpg.character.v1");
    const c=raw?JSON.parse(raw).character:null;
    return {origin:c?.originId,classId:c?.classId,abilities:c?.abilities??[]};
  })()`);
  if(identity.origin!=="baixada"||identity.classId!=="corporativo"||
    !identity.abilities.includes("corporativo-protocolo"))throw new Error("Classe/Origem não persistidas de forma independente: "+JSON.stringify(identity));
  // A primeira abertura é narrativa; texto progride sem vídeo ou fontes remotas.
  await poll(() => has(".na-opening-screen"), "cutscene após criar protagonista");
  const progressBefore=await evaluate('document.querySelector(".na-opening-typed")?.textContent.length');
  await sleep(275);
  const progressAfter=await evaluate('document.querySelector(".na-opening-typed")?.textContent.length');
  if(progressAfter<=progressBefore)throw new Error("A cutscene não revelou texto dinamicamente.");
  // 0.7.7: os oito quadros, parallax e autoplay devem existir desde o boot.
  const cinematicUi=await evaluate(`(()=>{
    const art=document.querySelector(".na-opening-art");
    const bars=document.querySelectorAll(".na-opening-progress i");
    const auto=document.querySelector(".na-opening-autoplay");
    return {visual:art?.dataset.openingVisual,frames:bars.length,
      auto:!!auto,autoplay:auto?.getAttribute("aria-pressed")};
  })()`);
  if(cinematicUi.visual!=="skyline"||cinematicUi.frames!==8||!cinematicUi.auto||
     cinematicUi.autoplay!=="false")
    throw new Error("Prólogo 0.7.7 não iniciou corretamente: "+JSON.stringify(cinematicUi));
  const firstVisual=await evaluate('document.querySelector(".na-opening-art")?.className');
  if(!firstVisual.includes("visual-skyline"))throw new Error("A arte da primeira cena não foi carregada.");
  await writeFile("qa/prologo-cinematografico-1600x720.png",Buffer.from(
    (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  // Em celular horizontal a cutscene deve caber no viewport sem esconder Avançar.
  await send("Emulation.setDeviceMetricsOverride",{
    width:914,height:411,deviceScaleFactor:1.75,mobile:true,
    screenOrientation:{type:"landscapePrimary",angle:90},
  });
  const openingMobile=await evaluate(`(()=>{
    const button=document.querySelector(".na-opening-next");
    const screen=document.querySelector(".na-opening-screen");
    const scene=document.querySelector(".na-opening-art");
    const b=button?.getBoundingClientRect(),s=screen?.getBoundingClientRect();
    return {buttonTop:b?.top,buttonBottom:b?.bottom,buttonHeight:b?.height,
      screenHeight:s?.height,artWidth:scene?.getBoundingClientRect().width,
      viewportHeight:innerHeight,viewportWidth:innerWidth};
  })()`);
  if(openingMobile.buttonHeight<44||openingMobile.buttonTop<0||
     openingMobile.buttonBottom>openingMobile.viewportHeight+2||
     openingMobile.screenHeight>openingMobile.viewportHeight+2||
     openingMobile.artWidth<180)
    throw new Error("Prólogo cortado em Android 914x411: "+JSON.stringify(openingMobile));
  await writeFile("qa/prologo-cinematografico-914x411.png",Buffer.from(
    (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  // Percorrer de verdade oito cenários antes de reiniciar o app no estado de intro.
  const cinematicVisuals=["skyline","aurea","eden","baixada","records","operative","interference","canal"];
  for(let i=0;i<cinematicVisuals.length;i++){
    const visual=cinematicVisuals[i];
    await poll(()=>evaluate('document.querySelector(".na-opening-art")?.dataset.openingVisual==='+JSON.stringify(visual)),
      "cena cinematográfica "+visual);
    if(visual==="operative"){
      const playerArt=await evaluate(`(()=>{
        const art=document.querySelector(".na-opening-character-sprite");
        const url=getComputedStyle(art).backgroundImage;
        return {exists:!!art,url};
      })()`);
      if(!playerArt.exists||!playerArt.url.includes("player-baixada-masculine"))
        throw new Error("Protagonista visual não corresponde à criação: "+JSON.stringify(playerArt));
    }
    await writeFile("qa/prologo-v077-"+String(i+1).padStart(2,"0")+"-"+visual+"-914x411.png",
      Buffer.from((await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
    if(i+1<cinematicVisuals.length){
      // Primeiro toque revela texto; segundo avança. Esperar React processar
      // cada atualização evita falso avanço em WebView Android lento.
      await evaluate('document.querySelector(".na-opening-next").click();true');
      await sleep(80);
      // A primeira ativação pode apenas revelar a fala OU já avançar.
      const advanced=await evaluate('document.querySelector(".na-opening-art")?.dataset.openingVisual');
      if(advanced===visual){
        await evaluate('document.querySelector(".na-opening-next").click();true');
        await sleep(80);
      }
    }
  }

  await send("Emulation.setDeviceMetricsOverride",{
    width:1600,height:720,deviceScaleFactor:1,mobile:true,
    screenOrientation:{type:"landscapePrimary",angle:90},
  });
  // Reabrir o jogo antes de terminar o prólogo NÃO deve perder a cutscene.
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"título após interromper cutscene");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>has(".na-opening-screen"),"retomada de cutscene interrompida");
  await evaluate(`document.querySelector('button[aria-label="Pular apresentação e continuar"]').click();true`);
  await poll(()=>has(".intro-shell .primary-button"),"prólogo individual da origem");
  const cinematicSave=await evaluate(`(()=>{
    const save=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    return {viewed:save.openingSeen,completed:save.introductionCompleted,
      origin:save.originId,classId:save.classId};
  })()`);
  if(cinematicSave.viewed!==true||cinematicSave.completed!==false||
     cinematicSave.origin!=="baixada"||cinematicSave.classId!=="corporativo")
    throw new Error("Abertura corrompeu identidade ou não salvou estado: "+JSON.stringify(cinematicSave));
  await evaluate('document.querySelector(".intro-shell .primary-button").click();true');
  await poll(() => has(".baixada-world canvas"), "canvas Phaser");
  await sleep(2600);

  const metrics = await evaluate('(()=>{const c=document.querySelector(".baixada-world canvas");const r=c.getBoundingClientRect();return {scene:!!c,width:Math.round(r.width),height:Math.round(r.height),canvasWidth:c.width,canvasHeight:c.height,title:document.title};})()');
  if (!metrics?.scene || metrics.width < 200 || metrics.height < 150) {
    throw new Error("Viewport Phaser inválido: " + JSON.stringify(metrics));
  }

  // Teclas rápidas simulam novo comando enquanto o tween do primeiro
  // movimento ainda está em andamento. Anteriormente o segundo era ignorado.
  await evaluate('document.querySelector(".baixada-world canvas")?.focus();true');
  const moveKey=async()=>{
    await send("Input.dispatchKeyEvent",{
      type:"keyDown",key:"d",code:"KeyD",windowsVirtualKeyCode:68,nativeVirtualKeyCode:68});
    await send("Input.dispatchKeyEvent",{
      type:"keyUp",key:"d",code:"KeyD",windowsVirtualKeyCode:68,nativeVirtualKeyCode:68});
  };
  await moveKey();
  await sleep(35);
  await moveKey();
  await poll(()=>evaluate(`(()=>{
    const save=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    const point=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.world-location.v068."+save.id)??"null");
    return point?.x===8&&point?.y===9;
  })()`),"dois passos com redirecionamento durante a caminhada",50);
  console.log("QA movimentação: segundo comando aceito durante tween e posição final persistida.");

  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const bytes = Buffer.from(shot.data, "base64");
  if (bytes.length < 15000) throw new Error("Captura PNG pequena ou vazia: " + bytes.length + " bytes.");
  await mkdir("qa", { recursive: true });
  await writeFile(OUT, bytes);

  // Verifica integração do personagem: trocar a apresentação não pode remontar
  // o canvas Phaser, reiniciar a Baixada nem alterar a identidade salva.
  await evaluate('window.__qaCanvas = document.querySelector(".baixada-world canvas");true');
  await evaluate('document.querySelector(".menu-trigger").click();true');
  await poll(() => has(".character-body-selection"), "troca corporal na central");
  await evaluate('document.querySelectorAll(".character-body-selection button")[1].click();true');
  await poll(() => evaluate('document.querySelectorAll(".character-body-selection button")[1]?.getAttribute("aria-pressed") === "true"'),
    "apresentação feminina selecionada");
  const persisted = await evaluate('document.querySelector(".baixada-world canvas") === window.__qaCanvas');
  if (!persisted) throw new Error("A troca corporal remontou o canvas Phaser e pode ter reiniciado a posição.");
  await evaluate('document.querySelector(".menu-close-button").click();true');
  await poll(() => evaluate('!document.querySelector(".character-menu-shell")'), "fechamento do menu");
  await sleep(650);
  const femaleShot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const femaleBytes = Buffer.from(femaleShot.data, "base64");
  if (femaleBytes.length < 15000) throw new Error("Captura da variante feminina inválida.");
  await writeFile("qa/baixada-feminina-1600x720.png", femaleBytes);
  await writeFile("qa/baixada-metricas.json", JSON.stringify({
    metrics, pngBytes: bytes.length, femalePngBytes: femaleBytes.length,
    sameCanvasAfterAppearanceChange: persisted, runtimeExceptions: session.exceptions,
  }, null, 2));

  // Percorre a mesma sessão salva em novo ponto de spawn válido no Pátio:
  // valida layout real do setor industrial sem reescrever o mapa em teste.
  const relocated = await evaluate(`(()=>{
    const raw=localStorage.getItem("cyberpunk-tactical-rpg.character.v1");
    if(!raw)return false;
    const id=JSON.parse(raw)?.character?.id;
    if(!id)return false;
    localStorage.setItem("cyberpunk-tactical-rpg.world-location.v068."+id,
      JSON.stringify({x:28,y:12}));
    return true;
  })()`);
  if(!relocated)throw new Error("QA industrial: personagem salvo não encontrado.");
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"menu para restaurar exploração");
  // O replay não pode reiniciar a missão nem forçar uma nova criação.
  await evaluate('document.querySelectorAll(".na-title-option")[3].click();true');
  await poll(()=>evaluate('Boolean([...document.querySelectorAll(".na-title-modal button")].find(b=>b.textContent?.includes("Rever apresentação")))'),"opção de rever a cutscene");
  await evaluate('[...document.querySelectorAll(".na-title-modal button")].find(b=>b.textContent?.includes("Rever apresentação")).click();true');
  await poll(()=>has(".na-opening-screen"),"replay manual do prólogo");
  await evaluate(`document.querySelector('button[aria-label="Pular apresentação e continuar"]').click();true`);
  await poll(()=>has(".na-title-option"),"replay retorna ao menu");
  const replaySave=await evaluate(`(()=>{
    const c=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    return {openingSeen:c.openingSeen,introductionCompleted:c.introductionCompleted,
      classId:c.classId,originId:c.originId};
  })()`);
  if(!replaySave.openingSeen||!replaySave.introductionCompleted||
      replaySave.classId!=="corporativo"||replaySave.originId!=="baixada")
    throw new Error("Rever apresentação alterou o personagem: "+JSON.stringify(replaySave));
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>has(".baixada-world canvas"),"mapa industrial restaurado");
  await sleep(2100);
  const patioShot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  const patioPng=Buffer.from(patioShot.data,"base64");
  if(patioPng.length<15000)throw new Error("QA industrial: screenshot vazio");
  await writeFile("qa/patio-reuso-1600x720.png",patioPng);
  console.log("QA industrial: Pátio do Reúso capturado em 1600×720.");

  // Percurso adicional: restaura o mesmo protagonista em célula caminhável do
  // Mercado dos Cabos. É uma preparação de QA, não um teleporte de gameplay.
  const marketReady=await evaluate(`(()=>{
    const raw=localStorage.getItem("cyberpunk-tactical-rpg.character.v1");
    const id=raw&&JSON.parse(raw)?.character?.id;
    if(!id)return false;
    localStorage.setItem("cyberpunk-tactical-rpg.world-location.v068."+id,
      JSON.stringify({x:12,y:26}));
    return true;
  })()`);
  if(!marketReady)throw new Error("QA feira: salvamento não encontrado.");
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"título da feira");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>has(".baixada-world canvas"),"cena da feira");
  await poll(()=>evaluate('document.querySelector(".district-brand h1")?.textContent.includes("Mercado dos Cabos")'),"identidade visual da feira");
  await sleep(1700);
  const marketPng=Buffer.from((await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64");
  if(marketPng.length<15000)throw new Error("QA feira: screenshot vazio");
  await writeFile("qa/mercado-dos-cabos-1600x720.png",marketPng);
  const marketMetrics=await evaluate(`(()=>{
    const canvas=document.querySelector(".baixada-world canvas");
    const label=document.querySelector(".district-brand h1")?.textContent;
    const save=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1"));
    return {canvas:!!canvas,sector:label,origin:save.character.originId,
      classId:save.character.classId,position:JSON.parse(localStorage.getItem(
      "cyberpunk-tactical-rpg.world-location.v068."+save.character.id))};
  })()`);
  if(marketMetrics.origin!=="baixada"||marketMetrics.classId!=="corporativo"||
     marketMetrics.position?.y!==26)throw new Error("QA feira: origem/classe/posição alteradas "+JSON.stringify(marketMetrics));
  await writeFile("qa/mercado-dos-cabos-metricas.json",JSON.stringify(marketMetrics,null,2));
  console.log("QA Mercado dos Cabos: setor, personagem e geometria capturados.");


  // QA móvel da arena: comandos devem permanecer disponíveis mesmo
  // quando a seção de recursos e habilidades excede o viewport.
  await evaluate('document.querySelector(".menu-trigger").click();true');
  await poll(() => has(".character-menu-nav"), "central do protagonista reaberta");
  await evaluate('Array.from(document.querySelectorAll(".character-menu-nav button")).find(b => b.textContent.includes("Configurações")).click();true');
  await poll(() => evaluate('Boolean(Array.from(document.querySelectorAll(".menu-two-columns button")).find(b => b.textContent.includes("Abrir Limbo de Teste")))'), "configurações com arena");
  await evaluate('Array.from(document.querySelectorAll(".menu-two-columns button")).find(b => b.textContent.includes("Abrir Limbo de Teste")).click();true');
  await poll(() => has(".arena-v030 .arena-console-scroll"), "arena tática");
  await sleep(500);
  const arenaLayout = await evaluate(`(() => {
    const area=document.querySelector(".arena-console");
    const scroll=document.querySelector(".arena-console-scroll");
    const dock=area?.querySelector(".control-sheet");
    const attack=dock?.querySelector(".attack-button");
    const turn=dock?.querySelector(".end-turn-button");
    const abilities=scroll?.querySelector(".arena-specials");
    if(!area||!scroll||!dock||!attack||!turn||!abilities)return {error:"Elemento da arena ausente"};
    const outer=area.getBoundingClientRect(), d=dock.getBoundingClientRect();
    const a=attack.getBoundingClientRect(), t=turn.getBoundingClientRect();
    return {outer:{top:outer.top,bottom:outer.bottom}, dock:{top:d.top,bottom:d.bottom,height:d.height},
      attack:{top:a.top,bottom:a.bottom,height:a.height},turn:{top:t.top,bottom:t.bottom,height:t.height},
      scrollClient:scroll.clientHeight,scrollContent:scroll.scrollHeight,
      topResourcesVisible:abilities.getBoundingClientRect().top>=scroll.getBoundingClientRect().top,
      windowHeight:innerHeight};
  })()`);
  if (arenaLayout.error || arenaLayout.dock.top < arenaLayout.outer.top - 3 ||
      arenaLayout.dock.bottom > arenaLayout.outer.bottom + 3 ||
      arenaLayout.attack.bottom > arenaLayout.windowHeight - 2 ||
      arenaLayout.turn.bottom > arenaLayout.windowHeight - 2 ||
      arenaLayout.attack.height < 44 || arenaLayout.turn.height < 44) {
    throw new Error("Painel fixo não está inteiramente utilizável: " + JSON.stringify(arenaLayout));
  }
  // Executa habilidade exclusiva e observa a alteração real de energia e
  // Defesa do personagem. Não aceita animação ou mensagem sem mutação de regras.
  const arenaTexture=await evaluate('document.querySelector(".battlefield-canvas canvas")?.getAttribute("data-player-texture")');
  const skillLauncher=await evaluate(`(()=>{
    const b=document.querySelector(".na-abilities-open"),r=b?.getBoundingClientRect();
    return {label:b?.textContent,height:r?.height,top:r?.top,bottom:r?.bottom};
  })()`);
  if(arenaTexture!=="player-baixada-feminine" || !skillLauncher.label?.includes("HABILIDADES") ||
     !skillLauncher.label?.includes("1 da classe") || skillLauncher.height<44 ||
     skillLauncher.bottom>arenaLayout.windowHeight) {
    throw new Error("Arena não preservou sprite/seletor: "+JSON.stringify({arenaTexture,skillLauncher}));
  }
  await writeFile("qa/arena-identidade-e-poderes.json",JSON.stringify({arenaTexture,skillLauncher},null,2));
  console.log("QA combate: sprite Baixada feminino e seletor de habilidades sempre acessível.");

  const classButton=await evaluate(`(()=>{
    const button=document.querySelector(".arena-special.class-exclusive");
    if(!button)return {found:false};
    return {found:true,name:button.textContent,disabled:button.getAttribute("aria-disabled")};
  })()`);
  if(!classButton.found || !classButton.name.includes("Protocolo de Contingência") ||
      classButton.disabled!=="false")throw new Error("Habilidade da classe não carregada: "+JSON.stringify(classButton));
  await evaluate('document.querySelector(".na-abilities-open").click();true');
  await poll(()=>has(".na-ability-picker"),"seletor de técnicas em primeiro plano");
  const pickerLayout=await evaluate(`(()=>{
    const dialog=document.querySelector(".na-ability-picker");
    const r=dialog?.getBoundingClientRect();
    return {width:r?.width,height:r?.height,top:r?.top,bottom:r?.bottom,
      options:document.querySelectorAll(".na-ability-choice").length,
      titles:[...document.querySelectorAll(".na-ability-picker-group h3")].map(el=>el.textContent)};
  })()`);
  if(pickerLayout.options!==5||pickerLayout.top<0||pickerLayout.bottom>arenaLayout.windowHeight+1||
     !pickerLayout.titles.includes("Técnicas da classe"))
    throw new Error("Seletor inacessível: "+JSON.stringify(pickerLayout));
  await evaluate('document.querySelector(".na-ability-choice").click();true');
  await poll(()=>evaluate('document.querySelector(".na-ability-picker-selected strong")?.textContent.includes("Protocolo de Contingência")'),"técnica escolhida");
  const selectedButton=await evaluate('document.querySelector(".na-ability-picker-actions button.primary")?.disabled');
  if(selectedButton)throw new Error("Técnica inicial deveria estar pronta.");
  await writeFile("qa/seletor-habilidades-1600x720.png",Buffer.from(
    (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  await evaluate('document.querySelector(".na-ability-picker-actions button.primary").click();true');
  await poll(()=>evaluate('!document.querySelector(".na-ability-picker")'),"seletor fecha após usar poder");
  await poll(()=>evaluate('document.querySelector(".combat-message")?.textContent.includes("Protocolo de Contingência")'),"efeito real da habilidade Corpo");
  const classMutation=await evaluate(`(()=>{
    const energy=document.querySelector(".arena-energy strong")?.textContent;
    const guard=document.querySelector(".arena-effects")?.textContent;
    const player=document.querySelector(".units")?.textContent;
    return {energy,guard,player};
  })()`);
  if(!classMutation.energy.includes("7 / 10") ||
     !classMutation.guard.includes("Proteção da classe"))
    throw new Error("Habilidade sem modificação esperada de regras: "+JSON.stringify(classMutation));
  await writeFile("qa/arena-habilidade-classe-1600x720.png",
    Buffer.from((await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  await writeFile("qa/arena-habilidade-classe-metricas.json",JSON.stringify(classMutation,null,2));
  console.log("QA classe: Baixada + Corporativo salvos; efeito real da classe executado.");

  const arenaShot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const arenaPng = Buffer.from(arenaShot.data,"base64");
  await writeFile("qa/arena-comandos-fixos-1600x720.png", arenaPng);
  await writeFile("qa/arena-comandos-metricas.json",JSON.stringify(arenaLayout,null,2));
  console.log("QA arena: comandos sempre visíveis:",JSON.stringify(arenaLayout));

  // Regressão Android de entrada: slot carregável e controles de toque em 914x411.
  await send("Emulation.setDeviceMetricsOverride",{
    width:914,height:411,deviceScaleFactor:1.75,mobile:true,
    screenOrientation:{type:"landscapePrimary",angle:90},
  });
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"menu de slots em viewport móvel");
  await evaluate('document.querySelectorAll(".na-title-option")[2].click();true');
  await poll(()=>has(".save-slot-entry"),"slot individual na nova central");
  const saveUi=await evaluate(`(()=>{
    const modal=document.querySelector(".na-title-modal");
    const rows=[...document.querySelectorAll(".save-slot-entry")];
    const actionButtons=[...document.querySelectorAll(".save-slot-actions button")];
    const r=modal.getBoundingClientRect();
    return {slots:rows.length,modalTop:r.top,modalBottom:r.bottom,
      viewport:innerHeight,importFile:!!document.querySelector('.backup-import-label input[type="file"]'),
      minButton:Math.min(...actionButtons.map(b=>b.getBoundingClientRect().height)),
      activeName:rows[0]?.textContent};
  })()`);
  if(saveUi.slots<1||!saveUi.importFile||saveUi.modalTop<-2||
     saveUi.modalBottom>saveUi.viewport+2||saveUi.minButton<43)
     throw new Error("QA slots Android 914x411: "+JSON.stringify(saveUi));
  await writeFile("qa/slots-914x411.png",Buffer.from((await send("Page.captureScreenshot",{
    format:"png",captureBeyondViewport:false})).data,"base64"));
  await writeFile("qa/slots-914x411-metricas.json",JSON.stringify(saveUi,null,2));
  console.log("QA slots Android 914×411:",JSON.stringify(saveUi));

  // QA persistência de Vida: um protagonista que volta a combater deve
  // manter seus ferimentos e ganhar HP real ao consumir um curativo.
  await evaluate(`(()=>{
    const c=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    localStorage.setItem("cyberpunk-tactical-rpg.health.v1."+c.id,
      JSON.stringify({hp:6,maxHp:18}));
    return true;
  })()`);
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"título após salvar ferimentos");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>has(".na-explore-health"),"HUD de Vida na Baixada");
  const healthBefore=await evaluate('document.querySelector(".na-explore-health")?.textContent.trim()');
  if(!healthBefore.includes("6/"))throw new Error("A Vida não foi restaurada da exploração: "+healthBefore);
  await evaluate('document.querySelector(".exploration-footer-actions.single-action button").click();true');
  await poll(()=>has(".unit-card.cyan"),"personagem ferido no combate");
  const arenaHp=await evaluate('document.querySelector(".unit-card.cyan .unit-stats b")?.textContent.trim()');
  if(!arenaHp.startsWith("6/"))throw new Error("Arena reinicializou a Vida: "+arenaHp);
  // O seletor deve funcionar no viewport horizontal real do Android (914x411),
  // não apenas no screenshot desktop 1600x720.
  const mobileLauncher=await evaluate(`(()=>{
    const r=document.querySelector(".na-abilities-open")?.getBoundingClientRect();
    return {top:r?.top,bottom:r?.bottom,height:r?.height,screenHeight:innerHeight};
  })()`);
  if(!mobileLauncher.height||mobileLauncher.height<44||
     mobileLauncher.top<0||mobileLauncher.bottom>mobileLauncher.screenHeight)
    throw new Error("Botão de habilidades não tocável no Android: "+JSON.stringify(mobileLauncher));
  await evaluate('document.querySelector(".na-abilities-open").click();true');
  await poll(()=>has(".na-ability-picker"),"seletor de habilidades Android 914x411");
  const mobileModal=await evaluate(`(()=>{
    const r=document.querySelector(".na-ability-picker")?.getBoundingClientRect();
    const confirm=document.querySelector(".na-ability-picker-actions .primary")?.getBoundingClientRect();
    return {top:r?.top,bottom:r?.bottom,screenHeight:innerHeight,
      confirmTop:confirm?.top,confirmBottom:confirm?.bottom,
      count:document.querySelectorAll(".na-ability-choice").length};
  })()`);
  if(mobileModal.top<0||mobileModal.bottom>mobileModal.screenHeight+2||
     mobileModal.confirmBottom>mobileModal.screenHeight+2||mobileModal.count!==5)
    throw new Error("Seletor cortado no Android 914x411: "+JSON.stringify(mobileModal));
  await writeFile("qa/seletor-habilidades-914x411.png",
    Buffer.from((await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  await evaluate('document.querySelector(".na-ability-picker-head button").click();true');
  await poll(()=>evaluate('!document.querySelector(".na-ability-picker")'),"fechamento seletor Android");
  await evaluate('document.querySelector(".actions .end-turn-button").click();true');
  await poll(()=>evaluate('document.querySelector(".combat-message")?.textContent.includes("Curativo de campo")'),
    "uso real de curativo");
  const healResult=await evaluate(`(()=>{
    const c=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    const health=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.health.v1."+c.id));
    return {hp:health.hp,shown:document.querySelector(".unit-card.cyan .unit-stats b")?.textContent};
  })()`);
  if(healResult.hp!==11||!healResult.shown.startsWith("11/"))
    throw new Error("Curativo não persistiu Vida real: "+JSON.stringify(healResult));
  await evaluate('document.querySelector(".secondary-actions button:last-child").click();true');
  await poll(()=>has(".na-explore-health"),"retorno à exploração com Vida salva");
  const healthAfter=await evaluate('document.querySelector(".na-explore-health")?.textContent.trim()');
  if(!healthAfter.includes("11/"))throw new Error("Retorno perdeu Vida: "+healthAfter);
  await writeFile("qa/vida-persistente-914x411.png",Buffer.from((await send("Page.captureScreenshot",{
    format:"png",captureBeyondViewport:false})).data,"base64"));
  console.log("QA Vida: ferimentos entre cenas 6 HP → curativo 11 HP → exploração 11 HP.");
  // O Chrome de QA pode simular Android com userAgent desktop.
  // O jogo começa expandido nesse caso. Forçar o estado recolhido
  // por meio do botão real antes de validar a visão compacta.
  await poll(()=>has(".na-quest-hud .na-hub-toggle"),"botão do diário compacto");
  if(await evaluate('document.querySelector(".na-quest-hud")?.classList.contains("expanded")'))
    await evaluate('document.querySelector(".na-quest-hud .na-hub-toggle").click();true');
  await poll(()=>has(".na-quest-hud.collapsed .na-quest-peek"),"orientação de missão compacta");
  const missionLayout=await evaluate(`(()=>{
    const hub=document.querySelector(".na-quest-hud"),next=hub?.querySelector(".na-quest-peek"),
      r=hub?.getBoundingClientRect(),n=next?.getBoundingClientRect();
    return {top:r?.top,bottom:r?.bottom,right:r?.right,width:r?.width,height:r?.height,
      nextTop:n?.top,title:next?.textContent,viewportWidth:innerWidth,viewportHeight:innerHeight,
      collapsed:hub?.classList.contains("collapsed")};
  })()`);
  if(missionLayout.top<0||missionLayout.bottom>missionLayout.viewportHeight+2||
     missionLayout.right>missionLayout.viewportWidth+2||missionLayout.nextTop<0||
     !missionLayout.title?.includes("clínica")||missionLayout.height>116)
    throw new Error("HUD compacto fora de tela: "+JSON.stringify(missionLayout));
  // Retomar personagem que concluiu a clínica: a campanha volta ao Pátio.
  await evaluate(`(()=>{
    const raw=localStorage.getItem("cyberpunk-tactical-rpg.character.v1");
    const id=raw&&JSON.parse(raw).character?.id;
    localStorage.setItem("cyberpunk-tactical-rpg.mission.v1."+id,
      JSON.stringify({step:3,clues:["canal"]}));
    return true;
  })()`);
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"título para retomar missão antiga");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>has(".na-quest-hud .na-hub-toggle"),"diário compacto após atualização");
  if(await evaluate('document.querySelector(".na-quest-hud")?.classList.contains("expanded")'))
    await evaluate('document.querySelector(".na-quest-hud .na-hub-toggle").click();true');
  await poll(()=>has(".na-quest-hud.collapsed .na-quest-peek"),"objetivo persistido após atualização");
  const legacyNext=await evaluate('document.querySelector(".na-quest-peek")?.textContent');
  if(!legacyNext?.includes("Pátio"))
    throw new Error("Missão anterior não encaminha ao Pátio: "+legacyNext);
  // O painel começa recolhido no Android, e pode ser aberto e fechado.
  if(await evaluate('document.querySelector(".na-quest-hud")?.classList.contains("collapsed")'))
    await evaluate('document.querySelector(".na-quest-hud .na-hub-toggle").click();true');
  await poll(()=>has(".na-quest-tabs"),"abrir diário compacto");
  const opened=await evaluate('document.querySelector(".na-quest-hud")?.classList.contains("expanded")');
  if(!opened)throw new Error("Quadro não abriu.");
  await evaluate('document.querySelector(".na-quest-hud .na-hub-toggle").click();true');
  const collapsed=await evaluate('document.querySelector(".na-quest-hud")?.classList.contains("collapsed")');
  if(!collapsed)throw new Error("HUD de missões não recolheu.");
  await evaluate('document.querySelector(".na-quest-hud .na-hub-toggle").click();true');
  await poll(()=>has(".na-quest-details"),"reabrir quadro");
  await writeFile("qa/proxima-missao-914x411.png",
    Buffer.from((await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  const trialButton=await evaluate('document.querySelector(".na-quest-primary")?.textContent');
  if(!trialButton?.includes("Iniciar Operação"))
    throw new Error("Campanha de teste não foi liberada após a clínica: "+trialButton);
  await evaluate('document.querySelector(".na-quest-primary").click();true');
  await poll(()=>evaluate('document.querySelector(".na-quest-tab-content p")?.textContent?.includes("Dra. Amara")'),
    "Primeiro objetivo da operação");
  const activeStage=await evaluate('document.querySelector(".na-quest-tab-content p")?.textContent');
  if(!activeStage?.includes("Dra. Amara"))throw new Error("Etapa incorreta: "+activeStage);
  await writeFile("qa/operacao-circuito-914x411.png",
    Buffer.from((await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  console.log("QA campanha: missão progressiva e operação liberada após clínica.");

  // QA subterrâneo no viewport real Android: interações públicas, sem ganchos de teste.
  // A posição é salva no dispositivo como qualquer personagem que caminhou ao Pátio Sul.
  await evaluate(`(()=>{
    const raw=localStorage.getItem("cyberpunk-tactical-rpg.character.v1");
    const id=JSON.parse(raw).character.id;
    localStorage.setItem("cyberpunk-tactical-rpg.world-location.v068."+id,JSON.stringify({x:33,y:20}));
    return true;
  })()`);
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"título ao visitar ampliação leste");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>has(".na-sewer-quick-access"),"escada do esgoto detectada no mundo aberto");
  const surfaceAccess=await evaluate('document.querySelector(".na-sewer-quick-access")?.textContent');
  if(!surfaceAccess.includes("GALERIA DE DRENAGEM"))
    throw new Error("Acesso da Galeria não foi encontrado: "+surfaceAccess);
  await sleep(950);
  await writeFile("qa/baixada-expandida-esgoto-914x411.png",Buffer.from(
    (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  await evaluate('document.querySelector(".na-sewer-quick-access").click();true');
  await poll(()=>has(".interior-world.sewer-drain canvas"),"mapa 1 Galeria de Drenagem em Phaser");
  await sleep(1300);
  const drainInfo=await evaluate(`(()=>{
    const c=document.querySelector(".interior-world.sewer-drain canvas");
    const r=c?.getBoundingClientRect();
    return {width:r?.width,height:r?.height,canvasW:c?.width,canvasH:c?.height,
      title:document.querySelector(".district-brand h1")?.textContent,
      hubCollapsed:!!document.querySelector(".na-mission-hub.collapsed")};
  })()`);
  if(!drainInfo.canvasW||drainInfo.width<400||drainInfo.height<260||
     !drainInfo.title?.includes("Galeria de Drenagem")||!drainInfo.hubCollapsed)
    throw new Error("Mapa subterrâneo 1 inválido: "+JSON.stringify(drainInfo));
  await writeFile("qa/esgoto-galeria-drenagem-914x411.png",Buffer.from(
    (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  await evaluate('document.querySelector(".area-return").click();true');
  await poll(()=>has(".na-sewer-quick-access"),"retorno à superfície via escada da galeria");
  // A segunda saída não pode entrar na Câmara se o jogador não recuperou manifesto.
  await evaluate(`(()=>{
    const id=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character.id;
    localStorage.setItem("cyberpunk-tactical-rpg.world-location.v068."+id,JSON.stringify({x:34,y:29}));
    return true;
  })()`);
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"retomar no segundo acesso");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>has(".na-sewer-quick-access"),"segunda escada do esgoto detectada");
  const emergency=await evaluate('document.querySelector(".na-sewer-quick-access")?.textContent');
  if(!emergency?.includes("CÂMARA 04"))
    throw new Error("Segunda saída mal conectada: "+emergency);
  await evaluate('document.querySelector(".na-sewer-quick-access").click();true');
  await poll(()=>has(".dialogue-panel"),"bloqueio narrativo da saída profunda");
  const lockedMessage=await evaluate('document.querySelector(".na-dialogue-spoken")?.getAttribute("aria-label")');
  if(!lockedMessage?.includes("bloqueada"))
    throw new Error("Saída profunda sem validação de progresso: "+lockedMessage);
  const dialogMetrics=await evaluate(`(()=>{
    const panel=document.querySelector(".dialogue-panel");
    const portrait=panel?.querySelector(".na-portrait-scene");
    const next=panel?.querySelector(".dialogue-continue");
    const p=panel?.getBoundingClientRect(),b=next?.getBoundingClientRect();
    return {ui:panel?.dataset.dialogueUi,portrait:portrait?.dataset.portraitId,
      x:p?.x,y:p?.y,bottom:p?.bottom,viewport:innerHeight,
      nextBottom:b?.bottom,nextHeight:b?.height};
  })()`);
  if(dialogMetrics.ui!=="v077"||dialogMetrics.portrait!=="terminal"||
     dialogMetrics.y<-1||dialogMetrics.bottom>dialogMetrics.viewport+2||
     dialogMetrics.nextBottom>dialogMetrics.viewport+2||dialogMetrics.nextHeight<44)
    throw new Error("Painel narrativo Android fora da tela: "+JSON.stringify(dialogMetrics));
  await writeFile("qa/dialogo-terminal-v077-914x411.png",
    Buffer.from((await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  // Reabre a campanha no checkpoint já concluído: a saída passa a ser alcançável.
  await evaluate(`(()=>{
    const id=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character.id;
    localStorage.setItem("cyberpunk-tactical-rpg.sewer-v09.v1."+id,
      JSON.stringify({traceFound:true,pumpRestored:true,gateOpened:true,
        manifestRecovered:true,sampleRecovered:false}));
    return true;
  })()`);
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"retomar após checkpoint subterrâneo");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>has(".na-sewer-quick-access"),"saída profunda habilitada");
  await evaluate('document.querySelector(".na-sewer-quick-access").click();true');
  await poll(()=>has(".interior-world.sewer-deep canvas"),"mapa 2 Câmara de Recalque em Phaser");
  await sleep(1200);
  const deepInfo=await evaluate(`(()=>{
    const c=document.querySelector(".interior-world.sewer-deep canvas");
    const r=c?.getBoundingClientRect();
    const hero=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1"))?.character;
    const saved=hero&&localStorage.getItem("cyberpunk-tactical-rpg.sewer-v09.v1."+hero.id);
    const checkpoint=saved?JSON.parse(saved):null;
    // O HUD 0.7.9 não apresenta mais .na-sewer-heading.
    // Avaliar o estado real da investigação sem depender do painel retraído.
    return {width:r?.width,height:r?.height,
      title:document.querySelector(".district-brand h1")?.textContent,
      checkpoint};
  })()`);
  if(deepInfo.width<400||deepInfo.height<260||
     !deepInfo.title?.includes("Câmara de Recalque")||
     !deepInfo.checkpoint?.traceFound||!deepInfo.checkpoint?.pumpRestored||
     !deepInfo.checkpoint?.gateOpened||!deepInfo.checkpoint?.manifestRecovered)
    throw new Error("Mapa subterrâneo 2 ou checkpoint inválido: "+JSON.stringify(deepInfo));
  await writeFile("qa/esgoto-camara-recalque-914x411.png",Buffer.from(
    (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  await evaluate('document.querySelector(".area-return").click();true');
  await poll(()=>has(".interior-world.sewer-drain canvas"),"retorno profundo → galeria");
  await evaluate('document.querySelector(".area-return").click();true');
  await poll(()=>has(".baixada-world:not(.interior-world) canvas"),"retorno galeria → superfície");
  const backTitle=await evaluate('document.querySelector(".district-brand h1")?.textContent');
  if(backTitle?.includes("Galeria de Drenagem")||backTitle?.includes("Câmara de Recalque"))
    throw new Error("Retorno subterrâneo prendeu o personagem: "+backTitle);
  console.log("QA subterrâneo: 39×34, ambas as escadas, dois mapas renderizados, bloqueio, checkpoint e retorno.");




  // Ferrugem: novo distrito deve abrir pelo terminal de transporte do
  // Pátio Sul usando o save real; não depende de rotas de teste privadas.
  await evaluate(`(()=>{
    const character=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    localStorage.setItem("cyberpunk-tactical-rpg.world-location.v068."+character.id,
      JSON.stringify({x:36,y:22}));
    return true;
  })()`);
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"título antes da viagem industrial");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>has(".na-sewer-quick-access"),"terminal de transporte de Ferrugem");
  const gateLabel=await evaluate('document.querySelector(".na-sewer-quick-access")?.textContent');
  if(!gateLabel?.includes("FERRUGEM"))throw new Error("Não há acesso ao distrito Ferrugem: "+gateLabel);
  await evaluate('document.querySelector(".na-sewer-quick-access").click();true');
  await poll(()=>has(".interior-world.ferrugem canvas"),"canvas industrial de Ferrugem");
  await sleep(1300);
  const ferrugemMetrics=await evaluate(`(()=>{
    const canvas=document.querySelector(".interior-world.ferrugem canvas");
    const r=canvas?.getBoundingClientRect();
    const title=document.querySelector(".district-brand h1")?.textContent;
    const character=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    const raw=localStorage.getItem("cyberpunk-tactical-rpg.ferrugem.v1."+character.id);
    const quest=raw?JSON.parse(raw):null;
    return {width:r?.width,height:r?.height,title,
      questStarted:quest?.started,questStep:quest?.step,scene:!!canvas};
  })()`);
  if(!ferrugemMetrics.scene||ferrugemMetrics.width<400||ferrugemMetrics.height<260||
     !ferrugemMetrics.title?.includes("Ferrugem")||
     ferrugemMetrics.questStarted!==true||ferrugemMetrics.questStep!==0)
    throw new Error("Novo distrito ou missão Ferrugem não foi inicializado: "+JSON.stringify(ferrugemMetrics));
  await writeFile("qa/ferrugem-914x411.png",Buffer.from(
    (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  // Reiniciar o documento no meio da Ferrugem simula fechamento do processo
  // Android: o distrito e os marcos devem reaparecer ao continuar o save.
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"reabertura após fechamento em Ferrugem");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>has(".interior-world.ferrugem canvas"),"retorno persistente à Ferrugem");
  await evaluate('document.querySelector(".menu-trigger").click();true');
  await poll(()=>has(".character-menu-shell"),"menu de Ferrugem");
  await evaluate('[...document.querySelectorAll(".character-menu-nav button")].find(b=>b.textContent?.includes("Inventário")).click();true');
  await poll(()=>has(".na-crafting-panel"),"oficina de fabricação no inventário");
  const recipes=await evaluate('document.querySelectorAll(".na-crafting-recipe").length');
  if(recipes<25)throw new Error("Expansão de fabricação incompleta: "+recipes);
  await evaluate('document.querySelector(".na-crafting-panel summary")?.click();true');
  await poll(()=>evaluate('document.querySelector(".na-crafting-panel")?.open===true'),
    "catálogo expandido de receitas de fabricação");
  await evaluate('document.querySelector(".na-crafting-panel")?.scrollIntoView({block:"start",behavior:"instant"});true');
  await sleep(220);
  await writeFile("qa/ferrugem-fabricacao-914x411.png",Buffer.from(
    (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  await evaluate('document.querySelector(".menu-close-button").click();true');
  await poll(()=>evaluate('!document.querySelector(".character-menu-shell")'),"fechar oficina");
  await evaluate('document.querySelector(".area-return").click();true');
  await poll(()=>has(".baixada-world:not(.interior-world) canvas"),"volta de Ferrugem à Baixada");
  const ferrugemSaved=await evaluate(`(()=>{
    const id=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character.id;
    const loc=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.world-location.v068."+id));
    return {x:loc.x,y:loc.y};
  })()`);
  if(ferrugemSaved.x!==36||ferrugemSaved.y!==22)
    throw new Error("Volta de Ferrugem perdeu ponto seguro da Baixada: "+JSON.stringify(ferrugemSaved));
  console.log("QA Ferrugem: distrito Phaser, capítulo inicializado, retorno e save preservados.");

  // Os cinco novos distritos devem ser navegáveis no mesmo ambiente Android
  // horizontal; a viagem usa os botões reais e o save do protagonista.
  await evaluate(`(()=>{
    const id=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character.id;
    localStorage.setItem("cyberpunk-tactical-rpg.world-location.v068."+id,
      JSON.stringify({x:37,y:25}));
    return true;
  })()`);
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"menu após atualizar posição para terminal de transporte");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>has(".na-sewer-quick-access"),"acesso rápido a central interdistrital");
  const transitLabel=await evaluate('document.querySelector(".na-sewer-quick-access")?.textContent');
  if(!transitLabel?.includes("INTERDISTRITAL"))throw new Error("Central interdistrital inacessível: "+transitLabel);
  const newDistricts=["aurea","subsolo","setor-zero","prisma","periferia"];
  for(let i=0;i<newDistricts.length;i++){
    const id=newDistricts[i];
    await evaluate('document.querySelector(".na-sewer-quick-access").click();true');
    await poll(()=>has(".na-transit-panel"),"central de transporte para "+id);
    await evaluate(`document.querySelectorAll(".na-transit-grid button")[${i+1}].click();true`);
    await poll(()=>has(".interior-world."+id+" canvas"),"mapa isométrico "+id);
    await sleep(450);
    const check=await evaluate(`(()=>{
      const canvas=document.querySelector(".interior-world.${id} canvas");
      const rect=canvas?.getBoundingClientRect();
      const hero=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
      const stored=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.city-chapters.v1."+hero.id)??"{}");
      return {width:rect?.width,height:rect?.height,
        title:document.querySelector(".district-brand h1")?.textContent,
        art:canvas?.dataset.districtArt,guide:canvas?.dataset.districtGuide,
        active:stored["${id}"]?.started===true};
    })()`);
    if(check.width<400||check.height<260||!check.active||
       check.art!=="v076-"+id||!check.guide?.startsWith("npc-"))
      throw new Error("Novo distrito não inicializado: "+id+" "+JSON.stringify(check));
    await writeFile("qa/distrito-"+id+"-914x411.png",Buffer.from(
      (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
    if(i===0){
      await send("Page.navigate",{url:URL});
      await poll(()=>has(".na-title-option"),"título após fechar no distrito Áurea");
      await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
      await poll(()=>has(".interior-world.aurea canvas"),"retomada exata do distrito Áurea");
    }
    await evaluate('document.querySelector(".area-return").click();true');
    await poll(()=>has(".baixada-world:not(.interior-world) canvas"),"retorno "+id+" à Baixada");
    await poll(()=>has(".na-sewer-quick-access"),"central de transporte após "+id);
  }
  // Reproduzir o caso relatado pelo usuário: WebView Android horizontal,
  // perfil Economia/Canvas. O antigo QA testava dimensões, não pixels.
  await send("Emulation.setUserAgentOverride",{userAgent:
    "Mozilla/5.0 (Linux; Android 15; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"});
  await evaluate('localStorage.removeItem("cyberpunk-tactical-rpg.graphics-mode.v1");true');
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"título Android simulado");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>evaluate('document.querySelector(".baixada-world[data-scene-state=ready] canvas")?.width>200'),
    "cena realmente renderizada no Android Economy Canvas",100);
  await poll(()=>evaluate('document.querySelector(".baixada-world")?.dataset.artReady==="true"'),
    "spritesheets e SVGs originais na Baixada Android",100);
  const androidPixels=await evaluate(`(()=>{
    const host=document.querySelector(".baixada-world");
    const canvas=host?.querySelector("canvas");
    const ctx=canvas?.getContext("2d");
    if(!ctx)return {status:host?.dataset.sceneState,renderer:host?.dataset.renderer,colors:0};
    const colors=new Set();
    for(let y=1;y<=5;y++)for(let x=1;x<=7;x++){
      const d=ctx.getImageData(Math.floor(canvas.width*x/8),
        Math.floor(canvas.height*y/6),1,1).data;
      colors.add(d[0]+","+d[1]+","+d[2]);
    }
    return {status:host?.dataset.sceneState,renderer:host?.dataset.renderer,colors:colors.size,
      panelCollapsed:document.querySelector(".na-mission-hub")?.classList.contains("collapsed"),
      engine:host?.dataset.engine,bootOverlay:!!host?.querySelector(".na-world-startup"),
      artStyle:host?.dataset.artStyle,artReady:host?.dataset.artReady,
      artLoaded:Number(host?.dataset.artLoaded??0),heroSprite:host?.dataset.heroSprite,
      canvasBytes:canvas?.width*canvas?.height*4};
  })()`);
  if(androidPixels.renderer!=="canvas"||androidPixels.engine!=="native-2d"||
    androidPixels.artStyle!=="restored-phaser"||androidPixels.artReady!=="true"||
    androidPixels.artLoaded<8||androidPixels.heroSprite!=="loaded"||
    androidPixels.bootOverlay||androidPixels.status!=="ready"||
    androidPixels.canvasBytes>4_500_000||androidPixels.colors<12||
    androidPixels.panelCollapsed!==true)
    throw new Error("O Android mostra mapa em branco ou o HUD o bloqueia: "+JSON.stringify(androidPixels));
  const androidShot=Buffer.from((await send("Page.captureScreenshot",{
    format:"png",captureBeyondViewport:false})).data,"base64");
  await writeFile("qa/baixada-android-canvas-914x411.png",androidShot);
  const pixelCheck=spawnSync("python3",["-c",
    "from PIL import Image;import sys;im=Image.open(sys.argv[1]).convert('RGB');w,h=im.size;a=im.crop((int(w*.19),int(h*.30),int(w*.53),int(h*.80)));colors=set(a.getdata());print('Mapa Android: cores reais =',len(colors));sys.exit(0 if len(colors)>20 else 1)",
    "qa/baixada-android-canvas-914x411.png"],{encoding:"utf8"});
  if(pixelCheck.status!==0)
    throw new Error("Screenshot em branco detectado no modo Android: "+pixelCheck.stdout+" "+pixelCheck.stderr);
  // O novo motor Android deve aceitar deslocamento físico e preservar o
  // mesmo save, sem Phaser.Game, WebGL, textura gigante ou loading infinito.
  const beforeNativeMove=await evaluate(`(()=>{
    const id=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character.id;
    return JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.world-location.v068."+id));
  })()`);
  await send("Input.dispatchKeyEvent",{type:"keyDown",key:"w",code:"KeyW",
    windowsVirtualKeyCode:87,nativeVirtualKeyCode:87});
  await send("Input.dispatchKeyEvent",{type:"keyUp",key:"w",code:"KeyW",
    windowsVirtualKeyCode:87,nativeVirtualKeyCode:87});
  await poll(()=>evaluate(`(()=>{
    const id=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character.id;
    const at=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.world-location.v068."+id));
    return at.x===${beforeNativeMove.x}&&at.y===${beforeNativeMove.y}-1;
  })()`),"movimento Android nativo com salvamento",45);
  if(await evaluate('!!document.querySelector(".baixada-world .na-world-startup")'))
    throw new Error("O mapa leve voltou à tela de carregamento durante a caminhada.");
  console.log("QA movimento Android: navegação do teclado e save funcional no motor nativo.");

  // Conversa com um NPC humano real, sem mock nem injeção de estado React:
  // a simulação Android posiciona o herói ao lado da banca do Nilo.
  await evaluate(`(()=>{
    const save=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    localStorage.setItem("cyberpunk-tactical-rpg.world-location.v068."+save.id,
      JSON.stringify({x:4,y:7}));
    return true;
  })()`);
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"menu para prova de conversa humana");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>evaluate('document.querySelector(".baixada-world[data-scene-state=ready] canvas")?.width>200'),
    "protagonista na banca do Nilo",90);
  await sleep(850);
  const pressedNpc=await evaluate(`(()=>{
    const canvas=document.querySelector(".baixada-world canvas");
    const rect=canvas?.getBoundingClientRect();
    if(!rect)return false;
    const zoom=Math.max(.76,Math.min(1.22,Math.min(rect.width/930,rect.height/475)*1.08));
    const pointX=rect.left+rect.width/2+24*zoom;
    const pointY=rect.top+rect.height*.53-12*zoom-25;
    return canvas.dispatchEvent(new PointerEvent("pointerdown",{
      bubbles:true,cancelable:true,pointerType:"touch",isPrimary:true,
      clientX:pointX,clientY:pointY}));
  })()`);
  if(pressedNpc===null)throw new Error("Toque simulado no Nilo não foi processado.");
  await poll(()=>has(".na-narrative-panel"),"conversa com retrato próprio do Nilo",90);
  const npcDialogue=await evaluate(`(()=>{
    const panel=document.querySelector(".na-narrative-panel");
    const img=panel?.querySelector(".na-portrait-scene");
    const button=panel?.querySelector(".dialogue-continue");
    const rect=panel?.getBoundingClientRect(),b=button?.getBoundingClientRect();
    return {speaker:panel?.querySelector("#dialogue-title")?.textContent,
      portrait:img?.dataset.portraitId,emotion:img?.dataset.emotion,
      text:panel?.querySelector(".na-dialogue-spoken")?.getAttribute("aria-label"),
      width:rect?.width,bottom:rect?.bottom,buttonBottom:b?.bottom,viewport:innerHeight};
  })()`);
  if(npcDialogue.speaker!=="Nilo"||npcDialogue.portrait!=="nilo"||
     !npcDialogue.text?.includes("conector")||
     npcDialogue.bottom>npcDialogue.viewport+2||
     npcDialogue.buttonBottom>npcDialogue.viewport+2)
    throw new Error("Diálogo NPC cortado ou sem retrato próprio: "+JSON.stringify(npcDialogue));
  await writeFile("qa/dialogo-nilo-v077-914x411.png",Buffer.from(
    (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  console.log("QA diálogo cinematográfico: busto de Nilo, fala e navegação Android aprovados.");

  // Quadro progressivo: somente os favores conhecidos na etapa 1 aparecem.
  // A tela não deve mostrar as campanhas futuras nem cobrir o cenário inteiro.
  await evaluate('document.querySelector(".na-dialogue-close").click();true');
  await evaluate(`(()=>{
    const hero=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    localStorage.setItem("cyberpunk-tactical-rpg.mission.v1."+hero.id,
      JSON.stringify({step:1,clues:[]}));
    localStorage.setItem("cyberpunk-tactical-rpg.world-area.v1."+hero.id,"null");
    return true;
  })()`);
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"título para HUD progressivo");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>has(".na-quest-hud"),"HUD compacto de missões",90);
  if(await evaluate('document.querySelector(".na-quest-hud")?.classList.contains("collapsed")'))
    await evaluate('document.querySelector(".na-quest-hud .na-hub-toggle").click();true');
  await poll(()=>has(".na-quest-tabs [role=tab]"),"abas de missões e favores");
  await evaluate('document.querySelectorAll(".na-quest-tabs [role=tab]")[1].click();true');
  await poll(()=>has(".na-favor-row"),"favor liberado pela clínica");
  const questBoard=await evaluate(`(()=>{
    const hub=document.querySelector(".na-quest-hud"),r=hub?.getBoundingClientRect();
    const names=[...document.querySelectorAll(".na-favor-row>div>strong")].map(n=>n.textContent);
    return {names,viewport:innerHeight,bottom:r?.bottom,width:r?.width,height:r?.height,
      credits:document.querySelector(".na-favor-wallet")?.textContent,
      tab:document.querySelectorAll(".na-quest-tabs [role=tab]")[1]?.getAttribute("aria-selected")};
  })()`);
  if(questBoard.names.length!==2||
    !questBoard.names.some(x=>x.includes("primeiros socorros"))||
    !questBoard.names.some(x=>x.includes("Peças para o Canal"))||
    questBoard.bottom>questBoard.viewport+2||questBoard.height>questBoard.viewport*.72||
    questBoard.tab!=="true")
    throw new Error("HUD progressivo com spoilers ou fora da tela: "+JSON.stringify(questBoard));
  await writeFile("qa/favores-progressivos-914x411.png",Buffer.from(
    (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  await evaluate('document.querySelector(".na-favor-row button").click();true');
  const acceptedFavor=await evaluate(`(()=>{
    const hero=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    return JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.favors.v1."+hero.id));
  })()`);
  if(!acceptedFavor?.accepted?.includes("triagem")||acceptedFavor.claimed?.length)
    throw new Error("Favor não foi aceito e salvo pelo quadro: "+JSON.stringify(acceptedFavor));
  console.log("QA favores: HUD compacto, 2 favores liberados, aceitação e save confirmados.");

  // Regressão real: tratamento não pode ficar dentro do painel de missões,
  // fechado por padrão no Android. Testar HP real (save + HUD + UI).
  await evaluate(`(()=>{
    const hero=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    const shown=document.querySelector(".na-explore-health strong")?.textContent??"18/18";
    const maxHp=Number(shown.split("/")[1])||18;
    localStorage.setItem("cyberpunk-tactical-rpg.world-area.v1."+hero.id,JSON.stringify("clinic"));
    localStorage.setItem("cyberpunk-tactical-rpg.health.v1."+hero.id,
      JSON.stringify({hp:5,maxHp}));
    return true;
  })()`);
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"menu para teste da clínica");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>has(".na-clinic-quick-treatment button"),"botão de atendimento na clínica");
  const clinicBefore=await evaluate(`(()=>{
    const hero=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    const panel=document.querySelector(".na-clinic-quick-treatment");
    const button=panel?.querySelector("button");
    const r=button?.getBoundingClientRect();
    const stored=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.health.v1."+hero.id));
    return {hp:stored.hp,maxHp:stored.maxHp,
      hubCollapsed:document.querySelector(".na-mission-hub")?.classList.contains("collapsed"),
      buttonDisabled:button?.disabled,visible:!!r&&r.width>100&&r.height>=48&&r.top>=0&&
        r.bottom<=innerHeight+2,enabled:button?getComputedStyle(button).display!=="none":false,
      text:button?.textContent??""};
  })()`);
  if(clinicBefore.hp!==5||!clinicBefore.hubCollapsed||clinicBefore.buttonDisabled||
     !clinicBefore.visible||!clinicBefore.enabled||!clinicBefore.text.includes("TRATAMENTO"))
    throw new Error("Cura inacessível no hospital: "+JSON.stringify(clinicBefore));
  await writeFile("qa/clinica-tratamento-antes-914x411.png",Buffer.from(
    (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  await evaluate('document.querySelector(".na-clinic-quick-treatment button").click();true');
  await poll(()=>evaluate(`(()=>{
    const hero=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    const hp=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.health.v1."+hero.id));
    return hp.hp===hp.maxHp&&
      document.querySelector(".na-explore-health strong")?.textContent===hp.maxHp+"/"+hp.maxHp &&
      document.querySelector(".na-clinic-quick-treatment button")?.disabled===true;
  })()`),"Vida persistida e HUD atualizado após cura",45);
  const dialogText=await evaluate('document.querySelector(".na-dialogue-spoken")?.getAttribute("aria-label")');
  if(!dialogText?.includes("Seus ferimentos foram tratados"))
    throw new Error("Dra. Amara não confirmou o tratamento: "+dialogText);
  await writeFile("qa/clinica-tratamento-depois-914x411.png",Buffer.from(
    (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  console.log("QA clínica: botão sempre visível com missões fechadas; 5 PV recuperados até máximo e persistidos.");

  // v0.8.1: confirmar que os 7 novos interiores são cenas reais no Chromium.
  // Captura em 914×411 e teste do retorno à área de origem (sem softlock).
  const rooms=[
    ["baixada-community",null],["ferrugem-foundry","ferrugem"],
    ["aurea-archive","aurea"],["subsolo-hideout","subsolo"],
    ["setor-zero-lab","setor-zero"],["prisma-backstage","prisma"],
    ["periferia-waterworks","periferia"],
  ];
  for(const [room,parent] of rooms){
    await evaluate(`(()=>{
      const hero=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
      localStorage.setItem("cyberpunk-tactical-rpg.world-area.v1."+hero.id,JSON.stringify("${room}"));
      return true;
    })()`);
    await send("Page.navigate",{url:URL});
    await poll(()=>has(".na-title-option"),"menu após entrar no interior "+room);
    await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
    await poll(()=>has('.interior-world.'+room+' canvas[data-nova-arcadia-interior="'+room+'"]'),
      "mapa navegável de "+room,90);
    await sleep(230);
    const indoor=await evaluate(`(()=>{
      const canvas=document.querySelector(".interior-world.${room} canvas");
      const rect=canvas?.getBoundingClientRect();
      return {area:canvas?.getAttribute("data-nova-arcadia-interior"),
       width:rect?.width,height:rect?.height,screen:document.querySelector(".district-brand h1")?.textContent};
    })()`);
    if(indoor.area!==room||indoor.width<400||indoor.height<250||
       !indoor.screen?.includes("Nova Arcádia"))
      throw new Error("Falha na cena interior de "+room+": "+JSON.stringify(indoor));
    await writeFile("qa/interior-"+room+"-914x411.png",Buffer.from(
      (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
    await evaluate('document.querySelector(".area-return")?.click();true');
    if(parent)await poll(()=>has(".interior-world."+parent+" canvas"),"retorno de "+room+" para "+parent);
    else await poll(()=>has(".baixada-world:not(.interior-world) canvas"),"retorno à Casa Comum na Baixada");
  }
  console.log("QA interiores: 7 cenas carregadas sob demanda, capturadas e saídas testadas.");
  // Regressão pós-morte: um combate perdido nunca pode prender o usuário
  // numa tela com ataques desabilitados ou exigir scroll no Android landscape.
  await evaluate(`(()=>{
    const hero=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    localStorage.setItem("cyberpunk-tactical-rpg.world-area.v1."+hero.id,"null");
    localStorage.setItem("cyberpunk-tactical-rpg.health.v1."+hero.id,
      JSON.stringify({hp:1,maxHp:18}));
    return true;
  })()`);
  await send("Page.navigate",{url:URL});
  await poll(()=>has(".na-title-option"),"menu antes de forçar derrota");
  await evaluate('document.querySelectorAll(".na-title-option")[0].click();true');
  await poll(()=>has(".exploration-footer-actions.single-action button"),
    "acesso ao limbo de teste após retomar o personagem");
  await evaluate('document.querySelector(".exploration-footer-actions.single-action button").click();true');
  await poll(()=>has(".arena-v030 .end-turn-button"),"combate real após 1 PV");
  await evaluate('Math.random=()=>0.99999;true');
  const lose=async()=>{
    for(let round=0;round<24;round++){
      if(await has(".na-defeat-backdrop [role=dialog]"))return true;
      await evaluate('(()=>{const b=document.querySelectorAll(".actions .end-turn-button")[1];if(!b||b.disabled)return false;b.click();return true})()');
      await sleep(35);
    }
    return has(".na-defeat-backdrop [role=dialog]");
  };
  if(!await lose())throw new Error("Softlock: morte não apresentou diálogo de recuperação");
  const defeatGeometry=await evaluate(`(()=>{
    const modal=document.querySelector(".na-defeat-dialog");
    const buttons=[...modal.querySelectorAll(".na-defeat-options button")];
    const dialog=modal?.getBoundingClientRect();
    return {viewport:{w:innerWidth,h:innerHeight},
      modal:{top:dialog?.top,bottom:dialog?.bottom},
      buttons:buttons.map(b=>{
        const r=b.getBoundingClientRect();return {text:b.textContent,top:r.top,
          bottom:r.bottom,width:r.width,height:r.height,disabled:b.disabled}
      }),main:document.querySelector(".na-defeat-dialog h2")?.textContent};
  })()`);
  if(defeatGeometry.buttons.length!==2||
     !defeatGeometry.main?.includes("incapacitado")||
     defeatGeometry.modal.top<0||defeatGeometry.modal.bottom>innerHeight+2||
     defeatGeometry.buttons.some(b=>b.top<0||b.bottom>innerHeight+2||b.height<48||b.disabled))
    throw new Error("Tela de derrota não cabe na viewport móvel: "+
      JSON.stringify(defeatGeometry));
  await writeFile("qa/derrota-recuperacao-914x411.png",Buffer.from(
    (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  await evaluate('document.querySelector(".na-defeat-retry").click();true');
  await poll(()=>evaluate('!document.querySelector(".na-defeat-backdrop")'),
    "retentativa remove modal e reinicia combate");
  const retryHp=await evaluate('document.querySelector(".unit-card.cyan .unit-stats b")?.textContent');
  const retryNumbers=retryHp?.split("/").map(Number)??[];
  if(!retryHp||retryNumbers[0]!==Math.ceil(retryNumbers[1]*.5))
    throw new Error("Retentativa não restaurou metade da Vida: "+retryHp);
  if(!await lose())throw new Error("Segunda derrota não ofereceu evacuação");
  await evaluate('document.querySelector(".na-defeat-clinic").click();true');
  await poll(()=>has(".na-clinic-quick-treatment button"),
    "evacuação real à clínica após derrota");
  const rescue=await evaluate(`(()=>{
    const c=JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.character.v1")).character;
    return {area:JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.world-area.v1."+c.id)),
      health:JSON.parse(localStorage.getItem("cyberpunk-tactical-rpg.health.v1."+c.id)),
      clinic:!!document.querySelector(".na-clinic-quick-treatment button")};
  })()`);
  if(!rescue.clinic||rescue.area!=="clinic"||
    rescue.health.hp!==Math.ceil(rescue.health.maxHp*.35))
    throw new Error("Evacuação da derrota não foi persistida: "+JSON.stringify(rescue));
  await writeFile("qa/derrota-clinica-914x411.png",Buffer.from(
    (await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false})).data,"base64"));
  console.log("QA derrota Android: KO real, modal 914x411, retry 50% PV e clínica 35% PV.");
  console.log("QA Android: ARTE ORIGINAL restaurada, "+androidPixels.artLoaded+
    " imagens (personagens e props), "+androidPixels.colors+
    " cores amostradas, 2D leve e HUD recolhido.");

  console.log("QA cidade: 5 novos mapas, central de transporte, capítulos e retomada após fechar.");

  console.log("QA visual: capturas masculina/feminina; canvas preservado após alternância.");
  console.log("Viewport: " + JSON.stringify(metrics) + ", PNG: " + bytes.length + " bytes");
  if (session.exceptions.length) {
    throw new Error("Exceções de execução detectadas no navegador: " + session.exceptions.join(" | ").slice(0,1500));
  }
} finally {
  session?.close();
  for (const child of [browser, server]) {
    if (child?.pid) {
      try { process.kill(-child.pid, "SIGKILL"); } catch { child.kill("SIGKILL"); }
    }
  }
}
