import Phaser from "phaser";
import corporateM from "../../assets/characters/player-corporativo-masculine.png";
import corporateF from "../../assets/characters/player-corporativo-feminine.png";
import baixadaM from "../../assets/characters/player-baixada-masculine.png";
import baixadaF from "../../assets/characters/player-baixada-feminine.png";
import gangueM from "../../assets/characters/player-gangue-masculine.png";
import gangueF from "../../assets/characters/player-gangue-feminine.png";
import militarM from "../../assets/characters/player-militar-masculine.png";
import militarF from "../../assets/characters/player-militar-feminine.png";
import pesquisadorM from "../../assets/characters/player-pesquisador-masculine.png";
import pesquisadorF from "../../assets/characters/player-pesquisador-feminine.png";
import nomadeM from "../../assets/characters/player-nomade-masculine.png";
import nomadeF from "../../assets/characters/player-nomade-feminine.png";
import amara from "../../assets/characters/npc-amara.png";
import nilo from "../../assets/characters/npc-nilo.png";
import joana from "../../assets/characters/npc-joana.png";
import saira from "../../assets/characters/npc-saira.png";
import teo from "../../assets/characters/npc-teo.png";
import type { OriginId } from "../character/origins";
import type { TestAppearance } from "../test-arena/appearance";

export const SPRITE_FRAME_WIDTH = 64;
export const SPRITE_FRAME_HEIGHT = 80;
export const PLAYER_COLUMNS = 12;
const NPC_COLUMNS = 4;

/** Todas as seis origens possuem os dois recursos visuais, sem modificadores de regras. */
export const PLAYER_SPRITES: Record<OriginId, Record<TestAppearance, string>> = {
  corporativo: { masculine: corporateM, feminine: corporateF },
  baixada: { masculine: baixadaM, feminine: baixadaF },
  gangue: { masculine: gangueM, feminine: gangueF },
  militar: { masculine: militarM, feminine: militarF },
  pesquisador: { masculine: pesquisadorM, feminine: pesquisadorF },
  nomade: { masculine: nomadeM, feminine: nomadeF },
};
export function getPlayerTexture(origin: OriginId, appearance: TestAppearance): string {
  return `player-${origin}-${appearance}`;
}
export function getPlayerSpriteUrl(origin: OriginId, appearance: TestAppearance): string {
  return PLAYER_SPRITES[origin][appearance];
}
export const NPC_TEXTURES = {
  amara: "npc-amara", nilo: "npc-nilo", joana: "npc-joana",
  saira: "npc-saira", teo: "npc-teo",
} as const;

const SPRITES: Record<string, { url: string; columns: number }> = {};
for (const [origin, presentations] of Object.entries(PLAYER_SPRITES)) {
  for (const [appearance, url] of Object.entries(presentations)) {
    SPRITES[`player-${origin}-${appearance}`] = { url, columns: PLAYER_COLUMNS };
  }
}
for (const [key, url] of Object.entries({ [NPC_TEXTURES.amara]: amara,
  [NPC_TEXTURES.nilo]: nilo,[NPC_TEXTURES.joana]: joana,
  [NPC_TEXTURES.saira]: saira,[NPC_TEXTURES.teo]: teo })) {
  SPRITES[key] = { url, columns: NPC_COLUMNS };
}

export type IsoDirection = 0 | 1 | 2 | 3;
export type SpriteState = "idle" | "walk" | "attack" | "ability" | "hurt" | "down";
// A grade lógica usa N/E/S/O; a arte usa SE/SW/NW/NE.
const DIRECTION_ROWS: Record<IsoDirection, number> = { 0: 3, 1: 0, 2: 1, 3: 2 };
export function rowForDirection(direction: IsoDirection): number {
  return DIRECTION_ROWS[direction];
}
export function frameForDirection(texture: string, direction: IsoDirection): number {
  return (SPRITES[texture]?.columns ?? NPC_COLUMNS) * rowForDirection(direction);
}

