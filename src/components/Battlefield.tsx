import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { BattleScene, CANVAS_HEIGHT, CANVAS_WIDTH } from "../game/BattleScene";
import type { TurnManager } from "../game/TurnManager";
import type { TestAppearance } from "../game/test-arena/appearance";

interface BattlefieldProps {
  manager: TurnManager;
  appearance: TestAppearance;
}

export default function Battlefield({ manager, appearance }: BattlefieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: "#0d1220",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true },
      scene: [new BattleScene(manager, appearance)],
    });
    return () => game.destroy(true);
  }, [manager, appearance]);

  return <div className="battlefield-canvas" ref={hostRef} aria-label="Mapa isométrico de teste" />;
}
