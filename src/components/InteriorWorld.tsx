import { useEffect, useRef } from "react";
import Phaser from "phaser";
import {performanceGameConfig,isAndroidDevice,isEconomyMode} from "../game/performance";
import {attachPerformanceDiagnostics} from "../game/performance-diagnostics";
import { InteriorScene, INTERIOR_VIEW_HEIGHT, INTERIOR_VIEW_WIDTH, type InteriorId } from "../game/baixada/InteriorScene";
import {SewerScene} from "../game/baixada/SewerScene";
import {FerrugemScene} from "../game/ferrugem/FerrugemScene";
import {DistrictScene} from "../game/districts/DistrictScene";
import {DistrictInteriorScene} from "../game/districts/DistrictInteriorScene";
import {isInnerId,INNER_BLUEPRINTS} from "../game/districts/interiors.ts";
import {isV20IllustratedRoom} from "../game/districts/v20-illustrations.ts";
import {packArtworkPreviewUrl} from "../game/assets/native-pack-manager.ts";
import type {NpcAttitude} from "../game/ai/faction-reactivity.ts";
import type {CinematicCameraFocus} from "../game/story/cinematic-camera.ts";
import {isDistrictId,type NodeSlot} from "../game/districts/catalog";
import {loadDistrictPosition,saveDistrictPosition} from "../game/districts/positions";
import {isSewerId} from "../game/baixada/sewer-layout";
import type {SewerProgress} from "../game/story/sewer-v09";
import type { OriginId } from "../game/character";
import type { TestAppearance } from "../game/test-arena/appearance";

