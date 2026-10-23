import type { EaseName, FenrirPose, PosePatch } from "./types";

/**
 * Neutral standing pose. Every clip is authored as a patch on top of this,
 * so proportions and joint zero-points stay consistent between animations.
 */
export const DEFAULT_POSE: FenrirPose = {
  rootX: 370,
  rootY: 292,
  rootRot: 0,

  spineY: 0,
  spineRot: 0,
  chest: 0,

  neckRot: 0,
  headRot: 0,
  jawOpen: 0,

  earNear: -3,
  earFar: 4,
  eyeOpen: 1,
  brow: 0,

  tail: [-18, -10, -2, 6, 12],

  frontNear: [6, 12, -6],
  frontFar: [2, 16, -5],
  rearNear: [-6, 6, -8, 3],
  rearFar: [-2, 4, -6, 2],
};

const ARRAY_FIELDS = [
  "tail",
  "frontNear",
  "frontFar",
  "rearNear",
  "rearFar",
] as const;

export function clonePose(pose: FenrirPose): FenrirPose {
  return {
    ...pose,
    tail: [...pose.tail],
    frontNear: [...pose.frontNear],
    frontFar: [...pose.frontFar],
    rearNear: [...pose.rearNear],
    rearFar: [...pose.rearFar],
  };
}

export function makePose(patch: PosePatch = {}): FenrirPose {
  const pose = clonePose(DEFAULT_POSE);
  for (const [key, value] of Object.entries(patch) as [
    keyof FenrirPose,
    FenrirPose[keyof FenrirPose],
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
export function lerpPose(a: FenrirPose, b: FenrirPose, t: number): FenrirPose {
  const out = clonePose(a);
  for (const key of Object.keys(a) as (keyof FenrirPose)[]) {
    if ((ARRAY_FIELDS as readonly string[]).includes(key)) continue;
    (out[key] as number) = lerp(
      a[key] as number,
      b[key] as number,
      t,
    );
  }
  out.tail = lerpArray(a.tail, b.tail, t);
  out.frontNear = lerpArray(a.frontNear, b.frontNear, t);
  out.frontFar = lerpArray(a.frontFar, b.frontFar, t);
  out.rearNear = lerpArray(a.rearNear, b.rearNear, t);
  out.rearFar = lerpArray(a.rearFar, b.rearFar, t);
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
