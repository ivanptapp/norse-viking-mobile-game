/**
 * Firmas de ataque.
 *
 * Un héroe no es solo una cifra de daño: en el campo se reconoce por *cómo*
 * golpea. Aquí vive esa identidad en forma de datos: el trazo que dibuja al
 * atacar, el color de la energía que arrastra, el silencio antes del impacto
 * y cómo entra en escena (carga, estocada, parpadeo o disparo a distancia).
 *
 * `BattleOverlay` no necesita saber nada de cada héroe: pide su firma y la
 * escena la traduce en efectos. Añadir un héroe nuevo es añadir una entrada.
 */

import { ELEMENT_COLOR, spriteCfg, type Weapon } from "@/lib/sprites";
import { heroById } from "@/lib/heroes";

/** Cómo se dibuja el golpe al impactar. */
export type AttackStyle =
  | "cleave" // arco amplio de hacha o espada
  | "thrust" // estocada lineal de lanza
  | "slam" // martillo/gran hacha contra el suelo
  | "volley" // lluvia de flechas
  | "arcane" // círculo rúnico y descarga mágica
  | "beam" // rayo sostenido de energía
  | "drain" // garras de sombra que roban vida
  | "fang"; // mordisco y zarpazo

/** Cómo llega el héroe hasta su objetivo. */
export type ApproachStyle = "dash" | "lunge" | "blink" | "stand";

export interface AttackSignature {
  style: AttackStyle;
  /** Color del golpe en sí (trazo, chispas, borde). */
  accent: string;
  /** Color secundario: estela, polvo, resplandor. */
  trail: string;
  approach: ApproachStyle;
  /** Silencio antes del impacto en ms a velocidad 1. */
  windup: number;
  /** Sacudida de cámara: 0 nada, 3 terremoto. */
  shake: 0 | 1 | 2 | 3;
  /** Sonido del golpe. */
  sound: "hit" | "crit" | "shoot" | "cast" | "dash";
  /** Palabra que acompaña a los críticos de este héroe. */
  word: string;
}

const BASE: AttackSignature = {
  style: "cleave",
  accent: "#f8fafc",
  trail: "#94a3b8",
  approach: "dash",
  windup: 160,
  shake: 1,
  sound: "hit",
  word: "¡GOLPE!",
};

/**
 * Héroes con sello propio. El resto se resuelve por arma y rol, que ya da
 * resultados distintos (hacha ≠ arco ≠ grimorio).
 */
