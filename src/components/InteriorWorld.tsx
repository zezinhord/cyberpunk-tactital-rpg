import { useEffect, useRef } from "react";
import Phaser from "phaser";
import {performanceGameConfig} from "../game/performance";
import {attachPerformanceDiagnostics} from "../game/performance-diagnostics";
import { InteriorScene, INTERIOR_VIEW_HEIGHT, INTERIOR_VIEW_WIDTH, type InteriorId } from "../game/baixada/InteriorScene";
import {SewerScene} from "../game/baixada/SewerScene";
import {FerrugemScene} from "../game/ferrugem/FerrugemScene";
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
}: {
  interior: InteriorId;
  originId: OriginId;
  appearance: TestAppearance;
  onInteract: (id: string) => void;
  sewerProgress: SewerProgress;
  returnFromDeep?: boolean;
  ferrugemTargetId?:string|null;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<InteriorScene | SewerScene | FerrugemScene | null>(null);
  const callbackRef = useRef(onInteract);
  callbackRef.current = onInteract;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = interior==="ferrugem"
       ? new FerrugemScene((id)=>callbackRef.current(id),originId,appearance,ferrugemTargetId)
      : isSewerId(interior)
      ? new SewerScene(interior,(id)=>callbackRef.current(id),originId,appearance,
          sewerProgress,returnFromDeep)
      : new InteriorScene(interior,(id)=>callbackRef.current(id),originId,appearance);
    sceneRef.current = scene;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: INTERIOR_VIEW_WIDTH,
      height: INTERIOR_VIEW_HEIGHT,
      backgroundColor: interior==="ferrugem" ? "#141e24" : isSewerId(interior) ? "#07141a" : interior === "clinic" ? "#0e1c20" : interior === "canal" ? "#0b1a20" : "#1c1714",
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      ...performanceGameConfig(),
      scene: [scene],
    });
    const detachDiagnostics=attachPerformanceDiagnostics(game,interior);
    return () => { detachDiagnostics(); sceneRef.current = null; game.destroy(true); };
  }, [interior, originId,returnFromDeep]);

  useEffect(() => { sceneRef.current?.setAppearance(appearance); }, [appearance]);
  useEffect(()=>{if(sceneRef.current instanceof SewerScene)sceneRef.current.setProgress(sewerProgress);},[sewerProgress]);
  useEffect(()=>{if(sceneRef.current instanceof FerrugemScene)sceneRef.current.setObjective(ferrugemTargetId);},[ferrugemTargetId]);

  return <div className={`baixada-world interior-world ${interior}`} ref={hostRef} aria-label={interior === "clinic" ? "Interior isométrico da clínica comunitária" : interior === "workshop" ? "Interior isométrico da oficina do Nilo" : interior === "canal" ? "Interior isométrico da Galeria do Canal"
   : interior === "sewer-drain" ? "Galeria de Drenagem Sul subterrânea, isométrica e caminhável"
   : interior === "ferrugem" ? "Distrito Ferrugem industrial, isométrico e caminhável"
   : "Câmara de Recalque 04 subterrânea, isométrica e caminhável"} />;
}
