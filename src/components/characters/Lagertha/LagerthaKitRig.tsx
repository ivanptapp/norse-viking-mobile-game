"use client";

import { memo } from "react";
import { KitRig } from "../shared/KitRig";
import { DEFAULT_LAGERTHA_POSE } from "./pose";
import { poseTransformsKit } from "./poseTransformsKit";
import { LAGERTHA_KIT } from "./lagerthaKit";

const INITIAL = poseTransformsKit(DEFAULT_LAGERTHA_POSE);
const { assetRoot, groundY, rootPivot, parts, slots } = LAGERTHA_KIT;

export type LagerthaFrame = "full" | "bust" | "face";

export type JointRegistrar = (name: string, node: SVGGElement | null) => void;

// Tight framing around the figure: the kit canvas carries the sword and the
// cape, so the default view would otherwise leave a lot of air around her.
const FRAMES: Record<LagerthaFrame, string> = {
  full: "26 54 500 830",
  bust: "146 62 250 330",
  face: "228 78 126 148",
};

/**
 * Lagertha built from the illustrated kit.
 *
 * The same joint names and the same animator as before; the only difference is
 * that each joint carries a painted piece instead of a vector limb. The layer
 * tree lives in `lagerthaKit.ts`, and the renderer is the shared KitRig.
 */
export const LagerthaKitRig = memo(function LagerthaKitRig({
  onJoint,
  frame = "full",
}: {
  onJoint: JointRegistrar;
  frame?: LagerthaFrame;
}) {
  return (
    <svg
      viewBox={FRAMES[frame]}
      className={`block h-full w-full ${
        frame === "full" ? "overflow-visible" : "overflow-hidden"
      }`}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="lagerthaKitGround" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#000" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ground shadow — outside the root, so a fall never spins it. */}
      <g
        ref={(node) => onJoint("shadow", node)}
        data-joint="shadow"
        transform={INITIAL.shadow}
      >
        <ellipse
          cx={rootPivot[0]}
          cy={groundY}
          rx={132}
          ry={15}
          fill="url(#lagerthaKitGround)"
        />
        {/* Tight occlusion under the boots: without it she floats a few pixels
            above the stage and the walk reads as sliding. */}
        <ellipse
          cx={rootPivot[0]}
          cy={groundY - 2}
          rx={64}
          ry={8}
          fill="#000"
          opacity={0.42}
        />
      </g>

      <g ref={(node) => onJoint("root", node)} data-joint="root" transform={INITIAL.root}>
        <KitRig
          slots={slots}
          parts={parts}
          assetRoot={assetRoot}
          transforms={INITIAL}
          onJoint={onJoint}
        />
      </g>
    </svg>
  );
});

export default LagerthaKitRig;
