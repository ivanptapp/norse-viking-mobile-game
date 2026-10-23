/**
 * Ragnar — body, armour and weapons.
 *
 * Every part is authored in the local coordinates of its joint (limbs point
 * down +y, the pelvis is the origin of the torso), so the rig can rotate a
 * group without ever re-rasterising the art.
 *
 * Materials follow the dark Nordic palette in RagnarMaterials: forged iron
 * with a honed edge, worn leather, olive wool, ash-brown fur and dirty linden
 * for the shield. Light comes from the upper left, with a cool rim on the
 * right, and every overlap gets an occlusion shadow so the armour reads as
 * layered plates instead of flat cut-outs.
 */

import { Ao, RAG, Strands, furHem, polar, round } from "./RagnarMaterials";

export {
  RagnarBeardArt,
  RagnarBraidArt,
  RagnarFaceArt,
  RagnarHairBackArt,
  RagnarHairFrontArt,
  RagnarNeckArt,
} from "./RagnarHeadArt";
export { RagnarDefs } from "./RagnarMaterials";

/* ================================================================== *
 * CLOAK — three chained fur-backed segments behind everything
 * ================================================================== */

export function RagnarCloakArt({
  index,
  length,
  top,
  bottom,
}: {
  index: number;
  length: number;
  top: number;
  bottom: number;
}) {
  const last = index === 2;
  const halfTop = top / 2;
  const halfBottom = bottom / 2;

  const hem = last
    ? furHem(-halfBottom, halfBottom, length - 26, 7, 18, 5, 40)
    : null;

  return (
    <g>
      {/* Heavy wool body */}
      <path
        d={`M ${-halfTop} -12
           C ${-halfTop - 10} ${length * 0.3} ${-halfBottom - 6} ${length * 0.66} ${-halfBottom - 2} ${length - 24}
           L ${-halfBottom + 4} ${length + (last ? 2 : 4)}
           L ${halfBottom - 4} ${length + (last ? 2 : 4)}
           L ${halfBottom + 2} ${length - 24}
           C ${halfBottom + 8} ${length * 0.7} ${halfTop + 8} ${length * 0.32} ${halfTop} -12
           C ${halfTop * 0.5} -20 ${-halfTop * 0.5} -20 ${-halfTop} -12 Z`}
        fill="url(#ragCloak)"
        stroke={RAG.line}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Fold structure — broad planes rather than stripes */}
      <g fill="none" strokeLinecap="round">
        <path
          d={`M ${-halfTop * 0.55} -6 C ${-halfTop * 0.6} ${length * 0.34} ${-halfBottom * 0.55} ${length * 0.68} ${-halfBottom * 0.42} ${length - 6}`}
          stroke="#090706"
          strokeWidth="2.6"
          opacity="0.55"
        />
        <path
          d={`M ${halfTop * 0.3} -8 C ${halfTop * 0.34} ${length * 0.36} ${halfBottom * 0.26} ${length * 0.7} ${halfBottom * 0.2} ${length - 8}`}
          stroke="#090706"
          strokeWidth="2.2"
          opacity="0.45"
        />
        <path
          d={`M ${-halfTop * 0.12} -10 C ${-halfTop * 0.08} ${length * 0.4} ${-halfBottom * 0.1} ${length * 0.74} ${-halfBottom * 0.08} ${length - 4}`}
          stroke="#0b0806"
          strokeWidth="1.6"
          opacity="0.4"
        />
      </g>

      {/* Fur nap: clumps breaking the outer silhouette */}
      <g fill="url(#ragFur)" opacity="0.9">
        <path
          d={`M ${-halfTop - 4} -8 C ${-halfTop - 16} ${length * 0.2} ${-halfTop - 18} ${length * 0.4} ${-halfTop - 8} ${length * 0.52}
             L ${-halfTop + 4} ${length * 0.44} Z`}
        />
        <path
          d={`M ${-halfTop - 6} ${length * 0.5} C ${-halfTop - 14} ${length * 0.66} ${-halfBottom - 10} ${length * 0.82} ${-halfBottom - 4} ${length - 20}
             L ${-halfBottom + 10} ${length - 26} Z`}
        />
        <path
          d={`M ${halfTop + 2} ${length * 0.08} C ${halfTop + 12} ${length * 0.3} ${halfBottom + 8} ${length * 0.6} ${halfBottom + 2} ${length - 20}
             L ${halfBottom - 12} ${length - 22} Z`}
        />
      </g>

      {/* Fur hem on the last segment */}
      {hem && (
        <>
          <path d={hem} fill="url(#ragFur)" stroke={RAG.line} strokeWidth="1.6" strokeLinejoin="round" />
          <g fill="none" stroke={RAG.furHi} strokeWidth="1.1" opacity="0.4" strokeLinecap="round">
            <path d={`M ${-halfBottom + 10} ${length - 26} C ${-halfBottom * 0.5} ${length - 20} ${halfBottom * 0.4} ${length - 24} ${halfBottom - 10} ${length - 28}`} />
          </g>
        </>
      )}

      {/* Cool rim on the leading edge */}
      <path
        d={`M ${halfBottom + 1} ${length - 24} C ${halfBottom + 7} ${length * 0.7} ${halfTop + 7} ${length * 0.32} ${halfTop} -12`}
        fill="none"
        stroke="#93aab6"
        strokeWidth="1.4"
        opacity="0.22"
      />
    </g>
  );
}

/* ================================================================== *
 * LEGS
 * ================================================================== */

