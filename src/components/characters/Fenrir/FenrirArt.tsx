import type { ReactNode } from "react";

/**
 * Original procedural artwork for Fenrir.
 *
 * Everything is vector, drawn in the local coordinates of its joint so the
 * same art can be rotated by the rig without ever being re-rasterised.
 * Palette: cold charcoal and steel fur, bone ivory fangs, icy rune light.
 */

const OUTLINE = "#05070a";
const OUTLINE_SOFT = "#0a0d10";
const CLAW = "url(#fenrirClaw)";
const IVORY = "#e6dfcd";
const IVORY_SHADE = "#b6ad99";

export function FenrirDefs() {
  return (
    <defs>
      <linearGradient id="fenrirFur" x1="0.18" y1="0" x2="0.5" y2="1">
        <stop offset="0" stopColor="#9aa7b2" />
        <stop offset="0.12" stopColor="#7a8793" />
        <stop offset="0.34" stopColor="#59656f" />
        <stop offset="0.62" stopColor="#3b4650" />
        <stop offset="0.85" stopColor="#252d34" />
        <stop offset="1" stopColor="#11161b" />
      </linearGradient>

      <linearGradient id="fenrirFurFar" x1="0.1" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor="#39424a" />
        <stop offset="0.45" stopColor="#21282e" />
        <stop offset="1" stopColor="#090d11" />
      </linearGradient>

      <linearGradient id="fenrirMane" x1="0.12" y1="0" x2="0.42" y2="1">
        <stop offset="0" stopColor="#828e99" />
        <stop offset="0.28" stopColor="#5c6772" />
        <stop offset="0.62" stopColor="#3a444d" />
        <stop offset="0.86" stopColor="#222a30" />
        <stop offset="1" stopColor="#0f1419" />
      </linearGradient>

      <linearGradient id="fenrirMuzzle" x1="0.2" y1="0" x2="0.4" y2="1">
        <stop offset="0" stopColor="#6b7782" />
        <stop offset="0.3" stopColor="#4c5660" />
        <stop offset="0.68" stopColor="#303840" />
        <stop offset="1" stopColor="#171d22" />
      </linearGradient>

      <radialGradient id="fenrirHaunch" cx="0.3" cy="0.18" r="0.92">
        <stop offset="0" stopColor="#7b8793" />
        <stop offset="0.3" stopColor="#596570" />
        <stop offset="0.62" stopColor="#39434c" />
        <stop offset="0.86" stopColor="#232b31" />
        <stop offset="1" stopColor="#11161a" />
      </radialGradient>

      <radialGradient id="fenrirShoulder" cx="0.26" cy="0.14" r="0.9">
        <stop offset="0" stopColor="#8a96a3" />
        <stop offset="0.3" stopColor="#66727e" />
        <stop offset="0.62" stopColor="#404a54" />
        <stop offset="0.86" stopColor="#272f36" />
        <stop offset="1" stopColor="#12181d" />
      </radialGradient>

      <linearGradient id="fenrirRim" x1="0" y1="0" x2="1" y2="0.4">
        <stop offset="0" stopColor="#c5d4e1" stopOpacity="0" />
        <stop offset="0.3" stopColor="#b9cddd" stopOpacity="0.9" />
        <stop offset="0.65" stopColor="#e2eef7" stopOpacity="0.65" />
        <stop offset="1" stopColor="#93a7b8" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="fenrirInnerEar" x1="0.5" y1="1" x2="0.5" y2="0">
        <stop offset="0" stopColor="#584349" />
        <stop offset="0.55" stopColor="#34262c" />
        <stop offset="1" stopColor="#1a1215" />
      </linearGradient>

      <radialGradient id="fenrirEye" cx="0.42" cy="0.34" r="0.72">
        <stop offset="0" stopColor="#f7ffff" />
        <stop offset="0.2" stopColor="#cdf7ff" />
        <stop offset="0.5" stopColor="#63d5ef" />
        <stop offset="0.82" stopColor="#1c8cb2" />
        <stop offset="1" stopColor="#093f58" />
      </radialGradient>

      <radialGradient id="fenrirEyeFar" cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#eaffff" />
        <stop offset="0.4" stopColor="#79dcf4" />
        <stop offset="1" stopColor="#0f506b" />
      </radialGradient>

      <radialGradient id="fenrirNose" cx="0.35" cy="0.22" r="0.95">
        <stop offset="0" stopColor="#565d65" />
        <stop offset="0.4" stopColor="#252a30" />
        <stop offset="1" stopColor="#040506" />
      </radialGradient>

      <linearGradient id="fenrirClaw" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stopColor="#bdb6a6" />
        <stop offset="0.55" stopColor="#7d776d" />
        <stop offset="1" stopColor="#33322e" />
      </linearGradient>

      <linearGradient id="fenrirRune" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ddfbff" />
        <stop offset="0.5" stopColor="#7ee2ff" />
        <stop offset="1" stopColor="#2b95b8" />
      </linearGradient>

      <linearGradient id="fenrirShadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.75" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="fenrirMouth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a0b0f" />
        <stop offset="0.6" stopColor="#170507" />
        <stop offset="1" stopColor="#080102" />
      </linearGradient>
    </defs>
  );
}

/* ================================================================== *
 * TORSO
 * ================================================================== */

