"use client";

import type { CSSProperties } from "react";

/**
 * El terreno.
 *
 * El fondo es una ilustración, así que el trabajo de la arena no es dibujar
 * otro paisaje encima sino *asentar* a los combatientes: niebla que separa el
 * horizonte del suelo, un suelo que oscurece hacia el espectador, siluetas de
 * hierba y piedra en primer plano (que dan profundidad y tapan los pies), y
 * una sombra de contacto bajo cada héroe.
 *
 * Así el personaje deja de flotar sobre una foto y pasa a estar de pie.
 */

export type TerrainTone = "snow" | "ember" | "mist" | "none";

const TONES: Record<
  Exclude<TerrainTone, "none">,
  { mist: string; glow: string; ground: string; shadow: string }
> = {
  snow: {
    mist: "rgba(186,230,253,.30)",
    glow: "rgba(125,211,252,.16)",
    ground: "rgba(8,14,20,.72)",
    shadow: "#000",
  },
  ember: {
    mist: "rgba(253,186,116,.18)",
    glow: "rgba(251,146,60,.20)",
    ground: "rgba(20,12,8,.74)",
    shadow: "#000",
  },
  mist: {
    mist: "rgba(203,213,225,.22)",
    glow: "rgba(148,163,184,.14)",
    ground: "rgba(10,14,13,.72)",
    shadow: "#000",
  },
};

export function BattleTerrain({ tone = "mist" }: { tone?: TerrainTone }) {
  if (tone === "none") return null;
  const t = TONES[tone];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Resplandor del horizonte: separa cielo de suelo. */}
      <div
        className="absolute inset-x-0"
        style={{
          top: "36%",
          height: "26%",
          background: `linear-gradient(180deg, transparent 0%, ${t.glow} 55%, transparent 100%)`,
          filter: "blur(18px)",
        }}
      />

      {/* Niebla baja: da escala y esconde el borde del suelo pintado. */}
      <div
        className="battle-mist absolute -inset-x-10"
        style={{
          top: "47%",
          height: 110,
          background: `radial-gradient(ellipse at 50% 50%, ${t.mist} 0%, transparent 70%)`,
          filter: "blur(14px)",
        }}
      />
      <div
        className="battle-mist-slow absolute -inset-x-10"
        style={{
          top: "55%",
          height: 80,
          background: `radial-gradient(ellipse at 50% 50%, ${t.mist} 0%, transparent 72%)`,
          filter: "blur(18px)",
          opacity: 0.7,
        }}
      />

      {/* Suelo: oscurece hacia el espectador para que las figuras recorten. */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          top: "44%",
          background: `linear-gradient(180deg, transparent 0%, ${t.ground} 34%, rgba(2,4,3,.97) 100%)`,
        }}
      />

      {/* Tierra pisoteada: un charco cálido donde se cruzan las formaciones. */}
      <div
        className="absolute inset-x-0"
        style={{
          top: "58%",
          bottom: 0,
          background:
            "radial-gradient(ellipse 68% 62% at 50% 72%, rgba(92,70,42,.42), rgba(40,30,20,.16) 46%, transparent 72%)",
          mixBlendMode: "overlay",
        }}
      />

      {/* Sombra de la formación: asienta el grupo, no sólo a cada héroe. */}
      <div
        className="absolute inset-x-0"
        style={{
          top: "56%",
          bottom: 0,
          background:
            "radial-gradient(ellipse 52% 46% at 50% 76%, rgba(0,0,0,.55), rgba(0,0,0,.22) 52%, transparent 78%)",
        }}
      />

      {/* Franja de tierra pisoteada bajo la formación. */}
      <div
        className="absolute inset-x-0"
        style={{
          top: "66%",
          height: "30%",
          background:
            "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(120,96,64,.14), transparent 70%)",
          mixBlendMode: "soft-light",
        }}
      />

      <Foreground tone={tone} />

      {/* Viñeta final. */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow:
            "inset 0 0 90px rgba(0,0,0,.6), inset 0 -40px 70px rgba(0,0,0,.55)",
        }}
      />
    </div>
  );
}

/** Siluetas de hierba, piedras y astillas: el "primer plano" del encuadre. */
function Foreground({ tone }: { tone: TerrainTone }) {
  const snow = tone === "snow";
  return (
    <svg
      className="absolute inset-x-0 bottom-0 w-full"
      style={{ height: "22%" }}
      viewBox="0 0 400 120"
      preserveAspectRatio="none"
      aria-hidden
    >
      {!snow && (
        <g fill="rgba(5,8,7,.92)">
          <path d="M0 120V86c10-2 14-10 20-18 2 10 6 14 10 20 3-8 7-12 12-16 0 8 3 14 6 20 6-4 10-10 16-12 1 8 5 12 9 16 4-6 9-10 14-12 1 8 4 12 8 16H0Z" />
          <path d="M400 120V78c-9-1-13-9-18-16-2 9-6 13-10 18-3-7-7-11-11-14 0 7-3 12-6 17-6-3-9-9-15-10-1 7-5 11-9 15-4-5-8-9-13-11-1 7-4 11-8 14h90Z" />
          <path d="M40 120c14-4 26-12 34-22 6 8 14 14 26 16 10 2 20 2 30 6H40Z" />
          <path d="M300 120c12-6 22-14 30-24 8 10 18 16 30 18 10 2 20 2 30 6h-90Z" />
        </g>
      )}
      {snow && (
        <g fill="rgba(226,240,252,.20)">
          <path d="M0 120V96c22-6 40-14 58-16 20-2 34 6 52 10 22 4 40 0 60-2 18-2 34 4 52 8h-222Z" />
          <path d="M150 120c30-4 60-10 92-10 28 0 54 6 78 10h-170Z" fill="rgba(226,240,252,.12)" />
          <path d="M400 120v-16c-20-6-40-10-58-8-16 2-30 8-46 10-18 2-34-2-52 0l-14 14h170Z" />
        </g>
      )}
    </svg>
  );
}

/** Sombra de contacto: lo que hace que un personaje esté *sobre* el suelo. */
export function ContactShadow({
  width,
  strength = 1,
}: {
  width: number;
  strength?: number;
}) {
  return (
    <div
      className="battle-contact-shadow"
      style={{
        width,
        height: width * 0.3,
        background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,${0.62 * strength}) 0%, rgba(0,0,0,${0.34 * strength}) 40%, rgba(0,0,0,0) 72%)`,
      }}
    />
  );
}

/** Charco de luz bajo un héroe con la definitiva lista. */
export function UltPool({ width, color }: { width: number; color: string }) {
  return (
    <div
      className="battle-ult-pool"
      style={{
        width: width * 1.05,
        height: width * 0.3,
        background: `radial-gradient(ellipse at 50% 50%, ${color} 0%, transparent 70%)`,
      }}
    />
  );
}

/**
 * Escala y atmósfera según la línea de profundidad (0 = fondo, 1 = frente).
 * Sin esto todos los combatientes miden lo mismo y el campo parece plano.
 */
export function depthScale(y: number): number {
  const t = Math.max(0, Math.min(1, (y - 0.68) / 0.3));
  return 0.78 + t * 0.26;
}

export function depthStyle(y: number): CSSProperties {
  const t = Math.max(0, Math.min(1, (y - 0.68) / 0.3));
  return {
    filter: `saturate(${(0.84 + t * 0.16).toFixed(2)}) brightness(${(0.88 + t * 0.12).toFixed(2)})`,
  };
}