export function RagnarThighArt({ far = false }: { far?: boolean }) {
  return (
    <g>
      {/* Baggy wool trouser leg */}
      <path
        d="M -34 -12
           C -39 14 -38 44 -34 70
           C -31 90 -27 108 -23 126
           L 20 126
           C 26 106 30 86 32 62
           C 34 36 32 12 26 -10 Z"
        fill={far ? "url(#ragWoolFar)" : "url(#ragWool)"}
        stroke={RAG.line}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Cloth folds: soft, low contrast */}
      <g fill="none" strokeLinecap="round">
        <path d="M -26 -6 C -30 24 -29 60 -24 94" stroke="#16140f" strokeWidth="2.6" opacity="0.35" />
        <path d="M 18 0 C 22 30 22 64 18 96" stroke="#12110c" strokeWidth="2.4" opacity="0.4" />
        <path d="M -10 18 C -12 44 -10 76 -8 106" stroke="#5a5548" strokeWidth="1.6" opacity="0.24" />
        <path d="M -22 44 C -16 52 -8 52 -2 46" stroke="#0f0e0a" strokeWidth="1.8" opacity="0.3" />
        <path d="M 4 70 C 10 78 18 78 24 72" stroke="#0f0e0a" strokeWidth="1.8" opacity="0.28" />
      </g>

      {/* Wrapped leather strap above the knee */}
      <path d="M -33 96 C -20 104 18 104 31 94 L 30 108 C 18 118 -20 118 -33 108 Z" fill="url(#ragLeatherFar)" stroke={RAG.line} strokeWidth="1.5" />
      <path d="M -30 100 C -18 107 16 107 29 99" fill="none" stroke="#8f6c42" strokeWidth="1" opacity="0.45" />

      {/* Occlusion where the skirt overlaps */}
      <path d="M -34 -12 C -20 -4 20 -4 26 -10 L 24 12 C 12 18 -22 18 -34 8 Z" fill="#080706" opacity="0.35" />
      {!far && (
        <>
          <path d="M -30 10 C -16 16 14 16 26 8" fill="none" stroke="#6a6557" strokeWidth="1.6" opacity="0.2" />
          <path d="M -26 -2 C -14 4 8 4 20 -2" fill="none" stroke="#000" strokeWidth="3" opacity="0.18" />
        </>
      )}
    </g>
  );
}

export function RagnarShinArt({ far = false }: { far?: boolean }) {
  return (
    <g>
      {/* Knee cop */}
      <path
        d="M -24 -8 C -12 -19 12 -19 24 -8 C 26 2 20 11 11 15 L -11 15 C -20 11 -26 2 -24 -8 Z"
        fill="url(#ragIronDark)"
        stroke={RAG.line}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M -20 -6 C -10 -14 10 -14 20 -6 C 17 0 9 3 0 3 C -9 3 -17 0 -20 -6 Z" fill="#6d787f" opacity="0.35" />
      <path d="M -20 -7 C -10 -15 8 -15 19 -8" fill="none" stroke="#c2ccd3" strokeWidth="1.3" opacity="0.3" />
      <path d="M -23 2 C -13 8 13 8 23 1" fill="none" stroke="#0f1418" strokeWidth="1.6" opacity="0.8" />
      <g fill="#8e9aa2" stroke="#12171b" strokeWidth="0.6">
        <circle cx="-15" cy="-2" r="1.7" />
        <circle cx="15" cy="-2" r="1.7" />
      </g>

      {/* Calf, wrapped in leather strips */}
      <path
        d="M -22 10
           C -27 28 -26 50 -22 70
           C -20 82 -19 92 -18 100
           L 18 100
           C 20 90 21 78 23 66
           C 27 46 27 26 23 10 Z"
        fill={far ? "url(#ragLeatherFar)" : "url(#ragLeather)"}
        stroke={RAG.line}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M -18 14 C -22 32 -21 54 -17 72"
        fill="none"
        stroke={far ? "#6a4a30" : "#8a6440"}
        strokeWidth="2.4"
        opacity="0.4"
        strokeLinecap="round"
      />
      <path
        d="M 17 16 C 21 34 21 54 17 74"
        fill="none"
        stroke="#100a06"
        strokeWidth="3"
        opacity="0.4"
        strokeLinecap="round"
      />
      {/* Wraps */}
      <g>
        {[24, 38, 52, 66, 80].map((y) => (
          <g key={y}>
            <path
              d={`M -22 ${y} C -12 ${y + 5} 12 ${y + 5} 22 ${y}`}
              fill="none"
              stroke="#1b1209"
              strokeWidth="2.6"
              opacity="0.75"
            />
            <path
              d={`M -21 ${y + 3} C -11 ${y + 8} 11 ${y + 8} 21 ${y + 3}`}
              fill="none"
              stroke="#a07a4d"
              strokeWidth="0.9"
              opacity="0.3"
            />
          </g>
        ))}
        {/* criss-cross lacing down the shin */}
        <g stroke="#241709" strokeWidth="1.2" opacity="0.5" fill="none">
          <path d="M -8 12 L 8 22 M 8 12 L -8 22 M -8 22 L 8 32 M 8 22 L -8 32 M -8 32 L 8 42 M 8 32 L -8 42" />
        </g>
      </g>

      {/* Fur cuff above the boot */}
      <path d={furHem(-24, 24, 94, 7, 8, 4, 18)} fill="url(#ragFur)" stroke={RAG.line} strokeWidth="1.2" strokeLinejoin="round" />
      <Strands
        color={RAG.furHi}
        width={1}
        opacity={0.35}
        paths={["M -16 82 C -12 88 -12 92 -14 96", "M 0 82 C 2 88 2 92 0 96", "M 15 82 C 18 88 18 92 16 96"]}
      />
    </g>
  );
}

export function RagnarBootArt({ far = false }: { far?: boolean }) {
  return (
    <g transform={`${far ? "" : "scale(-1 1) "}scale(1.12)`}>
      {/* Sole and heel */}
      <path
        d="M -18 18 C -20 26 -12 31 2 31 L 26 30 C 34 29 38 24 36 18 Z"
        fill="#191512"
        stroke={RAG.line}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Boot body */}
      <path
        d="M -17 -8
           C -20 2 -19 12 -16 20
           C -8 27 8 29 22 27
           C 32 25 37 20 37 13
           C 36 8 30 6 24 4
           C 18 2 14 -2 13 -10 Z"
        fill={far ? "url(#ragLeatherFar)" : "url(#ragLeather)"}
        stroke={RAG.line}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      {/* Toe cap */}
      <path
        d="M 22 27 C 32 25 37 20 37 13 C 34 9 27 8 21 9 C 20 16 20 22 22 27 Z"
        fill={far ? "#2c1c11" : "#3a2517"}
        stroke={RAG.line}
        strokeWidth="1.3"
      />
      <path d="M 24 12 C 29 12 33 14 35 17" fill="none" stroke="#8a6440" strokeWidth="1.3" opacity="0.4" />
      {/* Ankle strap + buckle */}
      <path d="M -18 2 C -8 8 8 9 16 6 L 16 12 C 8 15 -8 14 -18 8 Z" fill="url(#ragLeatherLight)" stroke={RAG.line} strokeWidth="1.2" />
      <rect x="-4" y="3" width="7" height="6" rx="1" fill="url(#ragIron)" stroke="#171c20" strokeWidth="0.9" />
      {/* Heel counter and highlight */}
      <path d="M -17 -8 C -20 0 -19 10 -16 18 C -12 20 -9 16 -10 8 C -11 0 -11 -6 -12 -10 Z" fill="#0f0b08" opacity="0.4" />
      <path d="M -14 -4 C -16 4 -15 12 -13 18" fill="none" stroke="#a37c52" strokeWidth="1.6" opacity="0.3" strokeLinecap="round" />
      <path d="M -2 -6 C 4 0 8 4 12 6" fill="none" stroke="#8a6440" strokeWidth="1.2" opacity="0.3" />
      {/* Mud at the sole */}
      <path d="M -14 24 C -4 28 12 29 26 26" fill="none" stroke="#0b0907" strokeWidth="2.2" opacity="0.5" />
    </g>
  );
}

