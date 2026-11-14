import { useEffect, useRef } from "react";
import Phaser from "phaser";
import {performanceGameConfig} from "../game/performance";
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
  const reportNearby=(tile:Tile)=>{
    const entries=["enter-sewer-drain","enter-sewer-deep"] as const;
    const target=entries.find(id=>{
      const other=ACTOR_TILES[id];
      return Math.abs(other.x-tile.x)+Math.abs(other.y-tile.y)<=2;
    });
    accessCallbackRef.current?.(target??null);
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let lastCheckpoint=0;
    const scene = new BaixadaScene((id) => callbackRef.current(id), originId, appearance,
      loadWorldLocation(characterId), (tile,settled=false) => {
        // Synchronous localStorage writes a cada 140 ms causavam microtravadas.
        // Salvar durante longas rotas a cada 1,2 s e SEMPRE ao interromper.
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
      });
    sceneRef.current = scene;
    const spawn=loadWorldLocation(characterId);
    reportNearby(spawn);
    lastSectorRef.current=sectorAt(spawn);
    sectorCallbackRef.current?.(lastSectorRef.current);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: BAIXADA_VIEW_WIDTH,
      height: BAIXADA_VIEW_HEIGHT,
      backgroundColor: "#101820",
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      ...performanceGameConfig(),
      scene: [scene],
    });

    const detachDiagnostics=attachPerformanceDiagnostics(game,"Baixada");
    return () => { detachDiagnostics(); sceneRef.current = null; game.destroy(true); };
  }, [originId,characterId]);

  useEffect(() => { sceneRef.current?.setAppearance(appearance); }, [appearance]);

  return <div className="baixada-world" ref={hostRef} aria-label="Baixada semiaberta expandida: ruas, Pátio Sul, Mercado dos Cabos e acessos aos dois níveis de esgoto" />;
}
