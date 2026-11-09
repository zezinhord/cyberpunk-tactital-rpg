import type { CharacterSave, PlayerCharacter } from "./types";
import { isOriginId } from "./origins";

export const CHARACTER_SAVE_KEY = "cyberpunk-tactical-rpg.character.v1";

function isPlayerCharacter(value: unknown): value is PlayerCharacter {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string"
    && typeof candidate.name === "string"
    && candidate.name.trim().length > 0
    && isOriginId(candidate.originId)
    && typeof candidate.level === "number"
    && typeof candidate.experience === "number"
    && typeof candidate.introductionCompleted === "boolean";
}

export function loadCharacter(): PlayerCharacter | null {
  try {
    const raw = globalThis.localStorage?.getItem(CHARACTER_SAVE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const save = parsed as Partial<CharacterSave>;
    return save.version === 1 && isPlayerCharacter(save.character) ? save.character : null;
  } catch {
    return null;
  }
}

export function saveCharacter(character: PlayerCharacter): boolean {
  try {
    if (typeof globalThis.localStorage === "undefined") return false;
    const save: CharacterSave = { version: 1, character: { ...character, updatedAt: new Date().toISOString() } };
    globalThis.localStorage?.setItem(CHARACTER_SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function deleteCharacterSave(): void {
  try { globalThis.localStorage?.removeItem(CHARACTER_SAVE_KEY); } catch { /* armazenamento indisponível */ }
}

export function createPlayerCharacter(name: string, originId: PlayerCharacter["originId"]): PlayerCharacter {
  const now = new Date().toISOString();
  const randomId = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `character-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  return {
    id: randomId,
    name: name.trim(),
    originId,
    classId: null,
    attributes: {},
    skills: [],
    abilities: [],
    equipment: [],
    level: 1,
    experience: 0,
    createdAt: now,
    updatedAt: now,
    introductionCompleted: false,
  };
}