export function FenrirBodyArt() {
  return (
    <g>
      {/* Ambient occlusion under the barrel */}
      <ellipse cx="-22" cy="50" rx="152" ry="26" fill="#000" opacity="0.42" />

      {/* Base silhouette: deep chest, high withers, tucked waist */}
      <path
        d="M -176 0
           C -178 -28 -160 -46 -132 -52
           C -106 -57 -84 -50 -62 -50
           C -32 -52 2 -62 38 -60
           C 76 -57 110 -38 124 -8
           C 130 12 126 34 112 48
           C 96 62 72 58 54 48
           C 38 40 22 44 6 46
           C -14 48 -36 52 -58 54
           C -90 56 -118 50 -138 40
           C -158 30 -174 16 -176 0 Z"
        fill="url(#fenrirFur)"
        stroke={OUTLINE}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />

      {/* The back stays a clean wolf line: volume comes from shading, not spikes. */}

      {/* Chest keel / pectoral light */}
      <path
        d="M 100 -18 C 116 -10 126 4 124 22 C 122 36 112 46 100 50 C 110 34 108 14 92 0 Z"
        fill="#8b97a2"
        opacity="0.14"
      />

      {/* Haunch mass */}
      <path
        d="M -178 2
           C -180 -28 -160 -48 -130 -50
           C -102 -52 -80 -30 -78 -2
           C -76 26 -96 48 -124 50
           C -152 52 -176 32 -178 2 Z"
        fill="url(#fenrirHaunch)"
        stroke={OUTLINE_SOFT}
        strokeWidth="1.3"
        opacity="0.96"
      />
      {/* Haunch highlight + fur breaks */}
      <path
        d="M -165 -24 C -152 -45 -128 -51 -108 -43"
        fill="none"
        stroke="#b6c6d3"
        strokeWidth="1.7"
        opacity="0.3"
        strokeLinecap="round"
      />
      <g fill="url(#fenrirMane)" opacity="0.9">
        <path d="M -176 18 C -158 25 -148 13 -136 27 C -124 13 -110 27 -98 18 C -90 34 -74 31 -66 46 C -88 56 -116 59 -140 52 C -160 46 -174 34 -176 18 Z" />
      </g>
      <g fill="none" stroke="#0b0f12" strokeWidth="1.4" opacity="0.5">
        <path d="M -162 4 C -150 12 -152 30 -138 38" />
        <path d="M -140 -20 C -128 -8 -132 8 -120 18" />
      </g>

      {/* Shoulder mass */}
      <path
        d="M 24 -60
           C 60 -68 98 -54 114 -28
           C 124 -10 120 14 106 30
           C 90 46 62 42 48 26
           C 30 6 16 -36 24 -60 Z"
        fill="url(#fenrirShoulder)"
        stroke={OUTLINE_SOFT}
        strokeWidth="1.2"
        opacity="0.96"
      />
      <path
        d="M 34 -54 C 56 -63 84 -56 102 -40"
        fill="none"
        stroke="#c0d1dd"
        strokeWidth="1.8"
        opacity="0.34"
        strokeLinecap="round"
      />
      <g fill="none" stroke="#0a0e11" strokeWidth="1.3" opacity="0.45">
        <path d="M 42 -34 C 54 -22 52 -4 62 8" />
        <path d="M 66 -38 C 78 -24 74 -6 86 8" />
      </g>

      {/* Sparse belly tufts: soft breaks instead of a row of plates */}
      <g fill="url(#fenrirMane)" stroke={OUTLINE_SOFT} strokeWidth="0.9">
        <path d="M 90 42 C 98 48 98 56 92 61 C 94 53 91 47 86 44 Z" />
        <path d="M -16 47 C -12 54 -14 60 -20 63 C -18 56 -21 52 -25 49 Z" />
        <path d="M -82 51 C -78 58 -80 64 -86 67 C -84 60 -87 56 -91 53 Z" />
        <path d="M -136 38 C -132 44 -134 49 -139 51 C -137 46 -140 42 -144 40 Z" />
      </g>

      {/* Chest fur breaks */}
      <g fill="url(#fenrirMane)" opacity="0.55">
        <path d="M 98 32 C 106 40 104 48 96 53 C 98 44 95 38 90 35 Z" />
        <path d="M 111 25 C 119 34 118 42 111 46 C 113 38 109 32 104 29 Z" />
      </g>

      {/* Occlusion and fur skirts where the limbs meet the torso */}
      <g fill="#030507" opacity="0.3">
        <ellipse cx="-136" cy="38" rx="44" ry="18" />
        <ellipse cx="84" cy="38" rx="38" ry="16" />
      </g>
      <g fill="url(#fenrirMane)" stroke={OUTLINE_SOFT} strokeWidth="0.9">
        <path d="M -174 24 C -158 42 -142 48 -126 46 C -134 58 -150 60 -166 52 Z" />
        <path d="M -148 30 C -138 46 -126 52 -112 48 C -120 60 -134 60 -142 50 Z" />
      </g>
      <path
        d="M -132 20 C -126 32 -130 44 -120 52"
        fill="none"
        stroke="#c4d3df"
        strokeWidth="2.6"
        opacity="0.12"
        strokeLinecap="round"
      />
      <path
        d="M 84 22 C 92 32 88 42 96 50"
        fill="none"
        stroke="#c4d3df"
        strokeWidth="2.6"
        opacity="0.12"
        strokeLinecap="round"
      />

      {/* Broad layered fur clumps: the hand-painted volume pass */}
      <g fill="#93a0ac" opacity="0.14">
        <path d="M -152 -22 C -134 -28 -114 -22 -100 -10 C -118 -16 -136 -14 -152 -22 Z" />
        <path d="M -90 -32 C -70 -40 -44 -38 -26 -26 C -48 -32 -68 -30 -90 -32 Z" />
        <path d="M 28 -48 C 54 -54 82 -46 98 -30 C 76 -40 52 -42 28 -48 Z" />
        <path d="M -156 16 C -138 26 -118 22 -104 12 C -122 22 -140 26 -156 16 Z" />
        <path d="M 18 26 C 40 18 62 22 78 32 C 58 26 38 28 18 26 Z" />
      </g>
      <g fill="#3b444d" opacity="0.26">
        <path d="M -110 10 C -90 6 -70 12 -58 22 C -78 14 -94 16 -110 10 Z" />
        <path d="M -20 -10 C 0 -16 22 -10 34 2 C 14 -6 -2 -4 -20 -10 Z" />
        <path d="M 46 34 C 62 30 76 34 86 40 C 72 36 58 38 46 34 Z" />
      </g>

      {/* Cool bounce light from the rune circle under the belly */}
      <path
        d="M 96 44 C 60 56 16 58 -24 54"
        fill="none"
        stroke="#7fe3ff"
        strokeWidth="3.5"
        opacity="0.1"
        strokeLinecap="round"
      />

      {/* Feathery fur highlights following the musculature */}
      <g fill="#b9c7d3" opacity="0.13">
        <path d="M -150 -24 C -140 -14 -134 -2 -132 8 C -140 0 -148 -12 -150 -24 Z" />
        <path d="M -126 -36 C -116 -26 -110 -12 -108 0 C -116 -10 -124 -24 -126 -36 Z" />
        <path d="M -96 -42 C -84 -30 -78 -16 -76 -4 C -84 -14 -92 -28 -96 -42 Z" />
        <path d="M -60 -42 C -48 -30 -42 -18 -40 -8 C -48 -16 -56 -28 -60 -42 Z" />
        <path d="M -28 -44 C -16 -32 -10 -20 -8 -10 C -16 -18 -24 -30 -28 -44 Z" />
        <path d="M 8 -44 C 20 -32 26 -20 28 -10 C 20 -18 12 -30 8 -44 Z" />
        <path d="M 42 -42 C 54 -30 60 -18 62 -8 C 54 -16 46 -28 42 -42 Z" />
        <path d="M 70 -34 C 82 -22 88 -10 90 0 C 82 -8 74 -20 70 -34 Z" />
        <path d="M -152 10 C -142 20 -132 24 -122 24 C -132 28 -144 22 -152 10 Z" />
        <path d="M -104 22 C -94 30 -84 32 -74 30 C -84 36 -96 32 -104 22 Z" />
        <path d="M 12 22 C 24 30 36 32 46 30 C 36 36 22 32 12 22 Z" />
        <path d="M 66 16 C 78 26 90 28 100 26 C 90 32 76 26 66 16 Z" />
      </g>
      <g fill="#0b0f13" opacity="0.22">
        <path d="M -158 -10 C -148 0 -138 6 -126 8 C -138 10 -150 4 -158 -10 Z" />
        <path d="M -70 -30 C -58 -20 -50 -10 -46 0 C -56 -8 -66 -18 -70 -30 Z" />
        <path d="M 0 -30 C 12 -20 18 -10 20 0 C 12 -8 4 -18 0 -30 Z" />
        <path d="M 58 -24 C 70 -14 76 -4 78 4 C 70 -4 62 -14 58 -24 Z" />
      </g>

      {/* Long painted fur strokes */}
      <g
        fill="none"
        stroke="#a1b2c0"
        strokeWidth="1.2"
        opacity="0.18"
        strokeLinecap="round"
      >
        <path d="M -152 -8 C -140 2 -144 18 -132 26" />
        <path d="M -134 -28 C -120 -16 -126 0 -112 10" />
        <path d="M -98 -42 C -82 -30 -90 -8 -72 -2" />
        <path d="M -64 -48 C -46 -34 -54 -12 -36 -6" />
        <path d="M -20 -54 C -2 -40 -10 -18 8 -10" />
        <path d="M 24 -56 C 42 -44 34 -24 52 -16" />
        <path d="M 68 -50 C 86 -38 80 -16 96 -8" />
        <path d="M -124 26 C -106 18 -98 32 -82 26" />
        <path d="M -56 34 C -38 26 -28 40 -10 34" />
        <path d="M 12 33 C 30 25 40 38 56 30" />
        <path d="M -166 14 C -152 20 -144 14 -132 18" />
      </g>

      {/* Deep chest / rib shadows */}
      <g fill="none" stroke="#040608" strokeWidth="1.7" opacity="0.42">
        <path d="M 10 12 C 28 10 44 16 56 27" />
        <path d="M -8 21 C 10 19 26 25 38 36" />
        <path d="M 74 30 C 86 34 98 34 108 28" />
      </g>

      {/* Scars across the flank */}
      <g stroke="#c9d5df" strokeLinecap="round" opacity="0.3">
        <path d="M -90 -36 L -72 16" strokeWidth="2.4" />
        <path d="M -76 -40 L -58 10" strokeWidth="1.7" />
        <path d="M -62 -38 L -48 4" strokeWidth="1.2" />
        <path d="M -48 -34 L -40 8" strokeWidth="0.9" />
      </g>

      {/* Shoulder rune: Algiz bound with Isa */}
      <g
        transform="translate(88 -6) rotate(-7)"
        fill="none"
        stroke="url(#fenrirRune)"
        strokeWidth="2.2"
        strokeLinecap="square"
        style={{ filter: "drop-shadow(0 0 4px rgba(110,220,255,.7))" }}
        opacity="0.85"
      >
        <path d="M 0 -16 L 0 16" />
        <path d="M 0 -7 L 11 2 L 0 11" />
        <path d="M 16 -16 L 16 16" />
        <path d="M 16 -4 L 24 -4" />
      </g>

      {/* Old scar over the rune */}
      <path
        d="M 66 -34 C 74 -18 72 -2 66 10"
        fill="none"
        stroke="#d4dfe8"
        strokeWidth="1.5"
        opacity="0.32"
      />

      {/* Fur edge along the chest */}
      <path
        d="M 104 36 C 116 44 118 54 110 62 C 106 52 98 48 94 42 Z"
        fill="url(#fenrirMane)"
        stroke={OUTLINE_SOFT}
        strokeWidth="0.8"
      />
    </g>
  );
}

