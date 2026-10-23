"use client";

import React from "react";
import type { FigureState } from "./hero-figure";

type RagnarPart = {
  name: string;
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layer: number;
};

type RagnarModularProps = {
  size?: number;
  state?: FigureState;
};

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;

const PARTS: RagnarPart[] = [
  {
    name: "cape",
    file: "part_009.png",
    x: 174,
    y: 80,
    width: 152,
    height: 182,
    layer: 1,
  },
  {
    name: "right_leg",
    file: "part_007.png",
    x: 180,
    y: 245,
    width: 77,
    height: 194,
    layer: 3,
  },
  {
    name: "left_leg",
    file: "part_008.png",
    x: 235,
    y: 245,
    width: 120,
    height: 183,
    layer: 3,
  },
  {
    name: "body",
    file: "part_001.png",
    x: 173,
    y: 20,
    width: 154,
    height: 268,
    layer: 4,
  },
  {
    name: "right_arm",
    file: "part_003.png",
    x: 295,
    y: 100,
    width: 70,
    height: 160,
    layer: 5,
  },
  {
    name: "left_arm",
    file: "part_004.png",
    x: 165,
    y: 100,
    width: 68,
    height: 162,
    layer: 5,
  },
  {
    name: "axe",
    file: "part_006.png",
    x: 320,
    y: 105,
    width: 86,
    height: 179,
    layer: 6,
  },
  {
    name: "shield",
    file: "part_005.png",
    x: 110,
    y: 155,
    width: 130,
    height: 130,
    layer: 7,
  },
];

