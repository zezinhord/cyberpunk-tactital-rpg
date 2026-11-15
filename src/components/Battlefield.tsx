import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { BattleScene, CANVAS_HEIGHT, CANVAS_WIDTH } from "../game/BattleScene";
import type { TurnManager } from "../game/TurnManager";
import type { TestAppearance } from "../game/test-arena/appearance";
import type {OriginId} from "../game/character/origins";

interface BattlefieldProps {
  manager: TurnManager;
  appearance: TestAppearance;
  originId:OriginId;
}

export default function Battlefield({ manager, appearance,originId }: BattlefieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const game = new Phaser.Game({
      // Canvas 2D preserva as texturas originais e evita contextos WebGL
      // instáveis em dispositivos com GPUs modestas.
      type: Phaser.CANVAS,
      parent: host,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: "#0d1220",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: false },
      scene: [new BattleScene(manager, appearance,originId)],
    });
    return () => game.destroy(true);
  }, [manager, appearance,originId]);

  return <div className="battlefield-canvas" ref={hostRef} aria-label={"Arena isométrica com personagem da origem "+originId+" e aparência "+appearance} />;
}