/* ================================================================== *
 * NECK + MANE
 * ================================================================== */

export function FenrirNeckArt() {
  return (
    <g>
      {/* Mane silhouette: layered wolf ruff, no regular sawtooth */}
      <path
        d="M -34 46
           C -40 20 -34 -2 -20 -20
           C -28 -24 -31 -36 -20 -41
           C -18 -51 -6 -59 5 -52
           C 11 -64 25 -66 31 -56
           C 41 -65 53 -58 52 -46
           C 64 -49 71 -38 62 -28
           C 69 -18 62 -7 52 -5
           C 46 9 36 21 30 34
           C 22 52 4 64 -16 60
           C -28 58 -36 52 -34 46 Z"
        fill="url(#fenrirMane)"
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Neck body: short, thick, angled forward */}
      <path
        d="M -26 34
           C -22 10 -10 -12 6 -26
           C 18 -36 32 -45 46 -47
           L 58 -30
           L 52 -16
           C 42 -6 34 8 28 22
           C 20 40 4 52 -12 48
           C -22 46 -29 40 -26 34 Z"
        fill="url(#fenrirMane)"
        stroke={OUTLINE}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Throat light */}
      <path
        d="M -16 34 C -8 14 4 -2 20 -16 C 30 -25 40 -31 50 -34"
        fill="none"
        stroke="url(#fenrirRim)"
        strokeWidth="3"
        opacity="0.5"
        strokeLinecap="round"
      />

      {/* Layered chest ruff */}
      <path
        d="M -26 16
           C -8 32 14 36 32 26
           C 28 48 18 70 2 82
           L -10 64 L -18 80 L -28 58 L -38 70
           C -44 52 -40 30 -26 16 Z"
        fill="url(#fenrirMane)"
        stroke={OUTLINE}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M -10 32 C 4 42 20 42 30 34 C 26 50 18 60 8 68 L 0 56 L -6 66 C -12 54 -14 42 -10 32 Z"
        fill="#4c5660"
        opacity="0.25"
      />
      <g fill="none" stroke="#a6b6c4" strokeWidth="1.2" opacity="0.3" strokeLinecap="round">
        <path d="M -8 34 C -2 50 -8 64 -4 76" />
        <path d="M 8 36 C 12 50 8 62 10 70" />
        <path d="M 20 32 C 18 44 14 52 14 60" />
      </g>

      {/* Fur strokes along neck */}
      <g fill="none" stroke="#a3b4c2" strokeWidth="1.15" opacity="0.25" strokeLinecap="round">
        <path d="M 0 -18 C 12 -28 26 -36 40 -41" />
        <path d="M 8 -8 C 20 -18 32 -26 44 -32" />
        <path d="M 16 2 C 26 -6 36 -14 46 -20" />
        <path d="M 22 12 C 30 4 38 -2 46 -10" />
        <path d="M -16 14 C -8 4 -4 -8 0 -16" />
      </g>

      {/* Icy rune branded at the mane base */}
      <g
        transform="translate(-2 8) rotate(16)"
        fill="none"
        stroke="url(#fenrirRune)"
        strokeWidth="1.8"
        strokeLinecap="square"
        opacity="0.65"
        style={{ filter: "drop-shadow(0 0 3px rgba(110,220,255,.55))" }}
      >
        <path d="M 0 -9 L 0 9" />
        <path d="M 0 -2 L 8 3 L 0 9" />
      </g>
    </g>
  );
}