/* ================================================================== *
 * SKIRT, TASSETS AND BELT HANGINGS
 * ================================================================== */

export function RagnarSkirtArt() {
  return (
    <g>
      {/* Wool under-skirt */}
      <path
        d="M -58 -18
           C -62 12 -58 42 -50 66
           L -30 78 L -6 70 L 8 80 L 30 70 L 50 78
           C 58 52 62 22 60 -16
           C 30 -6 -30 -6 -58 -18 Z"
        fill="url(#ragWool)"
        stroke={RAG.line}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <g fill="none" stroke="#15130e" strokeWidth="2" opacity="0.4">
        <path d="M -38 -8 C -40 18 -38 44 -34 62" />
        <path d="M -12 -4 C -13 22 -11 48 -9 66" />
        <path d="M 14 -4 C 14 20 16 46 18 64" />
        <path d="M 40 -10 C 42 16 44 42 42 62" />
      </g>

      {/* Fur hem */}
      <path d={furHem(-48, 50, 62, 10, 8, 7, 18)} fill="url(#ragFur)" stroke={RAG.line} strokeWidth="1.2" strokeLinejoin="round" />

      {/* Leather tassets hanging over the skirt */}
      {[-40, -14, 12, 38].map((x, i) => {
        const tilt = (i - 1.5) * 1.4;
        return (
          <g key={x} transform={`translate(${x} -20) rotate(${tilt})`}>
            <path
              d="M -13 0 L 13 0 L 12 30 C 12 38 6 42 0 44 C -6 42 -12 38 -12 30 Z"
              fill={i % 2 === 0 ? "url(#ragLeather)" : "url(#ragLeatherFar)"}
              stroke={RAG.line}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M -10 4 L 10 4" stroke="#b08a58" strokeWidth="1" opacity="0.35" />
            <circle cx="0" cy="8" r="2" fill="url(#ragIron)" stroke="#161b1f" strokeWidth="0.8" />
            <path
              d="M -6 34 C -2 37 2 37 6 34"
              fill="none"
              stroke="#1a1109"
              strokeWidth="1.3"
              opacity="0.5"
            />
          </g>
        );
      })}

      {/* A strip of mail under the front panel */}
      <path d="M -22 8 L 22 8 L 18 26 L -18 26 Z" fill="url(#ragMail)" opacity="0.65" />
      <path d="M -22 8 L 22 8 L 18 26 L -18 26 Z" fill="url(#ragMailShade)" opacity="0.7" />

      {/* Occlusion under the belt */}
      <path d="M -60 -16 C -30 -6 30 -6 60 -14 L 58 2 C 28 10 -30 10 -58 0 Z" fill="#060504" opacity="0.4" />
    </g>
  );
}

/* ================================================================== *
 * TORSO
 * ================================================================== */

