import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { BAIXADA_VIEW_HEIGHT, BAIXADA_VIEW_WIDTH, BaixadaScene } from "../game/baixada/BaixadaScene";
import type { OriginId } from "../game/character";
import type { TestAppearance } from "../game/test-arena/appearance";
import { loadWorldLocation, saveWorldLocation } from "../game/baixada/location";

interface BaixadaWorldProps {
  onInteract: (id: string) => void;
  originId: OriginId;
  appearance: TestAppearance;
  characterId: string;
}

export default function BaixadaWorld({ onInteract, originId, appearance, characterId }: BaixadaWorldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BaixadaScene | null>(null);
  const callbackRef = useRef(onInteract);
  callbackRef.current = onInteract;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new BaixadaScene((id) => callbackRef.current(id), originId, appearance,
      loadWorldLocation(characterId), (tile) => saveWorldLocation(characterId,tile));
    sceneRef.current = scene;
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

  return <div className="baixada-world" ref={hostRef} aria-label="Baixada expandida: ruas do Canal, Mercado da Ponte, Praça da Caixa d’Água, NPCs e acessos aos interiores" />;
}