/* ================================================================== *
 * HEAD
 * ================================================================== */

export function FenrirEarArt({ far = false }: { far?: boolean }) {
  const fill = far ? "url(#fenrirFurFar)" : "url(#fenrirFur)";
  return (
    <g>
      {/* Broad triangular wolf ear: wide at the base, thick leathery tip */}
      <path
        d="M -19 6
           C -22 0 -18 -12 -12 -24
           C -8 -34 -4 -44 2 -48
           C 10 -40 15 -28 19 -14
           C 22 -4 22 2 18 8
           C 4 14 -10 13 -19 6 Z"
        fill={fill}
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M -11 3
           C -12 -6 -7 -20 -1 -35
           C 4 -26 8 -14 12 2
           C 4 7 -4 7 -11 3 Z"
        fill="url(#fenrirInnerEar)"
        opacity="0.94"
      />
      <g fill={fill} stroke={OUTLINE_SOFT} strokeWidth="0.7">
        <path d="M -17 2 C -23 -2 -27 -8 -27 -14 C -21 -9 -16 -5 -11 -2 Z" />
        <path d="M 15 2 C 21 -2 25 -8 25 -13 C 19 -8 14 -5 9 -2 Z" />
      </g>
      <path
        d="M -12 -24 C -8 -34 -4 -44 2 -48"
        fill="none"
        stroke="#cfe6f5"
        strokeWidth="1.6"
        opacity="0.5"
        strokeLinecap="round"
      />
      {!far && (
        <>
          <path
            d="M -8 -22 L -2 -38 L -1 -30"
            fill="none"
            stroke="#c3d4e1"
            strokeWidth="1.4"
            opacity="0.5"
            strokeLinecap="round"
          />
          <path
            d="M -9 -8 C -8 -15 -5 -21 -2 -26"
            fill="none"
            stroke="#0a0d10"
            strokeWidth="1.2"
            opacity="0.55"
          />
          {/* Notched ear scar */}
          <path
            d="M 10 -26 L 16 -22 L 11 -18"
            fill="none"
            stroke="#d7e4ee"
            strokeWidth="1.2"
            opacity="0.42"
          />
        </>
      )}
    </g>
  );
}

