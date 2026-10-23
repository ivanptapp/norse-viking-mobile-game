/**
 * Ragnar — head.
 *
 * Rebuilt around readability at gameplay scale. The previous pass buried the
 * face under a hair curtain and a war-paint mask; this one gives the design
 * three loud shapes instead — a heavy brow, a lit cheekbone and a squared
 * jaw — and keeps the hair *behind* the cheek line so the face is never in
 * shadow.
 *
 * Light comes from the upper left, so every form gets a lit plane on the
 * viewer's left and a shadow plane on the right. Nothing is outlined twice:
 * silhouettes use the dark ink line, interior planes use colour only.
 *
 * Local space: the head joint sits at the base of the skull. The crown is at
 * y = -74, the chin at y = +3 and the beard hangs to y = +66.
 */

import { RAG, Strands } from "./RagnarMaterials";

/** Skin shadows, kept together so the face reads as one lighting setup. */
const SKIN = {
  lit: "#d9a97f",
  mid: "#b8835c",
  shade: "#8c5c3d",
  deep: "#5c3722",
  paint: "#1d2a3a",
  paintHi: "#2c3f55",
} as const;

/* ------------------------------------------------------------------ *
 * Neck
 * ------------------------------------------------------------------ */

export function RagnarNeckArt() {
  return (
    <g>
      {/* Column of the neck, widened at the base into the trapezius */}
      <path
        d="M -27 24 C -29 8 -25 -8 -17 -21 L 15 -21 C 24 -8 28 8 27 24
           C 20 30 -20 30 -27 24 Z"
        fill="url(#ragSkinFar)"
        stroke={RAG.line}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Sternocleidomastoid: one lit ridge, one shadowed one */}
      <path d="M -16 -18 C -12 -6 -10 6 -9 20" fill="none" stroke={SKIN.shade} strokeWidth="3" opacity="0.5" strokeLinecap="round" />
      <path d="M -14 -17 C -10 -5 -8 6 -7 19" fill="none" stroke={SKIN.lit} strokeWidth="1.4" opacity="0.28" strokeLinecap="round" />
      <path d="M 13 -18 C 11 -6 9 6 8 20" fill="none" stroke={SKIN.deep} strokeWidth="3.4" opacity="0.45" strokeLinecap="round" />
      {/* Throat shadow cast by the jaw */}
      <path d="M -22 -18 C -12 -6 12 -6 22 -18 L 24 -12 C 12 0 -12 0 -24 -12 Z" fill="#2a1810" opacity="0.55" />
      {/* Collar of the shirt */}
      <path d="M -28 20 C -14 28 14 28 28 20 L 30 26 C 14 34 -14 34 -30 26 Z" fill="#231a12" opacity="0.8" />
    </g>
  );
}

/* ------------------------------------------------------------------ *
 * Hair — everything behind the jaw line
 * ------------------------------------------------------------------ */

