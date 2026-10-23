/**
 * Ragnar — art materials.
 *
 * A single source of truth for the character's palette, gradients, textures
 * and the small shape helpers used by the body and head modules.
 *
 * The art direction is deliberately dark and low-saturation: charcoal iron,
 * weathered leather, ash-brown hair and a weathered tan skin, lit from the
 * upper left with a cool rim from the right. Every material gets its own
 * gradient and texture so iron does not read like leather, or leather like
 * skin. Nothing here uses SVG filters, so the rig stays cheap to re-render
 * on a phone.
 */

/* ------------------------------------------------------------------ *
 * Palette
 * ------------------------------------------------------------------ */

export const RAG = {
  ink: "#0b0907",
  line: "#100c08",

  skinHi: "#d6a67e",
  skinMid: "#ab7a55",
  skinLo: "#774b33",
  skinDeep: "#452a1d",

  hairHi: "#a98c5f",
  hairMid: "#6a5438",
  hairLo: "#2a2014",

  beardHi: "#a2865a",
  beardMid: "#59422a",
  beardLo: "#1d1409",

  ironHi: "#c6d1d9",
  ironMid: "#727d85",
  ironLo: "#39424a",
  ironDeep: "#12171b",

  bronzeHi: "#c2a063",
  bronzeMid: "#876839",
  bronzeLo: "#463319",

  leatherHi: "#8a5c34",
  leatherMid: "#4a301c",
  leatherLo: "#22150c",

  woolMid: "#33383a",
  woolLo: "#171b1c",

  furMid: "#3b332a",
  furLo: "#14100c",
  furHi: "#8b7a61",

  woodMid: "#65472a",
  woodLo: "#37220f",

  mailHi: "#98a3aa",
  mailMid: "#4a5258",
  mailLo: "#23282c",
} as const;

/** Keep SSR and client markup byte-identical for computed coordinates. */
export const round = (value: number) => Math.round(value * 100) / 100;

/** Polar helper for rivets and engraved rings. */
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [round(cx + Math.cos(a) * r), round(cy + Math.sin(a) * r)];
}

/* ------------------------------------------------------------------ *
 * Defs
 * ------------------------------------------------------------------ */