/** Skull, muzzle, eyes, nose, mouth cavity and tongue. */
export function FenrirHeadArt({
  registerEyes,
  registerMouth,
}: {
  registerEyes?: (node: SVGGElement | null) => void;
  registerMouth?: (node: SVGGElement | null) => void;
}) {
  return (
    <g>
      {/* Back-of-skull ruff: soft fur lobes, not a hood */}
      <path
        d="M -32 16
           C -43 4 -47 -12 -40 -28
           C -35 -43 -22 -52 -8 -56
           L -12 -40 L -24 -30 L -12 -24 L -28 -12 L -14 -8 L -30 -2 Z"
        fill="url(#fenrirMane)"
        stroke={OUTLINE_SOFT}
        strokeWidth="1.4"
      />
      <g fill="#7c8894" opacity="0.16">
        <path d="M -30 -30 C -26 -40 -18 -48 -8 -52 C -18 -44 -25 -36 -30 -30 Z" />
        <path d="M -26 -12 C -20 -22 -12 -28 -2 -32 C -12 -24 -20 -18 -26 -12 Z" />
      </g>

      {/* Moonlit rim along the skull and muzzle bridge */}
      <g fill="none" stroke="url(#fenrirRim)" strokeLinecap="round" opacity="0.8">
        <path d="M -32 -16 C -34 -38 -20 -52 -2 -54 C 18 -56 36 -47 46 -36" strokeWidth="2.2" />
        <path d="M 58 -30 C 72 -28 86 -25 98 -19" strokeWidth="1.6" opacity="0.7" />
      </g>

      {/* Main skull: shorter, deeper wolf wedge */}
      <path
        d="M -34 -16
           C -38 -36 -24 -52 -2 -54
           C 18 -56 36 -47 46 -36
           C 52 -30 59 -28 66 -26
           L 83 -22
           C 97 -20 108 -16 116 -10
           C 121 -6 121 1 116 5
           C 109 9 98 8 87 6
           C 76 4 66 7 58 12
           C 47 21 34 30 17 34
           C 0 38 -14 30 -25 16
           C -31 6 -35 -2 -34 -16 Z"
        fill="url(#fenrirFur)"
        stroke={OUTLINE}
        strokeWidth="2.3"
        strokeLinejoin="round"
      />

      {/* Cheek fur swept back from the jaw, with a single chin tuft */}
      <g fill="url(#fenrirMane)" stroke={OUTLINE_SOFT} strokeWidth="0.9">
        <path d="M -24 14 C -34 10 -41 2 -45 -6 C -36 0 -28 4 -18 8 Z" />
        <path d="M -18 24 C -28 22 -36 16 -40 8 C -32 14 -24 18 -14 20 Z" />
        <path d="M -8 30 C -14 34 -17 40 -16 46 C -10 41 -4 38 2 36 Z" />
      </g>
      <g fill="#8b98a4" opacity="0.12">
        <path d="M -20 16 C -28 12 -34 6 -36 0 C -29 6 -23 9 -16 11 Z" />
        <path d="M -6 34 C -10 38 -12 41 -12 44 C -8 41 -4 39 0 37 Z" />
      </g>

      {/* Muzzle top plane */}
      <path
        d="M 38 -35
           C 52 -37 66 -32 76 -25
           C 90 -23 104 -19 114 -12
           C 119 -9 120 -3 116 0
           C 106 4 94 2 83 0
           C 70 -2 58 3 48 8
           C 41 0 36 -22 38 -35 Z"
        fill="url(#fenrirMuzzle)"
        stroke={OUTLINE_SOFT}
        strokeWidth="1.2"
      />

      {/* Bridge highlight + stop */}
      <path
        d="M 42 -28 C 56 -32 70 -27 80 -22 C 92 -20 104 -16 113 -10"
        fill="none"
        stroke="#b3c4d1"
        strokeWidth="2.1"
        opacity="0.34"
        strokeLinecap="round"
      />
      <path
        d="M 49 -34 C 56 -32 62 -29 66 -25"
        fill="none"
        stroke="#0a0e11"
        strokeWidth="1.4"
        opacity="0.5"
      />

      {/* Snarl wrinkles */}
      <g fill="none" stroke="#0a0e11" strokeWidth="1.1" opacity="0.5">
        <path d="M 68 -14 C 80 -10 92 -7 103 -6" />
        <path d="M 72 -8 C 84 -5 94 -2 105 -1" />
        <path d="M 58 -8 C 66 -4 74 1 82 5" opacity="0.6" />
      </g>

      {/* Eye socket shadow */}
      <path
        d="M 16 -36 C 29 -43 48 -41 56 -32 C 52 -22 39 -17 27 -22 C 19 -25 15 -31 16 -36 Z"
        fill="#0a0e12"
        opacity="0.82"
      />

      {/* Eyes grouped for blink */}
      <g ref={registerEyes} transform="translate(36 -30) scale(1 1) translate(-36 30)">
        {/* Far eye */}
        <g opacity="0.9">
          <path
            d="M 9 -31 C 14 -35 22 -34 25 -30 C 21 -26 14 -25 9 -31 Z"
            fill="url(#fenrirEyeFar)"
            style={{ filter: "drop-shadow(0 0 3px rgba(110,220,255,.55))" }}
          />
          <ellipse cx="17.5" cy="-29.5" rx="1.2" ry="2.4" fill="#041218" />
        </g>

        {/* Near eye: narrow, angled, menacing */}
        <g style={{ filter: "drop-shadow(0 0 5px rgba(110,226,255,.8))" }}>
          <path
            d="M 25 -31
               C 32 -38 46 -38 53 -31
               C 48 -25 35 -23 28 -26
               C 25 -28 24 -30 25 -31 Z"
            fill="#071014"
            stroke="#0a1014"
            strokeWidth="1"
          />
          <ellipse cx="39" cy="-30" rx="6" ry="4.2" fill="url(#fenrirEye)" />
          <ellipse cx="40" cy="-30" rx="1.5" ry="3.8" fill="#04151c" />
          <circle cx="36" cy="-31.7" r="1.4" fill="#f4ffff" />
          <circle cx="42.5" cy="-28.2" r="0.8" fill="#e8ffff" opacity="0.9" />
        </g>
      </g>

      {/* Brow ridge + scars */}
      <path
        d="M 21 -37 C 31 -45 48 -45 56 -36"
        fill="none"
        stroke="#141a1f"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <g stroke="#cfdbe4" strokeLinecap="round">
        <path d="M 34 -40 L 31 -30" strokeWidth="1.5" opacity="0.45" />
        <path d="M 42 -41 L 40 -32" strokeWidth="1.1" opacity="0.35" />
      </g>

      {/* Forehead rune */}
      <g
        transform="translate(6 -48) rotate(-8)"
        fill="none"
        stroke="url(#fenrirRune)"
        strokeWidth="1.5"
        strokeLinecap="square"
        opacity="0.62"
        style={{ filter: "drop-shadow(0 0 3px rgba(110,220,255,.5))" }}
      >
        <path d="M 0 -6 L 0 6 M 0 -1 L 6 4 L 0 8" />
      </g>

      {/* Mouth cavity and tongue — only visible once the jaw opens. */}
      <g ref={registerMouth} opacity={0}>
        <path
          d="M 48 7
             C 64 12 86 13 110 8
             C 111 14 105 20 96 22
             C 80 25 60 23 50 17
             C 45 13 44 9 48 7 Z"
          fill="url(#fenrirMouth)"
        />
        <path
          d="M 62 14 C 76 19 92 20 106 15 C 101 21 89 23 76 21 C 68 20 64 18 62 14 Z"
          fill="#5c2229"
          opacity="0.72"
        />
      </g>

      {/* Nose */}
      <path
        d="M 106 -10
           C 114 -14 124 -10 126 -2
           C 128 6 120 12 112 10
           C 104 8 102 1 106 -10 Z"
        fill="url(#fenrirNose)"
        stroke="#000"
        strokeWidth="1"
      />
      <ellipse cx="115" cy="-2" rx="2.4" ry="1.5" fill="#000" opacity="0.6" />
      <path
        d="M 109 -8 C 115 -11 122 -9 123 -4"
        fill="none"
        stroke="#8996a1"
        strokeWidth="1.2"
        opacity="0.4"
        strokeLinecap="round"
      />

      {/* Whisker dots */}
      <g fill="#0a0d10" opacity="0.6">
        <circle cx="98" cy="1" r="0.9" />
        <circle cx="104" cy="4" r="0.8" />
        <circle cx="92" cy="-1" r="0.8" />
      </g>
    </g>
  );
}