export function RagnarTorsoArt() {
  return (
    <g>
      {/* Body silhouette under the kit: broad chest, cinched waist, solid hips */}
      <path
        d="M -86 -168
           C -92 -150 -88 -118 -80 -86
           C -74 -60 -68 -34 -62 -14
           L -56 14
           C -28 24 28 24 56 14
           L 62 -14
           C 68 -34 74 -60 80 -86
           C 88 -118 92 -150 86 -168
           C 60 -184 -60 -184 -86 -168 Z"
        fill="#191612"
        stroke={RAG.line}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Mail shirt under the plates: dense, dark, cool */}
      <path
        d="M -82 -164
           C -88 -146 -84 -114 -76 -84
           C -70 -58 -64 -32 -58 -12
           L -52 12
           C -24 20 24 20 52 12
           L 58 -12
           C 64 -32 70 -58 76 -84
           C 84 -114 88 -146 82 -164
           C 58 -178 -58 -178 -82 -164 Z"
        fill="url(#ragMail)"
        stroke={RAG.line}
        strokeWidth="1.4"
      />
      <path
        d="M -82 -164
           C -88 -146 -84 -114 -76 -84
           C -70 -58 -64 -32 -58 -12
           L -52 12
           C -24 20 24 20 52 12
           L 58 -12
           C 64 -32 70 -58 76 -84
           C 84 -114 88 -146 82 -164
           C 58 -178 -58 -178 -82 -164 Z"
        fill="url(#ragTorsoShade)"
      />

      {/* ---------------------------------------------------------- *
       * Cuirass — lamellar plates, tapered at the waist
       * ---------------------------------------------------------- */}
      <clipPath id="ragCuirassClip" clipPathUnits="userSpaceOnUse">
        <path
          d="M -70 -160
             C -44 -172 44 -172 70 -160
             C 66 -130 62 -100 60 -72
             C 58 -52 58 -36 57 -20
             C 30 -10 -30 -10 -57 -20
             C -58 -36 -58 -52 -60 -72
             C -62 -100 -66 -130 -70 -160 Z"
        />
      </clipPath>
      <g clipPath="url(#ragCuirassClip)">
        <rect x="-80" y="-176" width="160" height="176" fill="url(#ragLamellar)" />
        <rect x="-80" y="-176" width="160" height="176" fill="url(#ragTorsoShade)" opacity="0.8" />
        {/* leather side panels wrapping the ribs */}
        <path d="M -72 -164 C -78 -112 -72 -60 -62 -14 L -40 -10 C -50 -58 -54 -110 -52 -166 Z" fill="url(#ragLeather)" opacity="0.92" />
        <path d="M 72 -164 C 78 -112 72 -60 62 -14 L 40 -10 C 50 -58 54 -110 52 -166 Z" fill="url(#ragLeatherFar)" opacity="0.92" />
        <path d="M -66 -158 C -70 -110 -64 -58 -56 -16" fill="none" stroke="#a27c4e" strokeWidth="1" opacity="0.22" />
        <path d="M 66 -158 C 70 -110 64 -58 56 -16" fill="none" stroke="#0c0805" strokeWidth="1.5" opacity="0.45" />
        {/* chest shadow under the mantle */}
        <path d="M -60 -164 C -30 -150 30 -150 60 -164 L 60 -138 C 28 -126 -28 -126 -60 -138 Z" fill="#070605" opacity="0.55" />
      </g>
      {/* Cuirass rim */}
      <path
        d="M -70 -160
           C -44 -172 44 -172 70 -160
           C 66 -130 62 -100 60 -72
           C 58 -52 58 -36 57 -20
           C 30 -10 -30 -10 -57 -20
           C -58 -36 -58 -52 -60 -72
           C -62 -100 -66 -130 -70 -160 Z"
        fill="none"
        stroke="#0c0906"
        strokeWidth="1.8"
      />
      <path d="M -70 -160 C -44 -172 44 -172 70 -160" fill="none" stroke="#7d8790" strokeWidth="1.2" opacity="0.3" />

      {/* Crossed harness over the plates */}
      <path
        d="M -62 -166 C -34 -130 -6 -88 14 -44 L 30 -50 C 8 -96 -18 -142 -40 -174 Z"
        fill="url(#ragLeatherLight)"
        stroke={RAG.line}
        strokeWidth="1.6"
      />
      <path
        d="M 62 -166 C 40 -128 14 -86 -8 -44 L -24 -52 C -2 -98 22 -144 42 -176 Z"
        fill="url(#ragLeatherFar)"
        stroke={RAG.line}
        strokeWidth="1.6"
      />
      <g fill="none" stroke="#a9824f" strokeWidth="0.9" opacity="0.3">
        <path d="M -58 -162 C -32 -128 -6 -90 12 -48" />
        <path d="M 58 -162 C 38 -126 14 -88 -6 -48" />
      </g>
      <g>
        <rect x="-4" y="-110" width="18" height="13" rx="2" transform="rotate(54 5 -103)" fill="url(#ragBronze)" stroke={RAG.line} strokeWidth="1.1" />
        <circle cx="9" cy="-105" r="1.8" fill="#2a1c0d" />
        <rect x="-8" y="-66" width="18" height="13" rx="2" transform="rotate(-52 1 -59)" fill="url(#ragBronze)" stroke={RAG.line} strokeWidth="1.1" />
        <circle cx="-4" cy="-62" r="1.8" fill="#2a1c0d" />
      </g>

      {/* ---------------------------------------------------------- *
       * Fur mantle: the dominant shoulder mass
       * ---------------------------------------------------------- */}
      <g>
        {/* under-layer, slightly darker and lower */}
        <path
          d="M -122 -150 C -104 -160 -70 -166 -34 -162 C -44 -150 -76 -146 -96 -138 C -110 -132 -120 -140 -122 -150 Z"
          fill="#171310"
        />
        <path
          d="M 122 -150 C 104 -160 70 -166 34 -162 C 44 -150 76 -146 96 -138 C 110 -132 120 -140 122 -150 Z"
          fill="#14110e"
        />
        <path
          d="M -124 -156
             C -124 -182 -96 -202 -50 -200
             C -34 -194 -26 -178 -26 -158
             C -42 -148 -62 -150 -80 -144
             C -98 -138 -110 -144 -118 -140
             C -122 -136 -124 -148 -124 -156 Z"
          fill="url(#ragFur)"
          stroke={RAG.line}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M 124 -156
             C 124 -182 96 -202 50 -200
             C 34 -194 26 -178 26 -158
             C 42 -148 62 -150 80 -144
             C 98 -138 110 -144 118 -140
             C 122 -136 124 -148 124 -156 Z"
          fill="url(#ragFur)"
          stroke={RAG.line}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* collar standing behind the neck */}
        <path
          d="M -56 -186 C -34 -206 34 -206 56 -186 C 44 -170 18 -162 0 -164 C -20 -162 -44 -172 -56 -186 Z"
          fill="url(#ragFur)"
          stroke={RAG.line}
          strokeWidth="1.6"
        />
        {/* fur direction and highlights */}
        <g fill="none" strokeLinecap="round">
          <path d="M -118 -172 C -104 -188 -78 -197 -54 -196" stroke={RAG.furHi} strokeWidth="1.4" opacity="0.3" />
          <path d="M 118 -172 C 104 -188 78 -197 54 -196" stroke="#1c1712" strokeWidth="1.8" opacity="0.45" />
          <path d="M -112 -160 C -92 -150 -64 -150 -38 -156" stroke="#100d0a" strokeWidth="1.6" opacity="0.5" />
          <path d="M 112 -160 C 92 -150 64 -150 38 -156" stroke="#0d0a07" strokeWidth="2" opacity="0.55" />
          <path d="M -100 -184 C -96 -174 -92 -166 -88 -158" stroke="#7a6b55" strokeWidth="1.1" opacity="0.25" />
          <path d="M -74 -194 C -70 -184 -66 -174 -62 -166" stroke="#7a6b55" strokeWidth="1.1" opacity="0.22" />
          <path d="M 96 -182 C 92 -172 88 -164 84 -156" stroke="#5c5142" strokeWidth="1" opacity="0.2" />
        </g>
        {/* tufted lower edge */}
        <path d={furHem(-120, -27, -152, 9, 7, 3, 34)} fill="url(#ragFur)" stroke={RAG.line} strokeWidth="1.1" strokeLinejoin="round" />
        <path d={furHem(27, 120, -152, 9, 7, 9, 34)} fill="url(#ragFur)" stroke={RAG.line} strokeWidth="1.1" strokeLinejoin="round" />
        {/* fur nap: short clumps so the mass reads as hair, not stone */}
        <g fill="none" strokeLinecap="round">
          {[
            "M -112 -186 C -108 -178 -106 -172 -104 -166",
            "M -98 -192 C -94 -184 -92 -176 -90 -170",
            "M -84 -197 C -80 -189 -78 -181 -76 -174",
            "M -68 -199 C -65 -191 -62 -183 -60 -176",
            "M -50 -198 C -48 -190 -45 -182 -44 -174",
            "M -36 -192 C -34 -184 -32 -176 -31 -168",
            "M 112 -186 C 108 -178 106 -172 104 -166",
            "M 98 -192 C 94 -184 92 -176 90 -170",
            "M 84 -197 C 80 -189 78 -181 76 -174",
            "M 68 -199 C 65 -191 62 -183 60 -176",
            "M 50 -198 C 48 -190 45 -182 44 -174",
            "M 36 -192 C 34 -184 32 -176 31 -168",
          ].map((d) => (
            <path key={d} d={d} stroke="#8a7a62" strokeWidth="1" opacity="0.22" />
          ))}
          {[
            "M -106 -181 C -102 -173 -100 -167 -98 -161",
            "M -88 -189 C -84 -181 -82 -173 -80 -166",
            "M -72 -193 C -69 -185 -66 -177 -64 -170",
            "M -56 -194 C -54 -186 -51 -178 -50 -170",
            "M -42 -186 C -40 -178 -38 -170 -37 -162",
            "M 106 -181 C 102 -173 100 -167 98 -161",
            "M 88 -189 C 84 -181 82 -173 80 -166",
            "M 72 -193 C 69 -185 66 -177 64 -170",
            "M 56 -194 C 54 -186 51 -178 50 -170",
            "M 42 -186 C 40 -178 38 -170 37 -162",
          ].map((d) => (
            <path key={d} d={d} stroke="#0e0b08" strokeWidth="1.1" opacity="0.5" />
          ))}
        </g>
        {/* darker interior where the mantle meets the chest */}
        <path d="M -28 -158 C -20 -140 -12 -132 -4 -130 C 6 -132 16 -142 26 -158 C 12 -152 -12 -152 -28 -158 Z" fill="#0a0806" opacity="0.55" />
      </g>

      {/* Belt: wide, worn, iron buckle */}
      <path
        d="M -64 -34 C -32 -42 32 -42 64 -34 L 66 2 C 32 12 -32 12 -66 2 Z"
        fill="url(#ragLeather)"
        stroke={RAG.line}
        strokeWidth="1.8"
      />
      <path d="M -64 -26 C -32 -34 32 -34 64 -26" fill="none" stroke="#a9824f" strokeWidth="1.1" opacity="0.32" />
      <path d="M -65 -6 C -32 3 32 3 65 -6" fill="none" stroke="#100a06" strokeWidth="2" opacity="0.6" />
      <g fill="#8b969e" stroke="#12171b" strokeWidth="0.7">
        {[-52, -42, 42, 52].map((x) => (
          <circle key={x} cx={x} cy="-16" r="2.1" />
        ))}
      </g>

      {/* Buckle: square iron plate with a rune */}
      <g transform="translate(0 -16)">
        <rect x="-24" y="-17" width="48" height="34" rx="3.5" fill="url(#ragIronDark)" stroke={RAG.line} strokeWidth="2" />
        <rect x="-18" y="-11.5" width="36" height="23" rx="2" fill="none" stroke="#10161a" strokeWidth="1.3" opacity="0.85" />
        <path d="M -24 -8 L 24 -8" stroke="#c2ccd3" strokeWidth="0.9" opacity="0.22" />
        <g stroke="#241a0d" strokeWidth="2.2" fill="none" opacity="0.9">
          <path d="M 0 -8 L 0 8" />
          <path d="M -7 -4.5 L 7 3.5" />
          <path d="M 7 -4.5 L -7 3.5" />
        </g>
        <g fill="#8d99a1">
          <circle cx="-20" cy="-13.5" r="1.6" />
          <circle cx="20" cy="-13.5" r="1.6" />
          <circle cx="-20" cy="13.5" r="1.6" />
          <circle cx="20" cy="13.5" r="1.6" />
        </g>
      </g>

      {/* Hanging belt straps */}
      <path d="M 30 4 L 45 4 L 43 44 L 35 48 L 31 42 Z" fill="url(#ragLeatherLight)" stroke={RAG.line} strokeWidth="1.3" />
      <circle cx="37" cy="46" r="5.4" fill="none" stroke="url(#ragBronze)" strokeWidth="2.4" />
      <path d="M -30 4 L -17 4 L -19 38 L -27 40 Z" fill="url(#ragLeatherFar)" stroke={RAG.line} strokeWidth="1.3" />

      {/* Collar V: mail catching a little light */}
      <path d="M -18 -168 C -12 -152 -6 -142 0 -138 C 6 -142 12 -152 18 -168 Z" fill="#0a0b0c" opacity="0.55" />
      <path d="M -14 -166 C -8 -152 -3 -144 0 -141 C 3 -144 8 -152 14 -166" fill="none" stroke="#98a3ab" strokeWidth="0.9" opacity="0.22" />

      {/* Rim light down the right side */}
      <path
        d="M 84 -166 C 90 -146 84 -114 78 -84 C 72 -58 68 -32 62 -12"
        fill="none"
        stroke="#9db4c0"
        strokeWidth="1.4"
        opacity="0.16"
      />
    </g>
  );
}

