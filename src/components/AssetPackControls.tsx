import {useEffect,useState} from "react";
import {PACK_IDS,type PackId} from "../game/assets/pack-catalog.ts";
import {formatAssetSize,inspectPack,nativePackPlatform,verifiedCatalog}
 from "../game/assets/native-pack-manager.ts";

const LABELS:Readonly<Record<PackId,string>>={
 baixada:"Baixada",ferrugem:"Ferrugem",aurea:"Áurea",
 subsolo:"Subsolo","setor-zero":"Setor Zero",prisma:"Prisma",periferia:"Periferia",
};
/** Read-only maintenance view. Districts are not optional downloads:
 * the required first-run installation gate has provisioned all seven before
 * the player could create or load a character.
 */
export default function AssetPackControls(){
 const catalog=verifiedCatalog();
 const [statuses,setStatuses]=useState<Partial<Record<PackId,boolean>>>({});
 const [checking,setChecking]=useState(true);
 const [checkedCount,setCheckedCount]=useState(0);
 const [error,setError]=useState("");
 useEffect(()=>{
  let mounted=true;
  if(!nativePackPlatform()){setChecking(false);return;}
  // Android status() walks each district on disk. Serial reads prevent
  // concurrent filesystem stress on low-memory Android WebViews.
  void (async()=>{
   try{
    for(const id of PACK_IDS){
     const info=await inspectPack(id);
     if(!mounted)return;
     setStatuses(previous=>({...previous,[id]:info.installed}));
     setCheckedCount(previous=>previous+1);
    }
   }catch(err){
    if(mounted)setError("Não foi possível consultar a integridade dos arquivos: "+
     (err instanceof Error?err.message:"erro de acesso"));
   }finally{
    if(mounted)setChecking(false);
   }
  })();
  return()=>{mounted=false;};
 },[]);
 const all=PACK_IDS.every(id=>statuses[id]===true);
 return <div className="menu-section-stack" aria-label="Arquivos integrantes do jogo">
   <section className="menu-info-panel">
    <span className="menu-panel-kicker">JOGO COMPLETO · ARQUIVOS INTEGRADOS</span>
    <h4>Nova Arcádia 2.0 — instalação integral</h4>
    <p>Todos os distritos fazem parte da campanha principal. Os arquivos
     são instalados e autenticados na configuração inicial, não são conteúdo
     extra ou opcional. Depois da instalação, a campanha funciona offline.</p>
    <small>Arquivos visuais oficiais: 3.808. Tamanho dos sete arquivos
     de distrito: {formatAssetSize(catalog.totalBytes)}.</small>
    {checking?<p role="status">Conferindo instalação completa… {checkedCount} de {PACK_IDS.length} distritos</p>:
     <p role="status">{all?"✓ Os sete distritos estão integrados a este jogo.":
      "Há arquivos necessários ausentes. Faça uma nova verificação da instalação."}</p>}
    {error&&<p role="alert">{error}</p>}
   </section>
   <section className="menu-list-panel" aria-label="Integridade dos sete distritos">
    {PACK_IDS.map(id=><article className="na-item-row" key={id}>
     <div>
      <span>DISTRITO DO JOGO · {statuses[id]?"VERIFICADO":"A CONFERIR"}</span>
      <h4>{LABELS[id]}</h4>
      <p>{catalog.packs.find(p=>p.id===id)?.artworkCount??0} arquivos da
       campanha principal.</p>
     </div>
     <strong>{statuses[id]?"✓ Integrado":"Não confirmado"}</strong>
    </article>)}
   </section>
   <section className="menu-info-panel">
    <button type="button" className="menu-close-button"
     onClick={()=>window.location.reload()}>
     Verificar e recuperar instalação do jogo
    </button>
    <small>A verificação pode solicitar a reinstalação de arquivos danificados,
     preservando personagens, progresso e recompensas.</small>
   </section>
 </div>;
}