export function RagnarModular({
  size = 210,
  state = "idle",
}: RagnarModularProps) {
  return (
    <div
      className={`ragnar-modular ragnar-modular--${state}`}
      style={{
        width: `${(size * CANVAS_WIDTH) / CANVAS_HEIGHT}px`,
        height: `${size}px`,
      }}
      aria-hidden="true"
    >
      {PARTS.map((part) => (
        <img
          key={part.name}
          src={`/heroes/ragnar-parts/${part.file}`}
          alt=""
          draggable={false}
          className={`ragnar-modular__part ragnar-modular__part--${part.name}`}
          style={{
            left: `${(part.x / CANVAS_WIDTH) * 100}%`,
            top: `${(part.y / CANVAS_HEIGHT) * 100}%`,
            width: `${(part.width / CANVAS_WIDTH) * 100}%`,
            height: `${(part.height / CANVAS_HEIGHT) * 100}%`,
            zIndex: part.layer,
          }}
        />
      ))}

      <style>
        {`

    /* ===================================================
       ESTRUCTURA GENERAL
       =================================================== */

    .ragnar-modular {
      position: absolute;
      left: 50%;
      bottom: 0;
      transform: translateX(-50%);
      overflow: visible;
      flex-shrink: 0;
      pointer-events: none;
      isolation: isolate;
    }

    .ragnar-modular__part {
      position: absolute;
      display: block;
      max-width: none;
      object-fit: fill;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-drag: none;
      pointer-events: none;
      transform-origin: 50% 15%;
      backface-visibility: hidden;
      will-change: transform;
    }

    /* ===================================================
       REPOSO: RESPIRACIÓN Y MOVIMIENTO SUTIL
       =================================================== */

    @keyframes ragnar-idle-body {
  0%, 100% {
    transform: translateY(0) scaleY(1);
  }
  50% {
    transform: translateY(-4px) scaleY(1.018);
  }
}

@keyframes ragnar-idle-right-arm {
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(-7deg);
  }
}

@keyframes ragnar-idle-left-arm {
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

@keyframes ragnar-idle-cape {
  0%, 100% {
    transform: rotate(-2deg) skewX(0deg);
  }
  50% {
    transform: rotate(6deg) skewX(-3deg);
  }
}

@keyframes ragnar-idle-axe {
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(-6deg);
  }
}

@keyframes ragnar-idle-shield {
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(-5deg);
  }
}

    /* ===================================================
       CAMINAR: COORDINACIÓN DE BRAZOS Y PIERNAS
       =================================================== */

    .ragnar-modular--walk .ragnar-modular__part--body {
      transform-origin: 50% 85%;
      animation: ragnar-walk-body 0.48s ease-in-out infinite;
    }

    .ragnar-modular--walk .ragnar-modular__part--right_leg {
      transform-origin: 49% 8%;
      animation: ragnar-walk-right-leg 0.48s ease-in-out infinite;
    }

    .ragnar-modular--walk .ragnar-modular__part--left_leg {
      transform-origin: 4% 8%;
      animation: ragnar-walk-left-leg 0.48s ease-in-out infinite;
    }

    .ragnar-modular--walk .ragnar-modular__part--right_arm {
      transform-origin: 30% 19%;
      animation: ragnar-walk-right-arm 0.48s ease-in-out infinite;
    }

    .ragnar-modular--walk .ragnar-modular__part--left_arm {
      transform-origin: 80% 15%;
      animation: ragnar-walk-left-arm 0.48s ease-in-out infinite;
    }

    .ragnar-modular--walk .ragnar-modular__part--axe {
      transform-origin: 0% 12%;
      animation: ragnar-walk-axe 0.48s ease-in-out infinite;
    }

    .ragnar-modular--walk .ragnar-modular__part--shield {
      transform-origin: 85% 15%;
      animation: ragnar-walk-shield 0.48s ease-in-out infinite;
    }

    .ragnar-modular--walk .ragnar-modular__part--cape {
      transform-origin: 50% 5%;
      animation: ragnar-walk-cape 0.48s ease-in-out infinite;
    }

    /* ===================================================
       ATAQUE: PREPARACIÓN, IMPACTO Y RECUPERACIÓN
       =================================================== */

    .ragnar-modular--attack .ragnar-modular__part--right_arm {
      transform-origin: 30% 19%;
      animation: ragnar-attack-arm 0.58s cubic-bezier(.2,.7,.2,1) both;
    }

    .ragnar-modular--attack .ragnar-modular__part--axe {
      transform-origin: 0% 12%;
      animation: ragnar-attack-axe 0.58s cubic-bezier(.2,.7,.2,1) both;
    }

    .ragnar-modular--attack .ragnar-modular__part--body {
      transform-origin: 50% 85%;
      animation: ragnar-attack-body 0.58s cubic-bezier(.2,.7,.2,1) both;
    }

    .ragnar-modular--attack .ragnar-modular__part--left_arm {
      transform-origin: 80% 15%;
      animation: ragnar-attack-left-arm 0.58s ease-out both;
    }

    .ragnar-modular--attack .ragnar-modular__part--left_leg {
      transform-origin: 4% 8%;
      animation: ragnar-attack-left-leg 0.58s ease-out both;
    }

    .ragnar-modular--attack .ragnar-modular__part--right_leg {
      transform-origin: 49% 8%;
      animation: ragnar-attack-right-leg 0.58s ease-out both;
    }

    .ragnar-modular--attack .ragnar-modular__part--cape {
      transform-origin: 50% 5%;
      animation: ragnar-attack-cape 0.58s ease-out both;
    }

    .ragnar-modular--attack .ragnar-modular__part--shield {
      transform-origin: 85% 15%;
      animation: ragnar-attack-shield 0.58s ease-out both;
    }

    /* ===================================================
       RECIBIR DAÑO
       =================================================== */

    .ragnar-modular--hit .ragnar-modular__part--body {
      transform-origin: 50% 85%;
      animation: ragnar-hit-body 0.38s ease-out both;
    }

    .ragnar-modular--hit .ragnar-modular__part--right_arm {
      transform-origin: 30% 19%;
      animation: ragnar-hit-right-arm 0.38s ease-out both;
    }

    .ragnar-modular--hit .ragnar-modular__part--left_arm {
      transform-origin: 80% 15%;
      animation: ragnar-hit-left-arm 0.38s ease-out both;
    }

    .ragnar-modular--hit .ragnar-modular__part--cape {
      transform-origin: 50% 5%;
      animation: ragnar-hit-cape 0.38s ease-out both;
    }

    .ragnar-modular--hit .ragnar-modular__part--shield {
      transform-origin: 85% 15%;
      animation: ragnar-hit-shield 0.38s ease-out both;
    }

    .ragnar-modular--hit .ragnar-modular__part--axe {
      transform-origin: 0% 12%;
      animation: ragnar-hit-axe 0.38s ease-out both;
    }

    /* ===================================================
       MUERTE
       =================================================== */

    .ragnar-modular--dead .ragnar-modular__part {
      animation: none;
    }

    .ragnar-modular--dead .ragnar-modular__part--body {
      transform-origin: 50% 85%;
      animation: ragnar-dead-body 0.8s ease-in forwards;
    }

    .ragnar-modular--dead .ragnar-modular__part--right_arm {
      transform-origin: 30% 19%;
      animation: ragnar-dead-right-arm 0.8s ease-in forwards;
    }

    .ragnar-modular--dead .ragnar-modular__part--left_arm {
      transform-origin: 80% 15%;
      animation: ragnar-dead-left-arm 0.8s ease-in forwards;
    }

    .ragnar-modular--dead .ragnar-modular__part--right_leg {
      transform-origin: 49% 8%;
      animation: ragnar-dead-right-leg 0.8s ease-in forwards;
    }

    .ragnar-modular--dead .ragnar-modular__part--left_leg {
      transform-origin: 4% 8%;
      animation: ragnar-dead-left-leg 0.8s ease-in forwards;
    }

    .ragnar-modular--dead .ragnar-modular__part--cape {
      transform-origin: 50% 5%;
      animation: ragnar-dead-cape 0.8s ease-in forwards;
    }

    .ragnar-modular--dead .ragnar-modular__part--axe {
      transform-origin: 0% 12%;
      animation: ragnar-dead-axe 0.8s ease-in forwards;
    }

    .ragnar-modular--dead .ragnar-modular__part--shield {
      transform-origin: 85% 15%;
      animation: ragnar-dead-shield 0.8s ease-in forwards;
    }

    /* ===================================================
       KEYFRAMES: REPOSO
       =================================================== */

    @keyframes ragnar-idle-body {
      0%, 100% {
        transform: translateY(0) scaleY(1);
      }
      50% {
        transform: translateY(-1.5px) scaleY(1.008);
      }
    }

    @keyframes ragnar-idle-right-arm {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(-3deg); }
    }

    @keyframes ragnar-idle-left-arm {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(2deg); }
    }

    @keyframes ragnar-idle-cape {
      0%, 100% {
        transform: rotate(0deg) skewX(0deg);
      }
      50% {
        transform: rotate(2deg) skewX(-1deg);
      }
    }

    @keyframes ragnar-idle-axe {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(-2deg); }
    }

    @keyframes ragnar-idle-shield {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(-1.5deg); }
    }

    /* ===================================================
       KEYFRAMES: CAMINAR
       =================================================== */

   @keyframes ragnar-walk-body {
  0%, 100% {
    transform: translateY(0) rotate(-2deg);
  }
  25% {
    transform: translateY(-7px) rotate(1deg);
  }
  50% {
    transform: translateY(0) rotate(2deg);
  }
  75% {
    transform: translateY(-7px) rotate(-1deg);
  }
}

@keyframes ragnar-walk-right-leg {
  0%, 100% {
    transform: rotate(-32deg);
  }
  50% {
    transform: rotate(32deg);
  }
}

@keyframes ragnar-walk-left-leg {
  0%, 100% {
    transform: rotate(32deg);
  }
  50% {
    transform: rotate(-32deg);
  }
}

@keyframes ragnar-walk-right-arm {
  0%, 100% {
    transform: rotate(23deg);
  }
  50% {
    transform: rotate(-23deg);
  }
}

@keyframes ragnar-walk-left-arm {
  0%, 100% {
    transform: rotate(-20deg);
  }
  50% {
    transform: rotate(20deg);
  }
}

@keyframes ragnar-walk-axe {
  0%, 100% {
    transform: rotate(12deg);
  }
  50% {
    transform: rotate(-12deg);
  }
}

@keyframes ragnar-walk-shield {
  0%, 100% {
    transform: rotate(-7deg);
  }
  50% {
    transform: rotate(7deg);
  }
}

@keyframes ragnar-walk-cape {
  0%, 100% {
    transform: rotate(-5deg) skewX(0deg);
  }
  50% {
    transform: rotate(9deg) skewX(-4deg);
  }
}

    /* ===================================================
       KEYFRAMES: ATAQUE
       =================================================== */

    @keyframes ragnar-attack-arm {
      0% { transform: rotate(0deg); }
      16% { transform: rotate(-32deg); }
      34% { transform: rotate(-78deg); }
      54% { transform: rotate(52deg); }
      68% { transform: rotate(24deg); }
      82% { transform: rotate(-7deg); }
      100% { transform: rotate(0deg); }
    }

    @keyframes ragnar-attack-axe {
      0% { transform: rotate(0deg); }
      16% { transform: rotate(-22deg); }
      34% { transform: rotate(-58deg); }
      54% { transform: rotate(76deg); }
      68% { transform: rotate(30deg); }
      82% { transform: rotate(-12deg); }
      100% { transform: rotate(0deg); }
    }

    @keyframes ragnar-attack-body {
      0% {
        transform: translateX(0) rotate(0deg);
      }
      16% {
        transform: translateX(-2px) rotate(-3deg);
      }
      34% {
        transform: translateX(-4px) rotate(-7deg);
      }
      54% {
        transform: translateX(5px) rotate(5deg);
      }
      68% {
        transform: translateX(2px) rotate(2deg);
      }
      82%, 100% {
        transform: translateX(0) rotate(0deg);
      }
    }

    @keyframes ragnar-attack-left-arm {
      0%, 100% { transform: rotate(0deg); }
      16% { transform: rotate(10deg); }
      34% { transform: rotate(18deg); }
      54% { transform: rotate(-12deg); }
      68% { transform: rotate(-6deg); }
    }

    @keyframes ragnar-attack-left-leg {
      0%, 100% { transform: rotate(0deg); }
      34% { transform: rotate(-7deg); }
      54% { transform: rotate(9deg); }
      68% { transform: rotate(4deg); }
    }

    @keyframes ragnar-attack-right-leg {
      0%, 100% { transform: rotate(0deg); }
      34% { transform: rotate(6deg); }
      54% { transform: rotate(-8deg); }
      68% { transform: rotate(-3deg); }
    }

    @keyframes ragnar-attack-cape {
      0%, 100% { transform: rotate(0deg); }
      34% { transform: rotate(-5deg); }
      54% { transform: rotate(9deg); }
      68% { transform: rotate(4deg); }
    }

    @keyframes ragnar-attack-shield {
      0%, 100% { transform: rotate(0deg); }
      34% { transform: rotate(-8deg); }
      54% { transform: rotate(6deg); }
      68% { transform: rotate(2deg); }
    }

    /* ===================================================
       KEYFRAMES: RECIBIR DAÑO
       =================================================== */

    @keyframes ragnar-hit-body {
      0% {
        transform: translateX(0) rotate(0deg);
      }
      20% {
        transform: translateX(-6px) rotate(-5deg);
      }
      42% {
        transform: translateX(4px) rotate(3deg);
      }
      65% {
        transform: translateX(-2px) rotate(-1deg);
      }
      100% {
        transform: translateX(0) rotate(0deg);
      }
    }

    @keyframes ragnar-hit-right-arm {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(20deg); }
      55% { transform: rotate(-10deg); }
    }

    @keyframes ragnar-hit-left-arm {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-18deg); }
      55% { transform: rotate(9deg); }
    }

    @keyframes ragnar-hit-cape {
      0%, 100% { transform: rotate(0deg); }
      30% { transform: rotate(-9deg); }
      60% { transform: rotate(5deg); }
    }

    @keyframes ragnar-hit-shield {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-12deg); }
      55% { transform: rotate(5deg); }
    }

    @keyframes ragnar-hit-axe {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(18deg); }
      55% { transform: rotate(-8deg); }
    }

    /* ===================================================
       KEYFRAMES: MUERTE
       =================================================== */

    @keyframes ragnar-dead-body {
      0% {
        transform: rotate(0deg) translateY(0);
      }
      30% {
        transform: rotate(8deg) translateY(2px);
      }
      100% {
        transform: rotate(75deg) translateY(18px);
      }
    }

    @keyframes ragnar-dead-right-arm {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(48deg); }
    }

    @keyframes ragnar-dead-left-arm {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(-32deg); }
    }

    @keyframes ragnar-dead-right-leg {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(-28deg); }
    }

    @keyframes ragnar-dead-left-leg {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(18deg); }
    }

    @keyframes ragnar-dead-cape {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(-22deg); }
    }

    @keyframes ragnar-dead-axe {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(55deg); }
    }

    @keyframes ragnar-dead-shield {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(-30deg); }
    }

    /* ===================================================
       ACCESIBILIDAD
       =================================================== */

    @media (prefers-reduced-motion: reduce) {
      .ragnar-modular__part {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
      }
    }

  `}
      </style>
    </div>
  );
}

export default RagnarModular;
