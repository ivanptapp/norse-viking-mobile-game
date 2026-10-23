"use client";

import { memo } from "react";
import { KitRig } from "../shared/KitRig";
import { DEFAULT_POSE } from "./pose";
import { poseTransformsKit } from "./poseTransformsKit";
import type { JointRegistrar, RagnarFrame } from "./RagnarRig";
import { RAGNAR_KIT } from "./ragnarKit";

const INITIAL = poseTransformsKit(DEFAULT_POSE);
const { assetRoot, groundY, rootPivot, parts, slots } = RAGNAR_KIT;

// Tight framing around the figure: the kit canvas is mostly empty margin, so
// the lab would otherwise show a small character in a big box.
const FRAMES: Record<RagnarFrame, string> = {
  full: "96 8 318 500",
  bust: "150 14 220 300",
  face: "196 20 120 132",
};

/**
 * Ragnar built from the illustrated kit.
 *
 * The same joint names and the same animator as the vector rig; the only
 * difference is that each joint carries a painted piece instead of SVG paths.
 * The layer tree lives in `ragnarKit.ts`, so another hero only needs its own
 * parts, slots, rules and frame table to reuse this renderer.
 */
export const RagnarKitRig = memo(function RagnarKitRig({
  onJoint,
  frame = "full",
}: {
  onJoint: JointRegistrar;
  frame?: RagnarFrame;
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
        <radialGradient id="ragnarKitGround" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#000" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ground shadow — outside the root so a fall never spins it. */}
      <g
        ref={(node) => onJoint("shadow", node)}
        data-joint="shadow"
        transform={INITIAL.shadow}
      >
        <ellipse
          cx={rootPivot[0]}
          cy={groundY}
          rx={150}
          ry={16}
          fill="url(#ragnarKitGround)"
        />
        {/* Tight occlusion under the boots: without it the figure floats a
            few pixels above the stage, which is what made the walk read as
            sliding. */}
        <ellipse
          cx={rootPivot[0]}
          cy={groundY - 2}
          rx={74}
          ry={9}
          fill="#000"
          opacity={0.45}
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

export default RagnarKitRig;
