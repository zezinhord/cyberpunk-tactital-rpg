import Phaser from "phaser";
import { BOARD_HEIGHT, BOARD_WIDTH, isBlocked } from "./map";
import { TurnManager } from "./TurnManager";
import type { GameState, Position, Unit } from "./types";

const TILE_WIDTH = 56;
const TILE_HEIGHT = 28;
const ORIGIN_X = 240;
const ORIGIN_Y = 54;
export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 320;

const COLOR = {
  bg: 0x0d1220,
  tile: 0x151d31,
  tileAlt: 0x19243a,
  line: 0x354565,
  wallTop: 0x263451,
  wallLeft: 0x111b2c,
  wallRight: 0x1a2940,
  cyan: 0x00e5ff,
  magenta: 0xff2e88,
  amber: 0xffd166,
  ink: 0x080d17,
  track: 0x27344d,
};

function tileCenter({ x, y }: Position): { x: number; y: number } {
  return {
    x: ORIGIN_X + (x - y) * (TILE_WIDTH / 2),
    y: ORIGIN_Y + (x + y) * (TILE_HEIGHT / 2),
  };
}

export class BattleScene extends Phaser.Scene {
  private readonly manager: TurnManager;
  private graphics!: Phaser.GameObjects.Graphics;
  private unsubscribe?: () => void;

