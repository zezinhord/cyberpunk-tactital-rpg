import {useEffect,useMemo,useRef,useState,type ReactNode} from "react";
import {PACK_IDS,deliverySize,type PackId} from "../game/assets/pack-catalog.ts";
import {isCompleteGameCatalog,emptyContentStatus,hasInstalledEntireGame,
 installedGameBytes,fullGameProgress} from "../game/assets/complete-installation.ts";
import {formatAssetSize,inspectPack,installEmbeddedDistrict,integratedApkStatus,
 nativePackPlatform,verifiedCatalog} from "../game/assets/native-pack-manager.ts";
import "../game-installation.css";

/** Nova Arcádia 2.0 is ONE complete game. Every Android boot verifies that
 * the full set of seven signed districts is ready. Missing game data are
 * prepared automatically from the APK, with NO opt-in, NO extra download,
 * NO skip button, and NO route to gameplay before all districts pass SHA.
 * Existing QA201 saves and previously verified district files are preserved.
 */
const NAMES:Readonly<Record<PackId,string>>={
 baixada:"Baixada",ferrugem:"Ferrugem",aurea:"Áurea",subsolo:"Subsolo",
 "setor-zero":"Setor Zero",prisma:"Prisma",periferia:"Periferia",
};
type Phase="checking"|"installing"|"ready"|"invalid"|"failed";
type Transfer={id:PackId;stage:string;bytes:number;total:number};
function explainFailure(error:unknown,id:PackId):string{
 const detail=error instanceof Error?error.message:String(error);
 if(/storage|space|disk|ENOSPC|espaço/i.test(detail))
  return "O espaço de armazenamento não é suficiente para preparar "+NAMES[id]+
   ". Libere espaço e toque em Tentar novamente; seus salvamentos permanecerão intactos.";
 return "Não foi possível preparar "+NAMES[id]+": "+detail.slice(0,220)+
  ". O conteúdo instalado anteriormente e os salvamentos foram preservados.";
}
const newStatus=emptyContentStatus;
export default function GameInstallationGate({children}:{children:ReactNode}){
 const enabled=nativePackPlatform();
 const catalog=useMemo(()=>verifiedCatalog(),[]);
 const valid=useMemo(()=>isCompleteGameCatalog(catalog),[catalog]);
 const [phase,setPhase]=useState<Phase>("checking");
 const [installed,setInstalled]=useState<Record<PackId,boolean>>(newStatus);
 const [transfer,setTransfer]=useState<Transfer|null>(null);
 const [error,setError]=useState("");
 const [selected,setSelected]=useState<PackId|null>(null);
 const [free,setFree]=useState(0);
 const [apkBytes,setApkBytes]=useState(0);
 const busy=useRef(false);
 const currentBytes=installedGameBytes(catalog,installed);
 const progress=fullGameProgress(catalog,installed,transfer);
 const activeBytes=transfer&&!installed[transfer.id]?
  Math.min(Math.max(0,transfer.bytes),catalog.packs.find(p=>p.id===transfer.id)?.compressedBytes??0):0;
 const preparedBytes=currentBytes+activeBytes;
 const total=deliverySize(catalog);

 async function readInstalled():Promise<Record<PackId,boolean>>{
  const states=await Promise.all(PACK_IDS.map(async id=>({id,result:await inspectPack(id)})));
  const latest=newStatus();
  for(const {id,result} of states){
   latest[id]=result.installed;
   if(Number.isFinite(result.freeBytes))setFree(result.freeBytes);
  }
  setInstalled(latest);
  return latest;
 }

 async function prepareFullGame(initial?:Record<PackId,boolean>):Promise<void>{
  if(busy.current)return; // Includes StrictMode double-mount and manual retries.
  busy.current=true;
  setPhase("installing");
  setError("");
  let currentDistrict:PackId="baixada";
  try{
   // Inspect the seven private game districts once at boot or retry.
   // A redundant native status round-trip for each district would walk
   // thousands of installed files and block slower Android devices.
   const verified=initial??await readInstalled();
   for(const id of PACK_IDS){
    currentDistrict=id;
    if(verified[id]){
     setInstalled(old=>({...old,[id]:true}));
     continue;
    }
    setSelected(id);
    setTransfer({id,stage:"embedded",bytes:0,total:0});
    const installedDistrict=await installEmbeddedDistrict(id,event=>{
     setTransfer({id,stage:event.stage,bytes:event.bytes,total:event.total});
    });
    if(!installedDistrict.installed)
     throw new Error("O recurso obrigatório não passou pela verificação de integridade.");
    setInstalled(old=>({...old,[id]:true}));
    setFree(installedDistrict.freeBytes);
    setTransfer(null);
   }
   const latest=await readInstalled();
   if(!hasInstalledEntireGame(latest))
    throw new Error("A instalação completa dos sete distritos não foi confirmada.");
   setPhase("ready");
  }catch(e){
   // React state is asynchronous: selected may still refer to the prior district.
   setError(explainFailure(e,currentDistrict));
   setPhase("failed");
  }finally{
   setTransfer(null);
   setSelected(null);
   busy.current=false;
  }
 }

 // ONE single automatic installation process on every native startup.
 // A release missing the seven internal archives is INVALID, never an
 // 'optional DLC' fallback and never a silent remote download.
 useEffect(()=>{
  let active=true;
  if(!enabled){setPhase("ready");return;}
  if(!valid){
   setError("Este APK não contém o catálogo completo da versão 2.0.");
   setPhase("invalid");
   return;
  }
  void (async()=>{
   try{
    const bundle=await integratedApkStatus();
    if(!active)return;
    if(Number.isFinite(bundle.apkBytes)&&Number(bundle.apkBytes)>0)setApkBytes(Number(bundle.apkBytes));
    if(!bundle.allBundled||bundle.bundledCount!==PACK_IDS.length){
     setError("Este instalador não contém os sete distritos obrigatórios da versão 2.0. Instale o APK completo, sem remover seus dados.");
     setPhase("invalid");
     return;
    }
    const latest=await readInstalled();
    if(!active)return;
    if(hasInstalledEntireGame(latest))setPhase("ready");
    else void prepareFullGame(latest); // Reuse verified state, no duplicate disk scan.
   }catch(e){
    if(!active)return;
    setError("Falha ao verificar os arquivos obrigatórios: "+
     (e instanceof Error?e.message:String(e)).slice(0,170));
    setPhase("failed");
   }
  })();
  return ()=>{active=false;};
 },[enabled,valid]);

 if(phase==="ready")return <>{children}</>;
 return <main className="na-install-root" role="main"
   aria-label="Preparação automática obrigatória de Nova Arcádia 2.0">
   <section className="na-install-window" aria-live="polite">
    <header className="na-install-heading">
     <small>NOVA ARCÁDIA 2.0 · PROJETO ÉDEN</small>
     <h1>{phase==="invalid"?"Edição incompleta":
      phase==="failed"?"A instalação precisa de reparo":
      "Preparando Nova Arcádia 2.0"}</h1>
     <p>Todos os sete distritos e seus 3.808 recursos visuais já fazem parte
      deste APK. A preparação é automática e obrigatória, sem conteúdo opcional
      ou novos downloads.</p>
    </header>
    {phase==="checking"&&<p role="status" className="na-install-message">
      Verificando os arquivos oficiais para abrir o jogo completo…
    </p>}
    {(phase==="installing"||phase==="failed")&&<>
     <div className="na-install-meter">
      <div><strong>{progress}% preparado</strong>
       <span>{formatAssetSize(preparedBytes)}/{formatAssetSize(catalog.totalBytes)} · arquivos dos distritos</span></div>
      <div className="na-install-track" role="progressbar" aria-valuenow={progress}
       aria-label="Preparação automática dos distritos" aria-valuemin={0} aria-valuemax={100}>
       <span style={{width:progress+"%"}}/>
      </div>
      <small>{apkBytes>0?"APK integral medido: ":"Pacote integral previsto: "}{formatAssetSize(apkBytes||total.totalBytes)} · recursos-base e estrutura do APK: {formatAssetSize(Math.max(0,(apkBytes||total.totalBytes)-catalog.totalBytes))} · arquivos dos distritos a verificar: {formatAssetSize(catalog.totalBytes)}. A barra mede somente os arquivos dos distritos; nenhum download adicional.</small>
     </div>
     <div className="na-install-districts">
      {PACK_IDS.map(id=><div key={id}
       className={"na-install-district"+(installed[id]?" done":"")}>
       <span>{installed[id]?"✓":selected===id?"◌":"○"}</span>
       <strong>{NAMES[id]}</strong>
       <small>{installed[id]?"Verificado":selected===id?
        "Preparando automaticamente":"Obrigatório"}</small>
      </div>)}
     </div>
     {transfer&&<p className="na-install-message" role="status">
      Preparando {NAMES[transfer.id]}: {formatAssetSize(transfer.bytes)}
      {" "}de {formatAssetSize(transfer.total)}
     </p>}
     {phase==="installing"&&<p className="na-install-message" role="status">
      A preparação começou automaticamente. Não feche o aplicativo até concluir.
     </p>}
    </>}
    {(phase==="invalid"||phase==="failed")&&<p className="na-install-error" role="alert">{error}</p>}
    {phase==="failed"&&<div className="na-install-actions">
      <button type="button" className="primary"
       onClick={()=>void prepareFullGame()}>Tentar novamente após corrigir o problema</button>
    </div>}
    <footer>
     <span>Espaço disponível: {formatAssetSize(free)}</span>
     <span>Versão 2.0 integral · Offline · Salvamentos preservados</span>
    </footer>
   </section>
 </main>;
}
