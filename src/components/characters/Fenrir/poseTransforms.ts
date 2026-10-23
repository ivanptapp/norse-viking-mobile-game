import { DEFAULT_POSE } from "./pose";
import type { FenrirPose } from "./types";

/**
 * Joint layout in torso-local coordinates (character faces +x).
 * Art is authored around each pivot, so the rig only ever rotates groups.
 */
export const FENRIR_RIG = {
  neck: { base: [96, -36] as const, head: [52, -26] as const },
  jaw: [48, 8] as const,
  earNear: [4, -54] as const,
  earFar: [-24, -50] as const,
  eyes: [36, -30] as const,
  tail: {
    root: [-174, -8] as const,
    lengths: [32, 28, 24, 20, 18] as const,
    widths: [19, 17, 15, 13, 10] as const,
    tips: [16, 14, 12, 10, 7] as const,
  },
  frontNear: {
    shoulder: [84, 26] as const,
    elbow: [0, 70] as const,
    paw: [0, 60] as const,
  },
  frontFar: {
    shoulder: [62, 16] as const,
    elbow: [0, 70] as const,
    paw: [0, 60] as const,
  },
  rearNear: {
    hip: [-140, 18] as const,
    knee: [12, 62] as const,
    hock: [-6, 48] as const,
    paw: [0, 32] as const,
  },
  rearFar: {
    hip: [-166, 12] as const,
    knee: [12, 62] as const,
    hock: [-6, 48] as const,
    paw: [0, 32] as const,
  },
} as const;

const n = (v: number | undefined) => (Number.isFinite(v) ? (v as number) : 0);

/** Build the complete transform map for one pose. */
export function poseTransforms(pose: FenrirPose): Record<string, string> {
  const [nx, ny] = FENRIR_RIG.neck.base;
  const [hx, hy] = FENRIR_RIG.neck.head;
  const [jx, jy] = FENRIR_RIG.jaw;
  const [ex, ey] = FENRIR_RIG.eyes;
  const [tx, ty] = FENRIR_RIG.tail.root;

  const tn = pose.tail;
  const fn = pose.frontNear;
  const ff = pose.frontFar;
  const rn = pose.rearNear;
  const rf = pose.rearFar;

  const tailTransforms: Record<string, string> = {
    tail0: `translate(${tx} ${ty}) rotate(${n(tn[0])})`,
  };
  for (let i = 1; i < FENRIR_RIG.tail.lengths.length; i++) {
    tailTransforms[`tail${i}`] = `translate(${-FENRIR_RIG.tail.lengths[i - 1]} 0) rotate(${n(tn[i])})`;
  }

  const eyeOpen = Math.max(0.05, Math.min(1, n(pose.eyeOpen)));

  return {
    root: `translate(${n(pose.rootX)} ${n(pose.rootY)}) rotate(${n(pose.rootRot)})`,
    shadow: (() => {
      const lift = DEFAULT_POSE.rootY - pose.rootY;
      const squish = Math.max(0.45, 1 - lift / 420);
      return `translate(${DEFAULT_POSE.rootX} 481) scale(${squish} ${squish * 0.9}) translate(${-DEFAULT_POSE.rootX} -481)`;
    })(),
    body: `translate(0 ${n(pose.spineY)}) rotate(${n(pose.spineRot)})`,
    chest: `translate(84 0) scale(${1 + n(pose.chest) * 0.025} ${1 + n(pose.chest) * 0.04}) translate(-84 0)`,
    neck: `translate(${nx} ${ny}) rotate(${n(pose.neckRot)})`,
    head: `translate(${hx} ${hy}) rotate(${n(pose.headRot)}) scale(0.8 0.9)`,
    jaw: `rotate(${n(pose.jawOpen) * 33} ${jx} ${jy})`,
    earNear: `rotate(${n(pose.earNear)})`,
    earFar: `rotate(${n(pose.earFar)})`,
    eyes: `translate(${ex} ${ey}) scale(1 ${eyeOpen}) translate(${-ex} ${-ey})`,
    ...tailTransforms,
    frontNearUpper: `translate(${FENRIR_RIG.frontNear.shoulder[0]} ${FENRIR_RIG.frontNear.shoulder[1]}) rotate(${n(fn[0])})`,
    frontNearLower: `translate(${FENRIR_RIG.frontNear.elbow[0]} ${FENRIR_RIG.frontNear.elbow[1]}) rotate(${n(fn[1])})`,
    frontNearPaw: `translate(${FENRIR_RIG.frontNear.paw[0]} ${FENRIR_RIG.frontNear.paw[1]}) rotate(${n(fn[2])})`,
    frontFarUpper: `translate(${FENRIR_RIG.frontFar.shoulder[0]} ${FENRIR_RIG.frontFar.shoulder[1]}) rotate(${n(ff[0])})`,
    frontFarLower: `translate(${FENRIR_RIG.frontFar.elbow[0]} ${FENRIR_RIG.frontFar.elbow[1]}) rotate(${n(ff[1])})`,
    frontFarPaw: `translate(${FENRIR_RIG.frontFar.paw[0]} ${FENRIR_RIG.frontFar.paw[1]}) rotate(${n(ff[2])})`,
    rearNearUpper: `translate(${FENRIR_RIG.rearNear.hip[0]} ${FENRIR_RIG.rearNear.hip[1]}) rotate(${n(rn[0])})`,
    rearNearLower: `translate(${FENRIR_RIG.rearNear.knee[0]} ${FENRIR_RIG.rearNear.knee[1]}) rotate(${n(rn[1])})`,
    rearNearHock: `translate(${FENRIR_RIG.rearNear.hock[0]} ${FENRIR_RIG.rearNear.hock[1]}) rotate(${n(rn[2])})`,
    rearNearPaw: `translate(${FENRIR_RIG.rearNear.paw[0]} ${FENRIR_RIG.rearNear.paw[1]}) rotate(${n(rn[3])})`,
    rearFarUpper: `translate(${FENRIR_RIG.rearFar.hip[0]} ${FENRIR_RIG.rearFar.hip[1]}) rotate(${n(rf[0])})`,
    rearFarLower: `translate(${FENRIR_RIG.rearFar.knee[0]} ${FENRIR_RIG.rearFar.knee[1]}) rotate(${n(rf[1])})`,
    rearFarHock: `translate(${FENRIR_RIG.rearFar.hock[0]} ${FENRIR_RIG.rearFar.hock[1]}) rotate(${n(rf[2])})`,
    rearFarPaw: `translate(${FENRIR_RIG.rearFar.paw[0]} ${FENRIR_RIG.rearFar.paw[1]}) rotate(${n(rf[3])})`,
  };
}

/**
 * The ground shadow is part of the scene, not the body, so it does not
 * rotate when Fenrir falls. `shadow` is updated every frame with the pose.
 */
export const SHADOW_TRANSFORM = poseTransforms(DEFAULT_POSE).shadow;
