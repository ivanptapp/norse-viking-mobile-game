"use client";

import { memo } from "react";
import {
  RagnarAxeArt,
  RagnarBeardArt,
  RagnarBootArt,
  RagnarBraidArt,
  RagnarCloakArt,
  RagnarDefs,
  RagnarFaceArt,
  RagnarForearmArt,
  RagnarHairBackArt,
  RagnarHairFrontArt,
  RagnarHandArt,
  RagnarNeckArt,
  RagnarPauldronArt,
  RagnarShieldArt,
  RagnarShinArt,
  RagnarSkirtArt,
  RagnarThighArt,
  RagnarTorsoArt,
  RagnarUpperArmArt,
} from "./RagnarArt";
import { DEFAULT_POSE } from "./pose";
import { RAGNAR_RIG, poseTransforms } from "./poseTransforms";

const INITIAL = poseTransforms(DEFAULT_POSE);

export type JointRegistrar = (name: string, node: SVGGElement | null) => void;

/**
 * The articulated character. One SVG scene, one group per joint.
 *
 * The groups are static React output; RagnarCharacter mutates their
 * `transform` attributes from the animation loop, so no React render
 * happens per frame.
 */
export type RagnarFrame = "full" | "bust" | "face";

const FRAMES: Record<RagnarFrame, string> = {
  full: "0 0 640 760",
  bust: "186 96 268 320",
  face: "252 138 144 186",
};

