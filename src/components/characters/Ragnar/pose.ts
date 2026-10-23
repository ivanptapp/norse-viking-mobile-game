import type { EaseName, RagnarPose, RagnarPosePatch } from "./types";

/**
 * Neutral warrior stance. Every clip is authored as a patch on top of this,
 * so proportions and joint zero-points stay consistent across animations.
 * The stance is deliberately wide and grounded, like the reference art.
 */
export const DEFAULT_POSE: RagnarPose = {
  rootX: 0,
  rootY: 0,
  rootRot: 0,

  hipsRot: 0,
  spineY: 0,
  spineRot: 0,
  chest: 0,

  neckRot: 0,
  headRot: 0,

  // His right arm holds the axe up; his left arm braces the round shield
  // out at chest height so the cuirass and belt stay readable.
  axeArm: [18, 96, -104],
  shieldArm: [10, 55, -65],

  // Hip, knee and ankle. Ankle cancels hip + knee so the boots stay flat.
  legNear: [10, 4, -14],
  legFar: [-10, 4, 6],

  cloak: [-4, 3, 6],

  hair: 0,
  braid: 0,
  beard: 0,

  axe: 0,
  shield: 0,
};

const ARRAY_FIELDS = [
  "axeArm",
  "shieldArm",
  "legNear",
  "legFar",
  "cloak",
] as const;

export function clonePose(pose: RagnarPose): RagnarPose {
  return {
    ...pose,
    axeArm: [...pose.axeArm],
    shieldArm: [...pose.shieldArm],
    legNear: [...pose.legNear],
    legFar: [...pose.legFar],
    cloak: [...pose.cloak],
  };
}

export function makePose(patch: RagnarPosePatch = {}): RagnarPose {
  const pose = clonePose(DEFAULT_POSE);
  for (const [key, value] of Object.entries(patch) as [
    keyof RagnarPose,
    RagnarPose[keyof RagnarPose],
  ][]) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      (pose[key] as number[]) = [...value];
    } else {
      (pose[key] as number) = value as number;
    }
  }
  return pose;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpArray(a: number[], b: number[], t: number): number[] {
  const length = Math.max(a.length, b.length);
  const out: number[] = new Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = lerp(a[i] ?? b[i] ?? 0, b[i] ?? a[i] ?? 0, t);
  }
  return out;
}

/** Interpolate two full poses; array lengths are tolerated. */
export function lerpPose(a: RagnarPose, b: RagnarPose, t: number): RagnarPose {
  const out = clonePose(a);
  for (const key of Object.keys(a) as (keyof RagnarPose)[]) {
    if ((ARRAY_FIELDS as readonly string[]).includes(key)) continue;
    (out[key] as number) = lerp(a[key] as number, b[key] as number, t);
  }
  out.axeArm = lerpArray(a.axeArm, b.axeArm, t);
  out.shieldArm = lerpArray(a.shieldArm, b.shieldArm, t);
  out.legNear = lerpArray(a.legNear, b.legNear, t);
  out.legFar = lerpArray(a.legFar, b.legFar, t);
  out.cloak = lerpArray(a.cloak, b.cloak, t);
  return out;
}

const EASES: Record<EaseName, (t: number) => number> = {
  linear: (t) => t,
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  snap: (t) => 1 - Math.pow(1 - t, 4),
  hold: (t) => (t < 1 ? 0 : 1),
};

export function ease(name: EaseName, t: number): number {
  return EASES[name](Math.min(1, Math.max(0, t)));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep(t: number): number {
  const v = Math.min(1, Math.max(0, t));
  return v * v * (3 - 2 * v);
}

/** Small deterministic noise used for secondary motion, in [-1, 1]. */
export function wobble(t: number, seed = 0): number {
  return (
    Math.sin(t * 1.7 + seed) * 0.55 +
    Math.sin(t * 2.9 + seed * 2.3) * 0.3 +
    Math.sin(t * 4.3 + seed * 0.7) * 0.15
  );
}