/** Upper canines and lip line drawn above the lower jaw. */
export function FenrirHeadForegroundArt({
  registerFangs,
}: {
  registerFangs?: (node: SVGGElement | null) => void;
} = {}) {
  return (
    <g>
      {/* Solid upper lip: closes the jagged muzzle silhouette at rest */}
      <path
        d="M 43 2
           C 62 8 88 9 113 4
           C 115 8 112 11 108 12
           C 88 15 64 14 48 9
           C 44 7 42 4 43 2 Z"
        fill="url(#fenrirMuzzle)"
        stroke={OUTLINE_SOFT}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M 48 6 C 70 8 94 9 111 8"
        fill="none"
        stroke="#05080a"
        strokeWidth="1.5"
        opacity="0.55"
        strokeLinecap="round"
      />
      {/* The canines fade in only while the jaw is open. */}
      <g ref={registerFangs} opacity={0}>
        <path d="M 84 7 L 87 13 L 90 7 Z" fill={IVORY} stroke="#5c5a52" strokeWidth="0.55" />
        <path d="M 100 7 L 102 12 L 105 7 Z" fill={IVORY} stroke="#5c5a52" strokeWidth="0.55" />
        <path d="M 84 7 L 87 11 L 88 7 Z" fill="#fffdf3" opacity="0.55" />
      </g>
      {/* Muzzle scars */}
      <g stroke="#d6e2ea" strokeLinecap="round" opacity="0.38">
        <path d="M 96 -10 L 92 2" strokeWidth="1.3" />
        <path d="M 103 -8 L 100 1" strokeWidth="0.9" />
      </g>
    </g>
  );
}

/** Lower jaw, chin fur and lower fangs. */
export function FenrirJawArt({
  registerFangs,
}: {
  registerFangs?: (node: SVGGElement | null) => void;
} = {}) {
  return (
    <g>
      <path
        d="M 43 -2
           C 54 15 80 24 103 18
           L 116 8
           C 120 4 119 0 114 -1
           L 53 -8
           C 47 -8 43 -5 43 -2 Z"
        fill="url(#fenrirFur)"
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M 52 15 C 70 24 90 26 106 19"
        fill="none"
        stroke="#0a0e12"
        strokeWidth="1.4"
        opacity="0.7"
        strokeLinecap="round"
      />
      <path
        d="M 46 2 C 60 12 82 19 103 16"
        fill="none"
        stroke="#9badba"
        strokeWidth="1.2"
        opacity="0.26"
        strokeLinecap="round"
      />
      {/* Chin ruff */}
      <g fill="url(#fenrirMane)" stroke={OUTLINE_SOFT} strokeWidth="0.8">
        <path d="M 52 19 L 48 31 L 62 23 Z" />
        <path d="M 68 22 L 68 34 L 80 24 Z" />
        <path d="M 84 22 L 88 32 L 96 22 Z" />
      </g>
      {/* Lower fangs reveal themselves with the mouth. */}
      <g ref={registerFangs} opacity={0}>
        <path d="M 89 10 L 91 4 L 94 10 Z" fill={IVORY_SHADE} stroke="#57544d" strokeWidth="0.5" />
        <path d="M 104 9 L 106 4 L 108 9 Z" fill={IVORY_SHADE} stroke="#57544d" strokeWidth="0.45" />
      </g>
    </g>
  );
}

/* ================================================================== *
 * LEGS
 * ================================================================== */

export function FenrirFrontUpperArt({ far = false }: { far?: boolean }) {
  const fill = far ? "url(#fenrirFurFar)" : "url(#fenrirFur)";
  return (
    <g>
      <path
        d="M -28 -18
           C -12 -30 20 -24 30 -2
           C 34 12 28 26 24 38
           L 18 58
           C 16 68 4 72 -6 66
           L -18 22
           C -24 8 -32 0 -28 -18 Z"
        fill={fill}
        stroke={OUTLINE}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {!far && (
        <>
          <path
            d="M -18 -10 C -4 -20 15 -16 24 -2 C 28 8 24 22 21 32"
            fill="none"
            stroke="url(#fenrirRim)"
            strokeWidth="2.4"
            opacity="0.45"
            strokeLinecap="round"
          />
          <g fill="none" stroke="#9badbb" strokeWidth="1.15" opacity="0.26" strokeLinecap="round">
            <path d="M -8 -12 C -2 4 -2 26 2 44" />
            <path d="M 6 -10 C 10 8 10 28 13 46" />
            <path d="M -12 -4 C -16 8 -14 20 -10 30" />
          </g>
          <g fill="url(#fenrirMane)" stroke={OUTLINE_SOFT} strokeWidth="0.8">
            <path d="M -14 24 C -20 30 -24 38 -24 44 C -18 38 -12 34 -6 32 Z" />
            <path d="M 2 32 C -2 38 -4 44 -2 50 C 3 44 8 40 14 38 Z" />
            <path d="M -18 10 C -24 16 -27 24 -26 30 C -21 24 -16 20 -10 18 Z" />
          </g>
          <path
            d="M -12 -8 C -2 -16 14 -14 24 -2"
            fill="none"
            stroke="#c2d2de"
            strokeWidth="3.2"
            opacity="0.12"
            strokeLinecap="round"
          />
        </>
      )}
    </g>
  );
}

export function FenrirFrontLowerArt({ far = false }: { far?: boolean }) {
  const fill = far ? "url(#fenrirFurFar)" : "url(#fenrirFur)";
  return (
    <g>
      <path
        d="M -15 -2
           C -15 -10 -8 -15 0 -15
           C 8 -15 15 -10 15 -2
           L 14 32
           C 13 44 9 53 3 58
           L -8 57
           C -14 46 -18 18 -15 -2 Z"
        fill={fill}
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {!far && (
        <>
          <path
            d="M -8 2 C -1 -3 8 -3 13 2"
            fill="none"
            stroke="#afc0cc"
            strokeWidth="1.6"
            opacity="0.35"
            strokeLinecap="round"
          />
          <path
            d="M 13 4 C 13 22 10 40 4 52"
            fill="none"
            stroke="#cfe6f5"
            strokeWidth="1.3"
            opacity="0.26"
            strokeLinecap="round"
          />
          <path
            d="M -9 8 C -7 22 -8 38 -5 50"
            fill="none"
            stroke="#0c1013"
            strokeWidth="1.2"
            opacity="0.5"
          />
          <path
            d="M -5 34 L -13 42 L -2 44 Z"
            fill="url(#fenrirMane)"
            stroke={OUTLINE_SOFT}
            strokeWidth="0.7"
          />
          {/* Dewclaw */}
          <path d="M -13 30 L -18 39 L -11 38 Z" fill={CLAW} opacity="0.8" />
        </>
      )}
    </g>
  );
}