export default function InteriorWorld({
  interior,
  originId,
  appearance,
  onInteract,
  sewerProgress,
  returnFromDeep=false,
  ferrugemTargetId=null,
  districtTarget=null,
  characterId,
  worldAttitude="neutral",
  cinematicFocus=null,
}: {
  interior: InteriorId;
  originId: OriginId;
  appearance: TestAppearance;
  onInteract: (id: string) => void;
  sewerProgress: SewerProgress;
  returnFromDeep?: boolean;
  ferrugemTargetId?:string|null;
  districtTarget?:NodeSlot|null;
  characterId:string;
  worldAttitude?:NpcAttitude;
  cinematicFocus?:CinematicCameraFocus|null;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<InteriorScene | SewerScene | FerrugemScene | DistrictScene | DistrictInteriorScene | null>(null);
  const callbackRef = useRef(onInteract);
  callbackRef.current = onInteract;
  const attitudeRef=useRef(worldAttitude);
  attitudeRef.current=worldAttitude;
  const cinematicRef=useRef(cinematicFocus);
  cinematicRef.current=cinematicFocus;

  useEffect(() => {
    const host=hostRef.current;
    if(!host)return;
    let disposed=false,game:Phaser.Game|null=null,detachDiagnostics:(()=>void)|null=null;
    let lastCheckpoint=0;
    host.textContent="Preparando ambiente integrado de Nova Arcádia…";
    const start=async()=>{
      // Full originals remain safely installed in the same game. Android
      // converts the four illustrations to small native bitmap previews before
      // Phaser starts; it never decodes the 2880px atlas on the WebView GPU.
      const artPreviews:Record<string,string>={};
      if(isV20IllustratedRoom(interior)){
        const bp=INNER_BLUEPRINTS[interior];
        const entries=[["mural","mural"],...bp.props.map(p=>[p.id,"prop"])] as Array<
          [string,"mural"|"prop"]>;
        const candidates=Promise.all(entries.map(async([key,kind])=>{
          try{
            const url=await packArtworkPreviewUrl(interior,kind,
              kind==="prop"?key:undefined,512);
            return {key,url};
          }catch{return {key,url:null};}
        }));
        // Hardware stalls must not trap the player on a loading screen.
        let timer:ReturnType<typeof setTimeout>|null=null;
        try{
          const ready=await Promise.race([candidates,
            new Promise<null>(resolve=>{timer=setTimeout(()=>resolve(null),7000);})]);
          for(const item of ready??[])if(item.url)artPreviews[item.key]=item.url;
        }finally{if(timer!==null)clearTimeout(timer);}
      }
      if(disposed)return;
      const scene=isInnerId(interior)
        ? new DistrictInteriorScene(interior,(id)=>callbackRef.current(id),
            originId,appearance,artPreviews)
        : isDistrictId(interior)
        ? new DistrictScene(interior,(id)=>callbackRef.current(id),originId,
            appearance,districtTarget,loadDistrictPosition(characterId,interior),
            (tile,settled=false)=>{
              const now=Date.now();
              if(settled||now-lastCheckpoint>1200){
                saveDistrictPosition(characterId,interior,tile);
                lastCheckpoint=now;
              }
            },attitudeRef.current)
        : interior==="ferrugem"
         ? new FerrugemScene((id)=>callbackRef.current(id),originId,appearance,
             ferrugemTargetId)
        : isSewerId(interior)
        ? new SewerScene(interior,(id)=>callbackRef.current(id),originId,
            appearance,sewerProgress,returnFromDeep)
        : new InteriorScene(interior,(id)=>callbackRef.current(id),originId,appearance);
      sceneRef.current=scene;
      if(scene instanceof DistrictScene||scene instanceof DistrictInteriorScene)
        scene.setCinematicFocus(cinematicRef.current);
      host.textContent="";
      game=new Phaser.Game({
        type:isAndroidDevice()&&isEconomyMode()?Phaser.CANVAS:Phaser.AUTO,
        parent:host,width:INTERIOR_VIEW_WIDTH,height:INTERIOR_VIEW_HEIGHT,
        backgroundColor:interior==="ferrugem"?"#141e24":isSewerId(interior)?
          "#07141a":interior==="clinic"?"#0e1c20":interior==="canal"?
          "#0b1a20":"#1c1714",
        scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
        ...performanceGameConfig(),scene:[scene],
      });
      detachDiagnostics=attachPerformanceDiagnostics(game,interior);
    };
    void start().catch(error=>{
      if(!disposed){
        host.textContent="Não foi possível abrir o mapa completo. "+
          (error instanceof Error?error.message:"Falha de inicialização.");
        sceneRef.current=null;
      }
    });
    return ()=>{
      disposed=true;
      detachDiagnostics?.();
      sceneRef.current=null;
      game?.destroy(true);
    };
  },[interior,originId,returnFromDeep,characterId]);

  useEffect(() => { sceneRef.current?.setAppearance(appearance); }, [appearance]);
  useEffect(()=>{if(sceneRef.current instanceof SewerScene)sceneRef.current.setProgress(sewerProgress);},[sewerProgress]);
  useEffect(()=>{if(sceneRef.current instanceof FerrugemScene)sceneRef.current.setObjective(ferrugemTargetId);},[ferrugemTargetId]);
  useEffect(()=>{if(sceneRef.current instanceof DistrictScene)sceneRef.current.setObjective(districtTarget);},[districtTarget]);
  useEffect(()=>{if(sceneRef.current instanceof DistrictScene)
    sceneRef.current.setReaction(worldAttitude);},[worldAttitude]);
  useEffect(()=>{
    const scene=sceneRef.current;
    if(scene instanceof DistrictScene||scene instanceof DistrictInteriorScene)
      scene.setCinematicFocus(cinematicFocus);
  },[cinematicFocus]);

  return <div className={`baixada-world interior-world ${interior}`} ref={hostRef} aria-label={interior === "clinic" ? "Interior isométrico da clínica comunitária" : interior === "workshop" ? "Interior isométrico da oficina do Nilo" : interior === "canal" ? "Interior isométrico da Galeria do Canal"
   : interior === "sewer-drain" ? "Galeria de Drenagem Sul subterrânea, isométrica e caminhável"
   : interior === "ferrugem" ? "Distrito Ferrugem industrial, isométrico e caminhável"
   : isInnerId(interior) ? "Interior "+INNER_BLUEPRINTS[interior].title+" caminhável e com objetos interativos"
   : isDistrictId(interior) ? "Distrito "+interior+" explorável, com missões e NPCs interativos"
   : "Câmara de Recalque 04 subterrânea, isométrica e caminhável"} />;
}
