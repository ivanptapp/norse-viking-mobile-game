import type {
  EaseName,
  LagerthaPose,
  LagerthaPosePatch,
  LagerthaPoseKey,
} from "./types";

/**
 * Neutral pose. Zero means "exactly as drawn" for every joint, which lets
 * the idle frame reproduce the original illustration.
 */
export const DEFAULT_LAGERTHA_POSE: LagerthaPose = {
  rootX: 0,
  rootY: 0,
  rootRot: 0,

  spineX: 0,
  spineY: 0,
  spineRot: 0,
  chest: 0,

  headRot: 0,

  armUpper: 0,
  armLower: 0,
  shieldArm: 0,

  legNearHip: 0,
  legNearKnee: 0,
  legFarHip: 0,
  legFarKnee: 0,
};

export function clonePose(pose: LagerthaPose): LagerthaPose {
  return { ...pose };
}

export function makePose(patch: LagerthaPosePatch = {}): LagerthaPose {
  return { ...DEFAULT_LAGERTHA_POSE, ...patch };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Interpolate two complete poses. */
export function lerpPose(
  a: LagerthaPose,
  b: LagerthaPose,
  t: number,
): LagerthaPose {
  const out = clonePose(a);
  for (const key of Object.keys(a) as (keyof LagerthaPose)[]) {
    out[key] = lerp(a[key], b[key], t);
  }
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
  const v = clamp(t, 0, 1);
  return v * v * (3 - 2 * v);
}

/**
 * Sample a keyed clip at an arbitrary time.
 *
 * Keys are patches on top of DEFAULT_LAGERTHA_POSE, so every clip stays
 * proportionate and the original drawing remains the zero pose.
 */
export function sampleLagerthaClip(
  keys: LagerthaPoseKey[],
  duration: number,
  time: number,
): LagerthaPose {
  if (keys.length === 0) return { ...DEFAULT_LAGERTHA_POSE };

  const t = clamp(time, 0, duration);

  let nextIndex = keys.findIndex((key) => key.t >= t);
  if (nextIndex === -1) nextIndex = keys.length - 1;

  const nextKey = keys[nextIndex];
  const previousKey = keys[Math.max(0, nextIndex - 1)];
  const previous = makePose(previousKey.pose);
  const next = makePose(nextKey.pose);

  if (nextKey.t <= previousKey.t) return next;

  const local = (t - previousKey.t) / (nextKey.t - previousKey.t);
  return lerpPose(previous, next, ease(nextKey.ease, local));
}