const OVERRIDES: Record<string, Partial<AttackSignature>> = {
  // --- Míticos ---
  odin: {
    style: "beam",
    approach: "stand",
    accent: "#bfdbfe",
    trail: "#3b82f6",
    windup: 260,
    shake: 2,
    sound: "cast",
    word: "¡GUNGNIR!",
  },
  thor: {
    style: "slam",
    approach: "dash",
    accent: "#fef08a",
    trail: "#f59e0b",
    windup: 220,
    shake: 3,
    sound: "crit",
    word: "¡MJÖLNIR!",
  },
  ragnar: {
    style: "cleave",
    accent: "#fca5a5",
    trail: "#b91c1c",
    windup: 200,
    shake: 2,
    sound: "crit",
    word: "¡BERSERKER!",
  },
  freya: {
    style: "arcane",
    approach: "stand",
    accent: "#fbcfe8",
    trail: "#ec4899",
    windup: 240,
    shake: 1,
    sound: "cast",
    word: "¡BENDICIÓN!",
  },
  hel: {
    style: "drain",
    approach: "stand",
    accent: "#86efac",
    trail: "#065f46",
    windup: 240,
    shake: 2,
    sound: "cast",
    word: "¡ALMA!",
  },

  // --- Legendarios ---
  lagertha: {
    style: "thrust",
    approach: "lunge",
    accent: "#bae6fd",
    trail: "#38bdf8",
    windup: 170,
    shake: 2,
    sound: "crit",
    word: "¡VALQUIRIA!",
  },
  loki: {
    style: "fang",
    approach: "blink",
    accent: "#fdba74",
    trail: "#f97316",
    windup: 110,
    shake: 1,
    sound: "hit",
    word: "¡TRAICIÓN!",
  },
  heimdall: {
    style: "cleave",
    approach: "dash",
    accent: "#fef3c7",
    trail: "#facc15",
    windup: 210,
    shake: 2,
    sound: "crit",
    word: "¡GUARDIÁN!",
  },
  bjorn: {
    style: "cleave",
    approach: "dash",
    accent: "#e2e8f0",
    trail: "#64748b",
    windup: 220,
    shake: 2,
    sound: "crit",
    word: "¡JARL!",
  },
  ivar: {
    style: "volley",
    approach: "stand",
    accent: "#c4b5fd",
    trail: "#7c3aed",
    windup: 180,
    shake: 1,
    sound: "shoot",
    word: "¡SIN HUESOS!",
  },
  fenrir: {
    style: "fang",
    approach: "dash",
    accent: "#c084fc",
    trail: "#4c1d95",
    windup: 150,
    shake: 3,
    sound: "crit",
    word: "¡DEVORA!",
  },
  brynhildr: {
    style: "thrust",
    approach: "lunge",
    accent: "#fef9c3",
    trail: "#fde047",
    windup: 190,
    shake: 2,
    sound: "crit",
    word: "¡ASCENSIÓN!",
  },

  // --- Épicos ---
  harald: {
    style: "slam",
    approach: "dash",
    accent: "#bae6fd",
    trail: "#0ea5e9",
    windup: 240,
    shake: 3,
    sound: "crit",
    word: "¡ROMPEHIELOS!",
  },
  rollo: { style: "slam", shake: 2, word: "¡DEMOLEDOR!" },
  sigurd: {
    style: "fang",
    approach: "blink",
    accent: "#bbf7d0",
    trail: "#16a34a",
    windup: 120,
    sound: "hit",
    word: "¡COLMILLO!",
  },
  balder: {
    style: "arcane",
    approach: "stand",
    accent: "#fef3c7",
    trail: "#fbbf24",
    windup: 230,
    sound: "cast",
    word: "¡LUZ!",
  },
  tyr: { style: "cleave", approach: "lunge", word: "¡JUSTICIA!" },
  floki: { style: "slam", approach: "stand", shake: 2 },
  uhtred: { style: "cleave", approach: "lunge" },
  erik: { style: "cleave" },
  freydis: { style: "cleave", approach: "lunge" },

  // --- Raros ---
  hvitserk: { style: "fang", approach: "blink" },
  athelstan: { style: "arcane", approach: "stand", windup: 220 },
  leif: { style: "volley", approach: "stand" },
  ubbe: { style: "cleave" },
};

/** Estilo por defecto según el arma que empuña. */
function fromWeapon(weapon: Weapon): Partial<AttackSignature> {
  switch (weapon) {
    case "bow":
      return { style: "volley", approach: "stand", accent: "#fde68a", trail: "#d97706", sound: "shoot" };
    case "staff":
    case "book":
      return { style: "arcane", approach: "stand", accent: "#c4b5fd", trail: "#7c3aed", windup: 230, sound: "cast" };
    case "spear":
      return { style: "thrust", approach: "lunge", accent: "#e0f2fe", trail: "#0284c7" };
    case "greataxe":
      return { style: "slam", approach: "dash", accent: "#fca5a5", trail: "#7f1d1d", windup: 220, shake: 2, sound: "crit" };
    case "hammer":
      return { style: "slam", approach: "dash", accent: "#fde68a", trail: "#b45309", windup: 220, shake: 2 };
    case "daggers":
      return { style: "fang", approach: "blink", accent: "#fdba74", trail: "#c2410c", windup: 110 };
    default:
      return { style: "cleave", approach: "dash" };
  }
}

const cache = new Map<string, AttackSignature>();

export function signatureFor(heroId: string): AttackSignature {
  const id = heroId.toLowerCase();
  const hit = cache.get(id);
  if (hit) return hit;

  const def = heroById(id);
  const element = ELEMENT_COLOR[def.element] || "#f87171";
  const signature: AttackSignature = {
    ...BASE,
    ...fromWeapon(spriteCfg(id).weapon),
    accent: element,
    trail: element,
    ...OVERRIDES[id],
  };

  cache.set(id, signature);
  return signature;
}

/** Duración del desplazamiento cuerpo a cuerpo según cómo entra. */
export const APPROACH_MS: Record<ApproachStyle, number> = {
  dash: 620,
  lunge: 460,
  blink: 280,
  stand: 0,
};
