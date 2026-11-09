/**
 * Tokens visuais de Nova Arcádia.
 *
 * Fonte única de cores e medidas para o canvas (Phaser). O CSS espelha estes
 * valores em `:root` (src/styles.css): ao mudar um valor aqui, mude-o lá também.
 *
 * Regra de ouro: cores de FUNÇÃO nunca mudam de distrito para distrito, e a cor
 * nunca é o único indicador. Cada função tem também uma forma e um rótulo.
 */

/** Cores de função. O verde é exclusivo do Éden e NÃO significa segurança. */
export const ROLE_COLORS = {
  ally: "#00E5FF",
  hostile: "#FF2E88",
  neutral: "#FFD166",
  eden: "#7DFFB3",
} as const;

export type RoleId = keyof typeof ROLE_COLORS;
export type RoleShape = "circle" | "triangle" | "diamond" | "hexagon";

/** Forma e rótulo de cada função, para não depender só da cor. */
export const ROLE_MARKERS: Readonly<Record<RoleId, { shape: RoleShape; label: string }>> = {
  ally: { shape: "circle", label: "Aliado" },
  hostile: { shape: "triangle", label: "Hostil" },
  neutral: { shape: "diamond", label: "Neutro" },
  eden: { shape: "hexagon", label: "Éden" },
};

/** Base da interface. */
export const UI_COLORS = {
  bg: "#0B0D17",
  panel: "#161A2B",
  sunk: "#0F1322",
  line: "#2A3156",
  text: "#E6F1FF",
  muted: "#8FA3C7",
  edenBg: "#08120D",
} as const;

export interface DistrictPalette {
  name: string;
  /** Fundo e sombras. */
  shadow: string;
  /** Superfícies e painéis. */
  surface: string;
  /** Luz principal do distrito. */
  light: string;
  /** Cor de apoio (letreiros, detalhes). */
  accent: string;
}

/**
 * Paletas por distrito. Só pintam cenário, painéis e emblemas; nunca substituem
 * as cores de função. As chaves coincidem com `startingLocation.districtId`.
 */
export const DISTRICT_PALETTES = {
  aurea: { name: "Áurea", shadow: "#0E1118", surface: "#2E394D", light: "#7FE7FF", accent: "#E8D8A8" },
  baixada: { name: "Baixada", shadow: "#150F14", surface: "#3A2530", light: "#FF8A3D", accent: "#FF2E88" },
  subsolo: { name: "Subsolo", shadow: "#0C1211", surface: "#26332F", light: "#E8D44D", accent: "#FF4D4D" },
  ferrugem: { name: "Ferrugem", shadow: "#120F0D", surface: "#3E2A20", light: "#E0572B", accent: "#FFC233" },
  limite_urbano: { name: "Limite urbano", shadow: "#0F1219", surface: "#2A2E45", light: "#FF8F6B", accent: "#00E5FF" },
  limbo: { name: "Limbo de Teste", shadow: "#0D1220", surface: "#19243A", light: "#00E5FF", accent: "#FF2E88" },
} as const satisfies Record<string, DistrictPalette>;

export type DistrictId = keyof typeof DISTRICT_PALETTES;

export function isDistrictId(value: string): value is DistrictId {
  return Object.prototype.hasOwnProperty.call(DISTRICT_PALETTES, value);
}

/** Paleta do distrito; ids desconhecidos usam a do Limbo de Teste. */
export function getDistrictPalette(districtId: string): DistrictPalette {
  return isDistrictId(districtId) ? DISTRICT_PALETTES[districtId] : DISTRICT_PALETTES.limbo;
}

/** Medidas de toque em dp (Android). */
export const TOUCH = {
  /** Área mínima de qualquer elemento tocável. */
  minTarget: 48,
  /** Altura dos botões principais. */
  button: 56,
} as const;

/** Mesmas pilhas de fonte do CSS, para textos desenhados no canvas. */
export const FONT_STACKS = {
  display: '"Chakra Petch", "sans-serif-condensed", "Roboto Condensed", "Arial Narrow", system-ui, sans-serif',
  body: '"Barlow Semi Condensed", system-ui, "Roboto", "Segoe UI", sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, "Roboto Mono", Menlo, Consolas, monospace',
} as const;

/** "#RRGGBB" → número 0xRRGGBB, formato usado pelo Phaser. */
export function hexToInt(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}
