"use client";

import React from "react";
import type { FigureState } from "./hero-figure";

type FenrirPart = {
  name: string;
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layer: number;
};

type FenrirModularProps = {
  size?: number;
  state?: FigureState;
};

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;

const PARTS: FenrirPart[] = [
  {
    name: "tail",
    file: "part_007.png",
    x: 40,
    y: 220,
    width: 125,
    height: 96,
    layer: 0,
  },
  {
    name: "hind_left_leg",
    file: "part_005.png",
    x: 125,
    y: 190,
    width: 78,
    height: 169,
    layer: 1,
  },
  {
    name: "hind_right_leg",
    file: "part_006.png",
    x: 240,
    y: 190,
    width: 80,
    height: 164,
    layer: 1,
  },
  {
    name: "front_right_leg",
    file: "part_004.png",
    x: 290,
    y: 135,
    width: 92,
    height: 151,
    layer: 2,
  },
  {
    name: "body",
    file: "part_002.png",
    x: 139,
    y: 70,
    width: 180,
    height: 170,
    layer: 3,
  },
  {
    name: "head",
    file: "part_001.png",
    x: 265,
    y: 37,
    width: 143,
    height: 129,
    layer: 4,
  },
  {
    name: "front_left_leg",
    file: "part_003.png",
    x: 150,
    y: 90,
    width: 76,
    height: 165,
    layer: 4,
  },
];

