import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { BattleScene } from "../game/BattleScene";
import type { TurnManager } from "../game/TurnManager";

interface BattlefieldProps {
  manager: TurnManager;
}

export default function Battlefield({ manager }: BattlefieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: 480,
      height: 480,
      backgroundColor: "#0a1019",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: true,
      },
      scene: [new BattleScene(manager)],
    });

    return () => {
      game.destroy(true);
    };
  }, [manager]);

  return <div className="battlefield-canvas" ref={hostRef} aria-label="Campo de batalha tático" />;
}