export const RagnarRig = memo(function RagnarRig({
  onJoint,
  frame = "full",
}: {
  onJoint: JointRegistrar;
  frame?: RagnarFrame;
}) {
  const cloak = RAGNAR_RIG.cloak;

  return (
    <svg
      viewBox={FRAMES[frame]}
      className={`block h-full w-full ${frame === "full" ? "overflow-visible" : "overflow-hidden"}`}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
    >
      <RagnarDefs />

      {/* Ground shadow — outside the root so it never rotates with a fall */}
      <g ref={(node) => onJoint("shadow", node)} data-joint="shadow" transform={INITIAL.shadow}>
        <ellipse cx={320} cy={RAGNAR_RIG.ground} rx={150} ry={24} fill="url(#ragShadow)" />
        <ellipse cx={320} cy={RAGNAR_RIG.ground} rx={84} ry={13} fill="#000" opacity={0.32} />
      </g>

      <g ref={(node) => onJoint("root", node)} data-joint="root" transform={INITIAL.root}>
        <g ref={(node) => onJoint("hips", node)} data-joint="hips" transform={INITIAL.hips}>
          {/* ---------------------------------------------------------- *
           * CLOAK — behind the legs, three chained fur segments
           * ---------------------------------------------------------- */}
          <g ref={(node) => onJoint("cloak0", node)} data-joint="cloak0" transform={INITIAL.cloak0}>
            <RagnarCloakArt index={0} length={cloak.lengths[0]} top={150} bottom={140} />
            <g ref={(node) => onJoint("cloak1", node)} data-joint="cloak1" transform={INITIAL.cloak1}>
              <RagnarCloakArt index={1} length={cloak.lengths[1]} top={140} bottom={128} />
              <g ref={(node) => onJoint("cloak2", node)} data-joint="cloak2" transform={INITIAL.cloak2}>
                <RagnarCloakArt index={2} length={cloak.lengths[2]} top={128} bottom={110} />
              </g>
            </g>
          </g>

          {/* ---------------------------------------------------------- *
           * LEGS — far first, so the near leg overlaps correctly
           * ---------------------------------------------------------- */}
          <g
            ref={(node) => onJoint("legFarUpper", node)}
            data-joint="legFarUpper"
            transform={INITIAL.legFarUpper}
          >
            <RagnarThighArt far />
            <g
              ref={(node) => onJoint("legFarLower", node)}
              data-joint="legFarLower"
              transform={INITIAL.legFarLower}
            >
              <RagnarShinArt far />
              <g
                ref={(node) => onJoint("legFarFoot", node)}
                data-joint="legFarFoot"
                transform={INITIAL.legFarFoot}
              >
                <RagnarBootArt far />
              </g>
            </g>
          </g>

          <g
            ref={(node) => onJoint("legNearUpper", node)}
            data-joint="legNearUpper"
            transform={INITIAL.legNearUpper}
          >
            <RagnarThighArt />
            <g
              ref={(node) => onJoint("legNearLower", node)}
              data-joint="legNearLower"
              transform={INITIAL.legNearLower}
            >
              <RagnarShinArt />
              <g
                ref={(node) => onJoint("legNearFoot", node)}
                data-joint="legNearFoot"
                transform={INITIAL.legNearFoot}
              >
                <RagnarBootArt />
              </g>
            </g>
          </g>

          {/* Skirt hangs over the thighs, under the belt */}
          <RagnarSkirtArt />

          {/* ---------------------------------------------------------- *
           * TORSO
           * ---------------------------------------------------------- */}
          <g ref={(node) => onJoint("torso", node)} data-joint="torso" transform={INITIAL.torso}>
            {/* The armour is authored 16% wider than the final silhouette;
                the shoulder pivots below stay independent of this scale. */}
            <g transform="scale(0.84 1)">
              <RagnarTorsoArt />
            </g>

            {/* Shield arm (far) */}
            <g
              ref={(node) => onJoint("shieldShoulder", node)}
              data-joint="shieldShoulder"
              transform={INITIAL.shieldShoulder}
            >
              <RagnarUpperArmArt far />
              <RagnarPauldronArt far />
              <g
                ref={(node) => onJoint("shieldElbow", node)}
                data-joint="shieldElbow"
                transform={INITIAL.shieldElbow}
              >
                <RagnarForearmArt far />
                <g
                  ref={(node) => onJoint("shieldWrist", node)}
                  data-joint="shieldWrist"
                  transform={INITIAL.shieldWrist}
                >
                  <RagnarHandArt far />
                  <g
                    ref={(node) => onJoint("shield", node)}
                    data-joint="shield"
                    transform={INITIAL.shield}
                  >
                    <RagnarShieldArt />
                  </g>
                </g>
              </g>
            </g>

            {/* Neck + head */}
            <g ref={(node) => onJoint("neck", node)} data-joint="neck" transform={INITIAL.neck}>
              <RagnarNeckArt />
              <g ref={(node) => onJoint("head", node)} data-joint="head" transform={INITIAL.head}>
                {/* Head-to-body ratio: a hair over 1.08 keeps the skull heroic
                    without turning him into a caricature. Scaling about the
                    neck joint means the head still sits on the shoulders. */}
                <g transform="scale(1.08)">
                  <g ref={(node) => onJoint("hair", node)} data-joint="hair" transform={INITIAL.hair}>
                    <RagnarHairBackArt />
                  </g>

                  <RagnarFaceArt />

                  <g ref={(node) => onJoint("beard", node)} data-joint="beard" transform={INITIAL.beard}>
                    <RagnarBeardArt />
                  </g>

                  <g ref={(node) => onJoint("braid", node)} data-joint="braid" transform={INITIAL.braid}>
                    <RagnarBraidArt />
                  </g>

                  <RagnarHairFrontArt />
                </g>
              </g>
            </g>

            {/* Axe arm (near) */}
            <g
              ref={(node) => onJoint("axeShoulder", node)}
              data-joint="axeShoulder"
              transform={INITIAL.axeShoulder}
            >
              <RagnarUpperArmArt />
              <RagnarPauldronArt />
              <g
                ref={(node) => onJoint("axeElbow", node)}
                data-joint="axeElbow"
                transform={INITIAL.axeElbow}
              >
                <RagnarForearmArt />
                <g
                  ref={(node) => onJoint("axeWrist", node)}
                  data-joint="axeWrist"
                  transform={INITIAL.axeWrist}
                >
                  <RagnarHandArt />
                  <g ref={(node) => onJoint("axe", node)} data-joint="axe" transform={INITIAL.axe}>
                    <RagnarAxeArt />
                  </g>
                </g>
              </g>
            </g>

          </g>
        </g>
      </g>
    </svg>
  );
});

export default RagnarRig;
