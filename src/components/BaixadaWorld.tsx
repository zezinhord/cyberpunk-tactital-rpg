import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { BAIXADA_VIEW_HEIGHT, BAIXADA_VIEW_WIDTH, BaixadaScene } from "../game/baixada/BaixadaScene";
import type { OriginId } from "../game/character";
import type { TestAppearance } from "../game/test-arena/appearance";
import { loadWorldLocation, saveWorldLocation } from "../game/baixada/location";
import {sectorAt,type SectorId} from "../game/baixada/layout";

interface BaixadaWorldProps {
  onInteract: (id: string) => void;
  originId: OriginId;
  appearance: TestAppearance;
  characterId: string;
  onSectorChange?: (sector:SectorId)=>void;
}

export default function BaixadaWorld({ onInteract, originId, appearance, characterId,onSectorChange }: BaixadaWorldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BaixadaScene | null>(null);
  const callbackRef = useRef(onInteract);
  callbackRef.current = onInteract;
  const sectorCallbackRef=useRef(onSectorChange);
  sectorCallbackRef.current=onSectorChange;
  const lastSectorRef=useRef<SectorId|null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new BaixadaScene((id) => callbackRef.current(id), originId, appearance,
      loadWorldLocation(characterId), (tile) => {
        saveWorldLocation(characterId,tile);
        const sector=sectorAt(tile);
        if(sector!==lastSectorRef.current){
          lastSectorRef.current=sector;
          sectorCallbackRef.current?.(sector);
        }
      });
    sceneRef.current = scene;
    lastSectorRef.current=sectorAt(loadWorldLocation(characterId));
    sectorCallbackRef.current?.(lastSectorRef.current);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: BAIXADA_VIEW_WIDTH,
      height: BAIXADA_VIEW_HEIGHT,
      backgroundColor: "#101820",
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true, roundPixels: false },
      scene: [scene],
    });

    return () => { sceneRef.current = null; game.destroy(true); };
  }, [originId,characterId]);

  useEffect(() => { sceneRef.current?.setAppearance(appearance); }, [appearance]);

  return <div className="baixada-world" ref={hostRef} aria-label="Baixada semiaberta: ruas do Canal, Pátio do Reúso e Mercado dos Cabos com NPCs, lojas e acessos" />;
}