export function RagnarDefs() {
  return (
    <defs>
      {/* ---------------- skin ---------------- */}
      <linearGradient id="ragSkin" x1="0.18" y1="0" x2="0.78" y2="1">
        <stop offset="0" stopColor="#d3a077" />
        <stop offset="0.34" stopColor="#a97753" />
        <stop offset="0.72" stopColor="#82573c" />
        <stop offset="1" stopColor="#4a2e1f" />
      </linearGradient>
      <linearGradient id="ragSkinFar" x1="0.1" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor="#83604a" />
        <stop offset="0.45" stopColor="#66483a" />
        <stop offset="1" stopColor="#38241b" />
      </linearGradient>
      <radialGradient id="ragFace" cx="0.36" cy="0.2" r="0.92">
        <stop offset="0" stopColor="#dfae84" />
        <stop offset="0.4" stopColor="#b5835e" />
        <stop offset="0.74" stopColor="#7e5033" />
        <stop offset="1" stopColor="#452a19" />
      </radialGradient>

      {/* ---------------- hair ---------------- */}
      <linearGradient id="ragHair" x1="0.15" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={RAG.hairHi} />
        <stop offset="0.36" stopColor={RAG.hairMid} />
        <stop offset="0.78" stopColor="#3f3020" />
        <stop offset="1" stopColor={RAG.hairLo} />
      </linearGradient>
      <linearGradient id="ragBeard" x1="0.2" y1="0" x2="0.75" y2="1">
        <stop offset="0" stopColor={RAG.beardHi} />
        <stop offset="0.36" stopColor={RAG.beardMid} />
        <stop offset="0.76" stopColor="#2e2114" />
        <stop offset="1" stopColor={RAG.beardLo} />
      </linearGradient>
      <linearGradient id="ragStubble" x1="0" y1="0" x2="0.5" y2="1">
        <stop offset="0" stopColor="#4a3a26" />
        <stop offset="1" stopColor="#2a2014" />
      </linearGradient>

      {/* ---------------- metal ---------------- */}
      <linearGradient id="ragIron" x1="0.12" y1="0" x2="0.86" y2="1">
        <stop offset="0" stopColor="#c9d4dc" />
        <stop offset="0.2" stopColor="#828e97" />
        <stop offset="0.46" stopColor="#414a52" />
        <stop offset="0.62" stopColor="#232a30" />
        <stop offset="0.8" stopColor="#5d6871" />
        <stop offset="1" stopColor="#161b20" />
      </linearGradient>
      <linearGradient id="ragIronDark" x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor="#5c666e" />
        <stop offset="0.3" stopColor="#3d464d" />
        <stop offset="0.66" stopColor="#272d33" />
        <stop offset="1" stopColor="#161b1f" />
      </linearGradient>
      <linearGradient id="ragBlade" x1="0.06" y1="0" x2="0.72" y2="1">
        <stop offset="0" stopColor="#9aa6b0" />
        <stop offset="0.18" stopColor="#6b7780" />
        <stop offset="0.4" stopColor="#434c55" />
        <stop offset="0.52" stopColor="#69757e" />
        <stop offset="0.7" stopColor="#3b444c" />
        <stop offset="0.88" stopColor="#5b656e" />
        <stop offset="1" stopColor="#232a30" />
      </linearGradient>
      <linearGradient id="ragBronze" x1="0.14" y1="0" x2="0.82" y2="1">
        <stop offset="0" stopColor={RAG.bronzeHi} />
        <stop offset="0.32" stopColor="#9a7a45" />
        <stop offset="0.62" stopColor={RAG.bronzeMid} />
        <stop offset="0.86" stopColor="#5b4420" />
        <stop offset="1" stopColor="#33240f" />
      </linearGradient>
      <radialGradient id="ragBoss" cx="0.32" cy="0.26" r="0.82">
        <stop offset="0" stopColor="#cfd8de" />
        <stop offset="0.22" stopColor="#96a1a9" />
        <stop offset="0.52" stopColor="#5d686f" />
        <stop offset="0.8" stopColor="#333b41" />
        <stop offset="1" stopColor="#191e22" />
      </radialGradient>
      <linearGradient id="ragRim" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor="#8f99a1" />
        <stop offset="0.3" stopColor="#5b656d" />
        <stop offset="0.62" stopColor="#384146" />
        <stop offset="1" stopColor="#1b2024" />
      </linearGradient>

      {/* ---------------- leather, wool, fur ---------------- */}
      <linearGradient id="ragLeather" x1="0.16" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={RAG.leatherHi} />
        <stop offset="0.36" stopColor="#52381f" />
        <stop offset="0.72" stopColor={RAG.leatherMid} />
        <stop offset="1" stopColor={RAG.leatherLo} />
      </linearGradient>
      <linearGradient id="ragLeatherFar" x1="0.16" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor="#4e3622" />
        <stop offset="0.4" stopColor="#3a2718" />
        <stop offset="1" stopColor="#1a110a" />
      </linearGradient>
      <linearGradient id="ragLeatherLight" x1="0.16" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor="#7d593a" />
        <stop offset="0.4" stopColor="#5f4128" />
        <stop offset="0.78" stopColor="#412b1a" />
        <stop offset="1" stopColor="#261811" />
      </linearGradient>
      <linearGradient id="ragWool" x1="0.16" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor="#4b473c" />
        <stop offset="0.42" stopColor={RAG.woolMid} />
        <stop offset="1" stopColor={RAG.woolLo} />
      </linearGradient>
      <linearGradient id="ragWoolFar" x1="0.16" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor="#39362d" />
        <stop offset="0.5" stopColor="#2b2822" />
        <stop offset="1" stopColor="#181712" />
      </linearGradient>
      <linearGradient id="ragFur" x1="0.2" y1="0" x2="0.7" y2="1">
        <stop offset="0" stopColor={RAG.furHi} />
        <stop offset="0.3" stopColor="#4a4034" />
        <stop offset="0.66" stopColor={RAG.furMid} />
        <stop offset="1" stopColor={RAG.furLo} />
      </linearGradient>
      <linearGradient id="ragCloak" x1="0.12" y1="0" x2="0.75" y2="1">
        <stop offset="0" stopColor="#3a2f28" />
        <stop offset="0.34" stopColor="#241d19" />
        <stop offset="0.72" stopColor="#120f0d" />
        <stop offset="1" stopColor="#080606" />
      </linearGradient>

      {/* ---------------- wood / shield ---------------- */}
      <pattern id="ragPlanks" width="34" height="260" patternUnits="userSpaceOnUse">
        <rect width="34" height="260" fill="#6b4b2c" />
        <rect width="17" height="260" fill="#55391f" opacity="0.7" />
        <rect x="17" width="17" height="260" fill="#7c5733" opacity="0.3" />
        <path d="M0 0 V260 M17 0 V260 M34 0 V260" stroke="#2f1d0e" strokeWidth="2" />
        <g stroke="#3a2413" strokeWidth="0.9" opacity="0.5">
          <path d="M5 14 C11 38 3 60 8 88 C12 112 5 138 10 168 C14 194 7 220 11 246" />
          <path d="M24 8 C18 32 26 56 20 80 C15 104 24 130 19 158 C15 182 22 210 18 240" />
        </g>
        <g stroke="#9c7448" strokeWidth="0.8" opacity="0.25">
          <path d="M13 34 C17 56 11 74 15 96" />
          <path d="M29 44 C25 66 31 88 26 110" />
        </g>
      </pattern>
      <radialGradient id="ragShieldShade" cx="0.36" cy="0.3" r="0.78">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="0.62" stopColor="#0a0705" stopOpacity="0.18" />
        <stop offset="1" stopColor="#050403" stopOpacity="0.62" />
      </radialGradient>

      {/* ---------------- textures ---------------- */}
      <pattern id="ragMail" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill={RAG.mailLo} />
        <g fill="none" stroke={RAG.mailMid} strokeWidth="1.1">
          <circle cx="4" cy="4" r="2.7" />
          <circle cx="0" cy="0" r="2.7" />
          <circle cx="8" cy="0" r="2.7" />
          <circle cx="0" cy="8" r="2.7" />
          <circle cx="8" cy="8" r="2.7" />
        </g>
        <g fill="none" stroke="#8d979e" strokeWidth="0.55" opacity="0.5">
          <path d="M2 2.6 A2.7 2.7 0 0 1 5.4 2" />
          <path d="M2 6.6 A2.7 2.7 0 0 1 5.4 6" />
        </g>
      </pattern>
      <pattern id="ragLamellar" width="21" height="25" patternUnits="userSpaceOnUse">
        <rect width="21" height="25" fill="#1d2226" />
        <path
          d="M1 1.5 h19 v15.5 c0 3.6 -3.4 5.6 -9.5 5.6 s-9.5 -2 -9.5 -5.6 z"
          fill="url(#ragIronDark)"
          stroke="#0d1114"
          strokeWidth="1"
        />
        <path d="M2.6 3.4 h15.8" stroke="#9aa4ac" strokeWidth="0.9" opacity="0.28" />
        <circle cx="12.5" cy="6" r="1.15" fill="#9fabb3" opacity="0.75" />
        <circle cx="18.2" cy="6" r="1.15" fill="#9fabb3" opacity="0.6" />
      </pattern>
      <pattern id="ragMailShade" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="2.4" fill="#07090a" opacity="0.45" />
      </pattern>
      <pattern id="ragGrain" width="18" height="18" patternUnits="userSpaceOnUse">
        <path d="M0 4 C5 7 11 2 18 5" stroke="#b08a5c" strokeWidth="0.7" opacity="0.16" />
        <path d="M0 13 C4 10 11 15 18 12" stroke="#1a1108" strokeWidth="0.7" opacity="0.3" />
      </pattern>

      {/* ---------------- light & shadow ---------------- */}
      <radialGradient id="ragShadow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#000" stopOpacity="0.62" />
        <stop offset="0.55" stopColor="#000" stopOpacity="0.32" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="ragRimLight" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b6d2e0" stopOpacity="0.62" />
        <stop offset="0.5" stopColor="#9fb8c4" stopOpacity="0.12" />
        <stop offset="1" stopColor="#9fb8c4" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="ragTorsoShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.42" />
        <stop offset="0.22" stopColor="#000" stopOpacity="0" />
        <stop offset="0.78" stopColor="#000" stopOpacity="0.1" />
        <stop offset="1" stopColor="#000" stopOpacity="0.55" />
      </linearGradient>
    </defs>
  );
}

