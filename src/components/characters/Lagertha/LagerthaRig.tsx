"use client";

import { memo } from "react";
import { DEFAULT_LAGERTHA_POSE } from "./pose";
import { poseTransforms } from "./poseTransforms";
import {
  LAGERTHA_ART,
  LAGERTHA_ASSET_ROOT,
  LAGERTHA_PARTS,
  type LagerthaPartName,
} from "./rig";

const INITIAL = poseTransforms(DEFAULT_LAGERTHA_POSE);

export type JointRegistrar = (name: string, node: SVGGElement | null) => void;

function Art({ name }: { name: LagerthaPartName }) {
  const part = LAGERTHA_PARTS[name];
  return (
    <image
      href={`${LAGERTHA_ASSET_ROOT}/${part.file}`}
      x={part.x}
      y={part.y}
      width={part.width}
      height={part.height}
      preserveAspectRatio="none"
      pointerEvents="none"
    />
  );
}

/**
 * The articulated character. One SVG scene, one group per joint.
 *
 * The groups are static React output; LagerthaCharacter mutates their
 * transform attributes from the animation loop, so no React render happens
 * per frame.
 */
export const LagerthaRig = memo(function LagerthaRig({
  onJoint,
}: {
  onJoint: JointRegistrar;
}) {
  return (
    <svg
      viewBox={`0 0 ${LAGERTHA_ART.width} 600`}
      className="block h-full w-full overflow-visible"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="lagerthaGround" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#000" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ground shadow — outside the root so it never rotates with a fall. */}
      <ellipse
        ref={(node) => onJoint("shadow", node)}
        data-joint="shadow"
        cx={LAGERTHA_ART.rootPivot.x}
        cy={LAGERTHA_ART.groundY}
        rx={176}
        ry={17}
        fill="url(#lagerthaGround)"
        opacity={0.42}
        transform={INITIAL.shadow}
      />

      <g ref={(node) => onJoint("root", node)} data-joint="root" transform={INITIAL.root}>
        {/* Clean plate, visible only through the cut-out holes. */}
        <image
          href={`${LAGERTHA_ASSET_ROOT}/underlay.png`}
          x={0}
          y={0}
          width={LAGERTHA_ART.width}
          height={LAGERTHA_ART.height}
          preserveAspectRatio="none"
          pointerEvents="none"
        />

        {/* Legs sit behind the skirt and shield. */}
        <g
          ref={(node) => onJoint("legFarHip", node)}
          data-joint="legFarHip"
          transform={INITIAL.legFarHip}
        >
          <Art name="leg-far-upper" />
          <g
            ref={(node) => onJoint("legFarKnee", node)}
            data-joint="legFarKnee"
            transform={INITIAL.legFarKnee}
          >
            <Art name="leg-far-lower" />
          </g>
        </g>

        <g
          ref={(node) => onJoint("legNearHip", node)}
          data-joint="legNearHip"
          transform={INITIAL.legNearHip}
        >
          <Art name="leg-near-upper" />
          <g
            ref={(node) => onJoint("legNearKnee", node)}
            data-joint="legNearKnee"
            transform={INITIAL.legNearKnee}
          >
            <Art name="leg-near-lower" />
          </g>
        </g>

        {/* Torso, cape, shield and costume are the untouched base. */}
        <g
          ref={(node) => onJoint("torso", node)}
          data-joint="torso"
          transform={INITIAL.torso}
        >
          <image
            href={`${LAGERTHA_ASSET_ROOT}/base.png`}
            x={0}
            y={0}
            width={LAGERTHA_ART.width}
            height={LAGERTHA_ART.height}
            preserveAspectRatio="none"
            pointerEvents="none"
          />

          <g
            ref={(node) => onJoint("head", node)}
            data-joint="head"
            transform={INITIAL.head}
          >
            <Art name="head" />
          </g>

          <g
            ref={(node) => onJoint("armUpper", node)}
            data-joint="armUpper"
            transform={INITIAL.armUpper}
          >
            <Art name="arm-upper" />
            <g
              ref={(node) => onJoint("armLower", node)}
              data-joint="armLower"
              transform={INITIAL.armLower}
            >
              <Art name="arm-lower" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
});

export default LagerthaRig;