export function RagnarHairBackArt() {
  return (
    <g>
      {/* Mass behind the ears, tapering to the shoulders. It stays outside
          the cheek line so the face is never shaded by its own hair. */}
      <path
        d="M -24 -52
           C -28 -40 -29 -22 -28 -6
           C -27 8 -26 20 -24 30
           C -20 34 -16 31 -15 24
           C -18 12 -19 -2 -18 -16
           C -17 -30 -16 -42 -13 -50 Z"
        fill="url(#ragHair)"
        stroke="#1b140c"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M 22 -51
           C 26 -39 27 -21 26 -5
           C 25 9 24 21 22 31
           C 18 35 14 32 13 25
           C 16 13 17 -1 16 -15
           C 15 -29 14 -41 11 -49 Z"
        fill="url(#ragHair)"
        stroke="#1b140c"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Fold structure inside the mass: two values, no stray scratches */}
      <g fill="none" strokeLinecap="round">
        <path d="M -29 -46 C -33 -26 -33 -2 -30 22" stroke="#120d08" strokeWidth="3.4" opacity="0.45" />
        <path d="M -23 -50 C -26 -30 -26 -6 -23 18" stroke="#8a7048" strokeWidth="1.7" opacity="0.26" />
        <path d="M 27 -46 C 31 -26 31 -2 28 22" stroke="#120d08" strokeWidth="3.4" opacity="0.5" />
        <path d="M 22 -50 C 25 -30 25 -6 22 18" stroke="#8a7048" strokeWidth="1.5" opacity="0.2" />
      </g>

      {/* Braided tail behind his left shoulder */}
      <path
        d="M -31 -34 C -36 -16 -37 4 -35 22 C -34 30 -31 35 -27 37
           C -23 36 -21 31 -22 25 C -24 12 -24 -4 -23 -18 Z"
        fill="url(#ragHair)"
        stroke="#1b140c"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <g fill="none" stroke="#a08660" strokeWidth="1" opacity="0.3">
        {[-28, -20, -12, -4, 4, 12, 20].map((y, i) => (
          <path key={y} d={`M ${-35 + (i % 2) * 1.4} ${y} C -31 ${y + 2.4} -27 ${y + 2.4} ${-24 + (i % 2) * 1.2} ${y + 4.4}`} />
        ))}
      </g>

      {/* Cool rim on the far side, warm bounce on the near side */}
      <path d="M 30 -38 C 33 -20 33 0 29 20" fill="none" stroke="#93aab6" strokeWidth="1.6" opacity="0.22" />
      <path d="M -33 -40 C -36 -22 -36 -2 -32 18" fill="none" stroke="#c79a63" strokeWidth="1.4" opacity="0.18" />
    </g>
  );
}

