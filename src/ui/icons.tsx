import type { ReactNode } from "react";
import type { OriginId } from "../game/character";
import { ROLE_MARKERS } from "../theme/tokens";
import type { RoleId } from "../theme/tokens";

/**
 * Ícones em SVG (sem fontes de símbolos, que podem falhar em alguns Androids).
 * Herdam a cor do texto (`currentColor`). Sem `title`, ficam ocultos para leitores
 * de tela; com `title`, são anunciados como imagem.
 */

interface IconProps {
  size?: number;
  className?: string;
  title?: string;
}

function Svg({ size = 24, className, title, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Um emblema por origem; a forma identifica a origem mesmo sem cor. */
const EMBLEMS: Readonly<Record<OriginId, ReactNode>> = {
  corporativo: (
    <>
      <path d="M5 4h14v12l-4 4H5z" />
      <path d="M9 9h6" />
    </>
  ),
  baixada: (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M6 10v10h12V10" />
    </>
  ),
  gangue: (
    <>
      <path d="M12 3l8 9-8 9-8-9z" />
      <path d="M8 12h8" />
    </>
  ),
  militar: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
    </>
  ),
  pesquisador: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  nomade: (
    <>
      <path d="M4 20V10a8 8 0 0 1 16 0v10" />
      <path d="M9 15l3-3 3 3" />
    </>
  ),
};

export function OriginEmblem({ originId, ...props }: IconProps & { originId: OriginId }) {
  return <Svg {...props}>{EMBLEMS[originId]}</Svg>;
}

/** Marcador de função: círculo (aliado), triângulo (hostil), losango (neutro), hexágono (Éden). */
export function RoleGlyph({ role, size = 14, className }: { role: RoleId; size?: number; className?: string }) {
  const { shape } = ROLE_MARKERS[role];
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      {shape === "circle" && <circle cx="8" cy="8" r="6" />}
      {shape === "triangle" && <path d="M8 1.5L15 14H1z" />}
      {shape === "diamond" && <path d="M8 1l7 7-7 7-7-7z" />}
      {shape === "hexagon" && <path d="M8 1l6 3.5v7L8 15l-6-3.5v-7z" />}
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Svg>
  );
}

export function CrosshairIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="6" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    </Svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.01" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1-4 4-6 8-6s7 2 8 6" />
    </Svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
    </Svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 3L5 13h6l-1 8 8-10h-6z" />
    </Svg>
  );
}

/** Aviso: losango com exclamação (forma de "neutro", para não confundir com hostil). */
export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3l9 9-9 9-9-9z" />
      <path d="M12 8v5M12 16v.01" />
    </Svg>
  );
}

/** Marca do Éden: um "É" cortado em diagonal. A forma é estilizada por `.eden-mark` em styles.css. */
export function EdenMark({ size = 56 }: { size?: number }) {
  return (
    <span className="eden-mark" style={{ width: size, height: size, fontSize: size * 0.62 }} aria-hidden="true">
      <span>É</span>
      <i />
    </span>
  );
}