/* ================================================================== *
 * ARMS
 * ================================================================== */

export function RagnarUpperArmArt({ far = false }: { far?: boolean }) {
  return (
    <g>
      {/* Mail sleeve under the pauldron */}
      <path
        d="M -27 -8 C -32 10 -31 26 -26 38 L 24 38 C 28 24 29 8 25 -8 C 12 -16 -14 -16 -27 -8 Z"
        fill="url(#ragMail)"
        stroke={RAG.line}
        strokeWidth="1.4"
      />
      <path
        d="M -27 -8 C -32 10 -31 26 -26 38 L 24 38 C 28 24 29 8 25 -8 C 12 -16 -14 -16 -27 -8 Z"
        fill="#0b0d0f"
        opacity="0.35"
      />
      {/* Ragged mail hem */}
      <path
        d="M -26 34 L -20 44 L -14 35 L -8 45 L -2 35 L 5 44 L 11 35 L 18 43 L 24 35 Z"
        fill="url(#ragMail)"
        stroke={RAG.line}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Bare arm: deltoid, biceps, triceps */}
      <path
        d="M -25 30
           C -30 46 -30 66 -26 82
           C -23 92 -20 98 -18 102
           L 18 102
           C 22 94 25 82 26 68
           C 28 52 27 36 24 28
           C 10 22 -12 22 -25 30 Z"
        fill={far ? "url(#ragSkinFar)" : "url(#ragSkin)"}
        stroke={RAG.line}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      {/* Biceps mass */}
      <path
        d="M -20 34 C -27 48 -27 66 -22 80 C -14 72 -12 54 -14 40 Z"
        fill="#d3a57f"
        opacity={far ? 0.14 : 0.3}
      />
      <path
        d="M 6 30 C 19 34 22 50 20 68 C 18 80 16 90 14 98 C 22 88 24 68 23 52 C 22 40 18 32 6 30 Z"
        fill="#4a2e1f"
        opacity="0.45"
      />
      <g fill="none" strokeLinecap="round">
        <path d="M -20 36 C -25 50 -25 66 -21 80" stroke="#e0b48d" strokeWidth="2.2" opacity="0.35" />
        <path d="M -12 44 C -10 58 -10 70 -12 82" stroke="#6f452d" strokeWidth="1.4" opacity="0.5" />
        <path d="M 12 46 C 15 60 15 72 13 86" stroke="#5c3a27" strokeWidth="1.6" opacity="0.45" />
        <path d="M -18 92 C -8 98 8 98 16 92" stroke="#8a5b3e" strokeWidth="1.6" opacity="0.4" />
      </g>
      {/* Arm ring */}
      <path d="M -26 76 C -14 84 12 84 25 76 L 26 88 C 13 96 -14 96 -26 88 Z" fill="url(#ragLeatherFar)" stroke={RAG.line} strokeWidth="1.4" />
      <path d="M -24 79 C -12 86 12 86 24 79" fill="none" stroke="#8f6b42" strokeWidth="0.9" opacity="0.4" />
    </g>
  );
}

