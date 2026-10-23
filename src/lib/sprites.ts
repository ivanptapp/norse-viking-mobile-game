import type { HeroDef } from "./heroes";

export type Weapon = "axe" | "greataxe" | "sword" | "daggers" | "bow" | "staff" | "hammer" | "spear" | "book";
export type Helm = "nasal" | "horned" | "winged" | "valkyrie" | "crown" | "hood" | "none";

export interface SpriteCfg {
  weapon: Weapon;
  shield: boolean;
  female: boolean;
  beard: boolean;
  helm: Helm;
  hair: string;
  skin: string;
  cape: string | null;
  orb: string;
  beast: "wolf" | null;
  eyepatch: boolean;
  armor: boolean;
  avatar?: string; // Ruta al avatar cuadrado en public/heroes/{id}.png
  figure?: string; // Ruta al combatiente de cuerpo entero en public/heroes/figure_{id}.png
}

/**
 * Mapeo de figuras ilustradas de cuerpo entero para los combatientes en la Arena.
 * Se guardan en public/heroes/figure_{id}.png
 */
export const HERO_FIGURES: Record<string, string> = {
  // Quinteto Inicial generado
  ragnar: "/heroes/figure_ragnar.png",
  lagertha: "/heroes/figure_lagertha.png",
  ubbe: "/heroes/figure_ubbe.png",
  athelstan: "/heroes/figure_athelstan.png",
  leif: "/heroes/figure_leif.png",
  odin: "/heroes/figure_odin.png",
  thor: "/heroes/figure_thor.png",
  freya: "/heroes/figure_freya.png",
  hel: "/heroes/figure_hel.png",
  loki: "/heroes/figure_loki.png",
  heimdall: "/heroes/figure_heimdall.png",
  bjorn: "/heroes/figure_bjorn.png",
  ivar: "/heroes/figure_ivar.png",
  fenrir: "/heroes/figure_fenrir.png",
  brynhildr: "/heroes/figure_brynhildr.png",
  uhtred: "/heroes/figure_uhtred.png",
  harald: "/heroes/figure_harald.png",
  rollo: "/heroes/figure_rollo.png",
  tyr: "/heroes/figure_tyr.png",
  sigurd: "/heroes/figure_sigurd.png",
  floki: "/heroes/figure_floki.png",
  erik: "/heroes/figure_erik.png",
  balder: "/heroes/figure_balder.png",
  hvitserk: "/heroes/figure_hvitserk.png",
  freydis: "/heroes/figure_freydis.png",
  
  // Iremos añadiendo aquí los siguientes que generemos (Odín, Thor, etc.)
};

/**
 * Mapeo de avatares cuadrados para menús, cartas, escuadrón y aldea (25 héroes).
 * Apunta directamente a los archivos en public/heroes/{id}.png
 */
export const HERO_AVATARS: Record<string, string> = {
  // --- Míticos (5) ---
  odin: "/heroes/odin.png",
  thor: "/heroes/thor.png",
  ragnar: "/heroes/ragnar.png",
  freya: "/heroes/freya.png",
  hel: "/heroes/hel.png",

  // --- Legendarios (7) ---
  lagertha: "/heroes/lagertha.png",
  loki: "/heroes/loki.png",
  heimdall: "/heroes/heimdall.png",
  bjorn: "/heroes/bjorn.png",
  ivar: "/heroes/ivar.png",
  fenrir: "/heroes/fenrir.png",
  brynhildr: "/heroes/brynhildr.png",

  // --- Épicos (8) ---
  uhtred: "/heroes/uhtred.png",
  harald: "/heroes/harald.png",
  rollo: "/heroes/rollo.png",
  tyr: "/heroes/tyr.png",
  sigurd: "/heroes/sigurd.png",
  floki: "/heroes/floki.png",
  erik: "/heroes/erik.png",
  balder: "/heroes/balder.png",

  // --- Raros (5) ---
  ubbe: "/heroes/ubbe.png",
  hvitserk: "/heroes/hvitserk.png",
  athelstan: "/heroes/athelstan.png",
  freydis: "/heroes/freydis.png",
  leif: "/heroes/leif.png",
};

const BASE: SpriteCfg = {
  weapon: "sword",
  shield: false,
  female: false,
  beard: true,
  helm: "nasal",
  hair: "#5b3a1e",
  skin: "#e8b990",
  cape: null,
  orb: "#60a5fa",
  beast: null,
  eyepatch: false,
  armor: false,
};

