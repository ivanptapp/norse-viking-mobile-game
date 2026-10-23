"use client";

import React from "react";
import { FenrirCharacter, type FenrirState } from "./characters/Fenrir";
import { RagnarCharacter } from "./characters/Ragnar";
import type { RagnarState } from "./characters/Ragnar/types";
import { LagerthaPosePlate } from "./characters/Lagertha/PosePlate";
import type { LagerthaAnimation, LagerthaAnimationEvent, LagerthaCharacterHandle } from "./characters/Lagertha/PosePlate/lagertha.types";

export type FigureState =
  | "idle"
  | "walk"
  | "attack"
  | "hit"
  | "dead"
  | "cast"
  | "shoot"
  | "victory";

/** Battle figure states → Ragnar's articulated clips. */
const RAGNAR_STATE_MAP: Record<FigureState, RagnarState> = {
  idle: "idle",
  walk: "run",
  attack: "attack",
  hit: "hit",
  dead: "death",
  cast: "victory",
  shoot: "attack",
  victory: "victory",
};

/** Battle figure states → the full Fenrir animation set. */
const FENRIR_STATE_MAP: Record<FigureState, FenrirState> = {
  idle: "idle",
  walk: "walk",
  attack: "attack",
  hit: "hit",
  dead: "death",
  cast: "howl",
  shoot: "attack",
  victory: "howl",
};

function attackVariantIndex(variant: number): 0 | 1 | 2 {
  return (((Math.floor(variant) % 3) + 3) % 3) as 0 | 1 | 2;
}

function ragnarAnimationFor(state: FigureState, variant: number): RagnarState {
  if (state === "attack" || state === "shoot") {
    const variants: RagnarState[] = ["attack", "attack2", "attack3"];
    return variants[attackVariantIndex(variant)];
  }
  return RAGNAR_STATE_MAP[state];
}

const LAGERTHA_ANIMATION_MAP: Record<FigureState, LagerthaAnimation> = {
  idle: "idle",
  walk: "move",
  attack: "attack",
  hit: "hit",
  dead: "defeat",
  cast: "ultimate",
  shoot: "attack",
  victory: "victory",
};

function lagerthaAnimationFor(state: FigureState, variant: number): LagerthaAnimation {
  if (state === "attack" || state === "shoot") {
    const variants: LagerthaAnimation[] = ["attack", "attack2", "attack3"];
    return variants[attackVariantIndex(variant)];
  }
  return LAGERTHA_ANIMATION_MAP[state];
}

type HeroFigureProps = {
  heroId: string;
  size?: number;
  state?: FigureState;
  delay?: number;
  battleUnitId?: string;
  battleSpeed?: number;
  /** Cycles authored attack choreography without changing turn/damage logic. */
  attackVariant?: number;
  onLagerthaHandle?: (unitId: string, handle: LagerthaCharacterHandle | null) => void;
  onLagerthaEvent?: (unitId: string, event: LagerthaAnimationEvent) => void;
};

const HERO_IMAGES: Record<string, string> = {
  ragnar: "/heroes/figure_ragnar.png",
  fenrir: "/heroes/figure_fenrir.png",
  lagertha: "/heroes/figure_lagertha.png",
};

