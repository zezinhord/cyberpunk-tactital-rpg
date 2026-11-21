import {useEffect,useMemo,useRef,useState,type ReactNode} from "react";
import {PACK_IDS,deliverySize,type PackId} from "../game/assets/pack-catalog.ts";
import {isCompleteGameCatalog,emptyContentStatus,hasInstalledEntireGame,installedGameBytes,fullGameProgress,nextMissingGameDistrict} from "../game/assets/complete-installation.ts";
import {formatAssetSize,importDistrictPack,
 inspectPack,installDistrictPack,nativePackPlatform,verifiedCatalog,
} from "../game/assets/native-pack-manager.ts";
import "../game-installation.css";

/** One mandatory, non-optional first-run installation.
 * The signed APK and authenticated art packs form a SINGLE GAME.
 * The player never selects which content to omit; all seven regions are
 * required before gameplay. After installation every region runs offline.
 *
 * Compatibility: existing QA201 saves and already installed full packs are
 * reused. On a web development build, there is no Android asset provisioner.
 */
const NAMES:Readonly<Record<PackId,string>>={
 baixada:"Baixada",ferrugem:"Ferrugem",aurea:"Áurea",
 subsolo:"Subsolo","setor-zero":"Setor Zero",
 prisma:"Prisma",periferia:"Periferia",
};
type Phase="checking"|"needed"|"installing"|"ready"|"invalid";
type Transfer={id:PackId;stage:string;bytes:number;total:number};
const statusText=(stage:string)=>{
 if(stage==="download")return "Transferindo arquivos do jogo";
 if(stage==="import")return "Importando arquivos oficiais";
 if(stage==="unpack")return "Verificando e instalando";
 if(stage==="ready")return "Concluído";
 return "Preparando instalação";
};
function informativeError(error:unknown,id:PackId):string{
 const detail=error instanceof Error?error.message:String(error);
 if(/storage|espaço|space|disk|ENOSPC/i.test(detail))
  return "Espaço insuficiente para instalar "+NAMES[id]+
   ". Libere armazenamento; os outros distritos já instalados serão preservados.";
 if(/HTTP 40[34]|network|timeout|internet|connection|fetch|offline/i.test(detail))
  return "Não foi possível baixar "+NAMES[id]+
   ". Confira a conexão e selecione Retomar. Também é possível importar o ZIP oficial.";
 return "A instalação de "+NAMES[id]+" não foi concluída: "+detail.slice(0,230)+
  ". Nenhum personagem ou distrito instalado foi removido.";
}
const initialStats=emptyContentStatus;
export default function GameInstallationGate({children}:{children:ReactNode}){
 const enabled=nativePackPlatform();
 const catalog=useMemo(()=>verifiedCatalog(),[]);
 const completeCatalog=isCompleteGameCatalog(catalog);
 const [phase,setPhase]=useState<Phase>("checking");
 const [installed,setInstalled]=useState<Record<PackId,boolean>>(initialStats);
 const [transfer,setTransfer]=useState<Transfer|null>(null);
 const [message,setMessage]=useState("");
 const [selected,setSelected]=useState<PackId|null>(null);
 const [free,setFree]=useState(0);
 const busy=useRef(false);
 const total=deliverySize(catalog);
 const installedBytes=installedGameBytes(catalog,installed);
 const transferBytes=transfer&&!installed[transfer.id]?
  Math.min(transfer.bytes,catalog.packs.find(p=>p.id===transfer.id)?.compressedBytes??0):0;
 const next=nextMissingGameDistrict(installed);
 const fraction=fullGameProgress(catalog,installed,transfer);

 const refresh=async():Promise<Record<PackId,boolean>>=>{
  const entries=await Promise.all(PACK_IDS.map(async id=>{
   const result=await inspectPack(id);
   return {id,result};
  }));
  const updated=initialStats();
  for(const {id,result} of entries){
   updated[id]=result.installed;
   if(Number.isFinite(result.freeBytes))setFree(result.freeBytes);
  }
  setInstalled(updated);
  return updated;
 };

 useEffect(()=>{
  let alive=true;
  if(!enabled){setPhase("ready");return;}
  if(!completeCatalog){
   setPhase("invalid");
   setMessage("Este APK não contém o catálogo autenticado completo de 3 GB. "+
    "A instalação foi bloqueada para não apresentar um jogo incompleto.");
   return;
  }
  void (async()=>{
   try{
    const result=await Promise.all(PACK_IDS.map(async id=>({id,status:await inspectPack(id)})));
    if(!alive)return;
    const updated=initialStats();
    for(const entry of result){
     updated[entry.id]=entry.status.installed;
     if(Number.isFinite(entry.status.freeBytes))setFree(entry.status.freeBytes);
    }
    setInstalled(updated);
    setPhase(hasInstalledEntireGame(updated)?"ready":"needed");
   }catch(error){
    if(!alive)return;
    setMessage("Não foi possível verificar os arquivos instalados: "+
     (error instanceof Error?error.message:"erro de acesso ao armazenamento"));
    setPhase("needed");
   }
  })();
  return()=>{alive=false;};
 },[enabled,completeCatalog]);

 async function installAll():Promise<void>{
  if(busy.current)return;
  busy.current=true;setPhase("installing");setMessage("");
  try{
   for(const id of PACK_IDS){
    const checked=await inspectPack(id);
    if(checked.installed){
     setInstalled(old=>({...old,[id]:true}));
     continue;
    }
    setSelected(id);
    setTransfer({id,stage:"download",bytes:0,total:0});
    const status=await installDistrictPack(id,event=>{
     setTransfer({id,stage:event.stage,bytes:event.bytes,total:event.total});
    });
    if(!status.installed)throw new Error("Assinatura SHA-256 não confirmada.");
    setInstalled(old=>({...old,[id]:true}));
    setFree(status.freeBytes);
    setTransfer(null);
   }
   const current=await refresh();
   if(!hasInstalledEntireGame(current))throw new Error("A verificação final não confirmou os sete distritos.");
   setPhase("ready");
  }catch(error){
   setMessage(informativeError(error,selected??next??"baixada"));
   setPhase("needed");
  }finally{setTransfer(null);setSelected(null);busy.current=false;}
 }

 async function importNext():Promise<void>{
  if(busy.current)return;
  busy.current=true;setMessage("");setPhase("installing");
  try{
   const current=await refresh();
   const id=PACK_IDS.find(p=>!current[p]);
   if(!id){setPhase("ready");return;}
   setSelected(id);
   setTransfer({id,stage:"import",bytes:0,total:0});
   const status=await importDistrictPack(id,event=>{
    setTransfer({id,stage:event.stage,bytes:event.bytes,total:event.total});
   });
   if(!status.installed)throw new Error("O ZIP selecionado não corresponde ao jogo.");
   const latest=await refresh();
   setMessage(hasInstalledEntireGame(latest)?"":"Arquivo oficial de "+NAMES[id]+
    " integrado. Continue a instalação dos distritos restantes.");
   setPhase(hasInstalledEntireGame(latest)?"ready":"needed");
  }catch(error){
   setMessage(informativeError(error,selected??next??"baixada"));
   setPhase("needed");
  }finally{setSelected(null);setTransfer(null);busy.current=false;}
 }

 if(phase==="ready")return <>{children}</>;
 return <main className="na-install-root" role="main" aria-label="Instalação completa de Nova Arcádia">
  <section className="na-install-window" aria-live="polite">
   <header className="na-install-heading">
    <small>NOVA ARCÁDIA 2.0 · PROJETO ÉDEN</small>
    <h1>Instalação do jogo completo</h1>
    <p>Os sete distritos e seus 3.808 recursos visuais pertencem à campanha principal.
     A instalação é única, obrigatória e, quando concluída, funciona offline.</p>
   </header>
   {phase==="checking"?<p role="status" className="na-install-message">
     Verificando arquivos oficiais já presentes no aparelho. Os salvamentos serão preservados…
   </p>:phase==="invalid"?<p role="alert" className="na-install-error">{message}</p>:<>
    <div className="na-install-meter">
     <div><strong>{fraction}% instalado</strong>
      <span>{formatAssetSize(installedBytes+transferBytes)} / {formatAssetSize(catalog.totalBytes)}</span></div>
     <div className="na-install-track" role="progressbar" aria-label="Instalação dos arquivos do jogo"
      aria-valuenow={fraction} aria-valuemin={0} aria-valuemax={100}>
      <span style={{width:fraction+"%"}}/>
     </div>
     <small>Instalação total: aproximadamente {formatAssetSize(total.totalBytes)}.
      Nesta etapa, {formatAssetSize(catalog.totalBytes)} de arquivos pertencem aos distritos.</small>
    </div>
    <div className="na-install-districts">
     {PACK_IDS.map(id=><div key={id} className={"na-install-district"+(installed[id]?" done":"")}>
      <span>{installed[id]?"✓":selected===id?"◌":"○"}</span>
      <strong>{NAMES[id]}</strong>
      <small>{installed[id]?"Instalado e autenticado":
       selected===id&&transfer?statusText(transfer.stage):
       "Parte obrigatória do jogo"}</small>
     </div>)}
    </div>
    {transfer&&<p className="na-install-message" role="status">
     {statusText(transfer.stage)}: {NAMES[transfer.id]} —
     {" "}{formatAssetSize(transfer.bytes)} de {formatAssetSize(transfer.total)}
    </p>}
    {message&&<p className="na-install-error" role="alert">{message}</p>}
    {phase==="needed"&&<div className="na-install-actions">
     <button type="button" className="primary" onClick={()=>void installAll()}>
      {fraction>0?"Retomar instalação completa":"Instalar Nova Arcádia completa"}
     </button>
     {next&&<button type="button" className="secondary" onClick={()=>void importNext()}>
       Importar arquivo oficial sem internet
      </button>}
    </div>}
    {phase==="installing"&&<p className="na-install-message" role="status">
      Instalando a campanha integralmente. Não feche o aplicativo durante a verificação.
     </p>}
    <footer>
     <span>Espaço livre: {formatAssetSize(free)}</span>
     <span>Sem conteúdo opcional · SHA-256 · Salvamentos preservados</span>
    </footer>
   </>}
  </section>
 </main>;
}
