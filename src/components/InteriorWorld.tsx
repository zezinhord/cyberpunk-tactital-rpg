import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { InteriorScene, INTERIOR_VIEW_HEIGHT, INTERIOR_VIEW_WIDTH, type InteriorId } from "../game/baixada/InteriorScene";
import type { OriginId } from "../game/character";
import type { TestAppearance } from "../game/test-arena/appearance";

export default function InteriorWorld({
  interior,
  originId,
  appearance,
  onInteract,
}: {
  interior: InteriorId;
  originId: OriginId;
  appearance: TestAppearance;
  onInteract: (id: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<InteriorScene | null>(null);
  const callbackRef = useRef(onInteract);
  callbackRef.current = onInteract;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new InteriorScene(interior, (id) => callbackRef.current(id), originId, appearance);
    sceneRef.current = scene;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: INTERIOR_VIEW_WIDTH,
      height: INTERIOR_VIEW_HEIGHT,
      backgroundColor: interior === "clinic" ? "#0e1c20" : interior === "canal" ? "#0b1a20" : "#1c1714",
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true, roundPixels: false },
      scene: [scene],
    });
    return () => { sceneRef.current = null; game.destroy(true); };
  }, [interior, originId]);

  useEffect(() => { sceneRef.current?.setAppearance(appearance); }, [appearance]);

  return <div className={`baixada-world interior-world ${interior}`} ref={hostRef} aria-label={interior === "clinic" ? "Interior isométrico da clínica comunitária" : interior === "workshop" ? "Interior isométrico da oficina do Nilo" : "Interior isométrico da Galeria do Canal"} />;
}
