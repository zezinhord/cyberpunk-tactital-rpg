import Phaser from "phaser";
import type { Position } from "../types";
import type { OriginId } from "../character/origins";
import {
  createCharacterAnimations,
  NPC_TEXTURES,
  PLAYER_TEXTURES,
  playIdle,
  playWalk,
  preloadCharacterSprites,
  type IsoDirection,
} from "./sprites";

export type InteriorId = "clinic" | "workshop" | "canal";
export const INTERIOR_VIEW_WIDTH = 560;
export const INTERIOR_VIEW_HEIGHT = 420;

const WIDTH = 10;
const HEIGHT = 8;
const TILE_W = 54;
const TILE_H = 28;
const ORIGIN_X = 300;
const ORIGIN_Y = 90;
const PLAYER_START: Position = { x: 3, y: 6 };
const DIRECTIONS: Position[] = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];

type Point = { x: number; y: number };
type Actor = { id: string; name: string; role: string; tile: Position; texture?: string; kind: "person" | "terminal" | "exit"; visual?: Phaser.GameObjects.Sprite };

function center(tile: Position): Point {
  return { x: ORIGIN_X + (tile.x - tile.y) * TILE_W / 2, y: ORIGIN_Y + (tile.x + tile.y) * TILE_H / 2 };
}
function key(tile: Position): string { return `${tile.x},${tile.y}`; }
function inside(tile: Position): boolean { return tile.x >= 0 && tile.y >= 0 && tile.x < WIDTH && tile.y < HEIGHT; }
function directionBetween(from: Position, to: Position): IsoDirection {
  if (to.y < from.y) return 0;
  if (to.x > from.x) return 1;
  if (to.y > from.y) return 2;
  return 3;
}

export class InteriorScene extends Phaser.Scene {
  private readonly onInteract: (id: string) => void;
  private readonly originId: OriginId;
  private readonly interior: InteriorId;
  private player!: Phaser.GameObjects.Sprite;
  private playerTile: Position = PLAYER_START;
  private actors: Actor[] = [];
  private moving = false;
  private pending: string | null = null;
  private direction: IsoDirection = 2;
  private readonly blocked = new Set<string>();

  constructor(interior: InteriorId, onInteract: (id: string) => void, originId: OriginId) {
    super({ key: `BaixadaInterior-${interior}` });
    this.interior = interior;
    this.onInteract = onInteract;
    this.originId = originId;
  }

  preload(): void { preloadCharacterSprites(this); }

