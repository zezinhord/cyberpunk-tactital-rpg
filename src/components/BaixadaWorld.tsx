import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import {performanceGameConfig,isAndroidDevice,readGraphicsMode} from "../game/performance";
import {attachPerformanceDiagnostics} from "../game/performance-diagnostics";
import { BAIXADA_VIEW_HEIGHT, BAIXADA_VIEW_WIDTH, BaixadaScene } from "../game/baixada/BaixadaScene";
import type { OriginId } from "../game/character";
import type { TestAppearance } from "../game/test-arena/appearance";
import { loadWorldLocation, saveWorldLocation } from "../game/baixada/location";
import {sectorAt,ACTOR_TILES,type SectorId,type Tile} from "../game/baixada/layout";

interface BaixadaWorldProps {
  onInteract: (id: string) => void;
  originId: OriginId;
  appearance: TestAppearance;
  characterId: string;
  onSectorChange?: (sector:SectorId)=>void;
  onNearbyAccess?: (actorId:string|null)=>void;
}
type SceneStatus="loading"|"ready"|"recovering"|"failed";

/** Teste leve para o renderer CANVAS (sem WebGL readback/GPU readPixels).
 * A tela de fundo sólida #101820 não pode ser confundida com uma cena jogável.
 * O teste roda somente após a criação da cena e alguns quadros renderizados.
 */
function canvasHasMap(canvas:HTMLCanvasElement):boolean{
  if(canvas.width<200||canvas.height<150)return false;
  const context=canvas.getContext("2d",{willReadFrequently:true});
  if(!context)return false;
  try{
    const colors=new Set<string>();
    for(let y=1;y<=5;y++)for(let x=1;x<=7;x++){
      const px=Math.floor(canvas.width*x/8),py=Math.floor(canvas.height*y/6);
      const rgba=context.getImageData(px,py,1,1).data;
      const color=rgba[0]+","+rgba[1]+","+rgba[2];
      colors.add(color);
    }
    return colors.size>=4;
  }catch{return false;}
}

/** Trata falha de inicialização no Android com tentativa automática por
 * renderer alternativo. Nunca desmonta personagem ou altera slot.
 */
