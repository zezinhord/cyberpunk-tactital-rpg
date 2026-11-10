import Phaser from "phaser";
import corporate from "../../assets/characters/player-corporativo.png";
import baixada from "../../assets/characters/player-baixada.png";
import gangue from "../../assets/characters/player-gangue.png";
import militar from "../../assets/characters/player-militar.png";
import pesquisador from "../../assets/characters/player-pesquisador.png";
import nomade from "../../assets/characters/player-nomade.png";
import amara from "../../assets/characters/npc-amara.png";
import nilo from "../../assets/characters/npc-nilo.png";
import joana from "../../assets/characters/npc-joana.png";
import saira from "../../assets/characters/npc-saira.png";
import teo from "../../assets/characters/npc-teo.png";
import type { OriginId } from "../character/origins";

export const SPRITE_FRAME_WIDTH = 64;
export const SPRITE_FRAME_HEIGHT = 80;

export const PLAYER_TEXTURES: Record<OriginId, string> = {
  corporativo: "player-corporativo",
  baixada: "player-baixada",
  gangue: "player-gangue",
  militar: "player-militar",
  pesquisador: "player-pesquisador",
  nomade: "player-nomade",
};

export const NPC_TEXTURES = {
  amara: "npc-amara",
  nilo: "npc-nilo",
  joana: "npc-joana",
  saira: "npc-saira",
  teo: "npc-teo",
} as const;

const SPRITES: Record<string, string> = {
  [PLAYER_TEXTURES.corporativo]: corporate,
  [PLAYER_TEXTURES.baixada]: baixada,
  [PLAYER_TEXTURES.gangue]: gangue,
  [PLAYER_TEXTURES.militar]: militar,
  [PLAYER_TEXTURES.pesquisador]: pesquisador,
  [PLAYER_TEXTURES.nomade]: nomade,
  [NPC_TEXTURES.amara]: amara,
  [NPC_TEXTURES.nilo]: nilo,
  [NPC_TEXTURES.joana]: joana,
  [NPC_TEXTURES.saira]: saira,
  [NPC_TEXTURES.teo]: teo,
};

export type IsoDirection = 0 | 1 | 2 | 3;

// A grade lógica usa norte/leste/sul/oeste; a arte usa SE/SW/NW/NE.
const DIRECTION_ROWS: Record<IsoDirection, number> = { 0: 3, 1: 0, 2: 1, 3: 2 };

export function rowForDirection(direction: IsoDirection): number {
  return DIRECTION_ROWS[direction];
}

export function preloadCharacterSprites(scene: Phaser.Scene): void {
  for (const [key, url] of Object.entries(SPRITES)) {
    scene.load.spritesheet(key, url, {
      frameWidth: SPRITE_FRAME_WIDTH,
      frameHeight: SPRITE_FRAME_HEIGHT,
    });
  }
}

export function createCharacterAnimations(scene: Phaser.Scene): void {
  for (const key of Object.keys(SPRITES)) {
    for (let row = 0; row < 4; row += 1) {
      const start = row * 4;
      const walkKey = `${key}-walk-${row}`;
      const idleKey = `${key}-idle-${row}`;
      if (!scene.anims.exists(walkKey)) {
        scene.anims.create({
          key: walkKey,
          frames: scene.anims.generateFrameNumbers(key, { start, end: start + 3 }),
          frameRate: 9,
          repeat: -1,
        });
      }
      if (!scene.anims.exists(idleKey)) {
        scene.anims.create({
          key: idleKey,
          frames: [{ key, frame: start }, { key, frame: start + 2 }],
          frameRate: 1.5,
          repeat: -1,
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