export function RagnarForearmArt({ far = false }: { far?: boolean }) {
  return (
    <g>
      {/* Wrist / forearm skin under the bracer */}
      <path d="M -15 -4 C -17 4 -15 10 0 12 C 14 10 16 4 14 -4 Z" fill={far ? "url(#ragSkinFar)" : "url(#ragSkin)"} stroke={RAG.line} strokeWidth="1.5" />

      {/* Leather bracer */}
      <path
        d="M -20 0
           C -24 24 -23 52 -19 78
           C -8 88 9 88 20 78
           C 24 52 24 24 19 0
           C 8 -6 -8 -6 -20 0 Z"
        fill={far ? "url(#ragLeatherFar)" : "url(#ragLeatherLight)"}
        stroke={RAG.line}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M -17 4 C -20 26 -19 52 -15 74"
        fill="none"
        stroke="#a47c4f"
        strokeWidth="2"
        opacity="0.3"
        strokeLinecap="round"
      />
      <path
        d="M 15 6 C 18 28 18 52 15 74"
        fill="none"
        stroke="#150d07"
        strokeWidth="3"
        opacity="0.35"
        strokeLinecap="round"
      />
      {/* Straps */}
      {[16, 40, 62].map((y, i) => (
        <g key={y}>
          <path
            d={`M -21 ${y} C -10 ${y + 5} 10 ${y + 5} 21 ${y}`}
            fill="none"
            stroke="#1a1008"
            strokeWidth="2.8"
            opacity="0.8"
          />
          <path
            d={`M -20 ${y + 3} C -10 ${y + 8} 10 ${y + 8} 20 ${y + 3}`}
            fill="none"
            stroke="#b08a58"
            strokeWidth="0.9"
            opacity="0.3"
          />
          <rect x="-4" y={y + 1} width="8" height="6" rx="1.2" fill="url(#ragIron)" stroke="#14181b" strokeWidth="0.8" opacity={i === 1 ? 0.95 : 0.7} />
        </g>
      ))}
      {/* Tooled plate on the outside */}
      <path d="M -14 22 L 14 22 L 12 36 L -12 36 Z" fill="url(#ragLeather)" stroke="#1a1108" strokeWidth="1" opacity="0.9" />
      <g stroke="#c3a269" strokeWidth="0.9" opacity="0.4" fill="none">
        <path d="M -8 26 L 8 26 L 0 33 Z" />
      </g>
      <Strands
        color="#7d5c3a"
        width={1}
        opacity={0.22}
        paths={["M -12 8 C -14 28 -13 48 -11 68", "M 4 10 C 3 30 4 50 6 70"]}
      />
      {/* Cuff */}
      <path d="M -20 74 C -9 83 9 83 20 74 L 20 82 C 9 91 -9 91 -20 82 Z" fill="url(#ragLeatherFar)" stroke={RAG.line} strokeWidth="1.2" />
    </g>
  );
}