export default function BaixadaWorld({ onInteract, originId, appearance, characterId,onSectorChange,onNearbyAccess }: BaixadaWorldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BaixadaScene | null>(null);
  const callbackRef = useRef(onInteract);
  callbackRef.current = onInteract;
  const accessCallbackRef=useRef(onNearbyAccess);
  accessCallbackRef.current=onNearbyAccess;
  const sectorCallbackRef=useRef(onSectorChange);
  sectorCallbackRef.current=onSectorChange;
  const lastSectorRef=useRef<SectorId|null>(null);
  const [attempt,setAttempt]=useState(0);
  const [sceneStatus,setSceneStatus]=useState<SceneStatus>("loading");
  const [failure,setFailure]=useState("");
  const useCanvas=(isAndroidDevice()&&readGraphicsMode()==="economy")===((attempt%2)===0);

  const reportNearby=(tile:Tile)=>{
    const entries=["enter-sewer-drain","enter-sewer-deep","enter-ferrugem","enter-city-transit"] as const;
    const target=entries.find(id=>{
      const other=ACTOR_TILES[id];
      return Math.abs(other.x-tile.x)+Math.abs(other.y-tile.y)<=2;
    });
    accessCallbackRef.current?.(target??null);
  };

  useEffect(() => {
    const host=hostRef.current;
    if(!host)return;
    let disposed=false,sceneCreated=false,confirmed=false,frames=0;
    let game:Phaser.Game|null=null;
    let detachDiagnostics:(()=>void)|null=null;
    let verifyFrame:(()=>void)|null=null;
    let lastCheckpoint=0;
    let watchdog:ReturnType<typeof setTimeout>|null=null;
    let checkTimer:ReturnType<typeof setTimeout>|null=null;
    let graphicsLost:((e:Event)=>void)|null=null;

    const recover=(reason:string):void=>{
      if(disposed||confirmed)return;
      setFailure(reason);
      if(attempt<1){
        setSceneStatus("recovering");
        setAttempt(value=>value+1);
      }else{
        setSceneStatus("failed");
      }
    };
    const checkScene=():void=>{
      if(disposed||confirmed||!sceneCreated||!game?.canvas)return;
      frames++;
      if(frames<6)return;
      if(useCanvas&&frames%15!==0)return; // Uma leitura por ~0,5 s no modo Economia.
      const canvas=game.canvas;
      if(canvas.clientWidth<200||canvas.clientHeight<150)return;
      // O renderizador Canvas permite checar a presença de pixels reais.
      // O WebGL é monitorado por quadros e perda de contexto.
      if(useCanvas&&!canvasHasMap(canvas)){
        if(frames<45)return;
        recover("O renderer Canvas iniciou, mas não desenhou o mapa.");
        return;
      }
      confirmed=true;
      if(watchdog!==null)clearTimeout(watchdog);
      setFailure("");
      setSceneStatus("ready");
    };
    const scene=new BaixadaScene((id)=>callbackRef.current(id),originId,appearance,
      loadWorldLocation(characterId),(tile,settled=false)=>{
        const now=Date.now();
        if(settled||now-lastCheckpoint>=1200){
          saveWorldLocation(characterId,tile);
          lastCheckpoint=now;
        }
        reportNearby(tile);
        const sector=sectorAt(tile);
        if(sector!==lastSectorRef.current){
          lastSectorRef.current=sector;
          sectorCallbackRef.current?.(sector);
        }
      },()=>{sceneCreated=true;});
    sceneRef.current=scene;
    const spawn=loadWorldLocation(characterId);
    reportNearby(spawn);
    lastSectorRef.current=sectorAt(spawn);
    sectorCallbackRef.current?.(lastSectorRef.current);
    try{
      game=new Phaser.Game({
        type:useCanvas?Phaser.CANVAS:Phaser.AUTO,
        parent:host,
        width:BAIXADA_VIEW_WIDTH,
        height:BAIXADA_VIEW_HEIGHT,
        backgroundColor:"#101820",
        scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
        ...performanceGameConfig(),
        scene:[scene],
      });
      detachDiagnostics=attachPerformanceDiagnostics(game,"Baixada");
      verifyFrame=checkScene;
      game.events.on(Phaser.Core.Events.POST_RENDER,verifyFrame);
      graphicsLost=(event:Event)=>{
        event.preventDefault();
        // Contexto perdido no WebGL é uma causa real de mapa vazio em WebView.
        recover("O Android perdeu o contexto gráfico. Reiniciando no modo alternativo.");
      };
      game.canvas?.addEventListener("webglcontextlost",graphicsLost);
      watchdog=setTimeout(()=>recover(
        sceneCreated?"O cenário não produziu uma imagem visível.":"Os recursos do cenário não terminaram de inicializar."
      ),14000);
      // Alguns drivers pausam eventos postrender em modo de economia de bateria.
      // A verificação adicional evita uma tela preta eterna sem quadros.
      checkTimer=setInterval(()=>{
        if(sceneCreated&&frames>=2)checkScene();
      },1200);
    }catch(error){
      recover("Falha ao abrir o motor gráfico: "+String(error).slice(0,120));
    }
    return ()=>{
      disposed=true;
      if(watchdog!==null)clearTimeout(watchdog);
      if(checkTimer!==null)clearInterval(checkTimer);
      if(game&&verifyFrame)game.events.off(Phaser.Core.Events.POST_RENDER,verifyFrame);
      if(game?.canvas&&graphicsLost)game.canvas.removeEventListener("webglcontextlost",graphicsLost);
      detachDiagnostics?.();
      sceneRef.current=null;
      game?.destroy(true);
    };
  },[originId,characterId,attempt,useCanvas]);

  useEffect(()=>{sceneRef.current?.setAppearance(appearance);},[appearance]);

  const tryAgain=()=>{
    setFailure("");
    setSceneStatus("recovering");
    setAttempt(value=>value+1);
  };
  return <div className="baixada-world na-world-host" ref={hostRef}
    data-renderer={useCanvas?"canvas":"webgl-auto"}
    data-scene-state={sceneStatus}
    aria-label="Baixada semiaberta expandida: ruas, Pátio Sul, Mercado dos Cabos e esgotos">
    {sceneStatus!=="ready"&&<div className="na-world-startup" role="status">
      <strong>{sceneStatus==="failed"?"Não foi possível desenhar a Baixada":
        sceneStatus==="recovering"?"Reiniciando a imagem do mapa":"Carregando a Baixada"}</strong>
      <span>{sceneStatus==="failed"?
        failure:"Inicializando cenário e verificando a imagem. O personagem permanece salvo."}</span>
      {sceneStatus==="failed"&&<button type="button" onClick={tryAgain}>
        Reiniciar cenário no modo alternativo
      </button>}
    </div>}
  </div>;
}