const OVERRIDES: Record<string, Partial<SpriteCfg>> = {
  // Míticos
  odin: { weapon: "spear", helm: "none", hair: "#d6d3d1", cape: "#1e3a5f", eyepatch: true, orb: "#93c5fd" },
  thor: { weapon: "hammer", helm: "winged", hair: "#b45309", cape: "#7f1d1d", armor: true },
  ragnar: { weapon: "axe", helm: "none", hair: "#8a5a2b", cape: "#3f2a14" },
  freya: { weapon: "staff", female: true, beard: false, helm: "valkyrie", hair: "#fcd34d", cape: "#be185d", orb: "#f472b6" },
  hel: { weapon: "staff", female: true, beard: false, helm: "crown", hair: "#111827", skin: "#c7d2fe", cape: "#064e3b", orb: "#34d399" },

  // Legendarios
  lagertha: { weapon: "sword", shield: true, female: true, beard: false, helm: "none", hair: "#f5deb3", armor: true },
  loki: { weapon: "daggers", helm: "horned", beard: false, hair: "#111827", cape: "#14532d", orb: "#fb923c" },
  heimdall: { weapon: "sword", shield: true, helm: "winged", hair: "#fde68a", cape: "#854d0e", armor: true },
  bjorn: { weapon: "axe", shield: true, helm: "nasal", hair: "#7c4a1e", armor: true },
  ivar: { weapon: "bow", helm: "none", hair: "#1f2937", cape: "#312e81" },
  fenrir: { beast: "wolf" },
  brynhildr: { weapon: "spear", shield: true, female: true, beard: false, helm: "valkyrie", hair: "#b91c1c", cape: "#f8fafc" },

  // Épicos
  uhtred: { weapon: "sword", shield: true, helm: "none", hair: "#3f2a14", armor: true },
  harald: { weapon: "greataxe", helm: "horned", hair: "#a16207", armor: true },
  rollo: { weapon: "greataxe", helm: "horned", hair: "#6b3f1d" },
  tyr: { weapon: "sword", helm: "winged", hair: "#9ca3af", armor: true },
  sigurd: { weapon: "daggers", helm: "hood", beard: false, hair: "#1c1917" },
  floki: { weapon: "hammer", helm: "none", hair: "#111827", skin: "#d9c7b8" },
  erik: { weapon: "axe", shield: true, helm: "nasal", hair: "#b91c1c" },
  balder: { weapon: "staff", helm: "none", beard: false, hair: "#fef3c7", cape: "#fde68a", orb: "#fbbf24" },

  // Raros
  ubbe: { weapon: "sword", shield: true, helm: "nasal", hair: "#78350f" },
  hvitserk: { weapon: "daggers", helm: "hood", hair: "#eab308" },
  athelstan: { weapon: "book", helm: "none", beard: false, hair: "#4b2e13", cape: "#44403c" },
  freydis: { weapon: "sword", shield: true, female: true, beard: false, helm: "none", hair: "#dc2626" },
  leif: { weapon: "bow", helm: "nasal", hair: "#b45309", cape: "#155e75" },
};

export function spriteCfg(heroId: string): SpriteCfg {
  return {
    ...BASE,
    ...(OVERRIDES[heroId] || {}),
    avatar: HERO_AVATARS[heroId],
    figure: HERO_FIGURES[heroId],
  };
}

export function isRanged(def: HeroDef) {
  return def.role === "Mago" || def.role === "Apoyo" || def.role === "Tirador";
}

export function projectileKind(def: HeroDef): "arrow" | "orb" | "spear" {
  const c = spriteCfg(def.id);
  return c.weapon === "bow" ? "arrow" : c.weapon === "spear" ? "spear" : "orb";
}

export const ELEMENT_COLOR: Record<string, string> = {
  Trueno: "#fde047",
  Fuego: "#fb923c",
  Hielo: "#7dd3fc",
  Sombra: "#c084fc",
  Luz: "#fef3c7",
  Sabiduría: "#93c5fd",
  Amor: "#f9a8d4",
  Furia: "#f87171",
  Acero: "#e5e7eb",
  Veneno: "#86efac",
  Naturaleza: "#4ade80",
  Tierra: "#d6a35c",
  Viento: "#bae6fd",
};