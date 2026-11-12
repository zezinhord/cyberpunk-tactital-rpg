import Phaser from "phaser";
import {
  ACTOR_TILES, BUILDINGS, GRID_HEIGHT, GRID_WIDTH, PLAYER_START, PROPS, ROAMING_NPCS, isIndustrialSector,
  isInside, isStreet, isWalkable, type BuildingSpec,
} from "./layout";
import type { Position } from "../types";
import { route as safeRoute, approachRoute, canTraverse, canStand } from "./navigation";
import { CitizenRoutine } from "./npc-routines";
import { audioDirector } from "../../audio/director";
import type { OriginId } from "../character/origins";
import type { TestAppearance } from "../test-arena/appearance";
import {
  createCharacterAnimations,
  NPC_TEXTURES,
  ActorAnimationController,
  getPlayerTexture,
  frameForDirection,
  playIdle,
  playWalk,
  preloadCharacterSprites,
  type IsoDirection,
} from "./sprites";

export const BAIXADA_WIDTH = 1660;
export const BAIXADA_HEIGHT = 970;
export const BAIXADA_VIEW_WIDTH = 960;
export const BAIXADA_VIEW_HEIGHT = 540;

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
  routine?: CitizenRoutine;
  busy?: boolean;
}

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

function inside(tile: Position): boolean { return isInside(tile); }
function walkable(tile: Position): boolean { return isWalkable(tile); }

export class BaixadaScene extends Phaser.Scene {
  private readonly onInteract: (id: string) => void;
  private readonly onPositionChange?: (tile: Position) => void;
  private readonly originId: OriginId;
  private appearance: TestAppearance;
  private playerAnimator?: ActorAnimationController;
  private ground!: Phaser.GameObjects.Graphics;
  private details!: Phaser.GameObjects.Graphics;
  private markers!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private playerDirection: IsoDirection = 2;
  private playerTile: Position = { ...PLAYER_START };
  private actors: WorldActor[] = [];
  private moving = false;
  private pendingInteraction: string | null = null;

  private dynamicOccupancy(except?: string, includePlayer = false): Set<string> {
    const occupied = new Set<string>();
    for (const actor of this.actors) {
      if (actor.routine && actor.id !== except) occupied.add(actor.tile.x + "," + actor.tile.y);
    }
    if (includePlayer) occupied.add(this.playerTile.x + "," + this.playerTile.y);
    return occupied;
  }
  private findWorldPath(start: Position, target: Position): Position[] | null {
    return safeRoute(start, target, { occupied: this.dynamicOccupancy() });
  }
  private findApproachPath(start: Position, target: Position): Position[] | null {
    return approachRoute(start, target, { occupied: this.dynamicOccupancy() });
  }
  private tickCitizens(): void {
    for(const actor of this.actors) {
      if(!actor.routine || !actor.visual || actor.busy) continue;
      const occupied=this.dynamicOccupancy(actor.id,true);
      const previous={...actor.tile};
      const next=actor.routine.tick(previous,occupied);
      if(!next.moved || !canTraverse(previous,next.tile,{occupied})) continue;
      const direction: IsoDirection = next.tile.y < previous.y ? 0
        : next.tile.x > previous.x ? 1 : next.tile.y > previous.y ? 2 : 3;
      actor.tile={...next.tile};
      actor.busy=true;
      playWalk(actor.visual,actor.texture!,direction);
      const dest=tileCenter(next.tile);
      this.tweens.add({targets:actor.visual,x:dest.x,y:dest.y,duration:440,ease:"Sine.easeInOut",
        onUpdate:()=>{
          actor.visual!.setDepth(actor.visual!.y+0.2);
          actor.label?.setPosition(actor.visual!.x,actor.visual!.y-73);
          actor.label?.setDepth(actor.visual!.y+0.42);
        },
        onComplete:()=>{actor.busy=false;playIdle(actor.visual!,actor.texture!,direction);this.drawPlayerMarker();this.updateActorLabels();}
      });
    }
  }


  constructor(onInteract: (id: string) => void, originId: OriginId, appearance: TestAppearance,
    startTile?: Position, onPositionChange?: (tile: Position) => void) {
    super({ key: "BaixadaScene" });
    this.onInteract = onInteract;
    this.originId = originId;
    this.appearance = appearance;
    if(startTile && canStand(startTile))this.playerTile={...startTile};
    this.onPositionChange=onPositionChange;
  }