/* ------------------------------------------------------------------ *
 * Shape helpers
 * ------------------------------------------------------------------ */

const r2 = (value: number) => Math.round(value * 100) / 100;

/**
 * A ragged fur hem: a wavy line with alternating tufts, closed upwards.
 * `depth` is the tuft length, `seed` varies the silhouette.
 */
export function furHem(
  x0: number,
  x1: number,
  y: number,
  count: number,
  depth: number,
  seed = 0,
  top = 26,
): string {
  const step = (x1 - x0) / count;
  let d = `M ${r2(x0)} ${r2(y)}`;
  for (let i = 0; i < count; i++) {
    const xa = x0 + step * i;
    const xb = xa + step;
    const wob = Math.sin(i * 1.9 + seed) * 1.6;
    const tuft = depth * (0.72 + 0.4 * Math.abs(Math.sin(i * 2.7 + seed)));
    d += ` Q ${r2(xa + step * 0.3)} ${r2(y + tuft * 0.5 + wob)} ${r2(xa + step * 0.52)} ${r2(y + tuft)}`;
    d += ` Q ${r2(xb - step * 0.18)} ${r2(y + tuft * 0.24 + wob)} ${r2(xb)} ${r2(y + wob * 0.4)}`;
  }
  d += ` L ${r2(x1)} ${r2(y - top)} L ${r2(x0)} ${r2(y - top)} Z`;
  return d;
}