export function HeroFigure({
  heroId,
  size = 210,
  state = "idle",
  delay = 0,
  battleUnitId,
  battleSpeed = 1,
  attackVariant = 0,
  onLagerthaHandle,
  onLagerthaEvent,
}: HeroFigureProps) {
  const id = heroId.toLowerCase();
  const isRagnar = id === "ragnar";
  const isFenrir = id === "fenrir";
  const isLagertha = id === "lagertha";
  const lagerthaHandleRef = React.useCallback((handle: LagerthaCharacterHandle | null) => {
    if (battleUnitId) onLagerthaHandle?.(battleUnitId, handle);
  }, [battleUnitId, onLagerthaHandle]);
  const lagerthaEvent = React.useCallback((event: LagerthaAnimationEvent) => {
    if (battleUnitId) onLagerthaEvent?.(battleUnitId, event);
  }, [battleUnitId, onLagerthaEvent]);

  const imageSrc = isRagnar
    ? "/heroes/figure_ragnar_base.png"
    : (HERO_IMAGES[id] ?? `/heroes/figure_${id}.png`);

  return (
    <div
      className={`hero-figure hero-figure--${state} ${
        isRagnar ? "hero-figure--ragnar" : ""
      } 
      ${isLagertha ? "hero-figure--lagertha" : ""}
      ${isFenrir ? "hero-figure--fenrir" : ""}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
      }}
    >
      {isRagnar ? (
        <div className="hero-figure__ragnar">
          <RagnarCharacter
            art="kit"
            frame="full"
            state={ragnarAnimationFor(state, attackVariant)}
          />
        </div>
      ) : isFenrir ? (
        <div className="hero-figure__fenrir">
          <FenrirCharacter state={FENRIR_STATE_MAP[state]} />
        </div>
      ) : isLagertha ? (
        <div className="hero-figure__lagertha">
          <LagerthaPosePlate
            ref={lagerthaHandleRef}
            animation={lagerthaAnimationFor(state, attackVariant)}
            assetBaseUrl="/characters/lagertha-poses"
            battleSpeed={battleSpeed}
            x={size * 0.8}
            y={size * 1.12}
            characterHeight={size * 1.12}
            onAnimationEvent={lagerthaEvent}
          />
        </div>
      ) : (
        <img
          src={imageSrc}
          alt={id}
          className="hero-figure__image"
          draggable={false}
        />
      )}

      <style>{`
        .hero-figure {
          display: inline-flex;
          position: relative;
          align-items: flex-end;
          justify-content: center;
          flex-shrink: 0;
          overflow: visible;
          transform-origin: center bottom;
          will-change: transform;
        }

        .hero-figure__image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center bottom;
          pointer-events: none;
          user-select: none;
          -webkit-user-drag: none;
          filter: none;
          opacity: 1;
        }

        .hero-figure > .hero-figure__image:first-child {
          position: relative;
        }

        

        .hero-figure--idle {
          animation: hero-idle 2.4s ease-in-out infinite;
        }

        .hero-figure--walk {
          animation: hero-walk 0.42s ease-in-out infinite;
        }

        .hero-figure--attack {
          animation: hero-attack 0.42s ease-out both;
        }

        .hero-figure--hit {
          animation: hero-hit 0.32s ease-in-out both;
        }

        .hero-figure--dead {
          animation: hero-dead 0.75s ease-in forwards;
          pointer-events: none;
        }

        /* Fenrir posee su propio rig articulado: el contenedor no anima. */
        .hero-figure--fenrir {
          animation: none !important;
          opacity: 1;
          filter: none;
          transform: none;
        }

        .hero-figure__fenrir {
          position: absolute;
          left: 50%;
          bottom: -9%;
          width: 190%;
          height: 122%;
          transform: translateX(-50%);
          pointer-events: none;
        }

        /* Ragnar lleva su propio rig articulado: el contenedor no anima,
           porque el personaje ya respira, camina y ataca por dentro. */
        .hero-figure--ragnar {
          animation: none !important;
          opacity: 1;
          filter: none;
        }

        .hero-figure__ragnar {
          position: absolute;
          left: 50%;
          bottom: -2%;
          width: 160%;
          height: 112%;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .hero-figure__ragnar svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        /* Lagertha también lleva su propio rig articulado: el contenedor no
           anima, porque el personaje ya respira, camina y ataca por dentro. */
        .hero-figure--lagertha {
          animation: none !important;
          opacity: 1;
          filter: none;
        }

        .hero-figure__lagertha {
          position: absolute;
          left: 50%;
          bottom: -2%;
          width: 160%;
          height: 112%;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .hero-figure__lagertha canvas {
          display: block;
          width: 100%;
          height: 100%;
        }

        .hero-figure--cast {
          animation: hero-cast 0.65s ease-in-out both;
        }

        .hero-figure--shoot {
          animation: hero-shoot 0.38s ease-out both;
        }

        

        @keyframes hero-idle {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-3px) scale(1.012);
          }
        }

        @keyframes hero-walk {
          0%, 100% {
            transform: translateY(0) rotate(-2deg);
          }
          50% {
            transform: translateY(-5px) rotate(2deg);
          }
        }

        @keyframes hero-attack {
          0% {
            transform: translateX(0) rotate(0);
          }
          35% {
            transform: translateX(12px) rotate(-5deg);
          }
          65% {
            transform: translateX(18px) rotate(3deg);
          }
          100% {
            transform: translateX(0) rotate(0);
          }
        }

        @keyframes hero-hit {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-7px);
          }
          50% {
            transform: translateX(6px);
          }
          75% {
            transform: translateX(-3px);
          }
        }

        @keyframes hero-dead {
          from {
            transform: translateY(0) rotate(0);
            opacity: 1;
          }
          to {
            transform: translateY(18px) rotate(75deg);
            opacity: 0.25;
          }
        }

        @keyframes hero-cast {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-8px) scale(1.05);
          }
        }

        @keyframes hero-shoot {
          0%, 100% {
            transform: translateX(0) rotate(0);
          }
          45% {
            transform: translateX(10px) rotate(-3deg);
          }
        }

       
      `}</style>
    </div>
  );
}

export default HeroFigure;