  constructor(manager: TurnManager) {
    super({ key: "BattleScene" });
    this.manager = manager;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0d1220");
    this.graphics = this.add.graphics();
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handleBoardTap, this);
    this.unsubscribe = this.manager.subscribe((state) => this.drawBoard(state));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.handleBoardTap, this);
    });
    this.drawBoard(this.manager.getState());
  }

  private handleBoardTap(pointer: Phaser.Input.Pointer): void {
    const relativeX = (pointer.x - ORIGIN_X) / (TILE_WIDTH / 2);
    const relativeY = (pointer.y - ORIGIN_Y) / (TILE_HEIGHT / 2);
    const x = Math.round((relativeX + relativeY) / 2);
    const y = Math.round((relativeY - relativeX) / 2);
    if (x < 0 || y < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return;
    const center = tileCenter({ x, y });
    const localX = Math.abs(pointer.x - center.x) / (TILE_WIDTH / 2);
    const localY = Math.abs(pointer.y - center.y) / (TILE_HEIGHT / 2);
    if (localX + localY > 1.08) return;
    this.manager.movePlayerTo(x, y);
  }

  private traceDiamond(cx: number, cy: number, width = TILE_WIDTH, height = TILE_HEIGHT): void {
    const graphics = this.graphics;
    graphics.beginPath();
    graphics.moveTo(cx, cy - height / 2);
    graphics.lineTo(cx + width / 2, cy);
    graphics.lineTo(cx, cy + height / 2);
    graphics.lineTo(cx - width / 2, cy);
    graphics.closePath();
  }

  private drawBoard(state: GameState): void {
    const graphics = this.graphics;
    graphics.clear();
    graphics.fillStyle(COLOR.bg, 1);
    graphics.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const reachable = new Set(this.manager.getReachableCells().map((cell) => `${cell.x},${cell.y}`));
    for (let depth = 0; depth <= BOARD_WIDTH + BOARD_HEIGHT - 2; depth += 1) {
      for (let y = 0; y < BOARD_HEIGHT; y += 1) {
        for (let x = 0; x < BOARD_WIDTH; x += 1) {
          if (x + y !== depth) continue;
          const center = tileCenter({ x, y });
          graphics.fillStyle((x + y) % 2 === 0 ? COLOR.tile : COLOR.tileAlt, 1);
          this.traceDiamond(center.x, center.y);
          graphics.fillPath();
          graphics.lineStyle(1, COLOR.line, 0.9);
          this.traceDiamond(center.x, center.y);
          graphics.strokePath();
          if (reachable.has(`${x},${y}`)) {
            graphics.fillStyle(COLOR.cyan, 0.22);
            this.traceDiamond(center.x, center.y, TILE_WIDTH - 5, TILE_HEIGHT - 5);
            graphics.fillPath();
            graphics.lineStyle(1.5, COLOR.cyan, 0.9);
            this.traceDiamond(center.x, center.y, TILE_WIDTH - 5, TILE_HEIGHT - 5);
            graphics.strokePath();
          }
          if (isBlocked({ x, y })) this.drawObstacle(center.x, center.y);
        }
      }
    }

    const targetable = this.manager.canAttack();
    state.units
      .filter((unit) => unit.hp > 0)
      .sort((a, b) => a.x + a.y - (b.x + b.y))
      .forEach((unit) => this.drawUnit(unit, state, targetable));

    graphics.fillStyle(COLOR.amber, 0.9);
    graphics.fillCircle(ORIGIN_X, 20, 3);
  }

  private drawObstacle(cx: number, cy: number): void {
    const graphics = this.graphics;
    const lift = 17;
    // Faces laterais e topo formam um bloco baixo em perspectiva isométrica.
    graphics.fillStyle(COLOR.wallLeft, 1);
    graphics.beginPath();
    graphics.moveTo(cx - TILE_WIDTH / 2, cy);
    graphics.lineTo(cx, cy + TILE_HEIGHT / 2);
    graphics.lineTo(cx, cy + TILE_HEIGHT / 2 + lift);
    graphics.lineTo(cx - TILE_WIDTH / 2, cy + lift);
    graphics.closePath();
    graphics.fillPath();
    graphics.fillStyle(COLOR.wallRight, 1);
    graphics.beginPath();
    graphics.moveTo(cx + TILE_WIDTH / 2, cy);
    graphics.lineTo(cx, cy + TILE_HEIGHT / 2);
    graphics.lineTo(cx, cy + TILE_HEIGHT / 2 + lift);
    graphics.lineTo(cx + TILE_WIDTH / 2, cy + lift);
    graphics.closePath();
    graphics.fillPath();
    graphics.fillStyle(COLOR.wallTop, 1);
    this.traceDiamond(cx, cy - lift, TILE_WIDTH, TILE_HEIGHT);
    graphics.fillPath();
    graphics.lineStyle(1.5, COLOR.magenta, 0.6);
    this.traceDiamond(cx, cy - lift, TILE_WIDTH, TILE_HEIGHT);
    graphics.strokePath();
  }

  private drawUnit(unit: Unit, state: GameState, targetable: boolean): void {
    const graphics = this.graphics;
    const center = tileCenter(unit);
    const isPlayer = unit.side === "player";
    const color = isPlayer ? COLOR.cyan : COLOR.magenta;

    graphics.fillStyle(COLOR.ink, 0.7);
    graphics.fillEllipse(center.x, center.y + 3, 26, 10);
    graphics.fillStyle(color, 0.15);
    this.traceDiamond(center.x, center.y, TILE_WIDTH - 8, TILE_HEIGHT - 8);
    graphics.fillPath();

    if (unit.side === state.activeSide && !state.combatComplete) {
      graphics.lineStyle(2, color, 1);
      this.traceDiamond(center.x, center.y, TILE_WIDTH - 7, TILE_HEIGHT - 7);
      graphics.strokePath();
    }

    // Silhueta provisória: um corpo 2D simples sobre uma base isométrica.
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(center.x - 8, center.y - 25, 16, 20, 4);
    graphics.fillStyle(COLOR.ink, 1);
    graphics.fillCircle(center.x, center.y - 30, 6);
    graphics.fillStyle(color, 1);
    graphics.fillRect(center.x - 3, center.y - 32, 6, 3);

    graphics.fillStyle(COLOR.track, 1);
    graphics.fillRoundedRect(center.x - 14, center.y - 39, 28, 4, 2);
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(center.x - 14, center.y - 39, Math.max(0, Math.round(28 * unit.hp / unit.maxHp)), 4, 2);

    if (!isPlayer && targetable) {
      graphics.lineStyle(2.5, COLOR.amber, 1);
      graphics.strokeCircle(center.x, center.y - 13, 20);
    }
  }
}