/** A row of iron rivets on a circle. */
export function RivetRing({
  cx = 0,
  cy = 0,
  radius,
  count,
  size = 2.2,
  fill = "#a7b2ba",
  stroke = "#171c20",
}: {
  cx?: number;
  cy?: number;
  radius: number;
  count: number;
  size?: number;
  fill?: string;
  stroke?: string;
}) {
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const [x, y] = polar(cx, cy, radius, (i / count) * 360 + 4);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={size} fill={fill} stroke={stroke} strokeWidth={0.9} />
            <circle cx={x - size * 0.3} cy={y - size * 0.35} r={size * 0.34} fill="#e2e9ee" opacity={0.5} />
          </g>
        );
      })}
    </g>
  );
}

/** A dropped shadow blob used to fake ambient occlusion at overlaps. */
export function Ao({
  cx,
  cy,
  rx,
  ry,
  opacity = 0.4,
  rotate = 0,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity?: number;
  rotate?: number;
}) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="#050403"
      opacity={opacity}
      transform={rotate ? `rotate(${rotate} ${cx} ${cy})` : undefined}
    />
  );
}

/** Short hair/beard strands, used to break up a hair mass. */
export function Strands({
  paths,
  color,
  width = 1.4,
  opacity = 0.6,
}: {
  paths: string[];
  color: string;
  width?: number;
  opacity?: number;
}) {
  return (
    <g fill="none" stroke={color} strokeWidth={width} opacity={opacity} strokeLinecap="round">
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}
