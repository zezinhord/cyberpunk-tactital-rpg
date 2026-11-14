import Phaser from "phaser";
import { BOARD_HEIGHT, BOARD_WIDTH, isBlocked } from "./map";
import { TurnManager } from "./TurnManager";
import type { GameState, Position, Unit } from "./types";
import type { TestAppearance } from "./test-arena/appearance";
import type { OriginId } from "./character/origins";
import {preloadCharacterSprites,createCharacterAnimations,getPlayerTexture,
  frameForDirection,playIdle,playWalk,type IsoDirection} from "./baixada/sprites";

const TILE_WIDTH = 56;
const TILE_HEIGHT = 28;
const ORIGIN_X = 240;
const ORIGIN_Y = 70;
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
  private readonly appearance: TestAppearance;
  private readonly originId:OriginId;
  private graphics!: Phaser.GameObjects.Graphics;
  private bars!: Phaser.GameObjects.Graphics;
  private playerImage?: Phaser.GameObjects.Sprite;
  private enemyImage?: Phaser.GameObjects.Image;
  private lastCue = 0;
  private unsubscribe?: () => void;

  constructor(manager: TurnManager, appearance: TestAppearance,originId:OriginId) {
    super({ key: "BattleScene" });
    this.manager = manager;
    this.appearance = appearance;
    this.originId=originId;
  }

  preload(): void {
    preloadCharacterSprites(this);
    this.load.svg("arena-sentinel", "/assets/arena/sentinel.svg", { width: 128, height: 192 });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0d1220");
    createCharacterAnimations(this);
    this.graphics = this.add.graphics();
    this.graphics.setDepth(0);
    this.bars = this.add.graphics().setDepth(9);
    const texture=getPlayerTexture(this.originId,this.appearance);
    this.playerImage = this.add.sprite(0, 0, texture,frameForDirection(texture,0))
      .setOrigin(0.5, 0.91).setDisplaySize(50, 66).setDepth(6);
    playIdle(this.playerImage,texture,0);
    this.enemyImage = this.add.image(0, 0, "arena-sentinel")
      .setOrigin(0.5, 0.91).setDisplaySize(46, 68).setDepth(6);
    for (const avatar of [this.enemyImage]) {
      this.tweens.add({ targets: avatar, scaleY: avatar.scaleY * 0.98, duration: 940, yoyo: true, repeat: -1 });
    }
    this.lastCue = this.manager.getState().cue?.sequence ?? 0;
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handleBoardTap, this);
    this.unsubscribe = this.manager.subscribe((state) => this.renderState(state));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.handleBoardTap, this);
    });
    this.renderState(this.manager.getState());
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
    if (x === 0 && y === 6) {
      this.manager.interactWithTerminal(x, y);
      return;
    }
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

  private renderState(state: GameState): void {
    const player = state.units.find((unit) => unit.id === "runner");
    const enemy = state.units.find((unit) => unit.id === "drone");
    const moveCue = state.cue?.visual === "move" && state.cue.sequence !== this.lastCue;
    const beforeX = this.playerImage?.x ?? 0;
    const beforeY = this.playerImage?.y ?? 0;
    this.drawBoard(state);
    if (player && this.playerImage) {
      const dest = tileCenter(player);
      if (moveCue && beforeX > 0) {
        const dx=dest.x-beforeX,dy=dest.y-beforeY;
        const direction:IsoDirection=Math.abs(dx)>Math.abs(dy)?
          (dx>0?1:3):(dy>0?2:0);
        playWalk(this.playerImage,getPlayerTexture(this.originId,this.appearance),direction);
        this.tweens.killTweensOf(this.playerImage);
        this.playerImage.setPosition(beforeX, beforeY);
        this.tweens.add({
          targets: this.playerImage, x: dest.x, y: dest.y,
          duration: 220, ease: "Sine.Out",
          onComplete: () => {
            if (this.playerImage){
              playIdle(this.playerImage,getPlayerTexture(this.originId,this.appearance),direction);
            }
          },
        });
      } else {
        this.playerImage.setPosition(dest.x, dest.y);
      }
      this.playerImage.setVisible(player.hp > 0);
    }
    if (enemy && this.enemyImage) {
      const dest = tileCenter(enemy);
      this.enemyImage.setPosition(dest.x, dest.y);
      this.enemyImage.setVisible(enemy.hp > 0);
    }
    if (state.cue && state.cue.sequence !== this.lastCue) {
      this.lastCue = state.cue.sequence;
      this.showEffect(state.cue);
    }
  }

  private showEffect(cue: NonNullable<GameState["cue"]>): void {
    const entity = cue.target === "enemy" ? this.enemyImage : this.playerImage;
    const base = cue.target === "terminal" ? { x: 0, y: 6 }
      : cue.target === "enemy" ? this.manager.getState().units.find((u) => u.id === "drone")
      : this.manager.getState().units.find((u) => u.id === "runner");
    const position = base ? tileCenter(base) : { x: ORIGIN_X, y: ORIGIN_Y };
    const color = cue.visual === "hit" && cue.target === "enemy" ? COLOR.magenta
      : cue.visual === "terminal" || cue.visual === "shield" ? COLOR.amber : COLOR.cyan;
    // O protagonista executa uma ação física; o alvo exibe impacto ou bloqueio.
    const casting = cue.visual === "emp" || cue.visual === "shield" || cue.visual === "repair";
    const melee = (cue.visual === "hit" || cue.visual === "miss") && cue.target === "enemy";
    if ((casting || melee) && this.playerImage) {
      this.tweens.add({ targets: this.playerImage, angle: melee ? -9 : 7,
        duration: melee ? 105 : 180, yoyo: true, ease: "Sine.InOut" });
    }
    if (cue.visual === "hit" && cue.target === "player" && this.enemyImage) {
      this.tweens.add({ targets: this.enemyImage, angle: -8, duration: 115, yoyo: true });
    }
    if (cue.visual !== "move") {
      const pulse = this.add.circle(position.x, position.y - 29, 18, color, 0.14)
        .setStrokeStyle(2, color, 0.95).setDepth(12);
      this.tweens.add({ targets: pulse, scaleX: 2.1, scaleY: 1.8, alpha: 0,
        duration: cue.visual === "emp" ? 540 : 380,
        onComplete: () => pulse.destroy() });
      if (entity && (cue.visual === "hit" || cue.visual === "emp" || cue.visual === "basic")) {
        this.tweens.add({ targets: entity, alpha: 0.3, duration: 90, yoyo: true, repeat: 1 });
      }
      if (cue.amount && cue.amount > 0) {
        const sign = cue.visual === "repair" || cue.visual === "terminal" ? "+" : "−";
        const floating = this.add.text(position.x, position.y - 66, sign + String(cue.amount), {
          fontFamily: "Arial", fontSize: "20px", fontStyle: "bold", color: "#f7e8d6",
          stroke: "#09121a", strokeThickness: 4,
        }).setOrigin(0.5).setDepth(14);
        this.tweens.add({ targets: floating, y: floating.y - 22, alpha: 0, duration: 720,
          onComplete: () => floating.destroy() });
      }
    }
  }

  private drawBoard(state: GameState): void {
    const graphics = this.graphics;
    graphics.clear();
    this.bars.clear();
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

    const terminal = tileCenter({ x: 0, y: 6 });
    graphics.fillStyle(COLOR.amber, state.terminalUsed ? 0.3 : 0.85);
    this.traceDiamond(terminal.x, terminal.y - 8, 30, 16);
    graphics.fillPath();
    graphics.fillStyle(COLOR.ink, 1);
    graphics.fillRect(terminal.x - 7, terminal.y - 21, 14, 12);
    graphics.lineStyle(2, COLOR.amber, 0.9);
    graphics.strokeRect(terminal.x - 7, terminal.y - 21, 14, 12);

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

    // Os personagens agora são imagens vetoriais rasterizadas uma vez pelo loader Phaser.
    // As bases, seleção e barras de Vida continuam desenhadas no Graphics isométrico.

    // Interface de Vida acima do sprite e do cenário, preservada em profundidade.
    const bars = this.bars;
    bars.fillStyle(COLOR.track, 1);
    bars.fillRoundedRect(center.x - 14, center.y - 73, 28, 5, 2);
    bars.fillStyle(color, 1);
    bars.fillRoundedRect(center.x - 14, center.y - 73, Math.max(0, Math.round(28 * unit.hp / unit.maxHp)), 5, 2);

    if (!isPlayer && targetable) {
      graphics.lineStyle(2.5, COLOR.amber, 1);
      graphics.strokeCircle(center.x, center.y - 13, 20);
    }
  }
}