export function RagnarHairFrontArt() {
  const braids = [
    { x0: -16, y0: -64, x1: -4, y1: -86, w: 1 },
    { x0: -9, y0: -65, x1: 1, y1: -88, w: 0.95 },
    { x0: -2, y0: -66, x1: 6, y1: -87, w: 0.9 },
    { x0: 5, y0: -65, x1: 12, y1: -84, w: 0.82 },
  ];

  return (
    <g>
      {/* Shaved temples */}
      <path d="M -21 -58 C -24 -49 -25 -37 -23 -26 C -19 -27 -17 -33 -17 -41 C -17 -49 -18 -54 -21 -58 Z" fill="url(#ragStubble)" />
      <path d="M 19 -57 C 22 -48 23 -36 21 -25 C 17 -26 15 -32 15 -40 C 15 -48 16 -53 19 -57 Z" fill="url(#ragStubble)" />
      <g stroke="#7a6440" strokeWidth="0.6" opacity="0.26" strokeLinecap="round">
        {["M -22 -55 L -20 -51", "M -23 -50 L -21 -46", "M -22 -45 L -20 -41", "M -22 -40 L -20 -36", "M -22 -34 L -20 -31",
          "M 20 -54 L 18 -50", "M 21 -49 L 19 -45", "M 20 -44 L 18 -40", "M 20 -39 L 18 -35", "M 21 -33 L 19 -30"].map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {/* Rune tattoo on the left temple */}
      <g fill="none" stroke="#3d3223" strokeWidth="0.9" opacity="0.5" strokeLinecap="round">
        <path d="M -20 -52 L -20 -42" />
        <path d="M -20 -49 L -17 -46" />
        <path d="M -20 -45 L -17 -42" />
      </g>

      {/* Ears */}
      <g>
        <path d="M -22 -42 C -27 -43 -30 -36 -27 -29 C -25 -25 -21 -24 -19 -28 C -21 -33 -22 -38 -20 -42 Z" fill={SKIN.mid} stroke="#3a2412" strokeWidth="1.1" />
        <path d="M -24 -37 C -26 -33 -25 -29 -22 -28" fill="none" stroke={SKIN.deep} strokeWidth="1" opacity="0.7" />
        <path d="M 20 -40 C 25 -41 28 -34 25 -27 C 23 -23 19 -22 17 -26 C 19 -31 20 -36 18 -40 Z" fill={SKIN.mid} stroke="#3a2412" strokeWidth="1.1" />
        <path d="M 22 -35 C 24 -31 23 -27 20 -26" fill="none" stroke={SKIN.deep} strokeWidth="1" opacity="0.7" />
      </g>

      {/* Crown: follows the skull, swept back, clear hairline */}
      <path
        d="M -21 -58
           C -23 -67 -19 -77 -8 -81
           C 4 -85 17 -78 20 -68
           C 21 -63 20 -59 18 -55
           C 13 -62 6 -65 -2 -63
           C -10 -61 -16 -60 -21 -58 Z"
        fill="url(#ragHair)"
        stroke="#1b140c"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Hairline shadow across the forehead */}
      <path d="M -20 -57 C -12 -61 -2 -63 6 -61 C 13 -59 18 -56 19 -54 C 12 -58 2 -60 -6 -58 C -12 -57 -17 -56 -20 -54 Z" fill="#150f09" opacity="0.55" />

      {/* Braided rows over the skull */}
      {braids.map((row, i) => (
        <g key={i}>
          <path
            d={`M ${row.x0} ${row.y0} C ${row.x0 + (row.x1 - row.x0) * 0.3} ${row.y0 - 9} ${row.x1 - 1} ${row.y1 + 6} ${row.x1} ${row.y1}`}
            fill="none"
            stroke="#3a2b1a"
            strokeWidth={2.8 * row.w}
            opacity="0.5"
            strokeLinecap="round"
          />
          <path
            d={`M ${row.x0 - 1.4} ${row.y0 - 0.8} C ${row.x0 + (row.x1 - row.x0) * 0.3 - 1.2} ${row.y0 - 9} ${row.x1 - 2.6} ${row.y1 + 6} ${row.x1 - 1.8} ${row.y1}`}
            fill="none"
            stroke="#b39668"
            strokeWidth={1.3 * row.w}
            opacity="0.55"
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* Top knot, gathered high at the back of the crown */}
      <path d="M -2 -79 C 1 -89 11 -93 17 -88 C 22 -84 21 -77 15 -74 C 12 -81 5 -82 -2 -79 Z" fill="url(#ragHair)" stroke="#1b140c" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M 14 -76 L 5 -72 L 4 -67.6 L 14 -71 Z" fill="url(#ragLeatherFar)" stroke="#150e07" strokeWidth="1" />
      <path d="M 12.6 -74.6 L 5.6 -71.4" stroke="#b08a58" strokeWidth="0.8" opacity="0.5" />
      {/* Loose strands at the nape */}
      <Strands
        color="#a68c5f"
        width={1}
        opacity={0.3}
        paths={["M -19 -52 C -21 -40 -21 -28 -19 -16", "M 18 -50 C 20 -38 20 -26 18 -14"]}
      />
      <Strands
        color="#1a120a"
        width={1.4}
        opacity={0.45}
        paths={["M -22 -48 C -24 -36 -24 -24 -22 -12", "M 21 -46 C 23 -34 23 -22 21 -10"]}
      />
    </g>
  );
}

/* ------------------------------------------------------------------ *
 * Face
 * ------------------------------------------------------------------ */

export function RagnarFaceArt() {
  const eyes = [-10, 10];

  return (
    <g>
      {/* ---- skull, cheekbones, squared jaw ---- */}
      <path
        d="M -21 -46
           C -22 -57 -15 -68 -4 -71
           C 8 -74 19 -66 21 -55
           C 22 -48 22 -42 21 -37
           C 21 -29 20 -21 17 -14
           C 14 -6 8 0 1 2
           C -7 3 -14 -2 -17 -10
           C -20 -17 -21 -26 -21 -34
           C -22 -39 -21 -43 -21 -46 Z"
        fill="url(#ragFace)"
        stroke="#2e1c0f"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* Right side in shadow (light comes from the upper left) */}
      <path
        d="M 20 -52 C 21 -44 21 -36 20 -29 C 19 -21 17 -14 14 -8
           C 17 -10 19 -16 20 -24 C 21 -32 22 -42 21 -50 Z"
        fill={SKIN.deep}
        opacity="0.5"
      />
      {/* Cheek hollow under the bone */}
      <path d="M 8 -30 C 13 -27 16 -22 15 -16 C 12 -21 8 -25 5 -27 Z" fill={SKIN.deep} opacity="0.32" />
      {/* Lit cheekbone + temple plane */}
      <path d="M -19 -40 C -15 -35 -9 -33 -3 -34 C -8 -30 -15 -31 -19 -35 Z" fill={SKIN.lit} opacity="0.45" />
      <path d="M -20 -55 C -17 -60 -11 -63 -5 -63 C -10 -59 -15 -57 -19 -52 Z" fill={SKIN.lit} opacity="0.28" />
      {/* Jaw shadow and chin plane */}
      <path d="M -17 -12 C -10 -4 -2 0 4 -1 C 10 -3 14 -8 16 -14 C 11 -6 4 -2 -3 -2 C -10 -2 -15 -6 -17 -12 Z" fill={SKIN.deep} opacity="0.42" />
      <path d="M -5 1 C -1 -1 3 -1 6 0 C 3 2 -2 2 -5 1 Z" fill={SKIN.lit} opacity="0.3" />

      {/* ---- war paint: a band over the sockets, nose bridge left clean ---- */}
      <path
        d="M -22 -51 C -16 -54 -11 -52 -6 -49 L -5 -37 C -10 -35 -15 -36 -20 -37 C -22 -41 -23 -46 -22 -51 Z"
        fill={SKIN.paint}
        opacity="0.82"
      />
      <path
        d="M 5 -49 C 10 -52 16 -53 22 -50 L 22 -38 C 16 -36 11 -35 6 -37 Z"
        fill={SKIN.paint}
        opacity="0.82"
      />
      {/* Paint texture: uneven edge, one lighter pass */}
      <g fill={SKIN.paintHi} opacity="0.4">
        <path d="M -21 -49 C -16 -51 -11 -50 -7 -48 L -7 -46 C -11 -48 -16 -49 -21 -47 Z" />
        <path d="M 6 -48 C 11 -50 16 -51 21 -49 L 21 -47 C 16 -49 11 -48 6 -46 Z" />
      </g>
      {/* Drips */}
      <g fill={SKIN.paint} opacity="0.65">
        <path d="M -18 -37 C -17 -31 -17 -26 -18 -22 C -19 -26 -19 -32 -19.5 -36 Z" />
        <path d="M 13 -37 C 14 -31 14 -27 13 -23 C 12 -27 12 -32 11.5 -36 Z" />
      </g>

      {/* ---- sockets and eyes ---- */}
      <path d="M -19 -47 C -14 -50 -5 -50 -2 -45 C -7 -41 -15 -42 -19 -47 Z" fill="#20130c" opacity="0.8" />
      <path d="M 2 -45 C 5 -50 14 -50 19 -47 C 15 -42 7 -41 2 -45 Z" fill="#20130c" opacity="0.8" />

      {eyes.map((cx) => (
        <g key={cx}>
          {/* Opening */}
          <path
            d={`M ${cx - 4.8} -43.4 C ${cx - 3.1} -46 ${cx + 2.9} -46.2 ${cx + 4.8} -44
                C ${cx + 2.9} -41.8 ${cx - 3} -41.6 ${cx - 4.8} -43.4 Z`}
            fill="#a78e76"
          />
          {/* Iris: pale grey-blue, the reference's eye colour */}
          <circle cx={cx + 0.6} cy="-43.6" r="2.1" fill="#7d9698" />
          <circle cx={cx + 0.6} cy="-43.6" r="1" fill="#0a0f12" />
          <circle cx={cx + 1.2} cy="-44.4" r="0.55" fill="#eef5f6" opacity="0.9" />
          {/* Upper lid: heavy, angled down toward the nose */}
          <path
            d={`M ${cx - 5.4} -43.2 C ${cx - 3.4} -46.8 ${cx + 3.2} -47.2 ${cx + 5.4} -44.4`}
            fill="none"
            stroke="#100a06"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          {/* Lower lid and the shadow under it */}
          <path d={`M ${cx - 4.2} -41.6 C ${cx - 1.4} -40.8 ${cx + 1.6} -40.8 ${cx + 4.2} -41.8`} fill="none" stroke="#6b3f27" strokeWidth="1" opacity="0.85" />
          <path d={`M ${cx - 4} -40.6 C ${cx - 1} -39.6 ${cx + 1.4} -39.6 ${cx + 4} -40.8`} fill="none" stroke={SKIN.deep} strokeWidth="1.2" opacity="0.35" />
        </g>
      ))}

      {/* ---- brow ridge: the loudest shape on the face ---- */}
      <path d="M -22 -50 C -16 -55 -8 -54 -2 -46 L -5 -43.6 C -10 -50 -16 -50.4 -21.4 -47 Z" fill="#33261a" />
      <path d="M 2 -46 C 8 -54 16 -55 22 -50 L 21.4 -47 C 16 -50.4 10 -50 -5 -43.6 Z" fill="#2e2217" />
      <Strands color="#7d6644" width={0.8} opacity={0.4} paths={["M -20 -52 C -14 -54 -8 -52 -4 -48", "M 4 -48 C 9 -52 15 -54 20 -52"]} />
      {/* Brow shadow onto the socket: ties the ridge to the eyes */}
      <path d="M -21 -46 C -15 -49 -8 -48 -3 -45 C -9 -45.6 -15 -45.4 -20 -44 Z" fill="#1a0f08" opacity="0.5" />

      {/* ---- nose: broad bridge, broken once, heavy tip ---- */}
      <path
        d="M -3.6 -45 C -4.8 -38 -5.8 -31 -6.2 -26.6
           C -8.8 -25 -8.8 -22.6 -5.6 -22
           C -2 -21.4 2.4 -21.4 5.4 -21.8
           C 8.2 -22.4 8.4 -25 5.8 -26.6
           C 4.8 -31 4.2 -38 3.6 -45 Z"
        fill={SKIN.mid}
        stroke="#5e3421"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M -1.6 -43 C -2.4 -37 -3.2 -31 -3.6 -27" fill="none" stroke="#f0c69d" strokeWidth="1.7" opacity="0.55" strokeLinecap="round" />
      <path d="M 2.6 -43 C 3.2 -37 3.8 -31 4.2 -27" fill="none" stroke="#6b3a23" strokeWidth="1.5" opacity="0.75" strokeLinecap="round" />
      <path d="M 0.4 -36 L 3.6 -35" stroke="#5c3320" strokeWidth="0.9" opacity="0.6" />
      <path d="M -5.8 -24.4 C -3.4 -23 0 -22.6 2.8 -23.4" fill="none" stroke="#3a1f11" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="-5.6" cy="-23.6" rx="1.5" ry="0.9" fill="#341d11" opacity="0.9" />
      <ellipse cx="4.8" cy="-23.8" rx="1.4" ry="0.85" fill="#341d11" opacity="0.8" />
      <path d="M -4.8 -21.6 C -2 -20.8 1.2 -20.8 3.6 -21.4" fill="none" stroke={SKIN.lit} strokeWidth="1.1" opacity="0.4" />

      {/* ---- mouth: a dark line under the moustache ---- */}
      <path d="M -6.4 -14.4 C -2.6 -12.6 2.8 -12.6 6.4 -14.6" fill="none" stroke="#2a160c" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M -4.6 -12.2 C -1.6 -10.8 1.8 -10.8 4.6 -12.4" fill="none" stroke={SKIN.lit} strokeWidth="1.1" opacity="0.32" strokeLinecap="round" />
      {/* Nasolabial folds */}
      <path d="M -8 -20 C -10 -15 -10 -11 -9 -8" fill="none" stroke="#5e3421" strokeWidth="0.9" opacity="0.45" strokeLinecap="round" />
      <path d="M 8 -20 C 10 -15 10 -11 9 -8" fill="none" stroke="#5e3421" strokeWidth="0.9" opacity="0.4" strokeLinecap="round" />

      {/* ---- scars and weathering ---- */}
      <path d="M -20 -55 L -12 -37" stroke="#d3a37c" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
      <path d="M -20.2 -55.2 L -12.4 -37.4" stroke="#f3cfab" strokeWidth="0.6" strokeLinecap="round" opacity="0.55" />
      <g stroke="#4a2a18" strokeWidth="0.8" opacity="0.6" strokeLinecap="round">
        <path d="M -19 -51 L -21.4 -50.6" />
        <path d="M -17 -46 L -19.4 -45.6" />
      </g>
      <path d="M 17 -32 L 13.6 -25" stroke="#a87d5a" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
      <g fill="none" stroke="#6d4530" strokeWidth="0.8" opacity="0.35" strokeLinecap="round">
        <path d="M -16 -30 C -20 -31 -21 -32 -22 -34" />
        <path d="M 16 -24 C 18 -27 19 -29 20 -32" />
      </g>
      {/* Forehead light */}
      <path d="M -14 -63 C -6 -66 3 -65 10 -62" fill="none" stroke="#f0c9a3" strokeWidth="2.4" opacity="0.16" strokeLinecap="round" />
    </g>
  );
}

/* ------------------------------------------------------------------ *
 * Beard
 * ------------------------------------------------------------------ */

/**
 * Locks fan out from the chin instead of running parallel: that fan is what
 * stops a beard reading as a curtain of vertical stripes.
 */
const LOCKS: { d: string; fill: string; op: number }[] = [
  { d: "M -25 -22 C -29 -8 -28 6 -23 16 C -20 22 -17 26 -14 29 C -17 20 -18 10 -17 2 C -16 -8 -17 -16 -19 -23 Z", fill: "#7b6343", op: 0.65 },
  { d: "M -19 -24 C -22 -8 -21 8 -16 20 C -13 26 -10 29 -7 31 C -11 22 -12 12 -11 4 C -10 -6 -12 -17 -13 -25 Z", fill: "#9c8259", op: 0.5 },
  { d: "M -12 -25 C -14 -8 -12 8 -7 20 C -4 26 -1 29 2 31 C -2 22 -3 12 -2 4 C -1 -6 -3 -17 -4 -25 Z", fill: "#5f4a31", op: 0.6 },
  { d: "M -4 -25 C -4 -8 0 4 4 18 C 6 24 9 28 12 30 C 7 21 5 11 6 3 C 7 -7 5 -18 4 -26 Z", fill: "#8f7752", op: 0.42 },
  { d: "M 4 -25 C 6 -10 10 2 14 14 C 16 22 19 26 22 28 C 17 19 15 9 15 1 C 15 -9 14 -19 13 -26 Z", fill: "#4e3c26", op: 0.6 },
  { d: "M 12 -26 C 15 -12 19 0 22 10 C 24 18 26 22 27 24 C 23 16 21 8 20 0 C 19 -10 18 -20 19 -28 Z", fill: "#372a19", op: 0.7 },
];

export function RagnarBeardArt() {
  return (
    <g>
      {/* Sideburns joining the beard to the hairline */}
      <path d="M -22 -34 C -25 -30 -26 -24 -25 -18 L -18 -20 C -19 -26 -20 -31 -19 -35 Z" fill="url(#ragBeard)" stroke="#1d1409" strokeWidth="1" />
      <path d="M 20 -34 C 23 -30 24 -24 23 -18 L 17 -20 C 18 -26 19 -31 18 -35 Z" fill="url(#ragBeard)" stroke="#1d1409" strokeWidth="1" />

      {/* Main mass: broad at the jaw, rounded at the bottom, never a slab */}
      <path
        d="M -25 -26
           C -28 -10 -26 6 -21 17
           C -18 24 -11 30 -5 33
           C -1 35 2 35 6 33
           C 12 30 18 24 21 17
           C 26 6 28 -10 25 -27
           C 17 -22 8 -20 -1 -20
           C -10 -20 -18 -22 -25 -26 Z"
        fill="url(#ragBeard)"
        stroke="#1d1409"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Lock structure */}
      {LOCKS.map((lock, i) => (
        <path key={i} d={lock.d} fill={lock.fill} opacity={lock.op} stroke="#241a10" strokeWidth="0.6" strokeLinejoin="round" />
      ))}

      {/* Light on the near locks, shadow on the far side */}
      <Strands
        color="#d0b184"
        width={1.3}
        opacity={0.3}
        paths={["M -23 -20 C -24 -6 -22 10 -18 24", "M -16 -22 C -17 -6 -14 10 -10 26", "M -8 -22 C -8 -6 -6 10 -3 28"]}
      />
      <Strands
        color="#150e08"
        width={1.6}
        opacity={0.5}
        paths={["M 14 -22 C 16 -8 18 6 19 20", "M 20 -24 C 22 -10 24 4 24 16", "M 8 -20 C 10 -6 12 8 14 22"]}
      />

      {/* Ragged tip */}
      <g fill="#3a2b1a" opacity="0.5">
        <path d="M -13 25 L -11 31 L -8 26 Z" />
        <path d="M -5 28 L -3 34 L 1 29 Z" />
        <path d="M 4 27 L 7 32 L 9 26 Z" />
        <path d="M 11 24 L 14 29 L 16 22 Z" />
      </g>

      {/* Moustache: heavy wings over the upper lip */}
      <path
        d="M -23 -27
           C -17 -30 -9 -29 -3 -25.6
           C 0 -24 1 -24 4 -25.6
           C 10 -29 18 -30 23 -27
           C 22 -22.6 20 -18.6 17 -16.6
           C 14 -14.6 11.6 -16.6 9.6 -20
           C 7.6 -23.4 4.6 -23.6 2.6 -21.6
           C 0 -19 -2 -16 -5 -15
           C -10 -13 -16 -18 -20 -21
           C -22 -23 -23 -25 -23 -27 Z"
        fill="#5b472f"
        stroke="#1b1209"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <Strands color="#c2a577" width={1} opacity={0.32} paths={["M -19 -26 C -14 -27 -9 -26 -6 -24", "M 6 -25 C 11 -27 16 -26 20 -24"]} />
      <Strands color="#201608" width={1} opacity={0.5} paths={["M -18 -21 C -14 -19 -11 -19 -9 -21", "M 8 -20 C 11 -18 14 -19 16 -21"]} />
      <path d="M -20 -16 C -19 -12 -18 -9 -19 -6" fill="none" stroke="#7a6244" strokeWidth="2.1" strokeLinecap="round" opacity="0.9" />
      <path d="M 20 -15 C 19 -11 18 -8 19 -5" fill="none" stroke="#6a5439" strokeWidth="2" strokeLinecap="round" opacity="0.9" />

      {/* Central braid with an iron ring */}
      <g>
        <path d="M -4.6 20 C -6.2 30 -5.8 40 -3.8 47 L 0 52 L 3.8 47 C 5.8 40 6.2 30 4.6 20 Z" fill="#6e5739" stroke="#201608" strokeWidth="1.1" strokeLinejoin="round" />
        <g fill="none" stroke="#c0a273" strokeWidth="1.1" opacity="0.35">
          {[25, 30, 35, 40, 45].map((y, i) => (
            <path key={y} d={`M ${-4.8 + (i % 2) * 1.6} ${y} C -1.2 ${y + 2.4} 1.8 ${y + 2.4} ${4.8 - (i % 2) * 1.6} ${y + 4.4}`} />
          ))}
        </g>
        <g fill="none" stroke="#241a10" strokeWidth="1" opacity="0.6">
          {[27, 32, 37, 42].map((y, i) => (
            <path key={y} d={`M ${-4.4 + (i % 2) * 1.4} ${y} C -1.2 ${y + 2.2} 1.6 ${y + 2.2} ${4.4 - (i % 2) * 1.4} ${y + 4}`} />
          ))}
        </g>
        <path d="M -5 21.4 L 5 21.4 L 5.2 25 L -5.2 25 Z" fill="url(#ragIronDark)" stroke="#11171b" strokeWidth="0.9" />
        <path d="M -4.2 23.2 L 4.2 23.2" stroke="#b7c3cb" strokeWidth="0.6" opacity="0.45" />
        <path d="M -2.8 43.6 L 2.8 43.6 L 2.2 49.4 L -2.2 49.4 Z" fill="#2c2015" stroke="#19120b" strokeWidth="0.8" />
      </g>

      {/* Side braids */}
      <g>
        <path d="M -21 -6 C -24 4 -25 13 -24 21" fill="none" stroke="#7b6343" strokeWidth="3.4" strokeLinecap="round" />
        <g fill="none" stroke="#c2a879" strokeWidth="0.9" opacity="0.4">
          {[-2, 3, 8, 13, 18].map((y, i) => (
            <path key={y} d={`M ${-24.4 + (i % 2) * 1.2} ${y} C -22 ${y + 2} -20 ${y + 2} ${-20 + (i % 2) * 1.2} ${y + 4}`} />
          ))}
        </g>
        <path d="M -25 20 L -20.6 20 L -20.6 26.2 L -25.4 26.2 Z" fill="url(#ragIron)" stroke="#12171b" strokeWidth="0.9" />

        <path d="M 21 -4 C 24 6 25 14 24 22" fill="none" stroke="#5b472f" strokeWidth="3.2" strokeLinecap="round" />
        <g fill="none" stroke="#a88d61" strokeWidth="0.85" opacity="0.35">
          {[1, 6, 11, 16, 21].map((y, i) => (
            <path key={y} d={`M ${22 - (i % 2) * 1.2} ${y} C 24.4 ${y + 2} 26.4 ${y + 2} ${26 - (i % 2) * 1.2} ${y + 4}`} />
          ))}
        </g>
        <path d="M 19.6 21 L 25 21 L 25 27 L 19.2 27 Z" fill="url(#ragIron)" stroke="#12171b" strokeWidth="0.9" />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ *
 * Temple braid — its own joint so it can swing
 * ------------------------------------------------------------------ */

export function RagnarBraidArt() {
  return (
    <g>
      <circle cx="0" cy="0" r="3.6" fill="url(#ragBronze)" stroke="#1d1309" strokeWidth="1" />
      <circle cx="-1" cy="-1.2" r="1.1" fill="#e4c48c" opacity="0.6" />
      <path d="M -3.6 0.8 A 3.6 3.6 0 0 0 3.6 0.8" fill="none" stroke="#3a2a14" strokeWidth="0.7" opacity="0.8" />

      <path
        d="M -3 2 C -8 14 -11 28 -11 42 C -11 50 -10 56 -9 60 L -3 60 C -4 54 -5 46 -5 38 C -5 24 -3 12 2 2 Z"
        fill="#7d6544"
        stroke="#241a10"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <g fill="none" stroke="#c2a879" strokeWidth="1.1" opacity="0.5">
        {[6, 12, 18, 24, 30, 36, 42, 48, 54].map((y, i) => (
          <path key={y} d={`M ${-7 + (i % 2) * 1.8} ${y} C -4 ${y + 2.6} -1 ${y + 2.6} ${2 - (i % 2) * 1.8} ${y + 5}`} />
        ))}
      </g>
      <g fill="none" stroke="#2b2013" strokeWidth="1" opacity="0.55">
        {[9, 15, 21, 27, 33, 39, 45, 51].map((y, i) => (
          <path key={y} d={`M ${-6.4 + (i % 2) * 1.6} ${y} C -3.6 ${y + 2.4} -1 ${y + 2.4} ${2.4 - (i % 2) * 1.6} ${y + 4.6}`} />
        ))}
      </g>
      <path d="M -10 18 L -4 18 L -4 22 L -10 22 Z" fill="url(#ragIron)" stroke="#141a1e" strokeWidth="0.9" />
      <path d="M -9 36 L -4 36 L -4 40 L -9 40 Z" fill="url(#ragIron)" stroke="#141a1e" strokeWidth="0.9" />
      <path d="M -8 59 L -3.4 59 L -2.6 67 L -7 67 Z" fill="#4c3c27" stroke="#241a10" strokeWidth="0.9" />
      <path d="M -7 67 C -9 75 -8 81 -5 85" fill="none" stroke="#6b5539" strokeWidth="2.4" strokeLinecap="round" />
      <g fill="none" stroke="#b39a6d" strokeWidth="0.9" opacity="0.4">
        {[70, 75, 80].map((y) => (
          <path key={y} d={`M -8 ${y} C -6 ${y + 2} -4 ${y + 2} -3 ${y + 4}`} />
        ))}
      </g>
    </g>
  );
}
