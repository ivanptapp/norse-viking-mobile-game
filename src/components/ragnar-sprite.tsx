"use client";

import { useEffect, useState } from "react";
import type { FigureState } from "./hero-figure";

type RagnarAnimation = FigureState | "victory";

type RagnarSpriteProps = {
  size?: number;
  state?: RagnarAnimation;
};

const ANIMATIONS: Record<
  RagnarAnimation,
  { folder: string; frames: number; duration: number; loop: boolean }
> = {
  idle: {
    folder: "idle",
    frames: 6,
    duration: 220,
    loop: true,
  },
  walk: {
    folder: "walk",
    frames: 8,
    duration: 150,
    loop: true,
  },
  attack: {
    folder: "attack",
    frames: 8,
    duration: 140,
    loop: false,
  },
  hit: {
    folder: "hit",
    frames: 4,
    duration: 180,
    loop: false,
  },
  dead: {
    folder: "death",
    frames: 7,
    duration: 280,
    loop: false,
  },
  cast: {
    folder: "attack",
    frames: 8,
    duration: 140,
    loop: false,
  },
  shoot: {
    folder: "attack",
    frames: 8,
    duration: 140,
    loop: false,
  },
  victory: {
    folder: "victory",
    frames: 5,
    duration: 250,
    loop: true,
  },
};

export function RagnarSprite({
  size = 210,
  state = "idle",
}: RagnarSpriteProps) {
  const animation = ANIMATIONS[state] ? state : "idle";
  const config = ANIMATIONS[animation];

  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);

    if (config.frames <= 1) {
      return;
    }

    let currentFrame = 0;

    const timer = window.setInterval(() => {
      if (currentFrame < config.frames - 1) {
        currentFrame += 1;
        setFrame(currentFrame);
      } else if (config.loop) {
        currentFrame = 0;
        setFrame(0);
      } else {
        window.clearInterval(timer);
      }
    }, config.duration);

    return () => window.clearInterval(timer);
  }, [animation, config.duration, config.frames, config.loop]);

  const frameNumber = String(frame + 1).padStart(2, "0");
  const imageSrc = `/sprites/ragnar/frames-ready/${config.folder}/${frameNumber}.png`;

  return (
    <div
      className="ragnar-sprite"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: "relative",
        flexShrink: 0,
        overflow: "visible",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <img
        key={imageSrc}
        src={imageSrc}
        alt=""
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center bottom",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
    </div>
  );
}

export default RagnarSprite;