  create(): void {
    createCharacterAnimations(this);
    this.drawRoom();
    this.createActors();
    this.createPlayer();
    const camera = this.cameras.main;
    camera.setBounds(0, 0, 620, 430);
    camera.setZoom(1.0);
    camera.centerOn(this.player.x, this.player.y - 40);
    camera.startFollow(this.player, true, 0.12, 0.12);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handleTap, this);
    this.input.keyboard?.on("keydown", this.handleKeyboard, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.handleTap, this);
      this.input.keyboard?.off("keydown", this.handleKeyboard, this);
    });
  }

  private poly(g: Phaser.GameObjects.Graphics, points: Point[], color: number, alpha = 1, stroke = 0x172328): void {
    g.fillStyle(color, alpha); g.beginPath();
    g.moveTo(points[0]?.x ?? 0, points[0]?.y ?? 0);
    for (let i = 1; i < points.length; i += 1) { const p = points[i]; if (p) g.lineTo(p.x, p.y); }
    g.closePath(); g.fillPath(); g.lineStyle(1.4, stroke, 0.9); g.strokePath();
  }

  private drawRoom(): void {
    const g = this.add.graphics();
    const clinic = this.interior === "clinic";
    const canal = this.interior === "canal";
    const floorA = clinic ? 0x3a5050 : canal ? 0x263f42 : 0x4a4036;
    const floorB = clinic ? 0x304545 : canal ? 0x1f343b : 0x40372f;
    const wall = clinic ? 0x284c4b : canal ? 0x203d43 : 0x493a30;
    const light = clinic ? 0x7ce3cf : canal ? 0x70c9cf : 0xe6a45d;
    g.fillStyle(clinic ? 0x0e1c20 : canal ? 0x0b1a20 : 0x1c1714, 1); g.fillRect(0, 0, 620, 430);
    g.fillStyle(light, 0.07); g.fillEllipse(310, 190, 520, 320);

    for (let depth = 0; depth <= WIDTH + HEIGHT - 2; depth += 1) {
      for (let y = 0; y < HEIGHT; y += 1) for (let x = 0; x < WIDTH; x += 1) {
        if (x + y !== depth) continue;
        const p = center({ x, y });
        const diamond = [{ x: p.x, y: p.y - TILE_H / 2 }, { x: p.x + TILE_W / 2, y: p.y }, { x: p.x, y: p.y + TILE_H / 2 }, { x: p.x - TILE_W / 2, y: p.y }];
        const color = (x + y) % 2 === 0 ? floorA : floorB;
        this.poly(g, diamond, color, 1, clinic ? 0x617a70 : 0x806345);
        if ((x * 2 + y) % 5 === 0) {
          g.lineStyle(1, light, 0.18); g.beginPath(); g.moveTo(p.x - 9, p.y + 2); g.lineTo(p.x + 9, p.y + 2); g.strokePath();
        }
      }
    }

    // Paredes de fundo e laterais com recortes de luz e fiação aparente.
    const a = center({ x: 0, y: 0 }); const b = center({ x: WIDTH, y: 0 });
    const c = center({ x: WIDTH, y: HEIGHT }); const d = center({ x: 0, y: HEIGHT });
    const lift = 118;
    this.poly(g, [a, b, { x: b.x, y: b.y - lift }, { x: a.x, y: a.y - lift }], wall, 1, 0x101a1d);
    this.poly(g, [a, d, { x: d.x, y: d.y - lift }, { x: a.x, y: a.y - lift }], clinic ? 0x203c3e : 0x382c25, 1, 0x101a1d);
    g.lineStyle(3, light, 0.65); g.beginPath(); g.moveTo(a.x + 18, a.y - 94); g.lineTo(b.x - 18, b.y - 94); g.strokePath();
    g.fillStyle(light, 0.8); g.fillRoundedRect(ORIGIN_X - 42, 10, 84, 7, 3);
    g.fillStyle(0x0c171a, 0.85); g.fillRoundedRect(ORIGIN_X - 58, 26, 116, 24, 4);
    const roomTitle = clinic ? "CLÍNICA COMUNITÁRIA" : canal ? "GALERIA DE MANUTENÇÃO" : "OFICINA DO NILO";
    const roomColor = clinic ? "#b8f2df" : canal ? "#a8e8e6" : "#f2c184";
    this.add.text(ORIGIN_X, 38, roomTitle, {
      fontFamily: "IBM Plex Mono, monospace", fontSize: "13px", color: roomColor, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(800);

    if (clinic) this.drawClinicFurniture(g, light);
    else if (canal) this.drawCanalFurniture(g, light);
    else this.drawWorkshopFurniture(g, light);
    this.add.text(ORIGIN_X, 397, "SAÍDA  ◇  RETORNAR À BAIXADA", {
      fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "#d8b27b", backgroundColor: "#101a1acc", padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(900);
  }

  private drawClinicFurniture(g: Phaser.GameObjects.Graphics, light: number): void {
    // Recepção, maca, armário médico e divisória de atendimento.
    g.fillStyle(0x172a2b, 1); g.fillRoundedRect(366, 152, 88, 30, 4);
    g.fillStyle(0x4f827a, 1); g.fillRoundedRect(370, 149, 80, 8, 3);
    g.fillStyle(light, 0.8); g.fillRect(388, 153, 28, 3);
    g.fillStyle(0xe1e8dc, 1); g.fillRoundedRect(170, 250, 92, 22, 5);
    g.fillStyle(0x72958a, 1); g.fillRoundedRect(177, 243, 78, 10, 4);
    g.fillStyle(0x243a3b, 1); g.fillRect(179, 272, 5, 16); g.fillRect(247, 272, 5, 16);
    g.fillStyle(0x28413f, 1); g.fillRoundedRect(454, 206, 36, 58, 3);
    for (let i = 0; i < 3; i += 1) { g.lineStyle(2, light, 0.55); g.beginPath(); g.moveTo(458, 218 + i * 15); g.lineTo(486, 218 + i * 15); g.strokePath(); }
    g.fillStyle(0x101c20, 1); g.fillRoundedRect(410, 98, 58, 38, 4);
    g.fillStyle(light, 0.9); g.fillRoundedRect(416, 103, 46, 27, 3);
    g.fillStyle(0x21514b, 1); g.fillRect(420, 108, 28, 3); g.fillRect(420, 115, 35, 3); g.fillRect(420, 122, 20, 3);
    this.add.text(215, 232, "TRIAGEM 02", { fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "#d6e7dc" }).setOrigin(0.5).setDepth(650);
    this.add.text(439, 91, "REGISTROS", { fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "#b6efdc" }).setOrigin(0.5).setDepth(650);
  }

  private drawWorkshopFurniture(g: Phaser.GameObjects.Graphics, light: number): void {
    g.fillStyle(0x27211d, 1); g.fillRoundedRect(334, 150, 132, 36, 4);
    g.fillStyle(0x88613d, 1); g.fillRoundedRect(340, 144, 120, 10, 3);
    g.fillStyle(0x141b1b, 1); g.fillRect(349, 184, 7, 22); g.fillRect(444, 184, 7, 22);
    g.lineStyle(3, light, 0.7); g.beginPath(); g.moveTo(350, 137); g.lineTo(458, 137); g.strokePath();
    for (let i = 0; i < 5; i += 1) { g.fillStyle([0xd49a58,0x5c9d91,0x8f799f,0xa5a58a,0xb86c50][i] ?? light, 1); g.fillRoundedRect(352 + i * 20, 128 + (i % 2) * 4, 13, 10, 2); }
    g.fillStyle(0x273b3b, 1); g.fillRoundedRect(135, 170, 60, 74, 4);
    g.lineStyle(2, 0xa77e4e, 0.8); g.strokeRoundedRect(135, 170, 60, 74, 4);
    for (let i = 0; i < 3; i += 1) { g.fillStyle(0x8d6a45, 1); g.fillRect(142, 184 + i * 18, 46, 4); }
    g.fillStyle(0x10191c, 1); g.fillRoundedRect(390, 236, 58, 34, 4);
    g.fillStyle(light, 0.85); g.fillRect(397, 244, 44, 3); g.fillRect(397, 253, 27, 3);
    this.add.text(399, 126, "BANCADA / REPAROS", { fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "#f0c58b" }).setOrigin(0.5).setDepth(650);
  }

  private drawCanalFurniture(g: Phaser.GameObjects.Graphics, light: number): void {
    // Galeria subterrânea: canal de drenagem, passarela técnica, tubos e quadro de manutenção.
    g.fillStyle(0x102b33, 0.95); g.fillRoundedRect(62, 272, 492, 64, 10);
    g.fillStyle(0x1d5a60, 0.85); g.fillRoundedRect(70, 280, 476, 48, 8);
    g.lineStyle(2, 0x67c6c2, 0.55); g.beginPath(); g.moveTo(78, 288); g.lineTo(536, 288); g.strokePath();
    for (let i = 0; i < 8; i += 1) {
      const x = 90 + i * 58;
      g.fillStyle(0x7ad5cf, 0.18 + (i % 3) * 0.08); g.fillEllipse(x, 304 + (i % 2) * 5, 28, 5);
    }
    g.fillStyle(0x293d40, 1); g.fillRoundedRect(86, 134, 104, 32, 5);
    g.lineStyle(4, 0x708c85, 0.85); g.beginPath(); g.moveTo(104, 134); g.lineTo(104, 91); g.lineTo(487, 91); g.lineTo(487, 135); g.strokePath();
    g.lineStyle(2, light, 0.6); g.beginPath(); g.moveTo(110, 98); g.lineTo(480, 98); g.strokePath();
    g.fillStyle(0x101c20, 1); g.fillRoundedRect(440, 184, 58, 54, 4);
    g.lineStyle(2, light, 0.85); g.strokeRoundedRect(440, 184, 58, 54, 4);
    g.fillStyle(0xffd166, 0.92); g.fillRect(448, 193, 42, 5); g.fillRect(448, 205, 29, 4); g.fillRect(448, 216, 36, 4);
    g.fillStyle(0xd5a65e, 0.95); g.fillCircle(118, 207, 5); g.fillCircle(132, 207, 5);
    this.add.text(468, 173, "MANUTENÇÃO", { fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "#c1efea" }).setOrigin(0.5).setDepth(650);
    this.add.text(306, 315, "NÍVEL DO CANAL // ACESSO TÉCNICO", { fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "#a8ded9", backgroundColor: "#0b1a20cc", padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(650);
  }

  private createActors(): void {
    this.actors = this.interior === "clinic" ? [
      { id: "dra-amara", name: "Dra. Amara Solis", role: "MÉDICA COMUNITÁRIA", tile: { x: 4, y: 2 }, texture: NPC_TEXTURES.amara, kind: "person" },
      { id: "terminal-clinica", name: "Terminal de registros", role: "ARQUIVO LOCAL", tile: { x: 7, y: 2 }, kind: "terminal" },
      { id: "exit-interior", name: "Voltar à rua", role: "SAÍDA", tile: { x: 1, y: 6 }, kind: "exit" },
    ] : this.interior === "workshop" ? [
      { id: "vendedor", name: "Nilo", role: "MECÂNICO / VENDEDOR", tile: { x: 4, y: 3 }, texture: NPC_TEXTURES.nilo, kind: "person" },
      { id: "exit-interior", name: "Voltar à rua", role: "SAÍDA", tile: { x: 1, y: 6 }, kind: "exit" },
    ] : [
      { id: "teo", name: "Téo", role: "ENTREGADOR DO CANAL", tile: { x: 4, y: 3 }, texture: NPC_TEXTURES.teo, kind: "person" },
      { id: "terminal-galeria", name: "Registro de manutenção", role: "SERVIÇOS DO CANAL", tile: { x: 7, y: 5 }, kind: "terminal" },
      { id: "exit-interior", name: "Voltar à rua", role: "SAÍDA", tile: { x: 1, y: 6 }, kind: "exit" },
    ];

    for (const actor of this.actors) {
      const p = center(actor.tile);
      if (actor.kind === "person" && actor.texture) {
        actor.visual = this.add.sprite(p.x, p.y, actor.texture, 12).setOrigin(0.5, 0.95).setScale(0.86).setDepth(p.y + 100);
        playIdle(actor.visual, actor.texture, 2);
        this.tweens.add({ targets: actor.visual, y: p.y - 1.5, duration: 1650 + (actor.tile.x % 3) * 180, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      } else if (actor.kind === "terminal") {
        const g = this.add.graphics();
        g.fillStyle(0x101b20, 1); g.fillRoundedRect(p.x - 16, p.y - 54, 32, 49, 4);
        g.fillStyle(0xffd166, 0.92); g.fillRoundedRect(p.x - 12, p.y - 49, 24, 34, 3);
        g.fillStyle(0x4a351c, 1); g.fillRect(p.x - 8, p.y - 43, 16, 3); g.fillRect(p.x - 8, p.y - 35, 11, 3); g.fillRect(p.x - 8, p.y - 27, 16, 3);
        g.fillStyle(0x293d3d, 1); g.fillRect(p.x - 6, p.y - 5, 12, 8);
      } else if (actor.kind === "exit") {
        const g = this.add.graphics();
        g.fillStyle(0x161d1e, 1); g.fillRoundedRect(p.x - 16, p.y - 37, 32, 39, 3);
        g.lineStyle(2, 0xffd166, 0.95); g.strokeRoundedRect(p.x - 16, p.y - 37, 32, 39, 3);
        g.fillStyle(0xffd166, 0.9); g.fillCircle(p.x + 9, p.y - 17, 2.5);
      }
      const labelColor = actor.kind === "terminal" ? "#ffd166" : actor.kind === "exit" ? "#ffd166" : "#f2f0df";
      this.add.text(p.x, p.y - (actor.kind === "person" ? 72 : 47), actor.kind === "exit" ? "SAÍDA" : actor.kind === "terminal" ? "TERMINAL" : actor.name, {
        fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: labelColor, backgroundColor: "#10191ddd", padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setDepth(p.y + 150);
    }
  }

  private createPlayer(): void {
    const p = center(this.playerTile);
    const texture = PLAYER_TEXTURES[this.originId];
    this.player = this.add.sprite(p.x, p.y, texture, 12).setOrigin(0.5, 0.95).setScale(0.9).setDepth(p.y + 120);
    playIdle(this.player, texture, 2);
  }

  private walkable(tile: Position): boolean {
    if (!inside(tile) || this.blocked.has(key(tile))) return false;
    if (this.actors.some((actor) => key(actor.tile) === key(tile))) return false;
    const obstacles = this.interior === "clinic"
      ? ["5,2", "6,2", "4,4", "5,4", "6,4"]
      : this.interior === "workshop"
        ? ["5,2", "6,2", "7,2", "2,3", "2,4"]
        : ["5,2", "6,2", "7,2", "5,5", "6,5", "2,3"];
    return !obstacles.includes(key(tile));
  }

  private findPath(start: Position, end: Position): Position[] | null {
    if (!this.walkable(end)) return null;
    const queue: Position[] = [start];
    const previous = new Map<string, string | null>([[key(start), null]]);
    while (queue.length) {
      const current = queue.shift(); if (!current) break;
      if (current.x === end.x && current.y === end.y) break;
      for (const dir of DIRECTIONS) {
        const next = { x: current.x + dir.x, y: current.y + dir.y };
        if (!this.walkable(next) || previous.has(key(next))) continue;
        previous.set(key(next), key(current)); queue.push(next);
      }
    }
    if (!previous.has(key(end))) return null;
    const result: Position[] = []; let cursor: string | null = key(end);
    while (cursor) { const [x = 0, y = 0] = cursor.split(",").map(Number); result.unshift({ x, y }); cursor = previous.get(cursor) ?? null; }
    return result;
  }

  private approach(actor: Actor): void {
    const candidates = DIRECTIONS.map((d) => ({ x: actor.tile.x + d.x, y: actor.tile.y + d.y }))
      .filter((tile) => this.walkable(tile)).map((tile) => this.findPath(this.playerTile, tile)).filter((path): path is Position[] => Boolean(path));
    candidates.sort((a, b) => a.length - b.length);
    const path = candidates[0];
    if (!path) return;
    if (path.length === 1) { this.onInteract(actor.id); return; }
    this.pending = actor.id; this.walkPath(path);
  }

  private handleTap(pointer: Phaser.Input.Pointer): void {
    if (this.moving) return;
    const p = pointer.positionToCamera(this.cameras.main);
    const actor = this.actors.find((item) => {
      const c = center(item.tile); const top = c.y - (item.kind === "person" ? 70 : 43);
      return Math.abs(p.x - c.x) <= 27 && p.y >= top && p.y <= c.y + 14;
    });
    if (actor) { this.approach(actor); return; }
    const rx = (p.x - ORIGIN_X) / (TILE_W / 2); const ry = (p.y - ORIGIN_Y) / (TILE_H / 2);
    const tile = { x: Math.round((rx + ry) / 2), y: Math.round((ry - rx) / 2) };
    const c = center(tile);
    if (!inside(tile) || Math.abs(p.x - c.x) / (TILE_W / 2) + Math.abs(p.y - c.y) / (TILE_H / 2) > 1.1) return;
    const path = this.findPath(this.playerTile, tile); if (path) this.walkPath(path);
  }

  private handleKeyboard(event: KeyboardEvent): void {
    if (this.moving) return;
    const k = event.key.toLowerCase();
    const dir: IsoDirection | undefined = k === "arrowup" || k === "w" ? 0 : k === "arrowright" || k === "d" ? 1 : k === "arrowdown" || k === "s" ? 2 : k === "arrowleft" || k === "a" ? 3 : undefined;
    if (dir === undefined) return;
    const vector = DIRECTIONS[dir]; if (!vector) return;
    const next = { x: this.playerTile.x + vector.x, y: this.playerTile.y + vector.y };
    const path = this.findPath(this.playerTile, next); if (path) this.walkPath(path);
  }

  private walkPath(path: Position[]): void {
    if (path.length <= 1 || this.moving) return;
    this.moving = true;
    const texture = PLAYER_TEXTURES[this.originId];
    const steps = path.slice(1);
    const nextStep = (): void => {
      const next = steps.shift();
      if (!next) {
        this.moving = false;
        playIdle(this.player, texture, this.direction);
        const interaction = this.pending; this.pending = null;
        if (interaction) this.onInteract(interaction);
        return;
      }
      const direction = directionBetween(this.playerTile, next);
      this.direction = direction;
      playWalk(this.player, texture, direction);
      const p = center(next); this.playerTile = next;
      this.tweens.add({ targets: this.player, x: p.x, y: p.y, duration: 190, ease: "Sine.easeInOut", onUpdate: () => this.player.setDepth(this.player.y + 120), onComplete: nextStep });
    };
    nextStep();
  }
}
