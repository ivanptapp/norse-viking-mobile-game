"use client";

import { memo } from "react";
import {
  FenrirBodyArt,
  FenrirChestArt,
  FenrirDefs,
  FenrirEarArt,
  FenrirFrontLowerArt,
  FenrirFrontUpperArt,
  FenrirHeadArt,
  FenrirHeadForegroundArt,
  FenrirHindLowerArt,
  FenrirHindUpperArt,
  FenrirHockArt,
  FenrirJawArt,
  FenrirNeckArt,
  FenrirPawArt,
  FenrirTailSegmentArt,
} from "./FenrirArt";
import { DEFAULT_POSE } from "./pose";
import { FENRIR_RIG, poseTransforms } from "./poseTransforms";

const INITIAL = poseTransforms(DEFAULT_POSE);

export type JointRegistrar = (name: string, node: SVGGElement | null) => void;

/**
 * The articulated character. One SVG scene, one group per joint.
 *
 * The groups are static React output; FenrirCharacter mutates their
 * `transform` attributes from the animation loop, so no React render
 * happens per frame.
 */
export const FenrirRig = memo(function FenrirRig({
  onJoint,
}: {
  onJoint: JointRegistrar;
}) {
  const ta = FENRIR_RIG.tail.lengths;
  const tw = FENRIR_RIG.tail.widths;
  const tt = FENRIR_RIG.tail.tips;

  return (
    <svg
      viewBox="0 0 780 520"
      className="block h-full w-full overflow-visible"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
    >
      <FenrirDefs />

      {/* Ground shadow — outside the root so it never rotates with a fall */}
      <ellipse
        ref={(node) => onJoint("shadow", node)}
        data-joint="shadow"
        cx={370}
        cy={481}
        rx={188}
        ry={19}
        fill="url(#fenrirShadow)"
        transform={INITIAL.shadow}
      />
      <ellipse
        cx={370}
        cy={481}
        rx={120}
        ry={11}
        fill="#000"
        opacity={0.28}
        style={{ filter: "blur(4px)" }}
      />

      <g ref={(node) => onJoint("root", node)} data-joint="root" transform={INITIAL.root}>
        <g ref={(node) => onJoint("body", node)} data-joint="body" transform={INITIAL.body}>
          {/* ---------------------------------------------------------- *
           * TAIL (behind the body, five chained segments)
           * ---------------------------------------------------------- */}
          <g ref={(node) => onJoint("tail0", node)} data-joint="tail0" transform={INITIAL.tail0}>
            <FenrirTailSegmentArt length={ta[0]} baseWidth={tw[0]} tipWidth={tt[0]} />
            <g ref={(node) => onJoint("tail1", node)} data-joint="tail1" transform={INITIAL.tail1}>
              <FenrirTailSegmentArt length={ta[1]} baseWidth={tw[1]} tipWidth={tt[1]} />
              <g ref={(node) => onJoint("tail2", node)} data-joint="tail2" transform={INITIAL.tail2}>
                <FenrirTailSegmentArt length={ta[2]} baseWidth={tw[2]} tipWidth={tt[2]} />
                <g ref={(node) => onJoint("tail3", node)} data-joint="tail3" transform={INITIAL.tail3}>
                  <FenrirTailSegmentArt length={ta[3]} baseWidth={tw[3]} tipWidth={tt[3]} />
                  <g ref={(node) => onJoint("tail4", node)} data-joint="tail4" transform={INITIAL.tail4}>
                    <FenrirTailSegmentArt
                      length={ta[4]}
                      baseWidth={tw[4]}
                      tipWidth={tt[4]}
                      last
                    />
                  </g>
                </g>
              </g>
            </g>
          </g>

          {/* ---------------------------------------------------------- *
           * LEGS — all four are drawn under the torso, so the shoulder
           * and hip seams disappear behind the body silhouette.
           * ---------------------------------------------------------- */}

          {/* Far hind */}
          <g
            ref={(node) => onJoint("rearFarUpper", node)}
            transform={INITIAL.rearFarUpper}
          >
            <FenrirHindUpperArt far />
            <g
              ref={(node) => onJoint("rearFarLower", node)}
              transform={INITIAL.rearFarLower}
            >
              <FenrirHindLowerArt far />
              <g
                ref={(node) => onJoint("rearFarHock", node)}
                transform={INITIAL.rearFarHock}
              >
                <FenrirHockArt far />
                <g
                  ref={(node) => onJoint("rearFarPaw", node)}
                  transform={INITIAL.rearFarPaw}
                >
                  <FenrirPawArt far />
                </g>
              </g>
            </g>
          </g>

          {/* Far front */}
          <g
            ref={(node) => onJoint("frontFarUpper", node)}
            transform={INITIAL.frontFarUpper}
          >
            <FenrirFrontUpperArt far />
            <g
              ref={(node) => onJoint("frontFarLower", node)}
              transform={INITIAL.frontFarLower}
            >
              <FenrirFrontLowerArt far />
              <g
                ref={(node) => onJoint("frontFarPaw", node)}
                transform={INITIAL.frontFarPaw}
              >
                <FenrirPawArt far />
              </g>
            </g>
          </g>

          {/* Near hind */}
          <g
            ref={(node) => onJoint("rearNearUpper", node)}
            transform={INITIAL.rearNearUpper}
          >
            <FenrirHindUpperArt />
            <g
              ref={(node) => onJoint("rearNearLower", node)}
              transform={INITIAL.rearNearLower}
            >
              <FenrirHindLowerArt />
              <g
                ref={(node) => onJoint("rearNearHock", node)}
                transform={INITIAL.rearNearHock}
              >
                <FenrirHockArt />
                <g
                  ref={(node) => onJoint("rearNearPaw", node)}
                  transform={INITIAL.rearNearPaw}
                >
                  <FenrirPawArt />
                </g>
              </g>
            </g>
          </g>

          {/* Near front */}
          <g
            ref={(node) => onJoint("frontNearUpper", node)}
            transform={INITIAL.frontNearUpper}
          >
            <FenrirFrontUpperArt />
            <g
              ref={(node) => onJoint("frontNearLower", node)}
              transform={INITIAL.frontNearLower}
            >
              <FenrirFrontLowerArt />
              <g
                ref={(node) => onJoint("frontNearPaw", node)}
                transform={INITIAL.frontNearPaw}
              >
                <FenrirPawArt />
              </g>
            </g>
          </g>

          {/* ---------------------------------------------------------- *
           * TORSO
           * ---------------------------------------------------------- */}
          <FenrirBodyArt />

          {/* Breathing chest overlay */}
          <g            ref={(node) => onJoint("chest", node)}
            data-joint="chest"
            transform={INITIAL.chest}>
            <FenrirChestArt />
          </g>

          {/* ---------------------------------------------------------- *
           * NECK + HEAD
           * ---------------------------------------------------------- */}
          <g ref={(node) => onJoint("neck", node)} data-joint="neck" transform={INITIAL.neck}>
            <FenrirNeckArt />

            <g ref={(node) => onJoint("head", node)} data-joint="head" transform={INITIAL.head}>
              <g
                ref={(node) => onJoint("earFar", node)}
                data-joint="earFar"
                transform={INITIAL.earFar}
              >
                <FenrirEarArt far />
              </g>

              <FenrirHeadArt
                registerEyes={(node) => onJoint("eyes", node)}
                registerMouth={(node) => onJoint("mouthCavity", node)}
              />

              <g ref={(node) => onJoint("jaw", node)} data-joint="jaw" transform={INITIAL.jaw}>
                <FenrirJawArt registerFangs={(node) => onJoint("fangsLower", node)} />
              </g>

              <FenrirHeadForegroundArt registerFangs={(node) => onJoint("fangsUpper", node)} />

              <g
                ref={(node) => onJoint("earNear", node)}
                data-joint="earNear"
                transform={INITIAL.earNear}
                style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,.5))" }}
              >
                <FenrirEarArt />
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
});

export default FenrirRig;
