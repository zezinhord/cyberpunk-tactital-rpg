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

export const BAIXADA_WIDTH = 1120;
export const BAIXADA_HEIGHT = 720;
export const BAIXADA_VIEW_WIDTH = 560;
export const BAIXADA_VIEW_HEIGHT = 420;

const GRID_WIDTH = 20;
const GRID_HEIGHT = 16;
const TILE_WIDTH = 48;
const TILE_HEIGHT = 24;
const ORIGIN_X = 580;
const ORIGIN_Y = 140;

type Point = { x: number; y: number };
type ActorKind = "person" | "terminal" | "door";

interface WorldActor {
  id: string;
  name: string;
  kind: ActorKind;
  tile: Position;
  texture?: string;
  accent?: number;
  role?: string;
  visual?: Phaser.GameObjects.Sprite;
  label?: Phaser.GameObjects.Text;
}

interface BuildingSpec {
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  wall: number;
  roof: number;
  accent: number;
  label: string;
  sign?: string;
}

const BUILDINGS: BuildingSpec[] = [
  { x: 1, y: 0, width: 3, depth: 2, height: 74, wall: 0x27384a, roof: 0x354f5b, accent: 0xe5a95f, label: "MORADIA 03" },
  { x: 8, y: 0, width: 3, depth: 3, height: 112, wall: 0x243b43, roof: 0x315c5b, accent: 0x00d7d0, label: "CLÍNICA COMUNITÁRIA", sign: "CLÍNICA 24H" },
  { x: 12, y: 1, width: 2, depth: 2, height: 66, wall: 0x3b3041, roof: 0x594253, accent: 0xff8a62, label: "PENSÃO" },
  { x: 0, y: 8, width: 3, depth: 2, height: 78, wall: 0x3d3030, roof: 0x5b4437, accent: 0xffa65c, label: "OFICINA DO NILO", sign: "NILO / REPAROS" },
  { x: 10, y: 8, width: 3, depth: 2, height: 94, wall: 0x263747, roof: 0x344c5f, accent: 0xb78bff, label: "BLOCO RESIDENCIAL" },
  { x: 16, y: 0, width: 3, depth: 3, height: 84, wall: 0x3c3941, roof: 0x61505b, accent: 0xd89e71, label: "MERCADO DA PONTE", sign: "PONTE / TROCAS" },
  { x: 16, y: 9, width: 3, depth: 3, height: 102, wall: 0x293b3b, roof: 0x3f5b51, accent: 0x9bc08a, label: "MORADIAS DO CANAL" },
  { x: 2, y: 13, width: 3, depth: 2, height: 60, wall: 0x303b42, roof: 0x485860, accent: 0x78c7c6, label: "PONTO DE APOIO" },
  { x: 8, y: 13, width: 3, depth: 2, height: 72, wall: 0x343d3a, roof: 0x4d5d4e, accent: 0xc4a56e, label: "CAIXA D'ÁGUA" },
];

const BUILDING_CELLS = new Set<string>();
for (const building of BUILDINGS) {
  for (let x = building.x; x < building.x + building.width; x += 1) {
    for (let y = building.y; y < building.y + building.depth; y += 1) BUILDING_CELLS.add(`${x},${y}`);
  }
}

// NPCs e objetos de interação ocupam sua célula; o protagonista contorna os pontos de interesse.
const STREET_ACTOR_CELLS = new Set(["4,6", "12,6", "16,6", "9,3", "3,8", "14,13", "10,12"]);

const DIRECTIONS: Position[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

function tileCenter({ x, y }: Position): Point {
  return {
    x: ORIGIN_X + (x - y) * (TILE_WIDTH / 2),
    y: ORIGIN_Y + (x + y) * (TILE_HEIGHT / 2),
  };
}

function inside({ x, y }: Position): boolean {
  return x >= 0 && y >= 0 && x < GRID_WIDTH && y < GRID_HEIGHT;
}

function keyOf({ x, y }: Position): string {
  return `${x},${y}`;
}

function walkable(position: Position): boolean {
  return inside(position) && !BUILDING_CELLS.has(keyOf(position)) && !STREET_ACTOR_CELLS.has(keyOf(position));
}

function findPath(start: Position, end: Position): Position[] | null {
  if (!walkable(end)) return null;
  const queue: Position[] = [start];
  const previous = new Map<string, string | null>([[keyOf(start), null]]);

  while (queue.length) {
    const current = queue.shift();
    if (!current) break;
    if (current.x === end.x && current.y === end.y) break;

    for (const direction of DIRECTIONS) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const key = keyOf(next);
      if (!walkable(next) || previous.has(key)) continue;
      previous.set(key, keyOf(current));
      queue.push(next);
    }
  }

  const endKey = keyOf(end);
  if (!previous.has(endKey)) return null;
  const path: Position[] = [];
  let cursor: string | null = endKey;
  while (cursor) {
    const [x = 0, y = 0] = cursor.split(",").map(Number);
    path.unshift({ x, y });
    cursor = previous.get(cursor) ?? null;
  }
  return path;
}

