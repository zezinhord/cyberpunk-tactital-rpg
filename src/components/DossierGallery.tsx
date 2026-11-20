import {useMemo,useState} from "react";
import {packForRoom,packAssetUrl} from "../game/assets/native-pack-manager.ts";
import "../dossier-gallery.css";

interface Props{room:string;onClose:()=>void}
export default function DossierGallery({room,onClose}:Props){
 const pages=useMemo(()=>{
  const pack=packForRoom(room);
  return (pack?.assets??[])
   .filter(a=>a.room===room&&a.kind==="dossier")
   .sort((a,b)=>a.path.localeCompare(b.path));
 },[room]);
 const [index,setIndex]=useState(0);
 const [zoom,setZoom]=useState(false);
 const [imageError,setImageError]=useState(false);
 const current=pages[index];
 const src=current?packAssetUrl(room,"dossier",
  current.path.split("/").at(-1)?.split(".")[0]):null;
 return <div className="na-dossier-overlay" role="dialog" aria-modal="true"
   aria-label="Arquivo de evidências ampliadas da expansão">
   <div className="na-dossier-window">
     <header className="na-dossier-heading">
       <div>
         <small>ARQUIVO INVESTIGATIVO · NOVA ARCÁDIA 2.0</small>
         <strong>{room.replaceAll("-"," ").toUpperCase()}</strong>
         <span>{pages.length?index+1:0} / {pages.length} PRANCHAS</span>
       </div>
       <button type="button" onClick={onClose} aria-label="Fechar arquivo">Fechar ×</button>
     </header>
     <div className="na-dossier-visual">
       {!current||!src?
         <p>Pacote de evidências não instalado. O mapa e as missões continuam
           disponíveis sem estes arquivos.</p>:
         imageError?
         <p>Esta prancha não pôde ser carregada. O dado pode estar danificado;
            reinstale o pacote deste distrito nas Configurações.</p>:
         <img key={src} src={src} decoding="async" alt={current.caption??
           "Documento investigativo de "+room}
           className={zoom?"zoom":""}
           onError={()=>setImageError(true)}/>
       }
     </div>
     <div className="na-dossier-copy" aria-live="polite">
       <p>{current?.caption??"Sem descrição disponível."}</p>
     </div>
     <footer className="na-dossier-footer">
       <button type="button" onClick={()=>{setIndex(v=>Math.max(0,v-1));
         setZoom(false);setImageError(false);}} disabled={index===0}>Anterior</button>
       <button type="button" onClick={()=>setZoom(v=>!v)} disabled={!src||imageError}
         aria-pressed={zoom}>{zoom?"Enquadrar":"Ampliar"}</button>
       <button type="button" onClick={()=>{setIndex(v=>Math.min(pages.length-1,v+1));
         setZoom(false);setImageError(false);}} disabled={index>=pages.length-1}>Próxima</button>
     </footer>
   </div>
 </div>;
}