export function FenrirHindUpperArt({ far = false }: { far?: boolean }) {
  const fill = far ? "url(#fenrirFurFar)" : "url(#fenrirHaunch)";
  return (
    <g>
      <path
        d="M -28 -20
           C -6 -32 22 -22 30 2
           C 34 18 28 40 22 56
           C 18 68 2 72 -8 64
           L -20 22
           C -26 10 -32 -2 -28 -20 Z"
        fill={fill}
        stroke={OUTLINE}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {!far && (
        <>
          <path
            d="M -18 -14 C 2 -24 20 -14 26 2 C 30 16 24 36 19 50"
            fill="none"
            stroke="url(#fenrirRim)"
            strokeWidth="2.4"
            opacity="0.42"
            strokeLinecap="round"
          />
          <g fill="none" stroke="#9badbb" strokeWidth="1.15" opacity="0.26" strokeLinecap="round">
            <path d="M -8 -16 C 2 -2 4 18 2 38" />
            <path d="M 6 -14 C 14 0 15 20 13 40" />
            <path d="M -14 -8 C -20 6 -20 24 -14 36" />
          </g>
          <path
            d="M -22 16 C -32 24 -33 38 -22 46 C -13 52 -5 48 -3 38 Z"
            fill="url(#fenrirMane)"
            stroke={OUTLINE_SOFT}
            strokeWidth="0.9"
          />
          <g fill="url(#fenrirMane)" stroke={OUTLINE_SOFT} strokeWidth="0.8">
            <path d="M -24 26 C -32 34 -35 44 -32 52 C -26 44 -20 40 -14 38 Z" />
            <path d="M -4 40 C -8 48 -8 56 -4 62 C 1 54 5 50 11 46 Z" />
          </g>
          <path
            d="M 12 -10 C 2 -18 -14 -12 -22 2"
            fill="none"
            stroke="#c2d2de"
            strokeWidth="3.4"
            opacity="0.12"
            strokeLinecap="round"
          />
        </>
      )}
    </g>
  );
}

export function FenrirHindLowerArt({ far = false }: { far?: boolean }) {
  const fill = far ? "url(#fenrirFurFar)" : "url(#fenrirFur)";
  return (
    <g>
      <path
        d="M -15 -2
           C -15 -10 -8 -15 0 -15
           C 8 -15 16 -10 16 -1
           L 9 31
           C 7 41 1 48 -6 47
           L -14 40
           C -16 25 -16 8 -15 -2 Z"
        fill={fill}
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {!far && (
        <>
          <path
            d="M -7 2 C 1 -3 10 -2 14 2"
            fill="none"
            stroke="#afc0cc"
            strokeWidth="1.5"
            opacity="0.32"
            strokeLinecap="round"
          />
          <path
            d="M 15 3 C 14 18 11 32 3 43"
            fill="none"
            stroke="#cfe6f5"
            strokeWidth="1.2"
            opacity="0.24"
            strokeLinecap="round"
          />
          <path
            d="M -8 9 C -6 20 -7 33 -5 41"
            fill="none"
            stroke="#0b0f12"
            strokeWidth="1.1"
            opacity="0.45"
          />
          <path
            d="M 2 26 L -5 35 L 4 35 Z"
            fill="url(#fenrirMane)"
            stroke={OUTLINE_SOFT}
            strokeWidth="0.7"
          />
        </>
      )}
    </g>
  );
}

export function FenrirHockArt({ far = false }: { far?: boolean }) {
  const fill = far ? "url(#fenrirFurFar)" : "url(#fenrirFur)";
  return (
    <g>
      <path
        d="M -11 -1
           C -11 -7 -5 -11 0 -11
           C 6 -11 12 -7 12 0
           L 7 18
           C 5 26 0 30 -5 29
           L -10 23 Z"
        fill={fill}
        stroke={OUTLINE}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {!far && (
        <>
          <path
            d="M -5 2 C 0 -1 6 -1 9 2"
            fill="none"
            stroke="#afc0cc"
            strokeWidth="1.3"
            opacity="0.35"
            strokeLinecap="round"
          />
          <path
            d="M 9 6 C 10 12 8 18 6 22"
            fill="none"
            stroke="#0b0f12"
            strokeWidth="1.1"
            opacity="0.4"
          />
        </>
      )}
    </g>
  );
}

export function FenrirPawArt({ far = false }: { far?: boolean }) {
  const fill = far ? "url(#fenrirFurFar)" : "url(#fenrirFur)";
  return (
    <g>
      <path
        d="M -14 -2
           C -15 -8 -9 -12 -2 -11
           C 5 -10 11 -7 14 -2
           L 21 3
           C 27 7 28 14 24 18
           C 20 22 13 23 7 23
           L -2 23
           C -11 23 -17 16 -17 8
           C -17 4 -16 1 -14 -2 Z"
        fill={fill}
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <g fill={fill} stroke={OUTLINE_SOFT} strokeWidth="0.7">
        <path d="M -15 -1 C -20 -5 -22 -9 -21 -12 C -17 -8 -13 -6 -9 -5 Z" />
      </g>
      {!far && (
        <>
          <g fill="none" stroke="#0c1013" strokeWidth="1.1" opacity="0.5" strokeLinecap="round">
            <path d="M 1 8 L 2 21" />
            <path d="M 10 9 L 11 22" />
            <path d="M 19 11 L 19 21" />
          </g>
          <path
            d="M -11 2 C -4 -2 4 -2 10 1"
            fill="none"
            stroke="#afc0cc"
            strokeWidth="1.3"
            opacity="0.32"
            strokeLinecap="round"
          />
        </>
      )}
      {/* Short, blunt claws */}
      <g fill={CLAW} stroke="#2a2925" strokeWidth="0.4">
        <path d="M 4 20 L 7 25 L 10 20 Z" />
        <path d="M 12 20 L 15 24 L 18 19 Z" />
        <path d="M 20 18 L 24 22 L 24 17 Z" />
      </g>
    </g>
  );
}

