import {useEffect,useMemo,useState} from "react";
import {PACK_IDS,deliverySize,type PackId} from "../game/assets/pack-catalog.ts";
import {formatAssetSize,installDistrictPack,inspectPack,removeDistrictPack,
 verifiedCatalog,nativePackPlatform} from "../game/assets/native-pack-manager.ts";

interface InstallState{stage:string;bytes:number;total:number}
const DISTRICT_LABELS:Record<PackId,string>={
 baixada:"Baixada",ferrugem:"Ferrugem",aurea:"Áurea",
 subsolo:"Subsolo","setor-zero":"Setor Zero",
 prisma:"Prisma",periferia:"Periferia",
};
/** Optional, offline-once-downloaded art packs. Nothing downloads during boot.
 * Kept behind the complete release manifest to avoid listing nonexistent DLC.
 */
export default function AssetPackControls(){
 const catalog=useMemo(()=>verifiedCatalog(),[]);
 const total=deliverySize(catalog);
 const [installed,setInstalled]=useState<Partial<Record<PackId,boolean>>>({});
 const [free,setFree]=useState(0);
 const [busy,setBusy]=useState<PackId|null>(null);
 const [transfer,setTransfer]=useState<InstallState|null>(null);
 const [notice,setNotice]=useState("");
 useEffect(()=>{
  let active=true;
  if(!nativePackPlatform())return;
  (async()=>{
   for(const p of catalog.packs){
    try{
     const s=await inspectPack(p.id);
     if(!active)return;
     setInstalled(prev=>({...prev,[p.id]:s.installed}));
     setFree(s.freeBytes);
    }catch{
     if(active)setNotice("Não foi possível verificar os pacotes instalados.");
    }
   }
  })();
  return ()=>{active=false;};
 },[catalog]);
 if(!nativePackPlatform())return <section className="menu-info-panel">
   <h4>Pacotes de Nova Arcádia</h4>
   <p>O instalador completo funciona na versão Android; os arquivos básicos
      continuam disponíveis sem conexão.</p>
 </section>;
 if(catalog.packs.length!==PACK_IDS.length)return <section className="menu-info-panel">
   <h4>Expansão adicional ainda não publicada</h4>
   <p>Somente recursos de conteúdo autenticados podem ser instalados.
      O jogo atual permanece funcional sem pacotes externos.</p>
 </section>;
 async function add(id:PackId){
  if(busy)return;
  setBusy(id);setNotice("");setTransfer({stage:"download",bytes:0,total:0});
  try{
   const result=await installDistrictPack(id,event=>{
    setTransfer({stage:event.stage,bytes:event.bytes,total:event.total});
   });
   setInstalled(prev=>({...prev,[id]:result.installed}));
   setFree(result.freeBytes);
   setNotice(DISTRICT_LABELS[id]+": conteúdo verificado e disponível offline.");
  }catch(error){
   setNotice("Não foi possível instalar "+DISTRICT_LABELS[id]+": "+
    (error instanceof Error?error.message:"erro de transferência"));
  }finally{setBusy(null);setTransfer(null);}
 }
 async function drop(id:PackId){
  if(busy)return;
  setBusy(id);setNotice("");
  try{
   await removeDistrictPack(id);
   setInstalled(prev=>({...prev,[id]:false}));
   const info=await inspectPack(id);
   setFree(info.freeBytes);
   setNotice(DISTRICT_LABELS[id]+": dados extras excluídos; jogo base preservado.");
  }catch{
   setNotice("Não foi possível liberar os dados extras deste distrito.");
  }finally{setBusy(null);}
 }
 return <div className="menu-section-stack">
   <section className="menu-info-panel">
     <span className="menu-panel-kicker">{total.targetReached?
       "EDIÇÃO COMPLETA · PACOTES VERIFICADOS":
       (catalog.tag.includes("2074")?"MARCO +900 MB":
       catalog.tag.includes("1774")?"MARCO +600 MB":"MARCO +300 MB")+
         " · PACOTES DE TESTE VERIFICADOS"}</span>
     <h4>{formatAssetSize(total.totalBytes)} de conteúdo auditado</h4>
     <p>{total.targetReached?"Edição definitiva com os sete distritos.":
       "Marco intermediário de produção; a edição final de 3 GB ainda não foi publicada."}
       O aplicativo base é instalado normalmente. As artes adicionais são
       transferidas por distrito, uma única vez, com SHA-256 e salvamento
       no armazenamento privado do Android. Depois funcionam sem rede.</p>
     <small>Espaço disponível: {formatAssetSize(free)}.
       Durante a instalação, também é necessário espaço temporário para
       verificar o arquivo antes de extrair.</small>
   </section>
   <section className="menu-list-panel" aria-label="Pacotes de recursos offline">
     {PACK_IDS.map(id=>{
       const pack=catalog.packs.find(p=>p.id===id);
       if(!pack)return null;
       const done=installed[id]===true;
       const working=busy===id;
       return <article className="na-item-row" key={id}>
         <div>
           <span>ARTE E CENAS · {pack.locationCount} LOCAIS</span>
           <h4>{DISTRICT_LABELS[id]} {done?"· INSTALADO":""}</h4>
           <p>{pack.artworkCount} arquivos vinculados ao jogo.
            Download: {formatAssetSize(pack.compressedBytes)}.</p>
           {working&&transfer&&<small role="status">
              {transfer.stage==="download"?"Baixando":
               transfer.stage==="unpack"?"Verificando e instalando":
               "Processando"}: {formatAssetSize(transfer.bytes)} de
               {formatAssetSize(transfer.total)}
            </small>}
         </div>
         <button type="button" disabled={busy!==null} onClick={()=>done?drop(id):add(id)}>
           {working?"Aguarde":done?"Remover extras":"Baixar conteúdo"}
         </button>
       </article>;
     })}
   </section>
   {notice&&<p className="menu-footnote" role="status">{notice}</p>}
 </div>;
}