export function preloadCharacterSprites(scene: Phaser.Scene): void {
  for (const [key, spec] of Object.entries(SPRITES)) {
    scene.load.spritesheet(key, spec.url, {
      frameWidth: SPRITE_FRAME_WIDTH, frameHeight: SPRITE_FRAME_HEIGHT,
    });
  }
}

type AnimationSpec = { start: number; end: number; fps: number; loop: boolean };
const CHARACTER_ANIMATIONS: Record<Exclude<SpriteState,"idle">, AnimationSpec> = {
  walk: { start: 0, end: 3, fps: 9, loop: true },
  attack: { start: 4, end: 5, fps: 11, loop: false },
  ability: { start: 6, end: 7, fps: 9, loop: false },
  hurt: { start: 8, end: 9, fps: 10, loop: false },
  down: { start: 10, end: 11, fps: 3, loop: false },
};

export function createCharacterAnimations(scene: Phaser.Scene): void {
  for (const [key, spec] of Object.entries(SPRITES)) {
    const columns = spec.columns;
    for (let row = 0; row < 4; row += 1) {
      const offset = row * columns;
      const idleKey = `${key}-idle-${row}`;
      if (!scene.anims.exists(idleKey)) scene.anims.create({
        key: idleKey,
        frames: [{ key, frame: offset }, { key, frame: offset + 2 }],
        frameRate: 1.5, repeat: -1,
      });
      const available: readonly SpriteState[] = columns === PLAYER_COLUMNS
        ? ["walk", "attack", "ability", "hurt", "down"] : ["walk"];
      for (const state of available) {
        const config = CHARACTER_ANIMATIONS[state as Exclude<SpriteState, "idle">];
        const animationKey = `${key}-${state}-${row}`;
        if (!scene.anims.exists(animationKey)) scene.anims.create({
          key: animationKey,
          frames: scene.anims.generateFrameNumbers(key, {
            start: offset + config.start, end: offset + config.end,
          }),
          frameRate: config.fps, repeat: config.loop ? -1 : 0,
        });
      }
    }
  }
}

export function playIdle(sprite: Phaser.GameObjects.Sprite, texture: string, direction: IsoDirection): void {
  sprite.anims.play(`${texture}-idle-${rowForDirection(direction)}`, true);
}
export function playWalk(sprite: Phaser.GameObjects.Sprite, texture: string, direction: IsoDirection): void {
  sprite.anims.play(`${texture}-walk-${rowForDirection(direction)}`, true);
}

/** Controlador de estado compartilhado por todas as origens e interiores.
 * Estados especiais são concluídos e retornam ao repouso automaticamente.
 */
export class ActorAnimationController {
  private direction: IsoDirection;
  private current: SpriteState = "idle";
  private texture: string;
  private readonly complete: (animation: Phaser.Animations.Animation) => void;

  constructor(private readonly sprite: Phaser.GameObjects.Sprite, texture: string, direction: IsoDirection) {
    this.texture = texture;
    this.direction = direction;
    this.complete = (animation) => {
      const expected = `${this.texture}-${this.current}-${rowForDirection(this.direction)}`;
      if (animation.key === expected && this.current !== "down"
        && this.current !== "walk" && this.current !== "idle") this.play("idle");
    };
    this.sprite.on("animationcomplete", this.complete);
    this.play("idle");
  }
  setDirection(direction: IsoDirection): void {
    if (this.direction === direction) return;
    this.direction = direction;
    this.play(this.current);
  }
  setTexture(texture: string): void {
    if (this.texture === texture) return;
    this.texture = texture;
    this.sprite.anims.stop();
    this.sprite.setTexture(texture, frameForDirection(texture, this.direction));
    this.play(this.current);
  }
  play(state: SpriteState): void {
    const key = `${this.texture}-${state}-${rowForDirection(this.direction)}`;
    if (!this.sprite.scene.anims.exists(key)) {
      if (state !== "idle") this.play("idle");
      return;
    }
    this.current = state;
    this.sprite.anims.play(key, true);
  }
  dispose(): void { this.sprite.off("animationcomplete", this.complete); }
}