export function RagnarHandArt({ far = false }: { far?: boolean }) {
  return (
    <g>
      {/* Fist closed around a haft */}
      <path
        d="M -15 -6
           C -22 4 -23 20 -18 29
           C -10 37 8 37 16 29
           C 21 20 21 4 14 -6
           C 6 -12 -7 -12 -15 -6 Z"
        fill={far ? "url(#ragSkinFar)" : "url(#ragSkin)"}
        stroke={RAG.line}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      {/* Finger segments wrapping the grip */}
      <g>
        {[
          { y: 8, w: 1 },
          { y: 16, w: 0.96 },
          { y: 24, w: 0.9 },
        ].map(({ y, w }) => (
          <g key={y}>
            <path
              d={`M ${-14 * w} ${y} C ${-6 * w} ${y + 6} ${7 * w} ${y + 6} ${13 * w} ${y - 1}`}
              fill="none"
              stroke="#5b3826"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d={`M ${-13 * w} ${y - 2} C ${-5 * w} ${y + 3} ${6 * w} ${y + 3} ${12 * w} ${y - 3}`}
              fill="none"
              stroke="#d2a57e"
              strokeWidth="1.3"
              opacity="0.35"
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>
      {/* Thumb, tucked over the grip */}
      <path
        d="M -12 -6 C -4 -14 8 -14 13 -8 C 16 -3 13 2 8 2 C 2 2 -4 -1 -12 -6 Z"
        fill={far ? "url(#ragSkinFar)" : "url(#ragSkin)"}
        stroke={RAG.line}
        strokeWidth="1.4"
      />
      <path d="M -8 -6 C -2 -10 6 -10 10 -7" fill="none" stroke="#e0b48d" strokeWidth="1.2" opacity="0.4" />
      {/* Knuckle shadow */}
      <path d="M -13 2 C -6 -2 6 -2 13 2" fill="none" stroke="#5c3a27" strokeWidth="1.4" opacity="0.5" />
    </g>
  );
}

/* ================================================================== *
 * PAULDRONS — child of the shoulder joint, so they follow the arm
 * ================================================================== */

export function RagnarPauldronArt({ far = false }: { far?: boolean }) {
  return (
    <g transform={far ? "translate(4 -1) scale(-0.7 0.7)" : "translate(-4 -1) scale(0.7)"}>
      {/* Fur under the plate */}
      <path
        d={furHem(-46, 44, 12, 5, 12, far ? 4 : 8, 22)}
        fill="url(#ragFur)"
        stroke={RAG.line}
        strokeWidth="1.1"
        strokeLinejoin="round"
        opacity={far ? 0.9 : 1}
      />
      {/* Upper cap: broad, angular, tilted into the shoulder */}
      <path
        d="M -46 4
           C -46 -12 -32 -23 -8 -25
           C 16 -26 36 -16 42 -3
           C 45 4 40 10 30 11
           L -30 11
           C -41 10 -46 9 -46 4 Z"
        fill="#2c343a"
        stroke={RAG.line}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Two overlapping lames below the cap */}
      <path
        d="M -45 6 C -34 -2 -18 -6 0 -5.5 C 20 -5 36 0 42 6
           C 43 10 39 13 31 14 L -30 14 C -39 13 -44 11 -45 6 Z"
        fill="url(#ragIronDark)"
        stroke={RAG.line}
        strokeWidth="1.2"
      />
      <path
        d="M -42 11 C -30 6 -14 4 2 4 C 20 4 34 8 40 12
           C 39 16 32 18 24 18 L -26 18 C -35 17 -41 15 -42 11 Z"
        fill="#222a30"
        stroke={RAG.line}
        strokeWidth="1.1"
      />
      <path d="M -42 8 C -30 1 -14 -3 2 -2.5 C 20 -2 34 3 40 8" fill="none" stroke="#aab5bd" strokeWidth="1" opacity="0.22" />
      <path d="M -38 14 C -16 9 18 9 37 14" fill="none" stroke="#0f1418" strokeWidth="1.6" opacity="0.65" />
      {/* Hammered surface */}
      <g fill="none" stroke="#1b2126" strokeWidth="0.9" opacity="0.45">
        <path d="M -32 -8 C -25 -12 -17 -13 -11 -11" />
        <path d="M 8 -13 C 17 -14 25 -10 29 -5" />
        <path d="M -14 -2 C -4 -4 8 -3 16 -1" />
      </g>
      {/* Bronze boss and rivets */}
      <g>
        <circle cx="-8" cy="-6" r="8.5" fill="url(#ragBronze)" stroke={RAG.line} strokeWidth="1.3" opacity="0.9" />
        <circle cx="-8" cy="-6" r="4.4" fill="#3a2a15" stroke="#1a1208" strokeWidth="1" />
        <path d="M -10.6 -8.6 C -6 -11.4 0 -10 2 -6" fill="none" stroke="#f0d9a6" strokeWidth="1.2" opacity="0.45" />
      </g>
      <g fill="#93a0a8" stroke="#12171b" strokeWidth="0.7">
        {[-34, -22, 24, 36].map((x) => (
          <circle key={x} cx={x} cy="8" r="1.8" />
        ))}
      </g>
      <path d="M -40 -10 C -34 -19 -20 -23 -8 -23" fill="none" stroke="#c6d0d7" strokeWidth="1.4" opacity="0.28" />
      {/* Occlusion under the plate */}
      <Ao cx={0} cy={18} rx={36} ry={6} opacity={0.45} />
    </g>
  );
}

/* ================================================================== *
 * SHIELD — linden planks, iron rim, raven emblem
 * ================================================================== */

export function RagnarShieldArt() {
  const R = 72;
  return (
    <g transform="translate(10 -12)">
      {/* Shadow cast on the body behind the shield */}
      <ellipse cx="7" cy="9" rx={R + 3} ry={R + 1} fill="#050403" opacity="0.55" />

      {/* Linden boards */}
      <circle r={R} fill="url(#ragPlanks)" />
      <circle r={R} fill="url(#ragShieldShade)" />
      <circle r={R} fill="url(#ragTorsoShade)" opacity="0.35" />

      {/* Board joints with a lit lower lip */}
      <g>
        {[-36, 0, 36].map((y) => {
          const half = Math.sqrt(R * R - y * y);
          return (
            <g key={y}>
              <path d={`M ${-half} ${y} L ${half} ${y}`} stroke="#20130a" strokeWidth="1.6" opacity="0.8" />
              <path d={`M ${-half + 6} ${y + 1.4} L ${half - 6} ${y + 1.4}`} stroke="#a07846" strokeWidth="0.8" opacity="0.35" />
            </g>
          );
        })}
      </g>
      <g stroke="#3a2512" strokeWidth="0.8" opacity="0.3" fill="none">
        <path d="M -58 -54 C -32 -48 -8 -56 16 -50" />
        <path d="M -64 20 C -38 26 -10 18 20 24" />
        <path d="M -44 48 C -22 54 4 48 24 52" />
      </g>

      {/* Iron rim, segmented and worn */}
      <circle r={R - 1.5} fill="none" stroke="url(#ragRim)" strokeWidth="9" />
      <circle r={R - 6} fill="none" stroke="#0b0f12" strokeWidth="1.3" opacity="0.75" />
      <circle r={R + 3} fill="none" stroke="#080b0d" strokeWidth="1.5" opacity="0.9" />
      <g stroke="#11161a" strokeWidth="1.2" opacity="0.55">
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 + 0.2;
          return (
            <path
              key={i}
              d={`M ${round(Math.cos(a) * (R - 5))} ${round(Math.sin(a) * (R - 5))} L ${round(Math.cos(a) * (R + 1))} ${round(Math.sin(a) * (R + 1))}`}
            />
          );
        })}
      </g>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 + 0.35;
        const [x, y] = polar(0, 0, R - 3.5, (a * 180) / Math.PI);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={i % 3 === 0 ? 2 : 1.7} fill="#8b959d" stroke="#12171b" strokeWidth="0.7" />
            <circle cx={x - 0.5} cy={y - 0.6} r="0.6" fill="#dbe3e8" opacity="0.55" />
          </g>
        );
      })}
      {/* Rust patches */}
      <g fill="#6b4326" opacity="0.4">
        <path d="M 42 -46 C 52 -42 54 -32 46 -28 C 40 -34 38 -42 42 -46 Z" />
        <path d="M -52 22 C -44 26 -42 36 -50 40 C -56 34 -56 26 -52 22 Z" />
      </g>

      {/* Painted raven, worn where the hand rubs */}
      <g transform="translate(0 -1) scale(0.78)">
        <g fill="#14100d" opacity="0.92">
          <path d="M -8 -20 C -26 -38 -50 -48 -66 -44 C -58 -28 -44 -14 -24 -5 C -16 -2 -10 -10 -8 -20 Z" />
          <path d="M 8 -20 C 26 -38 50 -48 66 -44 C 58 -30 44 -16 24 -7 C 16 -4 10 -12 8 -20 Z" />
          <path d="M -6 -24 C -16 -14 -18 8 -14 30 L -7 52 C -3 58 3 58 7 52 L 14 28 C 18 6 15 -14 6 -24 Z" />
          <path d="M -7 -40 C -1 -48 10 -46 13 -37 C 15 -29 8 -22 0 -24 C -7 -26 -11 -33 -7 -40 Z" />
          <path d="M -3 -41 L -22 -36 L -4 -31 Z" />
          <path d="M -4 46 L 0 70 L 8 46 Z" />
        </g>
        <g fill="#7a5533" opacity="0.5">
          <circle cx="-38" cy="-30" r="3.2" />
          <circle cx="-32" cy="-24" r="1.9" />
          <circle cx="30" cy="-26" r="2.6" />
          <circle cx="6" cy="26" r="2.2" />
          <circle cx="-1" cy="10" r="1.7" />
        </g>
        <g fill="none" stroke="#463121" strokeWidth="0.9" opacity="0.6">
          <path d="M -14 -12 C -30 -22 -44 -31 -56 -35" />
          <path d="M 14 -12 C 30 -22 44 -31 56 -35" />
          <path d="M -4 6 C 0 20 1 32 3 42" />
        </g>
      </g>

      {/* Iron boss */}
      <circle r={16.5} fill="url(#ragBoss)" stroke="#0d1215" strokeWidth="2" />
      <circle r={11.4} fill="none" stroke="#3f484f" strokeWidth="1.1" opacity="0.7" />
      <path d="M -9.5 -7 C -2 -15 8 -14 13 -5" fill="none" stroke="#eef5f8" strokeWidth="2" opacity="0.32" strokeLinecap="round" />
      <circle cx="-6" cy="-6" r="2" fill="#ffffff" opacity="0.35" />
    </g>
  );
}