export function FenrirModular({
  size = 210,
  state = "idle",
}: FenrirModularProps) {
  return (
    <div
      className={`fenrir-modular fenrir-modular--${state}`}
      style={{
        width: `${(size * CANVAS_WIDTH) / CANVAS_HEIGHT}px`,
        height: `${size}px`,
      }}
      aria-hidden="true"
    >
      {PARTS.map((part) => (
        <img
          key={part.name}
          src={`/heroes/fenrir-parts/${part.file}`}
          alt=""
          draggable={false}
          className={`fenrir-modular__part fenrir-modular__part--${part.name}`}
          style={{
            left: `${(part.x / CANVAS_WIDTH) * 100}%`,
            top: `${(part.y / CANVAS_HEIGHT) * 100}%`,
            width: `${(part.width / CANVAS_WIDTH) * 100}%`,
            height: `${(part.height / CANVAS_HEIGHT) * 100}%`,
            zIndex: part.layer,
          }}
        />
      ))}

      <style>{`
        /* ESTRUCTURA */

        .fenrir-modular {
          position: absolute;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          overflow: visible;
          flex-shrink: 0;
          pointer-events: none;
          isolation: isolate;
        }

        .fenrir-modular__part {
          position: absolute;
          display: block;
          max-width: none;
          object-fit: fill;
          margin: 0;
          padding: 0;
          user-select: none;
          -webkit-user-drag: none;
          pointer-events: none;
          backface-visibility: hidden;
          transform-origin: 50% 15%;
          will-change: transform;
        }

        /* REPOSO */

        .fenrir-modular--idle .fenrir-modular__body {
          animation: fenrir-idle-body 2s ease-in-out infinite;
          transform-origin: 50% 85%;
        }

        .fenrir-modular--idle .fenrir-modular__head {
          animation: fenrir-idle-head 2s ease-in-out infinite;
          transform-origin: 25% 75%;
        }

        .fenrir-modular--idle .fenrir-modular__tail {
          animation: fenrir-idle-tail 1.8s ease-in-out infinite;
          transform-origin: 90% 30%;
        }

        .fenrir-modular--idle .fenrir-modular__front_left_leg,
        .fenrir-modular--idle .fenrir-modular__front_right_leg {
          animation: fenrir-idle-front-legs 2s ease-in-out infinite;
          transform-origin: 50% 10%;
        }

        .fenrir-modular--idle .fenrir-modular__hind_left_leg,
        .fenrir-modular--idle .fenrir-modular__hind_right_leg {
          animation: fenrir-idle-hind-legs 2s ease-in-out infinite;
          transform-origin: 50% 10%;
        }

        @keyframes fenrir-idle-body {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(-2px) scaleY(1.012); }
        }

        @keyframes fenrir-idle-head {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-1.5deg); }
        }

        @keyframes fenrir-idle-tail {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(7deg); }
        }

        @keyframes fenrir-idle-front-legs {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1deg); }
        }

        @keyframes fenrir-idle-hind-legs {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-1deg); }
        }

        /* CAMINAR */

        .fenrir-modular--walk .fenrir-modular__body {
          animation: fenrir-walk-body 0.48s ease-in-out infinite;
          transform-origin: 50% 85%;
        }

        .fenrir-modular--walk .fenrir-modular__head {
          animation: fenrir-walk-head 0.48s ease-in-out infinite;
          transform-origin: 25% 75%;
        }

        .fenrir-modular--walk .fenrir-modular__front_left_leg {
          animation: fenrir-walk-front-left 0.48s ease-in-out infinite;
          transform-origin: 50% 8%;
        }

        .fenrir-modular--walk .fenrir-modular__front_right_leg {
          animation: fenrir-walk-front-right 0.48s ease-in-out infinite;
          transform-origin: 50% 8%;
        }

        .fenrir-modular--walk .fenrir-modular__hind_left_leg {
          animation: fenrir-walk-hind-left 0.48s ease-in-out infinite;
          transform-origin: 50% 8%;
        }

        .fenrir-modular--walk .fenrir-modular__hind_right_leg {
          animation: fenrir-walk-hind-right 0.48s ease-in-out infinite;
          transform-origin: 50% 8%;
        }

        .fenrir-modular--walk .fenrir-modular__tail {
          animation: fenrir-walk-tail 0.48s ease-in-out infinite;
          transform-origin: 90% 30%;
        }

        @keyframes fenrir-walk-body {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }

        @keyframes fenrir-walk-head {
          0%, 100% { transform: rotate(1deg); }
          50% { transform: rotate(-2deg); }
        }

        @keyframes fenrir-walk-front-left {
          0%, 100% { transform: rotate(-20deg); }
          50% { transform: rotate(20deg); }
        }

        @keyframes fenrir-walk-front-right {
          0%, 100% { transform: rotate(20deg); }
          50% { transform: rotate(-20deg); }
        }

        @keyframes fenrir-walk-hind-left {
          0%, 100% { transform: rotate(24deg); }
          50% { transform: rotate(-24deg); }
        }

        @keyframes fenrir-walk-hind-right {
          0%, 100% { transform: rotate(-24deg); }
          50% { transform: rotate(24deg); }
        }

        @keyframes fenrir-walk-tail {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(9deg); }
        }

        /* ATAQUE */

        .fenrir-modular--attack .fenrir-modular__body {
          animation: fenrir-attack-body 0.58s ease-out both;
          transform-origin: 50% 80%;
        }

        .fenrir-modular--attack .fenrir-modular__head {
          animation: fenrir-attack-head 0.58s ease-out both;
          transform-origin: 25% 75%;
        }

        .fenrir-modular--attack .fenrir-modular__front_left_leg,
        .fenrir-modular--attack .fenrir-modular__front_right_leg {
          animation: fenrir-attack-front-legs 0.58s ease-out both;
          transform-origin: 50% 8%;
        }

        .fenrir-modular--attack .fenrir-modular__tail {
          animation: fenrir-attack-tail 0.58s ease-out both;
          transform-origin: 90% 30%;
        }

        @keyframes fenrir-attack-body {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-3px) rotate(-4deg); }
          50% { transform: translateX(7px) rotate(5deg); }
          75% { transform: translateX(2px) rotate(2deg); }
        }

        @keyframes fenrir-attack-head {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          50% { transform: rotate(12deg); }
          75% { transform: rotate(4deg); }
        }

        @keyframes fenrir-attack-front-legs {
          0%, 100% { transform: rotate(0deg); }
          30% { transform: rotate(-12deg); }
          55% { transform: rotate(18deg); }
          75% { transform: rotate(-5deg); }
        }

        @keyframes fenrir-attack-tail {
          0%, 100% { transform: rotate(0deg); }
          35% { transform: rotate(-12deg); }
          60% { transform: rotate(15deg); }
        }

        /* RECIBIR DAÑO */

        .fenrir-modular--hit .fenrir-modular__body {
          animation: fenrir-hit-body 0.38s ease-out both;
          transform-origin: 50% 85%;
        }

        .fenrir-modular--hit .fenrir-modular__head {
          animation: fenrir-hit-head 0.38s ease-out both;
          transform-origin: 25% 75%;
        }

        .fenrir-modular--hit .fenrir-modular__tail {
          animation: fenrir-hit-tail 0.38s ease-out both;
          transform-origin: 90% 30%;
        }

        @keyframes fenrir-hit-body {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-6px) rotate(-4deg); }
          55% { transform: translateX(4px) rotate(3deg); }
        }

        @keyframes fenrir-hit-head {
          0%, 100% { transform: rotate(0deg); }
          35% { transform: rotate(-8deg); }
          65% { transform: rotate(4deg); }
        }

        @keyframes fenrir-hit-tail {
          0%, 100% { transform: rotate(0deg); }
          35% { transform: rotate(-10deg); }
          65% { transform: rotate(6deg); }
        }

        /* MUERTE */

        .fenrir-modular--dead .fenrir-modular__part {
          animation: none;
        }

        .fenrir-modular--dead .fenrir-modular__body {
          transform-origin: 50% 85%;
          animation: fenrir-dead-body 0.8s ease-in forwards;
        }

        .fenrir-modular--dead .fenrir-modular__head {
          transform-origin: 25% 75%;
          animation: fenrir-dead-head 0.8s ease-in forwards;
        }

        .fenrir-modular--dead .fenrir-modular__tail {
          transform-origin: 90% 30%;
          animation: fenrir-dead-tail 0.8s ease-in forwards;
        }

        .fenrir-modular--dead .fenrir-modular__front_left_leg,
        .fenrir-modular--dead .fenrir-modular__front_right_leg {
          transform-origin: 50% 8%;
          animation: fenrir-dead-front-legs 0.8s ease-in forwards;
        }

        .fenrir-modular--dead .fenrir-modular__hind_left_leg,
        .fenrir-modular--dead .fenrir-modular__hind_right_leg {
          transform-origin: 50% 8%;
          animation: fenrir-dead-hind-legs 0.8s ease-in forwards;
        }

        @keyframes fenrir-dead-body {
          0% { transform: rotate(0deg) translateY(0); }
          100% { transform: rotate(65deg) translateY(16px); }
        }

        @keyframes fenrir-dead-head {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-25deg); }
        }

        @keyframes fenrir-dead-tail {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-25deg); }
        }

        @keyframes fenrir-dead-front-legs {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(25deg); }
        }

        @keyframes fenrir-dead-hind-legs {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-20deg); }
        }

        /* ACCESIBILIDAD */

        @media (prefers-reduced-motion: reduce) {
          .fenrir-modular__part {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default FenrirModular;