function nearestApproach(start: Position, target: Position): Position[] | null {
  const candidates = DIRECTIONS
    .map((direction) => ({ x: target.x + direction.x, y: target.y + direction.y }))
    .filter(walkable)
    .map((tile) => findPath(start, tile))
    .filter((path): path is Position[] => Boolean(path));
  candidates.sort((a, b) => a.length - b.length);
  return candidates[0] ?? null;
}

export class BaixadaScene extends Phaser.Scene {
  private readonly onInteract: (id: string) => void;
  private readonly originId: OriginId;
  private ground!: Phaser.GameObjects.Graphics;
  private details!: Phaser.GameObjects.Graphics;
  private markers!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Sprite;
  private playerDirection: IsoDirection = 2;
  private playerTile: Position = { x: 6, y: 9 };
  private actors: WorldActor[] = [];
  private moving = false;
  private pendingInteraction: string | null = null;

  constructor(onInteract: (id: string) => void, originId: OriginId) {
    super({ key: "BaixadaScene" });
    this.onInteract = onInteract;
    this.originId = originId;
  }

  preload(): void {
    preloadCharacterSprites(this);
  }

  create(): void {
    createCharacterAnimations(this);
    this.cameras.main.setBackgroundColor("#101820");
    this.ground = this.add.graphics();
    this.details = this.add.graphics();
    this.markers = this.add.graphics();
    this.drawDistrict();
    this.createActors();
    this.bakeStaticLayers();
    this.markers.setDepth(20);
    this.createPlayer();
    this.createStreetLabels();
    const camera = this.cameras.main;
    camera.setBounds(0, 0, BAIXADA_WIDTH, BAIXADA_HEIGHT);
    camera.setZoom(1.0);
    const start = tileCenter(this.playerTile);
    camera.centerOn(start.x, start.y - 34);
    camera.startFollow(this.player, true, 0.12, 0.12);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handleTap, this);
    this.input.keyboard?.on("keydown", this.handleKeyboard, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.handleTap, this);
      this.input.keyboard?.off("keydown", this.handleKeyboard, this);
    });
  }

  private polygon(
    graphics: Phaser.GameObjects.Graphics,
    points: Point[],
    color: number,
    alpha = 1,
    stroke?: number,
    strokeAlpha = 1,
    lineWidth = 1,
  ): void {
    graphics.fillStyle(color, alpha);
    graphics.beginPath();
    graphics.moveTo(points[0]?.x ?? 0, points[0]?.y ?? 0);
    for (let index = 1; index < points.length; index += 1) {
      const point = points[index];
      if (point) graphics.lineTo(point.x, point.y);
    }
    graphics.closePath();
    graphics.fillPath();
    if (stroke !== undefined) {
      graphics.lineStyle(lineWidth, stroke, strokeAlpha);
      graphics.beginPath();
      graphics.moveTo(points[0]?.x ?? 0, points[0]?.y ?? 0);
      for (let index = 1; index < points.length; index += 1) {
        const point = points[index];
        if (point) graphics.lineTo(point.x, point.y);
      }
      graphics.closePath();
      graphics.strokePath();
    }
  }

  private darken(color: number, factor: number): number {
    const red = Math.floor(((color >> 16) & 0xff) * factor);
    const green = Math.floor(((color >> 8) & 0xff) * factor);
    const blue = Math.floor((color & 0xff) * factor);
    return (red << 16) | (green << 8) | blue;
  }

  private diamond(cx: number, cy: number, width = TILE_WIDTH, height = TILE_HEIGHT): Point[] {
    return [
      { x: cx, y: cy - height / 2 },
      { x: cx + width / 2, y: cy },
      { x: cx, y: cy + height / 2 },
      { x: cx - width / 2, y: cy },
    ];
  }

  private drawDistrict(): void {
    const graphics = this.ground;
    graphics.fillStyle(0x101820, 1);
    graphics.fillRect(0, 0, BAIXADA_WIDTH, BAIXADA_HEIGHT);

    // Fundo atmosférico em camadas: névoa quente de oficinas e luz fria de anúncios.
    graphics.fillStyle(0x174448, 0.18);
    graphics.fillEllipse(390, 250, 530, 300);
    graphics.fillStyle(0x8a4e42, 0.12);
    graphics.fillEllipse(590, 360, 430, 210);

    for (let depth = 0; depth <= GRID_WIDTH + GRID_HEIGHT - 2; depth += 1) {
      for (let y = 0; y < GRID_HEIGHT; y += 1) {
        for (let x = 0; x < GRID_WIDTH; x += 1) {
          if (x + y !== depth) continue;
          const center = tileCenter({ x, y });
          const isStreet = y === 6
            || (x === 7 && y >= 3 && y <= 11)
            || (y === 7 && x >= 3 && x <= 10)
            || (y === 12 && x >= 5 && x <= 19)
            || (x === 14 && y >= 4 && y <= 14);
          const variation = (x * 7 + y * 11) % 5;
          const color = isStreet
            ? [0x38444a, 0x3a464a, 0x323f45, 0x3d494c, 0x354147][variation] ?? 0x38444a
            : [0x34413e, 0x3a4740, 0x303c3a, 0x39443e, 0x35423d][variation] ?? 0x34413e;
          this.polygon(graphics, this.diamond(center.x, center.y), color, 1, 0x52615a, 0.28, 0.8);

          if (isStreet && (x + y) % 4 === 0) {
            graphics.lineStyle(1, 0xe3c17e, 0.27);
            graphics.beginPath();
            graphics.moveTo(center.x - 8, center.y + 1);
            graphics.lineTo(center.x + 8, center.y + 1);
            graphics.strokePath();
          }
          if (!isStreet && variation === 2) this.drawGroundDetail(center.x, center.y, x, y);
        }
      }
    }

    this.drawRoadDrainage();
    this.drawBuildings();
    this.drawMarketStall(4, 5);
    this.drawPalm(2, 5);
    this.drawPalm(12, 6);
    this.drawPalm(6, 2);
    this.drawPalm(15, 5);
    this.drawPalm(13, 13);
    this.drawPalm(5, 13);
    this.drawLamp(6, 6);
    this.drawLamp(10, 7);
    this.drawLamp(14, 11);
    this.drawLamp(18, 12);
    this.drawCableRun();
    this.drawStreetProps();
  }

  private bakeStaticLayers(): void {
    const layers = [
      { graphics: this.ground, texture: "baixada-ground-v065", depth: 0 },
      { graphics: this.details, texture: "baixada-details-v065", depth: 10 },
    ];
    for (const layer of layers) {
      if (this.textures.exists(layer.texture)) this.textures.remove(layer.texture);
      layer.graphics.generateTexture(layer.texture, BAIXADA_WIDTH, BAIXADA_HEIGHT);
      layer.graphics.destroy();
      this.add.image(0, 0, layer.texture).setOrigin(0).setDepth(layer.depth);
    }
  }

  private drawGroundDetail(cx: number, cy: number, x: number, y: number): void {
    const graphics = this.ground;
    if ((x * 3 + y) % 3 === 0) {
      graphics.fillStyle(0x8faca0, 0.18);
      graphics.fillEllipse(cx - 5, cy + 1, 12, 3);
    } else {
      graphics.lineStyle(1, 0x111e22, 0.35);
      graphics.beginPath();
      graphics.moveTo(cx - 9, cy - 1);
      graphics.lineTo(cx - 2, cy + 2);
      graphics.lineTo(cx + 5, cy - 1);
      graphics.strokePath();
    }
  }

  private drawRoadDrainage(): void {
    const graphics = this.details;
    graphics.lineStyle(2, 0x17262c, 0.9);
    for (let x = 2; x < 19; x += 1) {
      const point = tileCenter({ x, y: 6 });
      graphics.beginPath();
      graphics.moveTo(point.x - 11, point.y + 4);
      graphics.lineTo(point.x + 10, point.y + 4);
      graphics.strokePath();
    }
    graphics.fillStyle(0x66c9c1, 0.25);
    graphics.fillEllipse(490, 255, 35, 7);
    graphics.fillEllipse(326, 302, 25, 5);
  }

  private drawBuildings(): void {
    const ordered = [...BUILDINGS].sort((a, b) => a.x + a.y - (b.x + b.y));
    for (const building of ordered) this.drawBuilding(building);
  }

  private drawBuilding(building: BuildingSpec): void {
    const g = this.details;
    const a = tileCenter({ x: building.x, y: building.y });
    const b = tileCenter({ x: building.x + building.width, y: building.y });
    const c = tileCenter({ x: building.x + building.width, y: building.y + building.depth });
    const d = tileCenter({ x: building.x, y: building.y + building.depth });
    const h = building.height;
    const at = { x: a.x, y: a.y - h };
    const bt = { x: b.x, y: b.y - h };
    const ct = { x: c.x, y: c.y - h };
    const dt = { x: d.x, y: d.y - h };

    // Duas fachadas em perspectiva e cobertura elevada.
    this.polygon(g, [d, c, ct, dt], building.wall, 1, 0x101b22, 0.9, 2);
    this.polygon(g, [b, c, ct, bt], this.darken(building.wall, 0.72), 1, 0x101b22, 0.9, 2);
    this.polygon(g, [at, bt, ct, dt], building.roof, 1, building.accent, 0.65, 2);

    // Linhas de estrutura, janelas e varandas da fachada voltada para a rua.
    for (let index = 1; index < building.width; index += 1) {
      const t = index / building.width;
      const x1 = Phaser.Math.Linear(bt.x, ct.x, t);
      const y1 = Phaser.Math.Linear(bt.y, ct.y, t);
      const x2 = Phaser.Math.Linear(b.x, c.x, t);
      const y2 = Phaser.Math.Linear(b.y, c.y, t);
      g.lineStyle(2, 0x101820, 0.65);
      g.beginPath();
      g.moveTo(x1, y1 + 8);
      g.lineTo(x2, y2 - 4);
      g.strokePath();
    }

    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < building.width; col += 1) {
        const t = (col + 0.5) / building.width;
        const baseX = Phaser.Math.Linear(bt.x, ct.x, t);
        const baseY = Phaser.Math.Linear(bt.y, ct.y, t);
        const windowY = baseY - 24 - row * 25;
        g.fillStyle(0x101f29, 1);
        g.fillRoundedRect(baseX - 7, windowY - 5, 14, 17, 2);
        g.fillStyle(building.accent, 0.68);
        g.fillRect(baseX - 5, windowY - 3, 10, 2);
        g.fillStyle(0x81ddd3, 0.22);
        g.fillRect(baseX - 5, windowY + 1, 10, 8);
      }
    }

    // Portas e painéis de serviço na fachada lateral.
    const doorX = (d.x + c.x) / 2;
    const doorY = (d.y + c.y) / 2 - 26;
    g.fillStyle(0x11191f, 1);
    g.fillRoundedRect(doorX - 8, doorY - 15, 16, 42, 2);
    g.fillStyle(building.accent, 0.8);
    g.fillRect(doorX + 4, doorY + 2, 2, 3);
    g.lineStyle(2, building.accent, 0.65);
    g.beginPath();
    g.moveTo(d.x + 7, d.y - 12);
    g.lineTo(c.x - 7, c.y - 12);
    g.strokePath();

    // Equipamento, caixas d'água, antenas e exaustores sobre o telhado.
    const roofCenter = { x: (at.x + bt.x + ct.x + dt.x) / 4, y: (at.y + bt.y + ct.y + dt.y) / 4 };
    g.fillStyle(0x192b31, 1);
    g.fillRoundedRect(roofCenter.x - 18, roofCenter.y - 5, 36, 15, 3);
    g.fillStyle(building.accent, 0.7);
    g.fillRect(roofCenter.x - 13, roofCenter.y - 2, 26, 2);
    g.lineStyle(2, 0x101820, 0.95);
    g.beginPath();
    g.moveTo(roofCenter.x + 25, roofCenter.y - 8);
    g.lineTo(roofCenter.x + 25, roofCenter.y - 34);
    g.lineTo(roofCenter.x + 35, roofCenter.y - 40);
    g.strokePath();
    g.fillStyle(building.accent, 0.95);
    g.fillCircle(roofCenter.x + 35, roofCenter.y - 40, 3);

    if (building.sign) {
      const signX = (d.x + c.x) / 2;
      const signY = (d.y + c.y) / 2 - h + 15;
      g.fillStyle(0x101b22, 0.98);
      g.fillRoundedRect(signX - 39, signY - 7, 78, 17, 3);
      g.lineStyle(1, building.accent, 0.9);
      g.strokeRoundedRect(signX - 39, signY - 7, 78, 17, 3);
      this.add.text(signX, signY + 1, building.sign, {
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: "15px",
        color: "#e6f4e8",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(signY + 10);
    }

    this.add.text((at.x + bt.x + ct.x + dt.x) / 4, Math.min(at.y, bt.y, ct.y, dt.y) - 11, building.label, {
      fontFamily: "IBM Plex Mono, monospace",
      fontSize: "14px",
      color: "#b7c8bd",
      backgroundColor: "#101820cc",
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(500);
  }

  private drawMarketStall(x: number, y: number): void {
    const g = this.details;
    const center = tileCenter({ x, y });
    const top = { x: center.x, y: center.y - 44 };
    const left = { x: center.x - 33, y: center.y - 27 };
    const right = { x: center.x + 33, y: center.y - 27 };
    const front = { x: center.x, y: center.y - 10 };
    this.polygon(g, [left, top, right, front], 0x9b5147, 1, 0x271e22, 1, 2);
    this.polygon(g, [left, top, front], 0xe2a65b, 1, 0x271e22, 0.8, 1);
    this.polygon(g, [top, right, front], 0x286d68, 1, 0x271e22, 0.8, 1);
    g.lineStyle(3, 0x25343a, 1);
    g.beginPath();
    g.moveTo(left.x, left.y);
    g.lineTo(left.x, center.y + 8);
    g.moveTo(right.x, right.y);
    g.lineTo(right.x, center.y + 8);
    g.strokePath();
    g.fillStyle(0x6b4935, 1);
    g.fillRect(center.x - 23, center.y - 10, 46, 15);
    g.fillStyle(0xf0c37c, 0.85);
    g.fillRect(center.x - 20, center.y - 7, 40, 3);
    for (let index = 0; index < 4; index += 1) {
      g.fillStyle([0xd87547, 0xd7ba67, 0x6fc6a7, 0x9c83c8][index] ?? 0xd87547, 1);
      g.fillCircle(center.x - 15 + index * 10, center.y - 17, 3);
    }
    this.add.text(center.x, center.y - 55, "MERCADO DA PONTE", {
      fontFamily: "IBM Plex Mono, monospace", fontSize: "14px", color: "#ffd7a2", backgroundColor: "#281d22cc", padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(480);
  }

  private drawPalm(x: number, y: number): void {
    const g = this.details;
    const base = tileCenter({ x, y });
    const crown = { x: base.x + 1, y: base.y - 66 };
    g.fillStyle(0x162a28, 0.48);
    g.fillEllipse(base.x + 4, base.y + 2, 36, 12);
    g.lineStyle(7, 0x664a35, 1);
    g.beginPath();
    g.moveTo(base.x, base.y);
    g.lineTo(crown.x - 2, crown.y + 24);
    g.strokePath();
    g.lineStyle(2, 0xb38a57, 0.9);
    for (let ring = 0; ring < 4; ring += 1) {
      const yLine = Phaser.Math.Linear(base.y - 11, crown.y + 24, ring / 4);
      g.beginPath();
      g.moveTo(base.x - 3, yLine);
      g.lineTo(base.x + 4, yLine - 2);
      g.strokePath();
    }
    const leafEnds = [
      { x: crown.x - 39, y: crown.y - 8 }, { x: crown.x - 29, y: crown.y - 27 },
      { x: crown.x - 8, y: crown.y - 34 }, { x: crown.x + 15, y: crown.y - 31 },
      { x: crown.x + 38, y: crown.y - 14 }, { x: crown.x + 42, y: crown.y + 4 },
      { x: crown.x + 12, y: crown.y + 7 }, { x: crown.x - 15, y: crown.y + 8 },
    ];
    for (const [index, end] of leafEnds.entries()) {
      const color = index % 2 === 0 ? 0x4e9673 : 0x72a86e;
      g.lineStyle(5, 0x285d4e, 1);
      g.beginPath();
      g.moveTo(crown.x, crown.y + 21);
      g.lineTo(end.x, end.y);
      g.strokePath();
      g.lineStyle(1, color, 1);
      for (let leaflet = 1; leaflet <= 4; leaflet += 1) {
        const t = leaflet / 5;
        const px = Phaser.Math.Linear(crown.x, end.x, t);
        const py = Phaser.Math.Linear(crown.y + 21, end.y, t);
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(px + (end.x < crown.x ? -9 : 9), py + 7);
        g.strokePath();
      }
    }
    g.fillStyle(0xd59b58, 1);
    g.fillCircle(crown.x, crown.y + 19, 5);
  }

  private drawLamp(x: number, y: number): void {
    const g = this.details;
    const base = tileCenter({ x, y });
    g.fillStyle(0x10181c, 0.55);
    g.fillEllipse(base.x, base.y + 2, 24, 7);
    g.lineStyle(4, 0x27373c, 1);
    g.beginPath();
    g.moveTo(base.x, base.y);
    g.lineTo(base.x + 3, base.y - 69);
    g.lineTo(base.x + 18, base.y - 74);
    g.strokePath();
    g.lineStyle(3, 0x00d6ce, 0.85);
    g.beginPath();
    g.moveTo(base.x + 8, base.y - 70);
    g.lineTo(base.x + 18, base.y - 74);
    g.strokePath();
    g.fillStyle(0x00d6ce, 0.28);
    g.fillCircle(base.x + 19, base.y - 74, 13);
    g.fillStyle(0x7af7df, 1);
    g.fillRoundedRect(base.x + 13, base.y - 79, 11, 5, 2);
  }

  private drawCableRun(): void {
    const g = this.details;
    g.lineStyle(2, 0x17272e, 0.96);
    g.beginPath();
    g.moveTo(115, 118);
    g.lineTo(206, 84);
    g.lineTo(325, 143);
    g.lineTo(478, 111);
    g.lineTo(623, 165);
    g.strokePath();
    g.lineStyle(1, 0x8e6650, 0.8);
    g.beginPath();
    g.moveTo(115, 121);
    g.lineTo(206, 87);
    g.lineTo(325, 146);
    g.lineTo(478, 114);
    g.lineTo(623, 168);
    g.strokePath();
    for (const point of [{ x: 206, y: 86 }, { x: 478, y: 113 }, { x: 623, y: 166 }]) {
      g.fillStyle(0x111c21, 1);
      g.fillCircle(point.x, point.y, 4);
    }
  }

  private drawStreetProps(): void {
    const g = this.details;
    const bins = [{ x: 5, y: 8 }, { x: 11, y: 5 }, { x: 15, y: 8 }, { x: 12, y: 13 }, { x: 18, y: 7 }];
    for (const tile of bins) {
      const point = tileCenter(tile);
      g.fillStyle(0x1a292e, 1);
      g.fillRoundedRect(point.x - 10, point.y - 18, 18, 20, 3);
      g.fillStyle(0x73a89b, 0.8);
      g.fillRect(point.x - 8, point.y - 17, 14, 3);
      g.lineStyle(1, 0x0d171b, 0.8);
      g.strokeRoundedRect(point.x - 10, point.y - 18, 18, 20, 3);
    }
    const crates = [{ x: 3, y: 8 }, { x: 9, y: 8 }, { x: 12, y: 5 }, { x: 17, y: 6 }, { x: 9, y: 11 }, { x: 12, y: 12 }, { x: 16, y: 13 }];
    for (const tile of crates) {
      const point = tileCenter(tile);
      g.fillStyle(0x8b6848, 1);
      g.fillRoundedRect(point.x - 9, point.y - 12, 18, 13, 2);
      g.lineStyle(1, 0x3b3125, 0.9);
      g.strokeRect(point.x - 7, point.y - 10, 14, 9);
      g.lineStyle(2, 0xb88d5c, 0.6);
      g.beginPath();
      g.moveTo(point.x - 7, point.y - 10);
      g.lineTo(point.x + 7, point.y - 1);
      g.strokePath();
    }
  }

  private createActors(): void {
    this.actors = [
      { id: "vendedor", name: "Nilo", kind: "person", tile: { x: 4, y: 6 }, texture: NPC_TEXTURES.nilo, role: "MECÂNICO / VENDEDOR" },
      { id: "moradora", name: "Joana", kind: "person", tile: { x: 12, y: 6 }, texture: NPC_TEXTURES.joana, role: "MORADORA DA BAIXADA" },
      { id: "saira", name: "Saira", kind: "person", tile: { x: 16, y: 6 }, texture: NPC_TEXTURES.saira, role: "VENDEDORA DO MERCADO" },
      { id: "enter-clinic", name: "Entrar na clínica", kind: "door", tile: { x: 9, y: 3 }, role: "INTERIOR" },
      { id: "enter-workshop", name: "Entrar na oficina", kind: "door", tile: { x: 3, y: 8 }, role: "INTERIOR" },
      { id: "enter-canal-gallery", name: "Descer para a galeria", kind: "door", tile: { x: 14, y: 13 }, role: "ACESSO TÉCNICO" },
      { id: "terminal-canal", name: "Terminal do Canal", kind: "terminal", tile: { x: 10, y: 12 }, role: "SERVIÇOS DO DISTRITO" },
    ];

    for (const actor of this.actors) {
      const point = tileCenter(actor.tile);
      if (actor.kind === "person" && actor.texture) {
        actor.visual = this.add.sprite(point.x, point.y, actor.texture, 12)
          .setOrigin(0.5, 0.95).setScale(0.86).setDepth(point.y + 100);
        playIdle(actor.visual, actor.texture, 2);
        this.tweens.add({ targets: actor.visual, y: point.y - 1.5, duration: 1500 + (actor.tile.x % 3) * 170, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        actor.label = this.add.text(point.x, point.y - 73, actor.name, {
          fontFamily: "IBM Plex Mono, monospace", fontSize: "13px", color: "#eef7ec", backgroundColor: "#111b20dd", padding: { x: 4, y: 2 },
        }).setOrigin(0.5).setDepth(point.y + 150);
      } else if (actor.kind === "terminal") {
        this.drawTerminal(point.x, point.y);
        actor.label = this.add.text(point.x, point.y - 47, "TERMINAL", {
          fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "#ffe3a0", backgroundColor: "#2b2417dd", padding: { x: 4, y: 2 },
        }).setOrigin(0.5).setDepth(point.y + 90);
      } else {
        const accent = actor.id === "enter-clinic" ? 0x79d8c6 : actor.id === "enter-canal-gallery" ? 0x70c9cf : 0xe2ae6e;
        this.drawDoor(point.x, point.y, accent);
        const doorLabel = actor.id === "enter-clinic" ? "CLÍNICA · ENTRAR" : actor.id === "enter-canal-gallery" ? "GALERIA · DESCER" : "OFICINA · ENTRAR";
        actor.label = this.add.text(point.x, point.y - 48, doorLabel, {
          fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "#ffe0a8", backgroundColor: "#151c1ddd", padding: { x: 4, y: 2 },
        }).setOrigin(0.5).setDepth(point.y + 90);
      }
    }
  }

  private drawDoor(cx: number, cy: number, accent: number): void {
    const g = this.details;
    g.fillStyle(0x10191e, 1);
    g.fillRoundedRect(cx - 13, cy - 43, 26, 43, 3);
    g.lineStyle(2, accent, 0.95);
    g.strokeRoundedRect(cx - 13, cy - 43, 26, 43, 3);
    g.fillStyle(accent, 0.18);
    g.fillRect(cx - 9, cy - 37, 18, 29);
    g.fillStyle(accent, 0.95);
    g.fillCircle(cx + 7, cy - 18, 2);
    g.lineStyle(1, accent, 0.8);
    g.beginPath(); g.moveTo(cx - 18, cy - 46); g.lineTo(cx + 18, cy - 46); g.strokePath();
  }

  private drawTerminal(cx: number, cy: number): void {
    const g = this.details;
    g.fillStyle(0x10181c, 0.6);
    g.fillEllipse(cx + 3, cy + 2, 31, 9);
    g.fillStyle(0x1b2a30, 1);
    g.fillRoundedRect(cx - 12, cy - 37, 24, 32, 3);
    g.fillStyle(0xffd166, 0.95);
    g.fillRoundedRect(cx - 9, cy - 34, 18, 20, 2);
    g.fillStyle(0x4a351c, 1);
    g.fillRect(cx - 7, cy - 31, 14, 2);
    g.fillRect(cx - 7, cy - 26, 9, 2);
    g.fillRect(cx - 7, cy - 21, 12, 2);
    g.fillStyle(0x71867d, 1);
    g.fillRect(cx - 4, cy - 5, 8, 7);
    g.fillRoundedRect(cx - 11, cy + 1, 22, 4, 2);
  }

  private createPlayer(): void {
    const point = tileCenter(this.playerTile);
    const texture = PLAYER_TEXTURES[this.originId];
    this.player = this.add.sprite(point.x, point.y, texture, 12)
      .setOrigin(0.5, 0.95).setScale(0.94).setDepth(point.y + 120);
    playIdle(this.player, texture, this.playerDirection);
    this.drawPlayerMarker();
  }

  private createStreetLabels(): void {
    const workshops = tileCenter({ x: 5, y: 9 });
    const bridge = tileCenter({ x: 15, y: 8 });
    const canal = tileCenter({ x: 11, y: 14 });
    this.add.text(workshops.x, workshops.y + 35, "RUA DAS OFICINAS", {
      fontFamily: "IBM Plex Mono, monospace", fontSize: "13px", color: "#b8b8a0", backgroundColor: "#152328cc", padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(900);
    this.add.text(bridge.x, bridge.y + 30, "MERCADO DA PONTE", {
      fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "#ffd7a2", backgroundColor: "#281d22cc", padding: { x: 5, y: 2 },
    }).setOrigin(0.5).setDepth(900);
    this.add.text(canal.x, canal.y + 25, "PRAÇA DA CAIXA D'ÁGUA", {
      fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "#a5bcb0", backgroundColor: "#152328cc", padding: { x: 5, y: 2 },
    }).setOrigin(0.5).setDepth(900);
    const gallery = tileCenter({ x: 14, y: 13 });
    this.add.text(gallery.x + 18, gallery.y + 36, "GALERIA DO CANAL", {
      fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "#a8ded9", backgroundColor: "#102126dd", padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(900);
  }

  private drawPlayerMarker(): void {
    this.markers.clear();
    const playerPoint = tileCenter(this.playerTile);
    this.polygon(this.markers, this.diamond(playerPoint.x, playerPoint.y + 1, 38, 19), 0x00e5ff, 0.1, 0x00e5ff, 0.55, 1.5);
    for (const actor of this.actors) {
      const point = tileCenter(actor.tile);
      this.polygon(
        this.markers,
        this.diamond(point.x, point.y + 1, actor.kind === "terminal" ? 34 : actor.kind === "door" ? 36 : 30, actor.kind === "terminal" ? 17 : actor.kind === "door" ? 18 : 15),
        0xffd166,
        0.1,
        0xffd166,
        0.78,
        1.2,
      );
    }
  }

  private handleTap(pointer: Phaser.Input.Pointer): void {
    if (this.moving || !this.player) return;
    const worldPoint = pointer.positionToCamera(this.cameras.main);
    const selectedActor = this.actors.find((actor) => {
      const point = tileCenter(actor.tile);
      const top = actor.kind === "person" ? point.y - 76 : point.y - 46;
      return Math.abs(worldPoint.x - point.x) <= 29 && worldPoint.y >= top && worldPoint.y <= point.y + 17;
    });

    if (selectedActor) {
      this.approachActor(selectedActor);
      return;
    }

    const relativeX = (worldPoint.x - ORIGIN_X) / (TILE_WIDTH / 2);
    const relativeY = (worldPoint.y - ORIGIN_Y) / (TILE_HEIGHT / 2);
    const target = {
      x: Math.round((relativeX + relativeY) / 2),
      y: Math.round((relativeY - relativeX) / 2),
    };
    const center = tileCenter(target);
    const localX = Math.abs(worldPoint.x - center.x) / (TILE_WIDTH / 2);
    const localY = Math.abs(worldPoint.y - center.y) / (TILE_HEIGHT / 2);
    if (!inside(target) || localX + localY > 1.1 || !walkable(target)) return;
    const path = findPath(this.playerTile, target);
    if (path) this.walkPath(path);
  }

  private handleKeyboard(event: KeyboardEvent): void {
    if (this.moving || !this.player) return;
    const key = event.key.toLowerCase();
    const direction = key === "arrowup" || key === "w" ? DIRECTIONS[0]
      : key === "arrowright" || key === "d" ? DIRECTIONS[1]
        : key === "arrowdown" || key === "s" ? DIRECTIONS[2]
          : key === "arrowleft" || key === "a" ? DIRECTIONS[3] : undefined;
    if (!direction) return;
    const next = { x: this.playerTile.x + direction.x, y: this.playerTile.y + direction.y };
    const path = findPath(this.playerTile, next);
    if (path) this.walkPath(path);
  }

  private approachActor(actor: WorldActor): void {
    this.pendingInteraction = actor.id;
    const path = nearestApproach(this.playerTile, actor.tile);
    if (!path) {
      this.pendingInteraction = null;
      return;
    }
    if (path.length === 1) {
      this.pendingInteraction = null;
      this.onInteract(actor.id);
      return;
    }
    this.walkPath(path);
  }

  private walkPath(path: Position[]): void {
    if (path.length <= 1 || this.moving) return;
    this.moving = true;
    const texture = PLAYER_TEXTURES[this.originId];
    const steps = path.slice(1);
    const nextStep = (): void => {
      const next = steps.shift();
      if (!next || !this.player) {
        this.moving = false;
        playIdle(this.player, texture, this.playerDirection);
        this.finishPendingInteraction();
        return;
      }
      const previous = this.playerTile;
      const direction: IsoDirection = next.y < previous.y ? 0 : next.x > previous.x ? 1 : next.y > previous.y ? 2 : 3;
      this.playerDirection = direction;
      playWalk(this.player, texture, direction);
      const point = tileCenter(next);
      this.playerTile = next;
      this.drawPlayerMarker();
      this.tweens.add({
        targets: this.player,
        x: point.x,
        y: point.y,
        duration: 190,
        ease: "Sine.easeInOut",
        onUpdate: () => this.player.setDepth(this.player.y + 120),
        onComplete: () => nextStep(),
      });
    };
    nextStep();
  }

  private finishPendingInteraction(): void {
    this.moving = false;
    if (!this.pendingInteraction) return;
    const id = this.pendingInteraction;
    this.pendingInteraction = null;
    this.onInteract(id);
  }
}