/* ================================================================== *
 * TAIL
 * ================================================================== */

export function FenrirTailSegmentArt({
  length,
  baseWidth = 22,
  tipWidth = 20,
  last = false,
  far = false,
}: {
  length: number;
  baseWidth?: number;
  tipWidth?: number;
  last?: boolean;
  far?: boolean;
}) {
  const fill = far ? "url(#fenrirFurFar)" : "url(#fenrirMane)";
  const l = length;
  const tip = -l;
  return (
    <g>
      {/* Base overlaps the previous segment; widths match at the joint so
          the fills merge into one continuous, bushy tail. */}
      <path
        d={`M 22 ${-baseWidth}
            C ${-l * 0.18} ${-baseWidth - 7} ${-l * 0.56} ${-tipWidth - 7} ${tip} ${-tipWidth}
            C ${tip - 6} ${-tipWidth * 0.35} ${tip - 6} ${tipWidth * 0.35} ${tip} ${tipWidth}
            C ${-l * 0.56} ${tipWidth + 7} ${-l * 0.18} ${baseWidth + 7} 22 ${baseWidth}
            C 27 ${baseWidth * 0.4} 27 ${-baseWidth * 0.4} 22 ${-baseWidth} Z`}
        fill={fill}
        stroke="none"
      />
      {/* Open outlines only: no stroke across the joint seam */}
      <path
        d={`M 16 ${-baseWidth} C ${-l * 0.18} ${-baseWidth - 7} ${-l * 0.56} ${-tipWidth - 7} ${tip} ${-tipWidth}`}
        fill="none"
        stroke={OUTLINE}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d={`M 16 ${baseWidth} C ${-l * 0.18} ${baseWidth + 7} ${-l * 0.56} ${tipWidth + 7} ${tip} ${tipWidth}`}
        fill="none"
        stroke={OUTLINE}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      {last && (
        <path
          d={`M ${tip} ${-tipWidth} C ${tip - 7} ${-tipWidth * 0.3} ${tip - 7} ${tipWidth * 0.3} ${tip} ${tipWidth}`}
          fill="none"
          stroke={OUTLINE}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      )}

      {/* Soft fur lobes give the tail volume without a spiked silhouette */}
      <g fill={fill} stroke={OUTLINE_SOFT} strokeWidth="0.7">
        <path d={`M ${-l * 0.14} ${-baseWidth + 1} C ${-l * 0.18} ${-baseWidth - 8} ${-l * 0.3} ${-baseWidth - 10} ${-l * 0.34} ${-baseWidth + 1} Z`} />
        <path d={`M ${-l * 0.44} ${-tipWidth + 1} C ${-l * 0.5} ${-tipWidth - 8} ${-l * 0.62} ${-tipWidth - 9} ${-l * 0.66} ${-tipWidth + 1} Z`} />
        <path d={`M ${-l * 0.2} ${baseWidth - 1} C ${-l * 0.26} ${baseWidth + 8} ${-l * 0.38} ${baseWidth + 9} ${-l * 0.42} ${baseWidth - 1} Z`} />
        <path d={`M ${-l * 0.54} ${tipWidth - 1} C ${-l * 0.6} ${tipWidth + 8} ${-l * 0.72} ${tipWidth + 8} ${-l * 0.76} ${tipWidth - 1} Z`} />
      </g>
      {!far && (
        <g fill="#b9c7d3" opacity="0.13">
          <path d={`M 12 ${-baseWidth + 3} C ${-l * 0.2} ${-baseWidth - 3} ${-l * 0.45} ${-tipWidth - 2} ${-l * 0.7} ${-tipWidth + 2} C ${-l * 0.45} ${-tipWidth + 4} ${-l * 0.2} ${-baseWidth + 1} 12 ${-baseWidth + 3} Z`} />
          <path d={`M 8 ${baseWidth - 4} C ${-l * 0.2} ${baseWidth + 2} ${-l * 0.42} ${tipWidth + 3} ${-l * 0.6} ${tipWidth} C ${-l * 0.4} ${tipWidth + 1} ${-l * 0.18} ${baseWidth} 8 ${baseWidth - 4} Z`} opacity="0.6" />
        </g>
      )}
      {last && (
        <g fill={fill} stroke={OUTLINE_SOFT} strokeWidth="0.7">
          <path d={`M ${tip + 4} ${-tipWidth + 1} C ${tip - 5} ${-tipWidth * 0.7} ${tip - 5} ${tipWidth * 0.7} ${tip + 4} ${tipWidth - 1} Z`} />
        </g>
      )}

      {!far && (
        <>
          <path
            d={`M 14 ${-baseWidth + 4} C ${-l * 0.25} ${-baseWidth - 2} ${-l * 0.55} ${-tipWidth - 2} ${-l * 0.84} ${-tipWidth + 2}`}
            fill="none"
            stroke="#b6c7d4"
            strokeWidth="1.6"
            opacity="0.28"
            strokeLinecap="round"
          />
          <path
            d={`M 2 ${baseWidth - 4} C ${-l * 0.24} ${baseWidth + 1} ${-l * 0.5} ${tipWidth + 2} ${-l * 0.68} ${tipWidth - 2}`}
            fill="none"
            stroke="#93a5b3"
            strokeWidth="1"
            opacity="0.22"
          />
        </>
      )}
    </g>
  );
}

/** Soft fur overlay that expands slightly while breathing. */
export function FenrirChestArt() {
  return (
    <g>
      <path
        d="M 28 -38
           C 58 -46 92 -32 102 -14
           C 92 12 66 26 36 20
           C 22 14 18 -24 28 -38 Z"
        fill="url(#fenrirMane)"
        opacity="0.5"
      />
      <path
        d="M 34 -30 C 54 -36 80 -30 92 -16"
        fill="none"
        stroke="#a1b2c0"
        strokeWidth="1.2"
        opacity="0.22"
        strokeLinecap="round"
      />
    </g>
  );
}

export type ArtSlotProps = { children?: ReactNode };
