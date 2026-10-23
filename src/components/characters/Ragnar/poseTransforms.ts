import type { RagnarPose } from "./types";

/**
 * Humanoid joint layout, in the character's local space.
 *
 * Origin (0, 0) is the pelvis. Negative y goes up, positive x is the
 * direction he faces. All art is authored around these pivots, so the rig
 * only ever translates and rotates groups.
 */
export const RAGNAR_RIG = {
  /** Screen position of the pelvis in the 640 x 760 stage. */
  origin: [320, 440] as const,
  /** Resting ground line, used by the shadow. */
  ground: 704,

  torsoPivot: [0, -8] as const,

  neck: {
    base: [0, -184] as const,
    head: [4, -18] as const,
  },
  beard: [0, -20] as const,
  hair: [0, -58] as const,
  braid: [-24, -38] as const,

  axeArm: {
    shoulder: [-74, -160] as const,
    elbow: [0, 96] as const,
    wrist: [0, 92] as const,
  },
  shieldArm: {
    shoulder: [74, -160] as const,
    elbow: [0, 96] as const,
    wrist: [0, 92] as const,
  },

  legNear: {
    hip: [-40, 2] as const,
    knee: [0, 122] as const,
    ankle: [0, 112] as const,
  },
  legFar: {
    hip: [40, 0] as const,
    knee: [0, 122] as const,
    ankle: [0, 112] as const,
  },

  cloak: {
    root: [-6, -164] as const,
    lengths: [112, 106, 100] as const,
  },
} as const;

const n = (v: number | undefined) => (Number.isFinite(v) ? (v as number) : 0);

/** Build the complete transform map for one pose. */
export function poseTransforms(pose: RagnarPose): Record<string, string> {
  const [ox, oy] = RAGNAR_RIG.origin;
  const [tx, ty] = RAGNAR_RIG.torsoPivot;
  const [nbx, nby] = RAGNAR_RIG.neck.base;
  const [nhx, nhy] = RAGNAR_RIG.neck.head;
  const [bex, bey] = RAGNAR_RIG.beard;
  const [hax, hay] = RAGNAR_RIG.hair;
  const [brx, bry] = RAGNAR_RIG.braid;

  const axe = pose.axeArm;
  const shield = pose.shieldArm;

  /*
   * Shield-arm calibration.
   *
   * The clips were authored when the shield rested across the chest: a
   * positive elbow angle folded the forearm inward and the wrist cancelled
   * the rotation. The art now holds the shield out at guard height, beside
   * the body, so the elbow is mirrored and the wrist keeps the board
   * upright. Keeping it here means every existing clip keeps working.
   */
  const shieldShoulder = n(shield[0]);
  const shieldElbow = -(n(shield[1]) + 56);
  const shieldWrist = -(shieldShoulder + shieldElbow);
  const near = pose.legNear;
  const far = pose.legFar;
  const cloak = pose.cloak;

  const chest = n(pose.chest);
  const chestScale = `translate(0 -96) scale(${(1 + chest * 0.018).toFixed(4)} ${(1 + chest * 0.012).toFixed(4)}) translate(0 96)`;

  const shadowLift = Math.max(0, -pose.rootY);

  return {
    root: `translate(${(ox + n(pose.rootX)).toFixed(2)} ${(oy + n(pose.rootY)).toFixed(2)}) rotate(${n(pose.rootRot).toFixed(2)})`,
    shadow: `translate(${ox} ${RAGNAR_RIG.ground}) scale(${(1 - Math.min(0.35, shadowLift / 900)).toFixed(3)} ${(1 - Math.min(0.5, shadowLift / 700)).toFixed(3)}) translate(${-ox} ${-RAGNAR_RIG.ground})`,

    hips: `rotate(${n(pose.hipsRot)} ${tx} ${ty})`,

    torso: `translate(0 ${n(pose.spineY)}) ${chestScale} rotate(${n(pose.spineRot).toFixed(2)} ${tx} ${ty})`,

    neck: `translate(${nbx} ${nby}) rotate(${n(pose.neckRot)})`,
    head: `translate(${nhx} ${nhy}) rotate(${n(pose.headRot)})`,
    beard: `rotate(${n(pose.beard)} ${bex} ${bey})`,
    hair: `rotate(${n(pose.hair)} ${hax} ${hay})`,
    braid: `rotate(${n(pose.braid)} ${brx} ${bry})`,

    axeShoulder: `translate(${RAGNAR_RIG.axeArm.shoulder[0]} ${RAGNAR_RIG.axeArm.shoulder[1]}) rotate(${n(axe[0])})`,
    axeElbow: `translate(${RAGNAR_RIG.axeArm.elbow[0]} ${RAGNAR_RIG.axeArm.elbow[1]}) rotate(${n(axe[1])})`,
    axeWrist: `translate(${RAGNAR_RIG.axeArm.wrist[0]} ${RAGNAR_RIG.axeArm.wrist[1]}) rotate(${n(axe[2])})`,
    axe: `rotate(${n(pose.axe)})`,

    shieldShoulder: `translate(${RAGNAR_RIG.shieldArm.shoulder[0]} ${RAGNAR_RIG.shieldArm.shoulder[1]}) rotate(${shieldShoulder})`,
    shieldElbow: `translate(${RAGNAR_RIG.shieldArm.elbow[0]} ${RAGNAR_RIG.shieldArm.elbow[1]}) rotate(${shieldElbow})`,
    shieldWrist: `translate(${RAGNAR_RIG.shieldArm.wrist[0]} ${RAGNAR_RIG.shieldArm.wrist[1]}) rotate(${shieldWrist})`,
    shield: `rotate(${n(pose.shield)})`,

    legNearUpper: `translate(${RAGNAR_RIG.legNear.hip[0]} ${RAGNAR_RIG.legNear.hip[1]}) rotate(${n(near[0])})`,
    legNearLower: `translate(${RAGNAR_RIG.legNear.knee[0]} ${RAGNAR_RIG.legNear.knee[1]}) rotate(${n(near[1])})`,
    legNearFoot: `translate(${RAGNAR_RIG.legNear.ankle[0]} ${RAGNAR_RIG.legNear.ankle[1]}) rotate(${n(near[2])})`,
    legFarUpper: `translate(${RAGNAR_RIG.legFar.hip[0]} ${RAGNAR_RIG.legFar.hip[1]}) rotate(${n(far[0])})`,
    legFarLower: `translate(${RAGNAR_RIG.legFar.knee[0]} ${RAGNAR_RIG.legFar.knee[1]}) rotate(${n(far[1])})`,
    legFarFoot: `translate(${RAGNAR_RIG.legFar.ankle[0]} ${RAGNAR_RIG.legFar.ankle[1]}) rotate(${n(far[2])})`,

    cloak0: `translate(${RAGNAR_RIG.cloak.root[0]} ${RAGNAR_RIG.cloak.root[1]}) rotate(${n(cloak[0])})`,
    cloak1: `translate(0 ${RAGNAR_RIG.cloak.lengths[0]}) rotate(${n(cloak[1])})`,
    cloak2: `translate(0 ${RAGNAR_RIG.cloak.lengths[1]}) rotate(${n(cloak[2])})`,
  };
}