/* ================================================================== *
 * AXE — bearded war axe, forged iron, honed edge
 * ================================================================== */

export function RagnarAxeArt() {
  return (
    <g transform="scale(1.12)">
      {/* Haft */}
      <path
        d="M -5 32 L 5 32 L 5.6 -166 L -5.6 -166 Z"
        fill="url(#ragWood)"
        stroke={RAG.line}
        strokeWidth="1.6"
      />
      <path d="M -2.4 28 L -2.4 -164" stroke="#a87f4c" strokeWidth="1.2" opacity="0.35" />
      <path d="M 3 30 L 3 -160" stroke="#241408" strokeWidth="1.2" opacity="0.6" />

      {/* Grip wraps */}
      <g>
        {[20, 8, -4].map((y) => (
          <g key={y}>
            <path d={`M -6 ${y} L 6 ${y} L 6 ${y - 10} L -6 ${y - 10} Z`} fill="url(#ragLeatherFar)" stroke={RAG.line} strokeWidth="1" />
            <path d={`M -6 ${y - 2} L 6 ${y - 9}`} stroke="#a9824f" strokeWidth="1" opacity="0.45" />
          </g>
        ))}
        <path d="M -6 -36 L 6 -36 L 6 -46 L -6 -46 Z" fill="url(#ragLeatherFar)" stroke={RAG.line} strokeWidth="1" />
      </g>

      {/* Head */}
      <g>
        {/* Blade: bearded, sweeping down and back */}
        <path
          d="M -5 -170
             L -46 -178
             C -72 -184 -90 -196 -96 -212
             L -70 -216
             C -40 -214 -16 -204 -6 -190 Z"
          fill="url(#ragBlade)"
          stroke={RAG.line}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* The beard below the eye */}
        <path
          d="M -8 -190
             C -26 -188 -50 -180 -64 -168
             C -74 -158 -78 -146 -76 -136
             C -68 -140 -54 -150 -38 -158
             C -24 -165 -13 -170 -8 -174 Z"
          fill="url(#ragBlade)"
          stroke={RAG.line}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Honed edge */}
        <path
          d="M -40 -177 C -66 -183 -84 -195 -92 -210"
          fill="none"
          stroke="#d3dade"
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M -63 -168 C -72 -158 -75 -147 -74 -139"
          fill="none"
          stroke="#d3dade"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Nicks along the edge */}
        <g fill="#20262a">
          <path d="M -80 -200 L -76 -196 L -82 -194 Z" />
          <path d="M -69 -159 L -65 -155 L -70 -153 Z" />
        </g>
        {/* Hammered cheek and engraving */}
        <g fill="none" stroke="#20262b" strokeWidth="1.2" opacity="0.65">
          <path d="M -28 -192 C -40 -188 -52 -180 -58 -170" />
          <path d="M -18 -186 C -30 -180 -40 -172 -46 -162" />
          <path d="M -46 -206 C -34 -204 -22 -198 -14 -192" />
        </g>
        <g fill="none" stroke="#9aa5ac" strokeWidth="1" opacity="0.3">
          <path d="M -24 -198 C -34 -194 -44 -187 -50 -178" />
        </g>
        <g stroke="#1c2226" strokeWidth="1.8" fill="none" opacity="0.75">
          <path d="M -34 -180 L -34 -164 M -40 -174 L -28 -170" />
        </g>

        {/* Socket and langets */}
        <path
          d="M -9 -204 L 11 -204 L 12 -168 L -10 -168 Z"
          fill="url(#ragIronDark)"
          stroke={RAG.line}
          strokeWidth="1.4"
        />
        <path d="M -8 -198 L 10 -198" stroke="#96a1a9" strokeWidth="1" opacity="0.35" />
        <circle cx="1" cy="-186" r="2.4" fill="#11161a" />
        <path d="M -5 -166 L -1 -166 L -1 -140 L -5 -140 Z" fill="url(#ragBronze)" stroke={RAG.line} strokeWidth="0.9" />
        <path d="M 1 -166 L 5 -166 L 5 -142 L 1 -142 Z" fill="url(#ragBronze)" stroke={RAG.line} strokeWidth="0.9" />

        {/* Poll / hammer on the back */}
        <path
          d="M 8 -200 L 26 -198 L 27 -176 L 9 -176 Z"
          fill="url(#ragIron)"
          stroke={RAG.line}
          strokeWidth="1.4"
        />
        <path d="M 26 -198 L 27 -176" stroke="#c0cad1" strokeWidth="1.6" opacity="0.35" />
      </g>

      {/* Butt cap */}
      <path d="M -7 30 L 7 30 L 8 40 L -8 40 Z" fill="url(#ragBronze)" stroke={RAG.line} strokeWidth="1.2" />
      <path d="M -6 33 L 6 33" stroke="#e0c08a" strokeWidth="1" opacity="0.4" />
    </g>
  );
}
