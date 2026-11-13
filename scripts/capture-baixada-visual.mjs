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
  await poll(() => has(".intro-shell .primary-button"), "prólogo");
  await evaluate('document.querySelector(".intro-shell .primary-button").click();true');
  await poll(() => has(".baixada-world canvas"), "canvas Phaser");
  await sleep(2600);

  const metrics = await evaluate('(()=>{const c=document.querySelector(".baixada-world canvas");const r=c.getBoundingClientRect();return {scene:!!c,width:Math.round(r.width),height:Math.round(r.height),canvasWidth:c.width,canvasHeight:c.height,title:document.title};})()');
  if (!metrics?.scene || metrics.width < 200 || metrics.height < 150) {
    throw new Error("Viewport Phaser inválido: " + JSON.stringify(metrics));
  }

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
  const classButton=await evaluate(`(()=>{
    const button=document.querySelector(".arena-special.class-exclusive");
    if(!button)return {found:false};
    return {found:true,name:button.textContent,disabled:button.getAttribute("aria-disabled")};
  })()`);
  if(!classButton.found || !classButton.name.includes("Protocolo de Contingência") ||
      classButton.disabled!=="false")throw new Error("Habilidade da classe não carregada: "+JSON.stringify(classButton));
  await evaluate('document.querySelector(".arena-special.class-exclusive").click();true');
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
