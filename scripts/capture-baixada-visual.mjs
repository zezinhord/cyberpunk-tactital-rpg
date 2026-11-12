/** Captura real da interface Phaser, sem Playwright nem dependências externas.
 * O Chromium é disponibilizado pelo runner Ubuntu; falhas visuais NÃO bloqueiam o APK.
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
  await poll(() => evaluate('Boolean(document.querySelector(".creation-shell .primary-button:not([disabled])"))'), "nome validado");
  await evaluate('document.querySelector(".creation-shell .primary-button").click();true');
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
  await writeFile("qa/baixada-metricas.json", JSON.stringify({ metrics, pngBytes: bytes.length,
    runtimeExceptions: session.exceptions }, null, 2));

  console.log("QA visual: captura Phaser criada em " + OUT);
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