  setAppearance(appearance: TestAppearance): void {
    if (this.appearance === appearance) return;
    this.appearance = appearance;
    this.playerAnimator?.setTexture(getPlayerTexture(this.originId, appearance));
  }

  preload(): void {
    this.load.svg("baixada-market-stall", "/assets/baixada/market-stall.svg");
    this.load.svg("baixada-palm-tree", "/assets/baixada/palm-tree.svg");
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
    this.updateActorLabels();
    this.time.addEvent({delay:1450,loop:true,callback:()=>this.tickCitizens()});
    const camera = this.cameras.main;
    camera.setBounds(0, 0, BAIXADA_WIDTH, BAIXADA_HEIGHT);
    this.updateCameraForViewport();
    this.scale.on("resize", this.updateCameraForViewport, this);
    const start = tileCenter(this.playerTile);
    camera.centerOn(start.x, start.y - 34);
    camera.startFollow(this.player, true, 0.12, 0.12);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handleTap, this);
    this.input.keyboard?.on("keydown", this.handleKeyboard, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.handleTap, this);
      this.input.keyboard?.off("keydown", this.handleKeyboard, this);
      this.playerAnimator?.dispose();
      this.scale.off("resize", this.updateCameraForViewport, this);
    });
  }

  private updateCameraForViewport(): void {
    // A mesma composição 2:1 deve permanecer legível de 16:9 a telas ultrawide.
    // Zoom uniforme: nunca distorcer a geometria isométrica ou esticar sprites.
    const zoom = Phaser.Math.Clamp(
      Math.min(this.scale.width / BAIXADA_VIEW_WIDTH, this.scale.height / 500),
      0.9, 1.5,
    );
    this.cameras.main.setZoom(zoom);
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
    // Horizonte industrial distante: pano de fundo, jamais collider.
    graphics.fillStyle(0x26363a, 0.46);
    for(let n=0;n<14;n+=1) {
      const x=730+n*65;
      const height=40+(n*17%53);
      graphics.fillRect(x, 104-height, 37+(n%3)*7, height);
    }
    graphics.lineStyle(2,0x6e6654,0.3);
    graphics.beginPath();graphics.moveTo(780,68);graphics.lineTo(1640,68);graphics.strokePath();
    graphics.fillStyle(0x8a4e42, 0.12);
    graphics.fillEllipse(590, 360, 430, 210);

    // Continuidade urbana visual, além do limite físico jogável.
    // Não amplia o espaço navegável nem cria falsos acessos.
    for(let y=-11;y<GRID_HEIGHT+13;y+=1){
      for(let x=-11;x<GRID_WIDTH+13;x+=1){
        if(isInside({x,y}))continue;
        const point=tileCenter({x,y});
        if(point.x < -38||point.x>BAIXADA_WIDTH+38||
           point.y < -38||point.y>BAIXADA_HEIGHT+38)continue;
        const industrial=isIndustrialSector({x,y});
        const tone=(x*11+y*17)%5;
        const palette=industrial
          ? [0x303b3c,0x34413f,0x35413f,0x303c3b,0x333e3e]
          : [0x34443e,0x314039,0x38453d,0x35413a,0x37473e];
        this.polygon(graphics,this.diamond(point.x,point.y),
          palette[(tone+5)%5] ?? 0x303b3c,1,0x73867b,0.08,0.8);
        if((x*3+y*7)%17===0){
          graphics.lineStyle(1,0xc09f73,0.16);graphics.beginPath();
          graphics.moveTo(point.x-9,point.y+1);graphics.lineTo(point.x+7,point.y+1);graphics.strokePath();
        }
      }
    }

    for (let depth = 0; depth <= GRID_WIDTH + GRID_HEIGHT - 2; depth += 1) {
      for (let y = 0; y < GRID_HEIGHT; y += 1) {
        for (let x = 0; x < GRID_WIDTH; x += 1) {
          if (x + y !== depth) continue;
          const center = tileCenter({ x, y });
          const street = isStreet({ x, y });
          const variation = (x * 7 + y * 11) % 5;
          const industrial = isIndustrialSector({x,y});
          const color = industrial
            ? street ? [0x393e40,0x394044,0x3f4242,0x363e41,0x414849][variation] ?? 0x393e40
              : [0x514d44,0x555247,0x4c4d48,0x54504a,0x524e46][variation] ?? 0x514d44
            : street ? [0x424846, 0x3d4747, 0x404b48, 0x424846, 0x3e4747][variation] ?? 0x424846
              : [0x475046, 0x424c45, 0x4a4e43, 0x485046, 0x435048][variation] ?? 0x475046;
          this.polygon(graphics, this.diamond(center.x, center.y), color, 1, 0x52615a, 0.28, 0.8);

          if (street && (x + y) % 6 === 0) {
            graphics.lineStyle(1, 0xe3c17e, 0.27);
            graphics.beginPath();
            graphics.moveTo(center.x - 8, center.y + 1);
            graphics.lineTo(center.x + 8, center.y + 1);
            graphics.strokePath();
          }
          if (!street && walkable({ x, y }) && variation === 2) this.drawGroundDetail(center.x, center.y, x, y);
        }
      }
    }

    this.drawRoadDrainage();
    // Edificações são objetos de mundo separados: ordenação por pé/profundidade real.
    this.drawBuildings();
    for (const point of PROPS.marketStalls) this.drawMarketStall(point.x, point.y);
    for (const point of PROPS.palms) this.drawPalm(point.x, point.y);
    for (const point of PROPS.lamps) this.drawLamp(point.x, point.y);
    this.drawStreetProps();
  }

  private bakeStaticLayers(): void {
    const layers = [
      { graphics: this.ground, texture: "baixada-ground-v067a", depth: -20 },
      { graphics: this.details, texture: "baixada-details-v067a", depth: -10 },
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
    for (let x = 2; x < GRID_WIDTH - 1; x += 1) {
      const point = tileCenter({ x, y: 6 });
      graphics.beginPath();
      graphics.moveTo(point.x - 11, point.y + 4);
      graphics.lineTo(point.x + 10, point.y + 4);
      graphics.strokePath();
    }
    // Rede de águas pluviais do Pátio: continuidade com o ramal antigo.
    for(let x=20;x<GRID_WIDTH;x+=1){
      const p=tileCenter({x,y:12});
      graphics.lineStyle(2,0x857153,0.45);graphics.beginPath();
      graphics.moveTo(p.x-11,p.y+4);graphics.lineTo(p.x+11,p.y+4);graphics.strokePath();
    }
    graphics.fillStyle(0x66c9c1, 0.25);
    graphics.fillEllipse(490, 255, 35, 7);
    graphics.fillEllipse(326, 302, 25, 5);
  }

  private drawBuildings(): void {
    const ordered = [...BUILDINGS].sort((a, b) => (a.x + a.y) - (b.x + b.y));
    for (const building of ordered) {
      const graphics = this.add.graphics();
      this.drawBuilding(graphics, building);
      // O ponto frontal do edifício representa sua base para o algoritmo do pintor.
      const front = tileCenter({ x: building.x + building.width, y: building.y + building.depth });
      graphics.setDepth(front.y + 0.05);
    }
  }

  private drawBuilding(g: Phaser.GameObjects.Graphics, building: BuildingSpec): void {
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
        // A baseY já é a linha do TELHADO (y-h). As janelas descem pela
        // fachada até o chão, não sobem para fora do edifício.
        const windowY = baseY + Math.min(h - 22, 20 + row * Math.max(22, (h - 36) / 2));
        g.fillStyle(0x101f29, 1);
        g.fillRoundedRect(baseX - 6, windowY - 5, 12, 14, 2);
        g.fillStyle(building.accent, 0.68);
        g.fillRect(baseX - 4, windowY - 3, 8, 2);
        g.fillStyle(0x81ddd3, 0.22);
        g.fillRect(baseX - 4, windowY + 1, 8, 6);
      }
    }

    // Acabamentos locais, sem adicionar objetos avulsos ao eixo de circulação.
    if (building.style === "housing" || building.style === "canal") {
      // Cobogós e reboco irregular: elementos integrados à fachada.
      const cobogoY = Phaser.Math.Linear(bt.y, ct.y, 0.25) + 16;
      const cobogoX = Phaser.Math.Linear(bt.x, ct.x, 0.25);
      for (let row = 0; row < 2; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          const px = cobogoX + col * 8;
          const py = cobogoY + row * 9 + col * 4;
          g.fillStyle(0x1a282b, 0.9);
          g.fillRect(px, py, 5, 5);
          g.lineStyle(1, 0xbba88d, 0.5);
          g.strokeRect(px, py, 5, 5);
        }
      }
    }
    if (building.style === "clinic") {
      // Faixa de azulejos/vidro: clínica mantida pela comunidade.
      const left = Phaser.Math.Linear(bt.x, ct.x, 0.1);
      const right = Phaser.Math.Linear(bt.x, ct.x, 0.9);
      const yy = Phaser.Math.Linear(bt.y, ct.y, 0.5) + 20;
      g.lineStyle(4, 0x9fb2a9, 0.65);
      g.beginPath();
      g.moveTo(left, yy);
      g.lineTo(right, yy + 18);
      g.strokePath();
    }
    if (building.style === "workshop") {
      const shutterX = Phaser.Math.Linear(d.x, c.x, 0.74);
      const shutterY = Phaser.Math.Linear(d.y, c.y, 0.74) - 24;
      g.fillStyle(0x463e36, 0.88);
      g.fillRoundedRect(shutterX - 14, shutterY - 4, 28, 23, 2);
      for (let i = 0; i < 4; i += 1) {
        g.lineStyle(2, 0xa68c69, 0.65);
        g.beginPath();
        g.moveTo(shutterX - 12, shutterY + i * 5);
        g.lineTo(shutterX + 12, shutterY + i * 5);
        g.strokePath();
      }
    }
    if (building.style === "canal") {
      g.lineStyle(3, 0x41565b, 0.9);
      g.beginPath();
      g.moveTo(d.x + 15, d.y - 9);
      g.lineTo(d.x + 15, d.y - 54);
      g.lineTo(d.x + 33, d.y - 54);
      g.strokePath();
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

    // Tratamento material: menos ruído de tecnologia; volumes reconhecíveis.
    if (building.style === "housing" || building.style === "canal") {
      const upper = Phaser.Math.Linear(d.y, c.y, 0.32);
      g.lineStyle(2, 0xc7ab83, 0.55);
      g.beginPath();
      g.moveTo(d.x + 7, upper - 35);
      g.lineTo(c.x - 7, upper - 35);
      g.strokePath();
      for (let index = 0; index < 3; index += 1) {
        const x = d.x + 12 + index * 13;
        const y = upper - 33 + index * 2;
        g.fillStyle(index === 1 ? 0x947665 : 0xb0aa89, 0.9);
        g.fillRect(x, y, 11, 9);
      }
    }
    if (building.style === "market" || building.style === "workshop" || building.style === "depot") {
      const shade = building.style === "market" ? 0xa16e50 : 0xb28b58;
      const awningX = Phaser.Math.Linear(d.x, c.x, 0.55);
      const awningY = Phaser.Math.Linear(d.y, c.y, 0.55) - 31;
      this.polygon(g, [
        { x: awningX - 30, y: awningY }, { x: awningX + 30, y: awningY },
        { x: awningX + 35, y: awningY + 14 }, { x: awningX - 36, y: awningY + 14 },
      ], shade, 1, 0x252521, 0.8, 1.5);
      g.lineStyle(2, 0xd9bb83, 0.7);
      g.beginPath();
      g.moveTo(awningX - 27, awningY + 2);
      g.lineTo(awningX + 24, awningY + 2);
      g.strokePath();
    }

    // Volume único por cobertura, e não antena e caixa repetidas em todos os telhados.
    const roofCenter = { x: (at.x + bt.x + ct.x + dt.x) / 4, y: (at.y + bt.y + ct.y + dt.y) / 4 };
    if (building.style === "factory") {
      g.fillStyle(0x2e3438,1);
      g.fillRect(roofCenter.x-21,roofCenter.y-20,11,26);
      g.fillRect(roofCenter.x+13,roofCenter.y-33,10,39);
      g.fillStyle(0xbc9270,0.65);
      g.fillRect(roofCenter.x-22,roofCenter.y-19,13,3);
    }
    if (building.style === "utility" || building.style === "canal") {
      g.fillStyle(0x334449, 1);
      g.fillRoundedRect(roofCenter.x - 13, roofCenter.y - 15, 26, 21, 5);
      g.fillStyle(0x9caba4, 0.55);
      g.fillEllipse(roofCenter.x, roofCenter.y - 15, 26, 7);
      g.lineStyle(2, 0x162830, 0.85);
      g.strokeRoundedRect(roofCenter.x - 13, roofCenter.y - 15, 26, 21, 5);
    } else if (building.style === "clinic") {
      g.fillStyle(0x253944, 1);
      g.fillRoundedRect(roofCenter.x - 18, roofCenter.y - 5, 36, 12, 2);
      g.lineStyle(2, 0x7ca2a2, 0.6);
      g.strokeRoundedRect(roofCenter.x - 18, roofCenter.y - 5, 36, 12, 2);
    }

    if (building.sign) {
      const signX = (d.x + c.x) / 2;
      const signY = (d.y + c.y) / 2 - h + 15;
      g.fillStyle(0x101b22, 0.98);
      g.fillRoundedRect(signX - 39, signY - 7, 78, 17, 3);
      g.lineStyle(1, building.accent, 0.9);
      g.strokeRoundedRect(signX - 39, signY - 7, 78, 17, 3);
      this.add.text(signX, signY + 1, building.sign, {
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: "12px",
        color: "#e6f4e8",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(tileCenter({ x: building.x + building.width, y: building.y + building.depth }).y + 0.1);
    }


  }

  private drawMarketStall(x: number, y: number): void {
    const point = tileCenter({ x, y });
    this.add.image(point.x, point.y + 4, "baixada-market-stall")
      .setOrigin(0.5, 0.95)
      .setScale(0.40)
      .setDepth(point.y + 0.12);

  }

  private drawPalm(x: number, y: number): void {
    const base = tileCenter({ x, y });
    this.add.image(base.x, base.y + 1, "baixada-palm-tree")
      .setOrigin(0.5, 0.98)
      .setScale(0.46)
      .setDepth(base.y + 0.12);
  }

  private drawLamp(x: number, y: number): void {
    const base = tileCenter({ x, y });
    const g = this.add.graphics().setDepth(base.y + 0.11);
    g.fillStyle(0x10181c, 0.55);
    g.fillEllipse(base.x, base.y + 2, 24, 7);
    g.lineStyle(4, 0x27373c, 1);
    g.beginPath();
    g.moveTo(base.x, base.y);
    g.lineTo(base.x + 3, base.y - 69);
    g.lineTo(base.x + 18, base.y - 74);
    g.strokePath();
    g.lineStyle(3, 0xc99c72, 0.85);
    g.beginPath();
    g.moveTo(base.x + 8, base.y - 70);
    g.lineTo(base.x + 18, base.y - 74);
    g.strokePath();
    g.fillStyle(0xd59c65, 0.24);
    g.fillCircle(base.x + 19, base.y - 74, 13);
    g.fillStyle(0xffdc9a, 1);
    g.fillRoundedRect(base.x + 13, base.y - 79, 11, 5, 2);
  }

  private drawStreetProps(): void {
    // Props são objetos independentes do piso: depth e colisão compartilham PROPS.
    for (const tile of PROPS.bins) {
      const point = tileCenter(tile);
      const g = this.add.graphics().setDepth(point.y + 0.12);
      g.fillStyle(0x19282b, 1);
      g.fillRoundedRect(point.x - 8, point.y - 16, 16, 17, 3);
      g.fillStyle(0x9a9880, 0.8);
      g.fillRect(point.x - 7, point.y - 16, 14, 3);
      g.lineStyle(1.2, 0x0d171b, 0.8);
      g.strokeRoundedRect(point.x - 8, point.y - 16, 16, 17, 3);
    }
    for (const tile of PROPS.crates) {
      const point = tileCenter(tile);
      const g = this.add.graphics().setDepth(point.y + 0.12);
      g.fillStyle(0x96734c, 1);
      g.fillRoundedRect(point.x - 9, point.y - 12, 18, 12, 2);
      g.lineStyle(1, 0x3b3125, 0.9);
      g.strokeRect(point.x - 7, point.y - 10, 14, 9);
      g.lineStyle(2, 0xc39c67, 0.6);
      g.beginPath();
      g.moveTo(point.x - 7, point.y - 10);
      g.lineTo(point.x + 7, point.y - 1);
      g.strokePath();
    }
  }

  private createActors(): void {
    this.actors = [
      { id: "vendedor", name: "Nilo", kind: "person", tile: ACTOR_TILES.vendedor, texture: NPC_TEXTURES.nilo, role: "MECÂNICO / VENDEDOR" },
      { id: "moradora", name: "Joana", kind: "person", tile: ACTOR_TILES.moradora, texture: NPC_TEXTURES.joana, role: "MORADORA DA BAIXADA" },
      { id: "saira", name: "Saira", kind: "person", tile: ACTOR_TILES.saira, texture: NPC_TEXTURES.saira, role: "VENDEDORA DO MERCADO" },
      { id: "enter-clinic", name: "Entrar na clínica", kind: "door", tile: ACTOR_TILES["enter-clinic"], role: "INTERIOR" },
      { id: "enter-workshop", name: "Entrar na oficina", kind: "door", tile: ACTOR_TILES["enter-workshop"], role: "INTERIOR" },
      { id: "enter-canal-gallery", name: "Descer para a galeria", kind: "door", tile: ACTOR_TILES["enter-canal-gallery"], role: "ACESSO TÉCNICO" },
      { id: "terminal-canal", name: "Terminal do Canal", kind: "terminal", tile: ACTOR_TILES["terminal-canal"], role: "SERVIÇOS DO DISTRITO" },
      { id: "patio-console", name: "Console V-09", kind: "terminal", tile: ACTOR_TILES["patio-console"], role: "PÁTIO DO REÚSO" },
      { id: "patio-sentinel", name: "Sentinela V-09", kind: "person", tile: ACTOR_TILES["patio-sentinel"], texture: NPC_TEXTURES.teo, role: "UNIDADE DE VIGILÂNCIA" },
      ...ROAMING_NPCS.map((spec,index)=>({
        id:spec.id,name:spec.name,kind:"person" as const,tile:{...spec.route[0]},
        texture:[NPC_TEXTURES.joana,NPC_TEXTURES.teo,NPC_TEXTURES.saira][index],
        role:spec.role,routine:new CitizenRoutine(spec),
      })),
    ];

    for (const actor of this.actors) {
      const point = tileCenter(actor.tile);
      if (actor.kind === "person" && actor.texture) {
        actor.visual = this.add.sprite(point.x, point.y, actor.texture, 12)
          .setOrigin(0.5, 0.95).setScale(0.86).setDepth(point.y + 0.2);
        playIdle(actor.visual, actor.texture, 2);
        if(actor.id === "patio-sentinel") actor.visual.setTint(0xff648f);
        if(!actor.routine) this.tweens.add({ targets: actor.visual, y: point.y - 1.5, duration: 1500 + (actor.tile.x % 3) * 170, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        actor.label = this.add.text(point.x, point.y - 73, actor.name, {
          fontFamily: "IBM Plex Mono, monospace", fontSize: "13px", color: "#eef7ec", backgroundColor: "#111b20dd", padding: { x: 4, y: 2 },
        }).setOrigin(0.5).setDepth(point.y + 0.42);
      } else if (actor.kind === "terminal") {
        this.drawTerminal(point.x, point.y);
        actor.label = this.add.text(point.x, point.y - 47, "TERMINAL", {
          fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "#ffe3a0", backgroundColor: "#2b2417dd", padding: { x: 4, y: 2 },
        }).setOrigin(0.5).setDepth(point.y + 0.42);
      } else {
        const accent = 0xffb300; // Portas neutras e interativas sempre em âmbar.
        this.drawDoor(point.x, point.y, accent);
        const doorLabel = actor.id === "enter-clinic" ? "CLÍNICA · ENTRAR" : actor.id === "enter-canal-gallery" ? "GALERIA · DESCER" : "OFICINA · ENTRAR";
        actor.label = this.add.text(point.x, point.y - 48, doorLabel, {
          fontFamily: "IBM Plex Mono, monospace", fontSize: "12px", color: "#ffe0a8", backgroundColor: "#151c1ddd", padding: { x: 4, y: 2 },
        }).setOrigin(0.5).setDepth(point.y + 0.42);
      }
      actor.label?.setVisible(false);
    }
  }

  private drawDoor(cx: number, cy: number, accent: number): void {
    const g = this.add.graphics().setDepth(cy + 0.12);
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
    const g = this.add.graphics().setDepth(cy + 0.12);
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
    this.playerShadow = this.add.ellipse(point.x, point.y + 2, 22, 7, 0x071015, 0.22)
      .setDepth(point.y - 0.04);
    const texture = getPlayerTexture(this.originId, this.appearance);
    this.player = this.add.sprite(point.x, point.y, texture, frameForDirection(texture, this.playerDirection))
      .setOrigin(0.5, 0.95).setScale(0.94).setDepth(point.y + 0.32);
    this.playerAnimator = new ActorAnimationController(this.player, texture, this.playerDirection);
    this.drawPlayerMarker();
  }

  private updateActorLabels(): void {
    for (const actor of this.actors) {
      const distance = Math.abs(actor.tile.x - this.playerTile.x) + Math.abs(actor.tile.y - this.playerTile.y);
      actor.label?.setVisible(distance <= 2);
    }
  }

  private drawPlayerMarker(): void {
    this.markers.clear();
    const playerPoint = tileCenter(this.playerTile);
    this.polygon(this.markers, this.diamond(playerPoint.x, playerPoint.y + 1, 38, 19), 0x00e5ff, 0.1, 0x00e5ff, 0.55, 1.5);
    for (const actor of this.actors) {
      const distance = Math.abs(actor.tile.x - this.playerTile.x) + Math.abs(actor.tile.y - this.playerTile.y);
      if (distance > 3) continue;
      const point = tileCenter(actor.tile);
      this.polygon(
        this.markers,
        this.diamond(point.x, point.y + 1, actor.kind === "terminal" ? 34 : actor.kind === "door" ? 36 : 30, actor.kind === "terminal" ? 17 : actor.kind === "door" ? 18 : 15),
        0xffd166,
        0.05,
        0xffd166,
        0.6,
        1.2,
      );
    }
  }

  private handleTap(pointer: Phaser.Input.Pointer): void {
    if (this.moving || !this.player) return;
    const worldPoint = pointer.positionToCamera(this.cameras.main) as { x: number; y: number };
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
    if (!inside(target) || localX + localY > 1.1 || !canStand(target,{occupied:this.dynamicOccupancy()})) return;
    const path = this.findWorldPath(this.playerTile, target);
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
    const path = this.findWorldPath(this.playerTile, next);
    if (path) this.walkPath(path);
  }

  private approachActor(actor: WorldActor): void {
    this.pendingInteraction = actor.id;
    actor.routine?.interact();
    const path = this.findApproachPath(this.playerTile, actor.tile);
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
    const steps = path.slice(1);
    const nextStep = (): void => {
      const next = steps.shift();
      if (!next || !this.player) {
        this.moving = false;
        this.playerAnimator?.play("idle");
        this.finishPendingInteraction();
        return;
      }
      const previous = this.playerTile;
      // Proteção física no momento da movimentação: nenhuma interpolação
      // executa um passo que atravessaria um edifício, pessoa ou obstáculo.
      if (!canTraverse(previous, next,{occupied:this.dynamicOccupancy()})) {
        steps.length = 0;
        this.pendingInteraction = null;
        this.moving = false;
        this.playerAnimator?.play("idle");
        return;
      }
      const direction: IsoDirection = next.y < previous.y ? 0 : next.x > previous.x ? 1 : next.y > previous.y ? 2 : 3;
      this.playerDirection = direction;
      this.playerAnimator?.setDirection(direction);
      this.playerAnimator?.play("walk");
      const point = tileCenter(next);
      this.playerTile = next;
      this.tweens.add({
        targets: this.playerShadow,
        x: point.x,
        y: point.y + 2,
        duration: 190,
        ease: "Sine.easeInOut",
        onUpdate: () => this.playerShadow.setDepth(this.playerShadow.y - 2.04),
      });
      this.tweens.add({
        targets: this.player,
        x: point.x,
        y: point.y,
        duration: 190,
        ease: "Sine.easeInOut",
        onUpdate: () => this.player.setDepth(this.player.y + 0.32),
        onComplete: () => {
          this.drawPlayerMarker();
          this.updateActorLabels();
          audioDirector.effect("step");
          this.onPositionChange?.({...this.playerTile});
          nextStep();
        },
      });
    };
    nextStep();
  }

  private finishPendingInteraction(): void {
    this.moving = false;
    if (!this.pendingInteraction) return;
    const id = this.pendingInteraction;
    this.pendingInteraction = null;
    const actor=this.actors.find((a)=>a.id===id);
    if (actor && Math.abs(actor.tile.x-this.playerTile.x)+Math.abs(actor.tile.y-this.playerTile.y)>1) return;
    this.onInteract(id);
  }
}
