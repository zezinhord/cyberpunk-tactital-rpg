import Phaser from "phaser";
import { BOARD_HEIGHT, BOARD_WIDTH, isBlocked } from "./map";
import { TurnManager } from "./TurnManager";
import type { GameState, Unit } from "./types";

const CELL_SIZE = 54;
const BOARD_SIZE = CELL_SIZE * BOARD_WIDTH;
const BOARD_X = (480 - BOARD_SIZE) / 2;
const BOARD_Y = (480 - BOARD_SIZE) / 2;

export class BattleScene extends Phaser.Scene {
  private readonly manager: TurnManager;
  private graphics!: Phaser.GameObjects.Graphics;
  private unitLabels: Phaser.GameObjects.Text[] = [];
  private unsubscribe?: () => void;

  constructor(manager: TurnManager) {
    super({ key: "BattleScene" });
    this.manager = manager;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a1019");
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
    const x = Math.floor((pointer.x - BOARD_X) / CELL_SIZE);
    const y = Math.floor((pointer.y - BOARD_Y) / CELL_SIZE);
    if (x < 0 || y < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return;
    this.manager.movePlayerTo(x, y);
  }

  private drawBoard(state: GameState): void {
    const graphics = this.graphics;
    graphics.clear();
    this.unitLabels.forEach((label) => label.destroy());
    this.unitLabels = [];

    graphics.fillStyle(0x0e1a25, 1);
    graphics.fillRoundedRect(BOARD_X - 7, BOARD_Y - 7, BOARD_SIZE + 14, BOARD_SIZE + 14, 13);

    const reachable = new Set(
      this.manager.getReachableCells().map((cell) => `${cell.x},${cell.y}`),
    );

    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const positionX = BOARD_X + x * CELL_SIZE;
        const positionY = BOARD_Y + y * CELL_SIZE;
        const blocked = isBlocked({ x, y });
        const canMove = reachable.has(`${x},${y}`);

        graphics.fillStyle(blocked ? 0x263440 : canMove ? 0x183a42 : 0x142431, 1);
        graphics.fillRect(positionX + 1, positionY + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        graphics.lineStyle(1, canMove ? 0x3bc6c2 : 0x294353, canMove ? 0.95 : 0.72);
        graphics.strokeRect(positionX + 1, positionY + 1, CELL_SIZE - 2, CELL_SIZE - 2);

        if (blocked) {
          graphics.fillStyle(0x526675, 0.8);
          graphics.fillRoundedRect(positionX + 8, positionY + 8, CELL_SIZE - 16, CELL_SIZE - 16, 4);
          graphics.lineStyle(1, 0x748a96, 0.45);
          graphics.lineBetween(positionX + 13, positionY + 13, positionX + CELL_SIZE - 13, positionY + CELL_SIZE - 13);
          graphics.lineBetween(positionX + CELL_SIZE - 13, positionY + 13, positionX + 13, positionY + CELL_SIZE - 13);
        }
      }
    }

    state.units.filter((unit) => unit.hp > 0).forEach((unit) => this.drawUnit(unit));
  }

  private drawUnit(unit: Unit): void {
    const centerX = BOARD_X + unit.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = BOARD_Y + unit.y * CELL_SIZE + CELL_SIZE / 2;
    const player = unit.side === "player";
    const fill = player ? 0x4be1d2 : 0xff4f91;
    const stroke = player ? 0xa2fff5 : 0xffb1cf;

    this.graphics.fillStyle(fill, 0.13);
    this.graphics.fillCircle(centerX, centerY, 25);
    this.graphics.lineStyle(2, stroke, 1);
    this.graphics.strokeCircle(centerX, centerY, 18);
    this.graphics.fillStyle(fill, 1);
    this.graphics.fillCircle(centerX, centerY, 13);

    const label = this.add.text(centerX, centerY, player ? "V" : "D", {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
      color: "#07131b",
    });
    label.setOrigin(0.5);
    this.unitLabels.push(label);
  }
}
