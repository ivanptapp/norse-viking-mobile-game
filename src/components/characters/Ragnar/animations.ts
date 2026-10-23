import { clonePose, ease, lerpPose, makePose } from "./pose";
import type {
  EaseName,
  RagnarClip,
  RagnarPose,
  RagnarPoseKey,
  RagnarPosePatch,
  RagnarState,
} from "./types";

const TAU = Math.PI * 2;

function key(t: number, patch: RagnarPosePatch, easing: EaseName = "inOut"): RagnarPoseKey {
  return { t, pose: makePose(patch), ease: easing };
}

function loopClip(
  duration: number,
  samples: number,
  poseAt: (u: number) => RagnarPosePatch,
): RagnarClip {
  const keys: RagnarPoseKey[] = [];
  for (let i = 0; i <= samples; i++) {
    const u = (i / samples) % 1;
    keys.push({ t: (i / samples) * duration, pose: makePose(poseAt(u)), ease: "linear" });
  }
  // Guarantee a seamless loop even when the generator is off by a hair.
  keys[keys.length - 1].pose = clonePose(keys[0].pose);
  return { duration, loop: true, keys };
}

/* ------------------------------------------------------------------ *
 * IDLE — breathing, tiny weight shifts, cloth and hair follow-through
 * ------------------------------------------------------------------ */

const idle = loopClip(3.6, 12, (u) => {
  const t = u * TAU;
  return {
    rootY: 0.9 * Math.sin(t),
    rootX: 0.7 * Math.sin(t + 1.1),
    hipsRot: 0.9 * Math.sin(t + 0.4),
    spineY: -0.8 + 0.9 * Math.sin(t + 0.9),
    spineRot: 1.1 * Math.sin(t + 0.7),
    chest: 0.5 + 0.5 * Math.sin(t - 0.2),
    neckRot: -0.7 * Math.sin(t + 0.7),
    headRot: 1.5 * Math.sin(t * 0.95 + 0.3),
    axeArm: [24 + 1.1 * Math.sin(t + 0.2), 112 + 1.4 * Math.sin(t + 0.6), -128 - 1.2 * Math.sin(t + 0.8)],
    shieldArm: [10 + 0.7 * Math.sin(t + 0.3), 55 + 0.9 * Math.sin(t + 0.9), -65 - 0.7 * Math.sin(t + 1)],
    cloak: [-3 + 1.3 * Math.sin(t + 0.4), 3 + 1.1 * Math.sin(t + 1), 5 + 1.5 * Math.sin(t + 1.6)],
    hair: 1.7 * Math.sin(t + 1.2),
    braid: 2.6 * Math.sin(t * 1.05 + 0.7),
    beard: 1.1 * Math.sin(t + 0.2),
    axe: 0.8 * Math.sin(t + 1.4),
  };
});

/* ------------------------------------------------------------------ *
 * LOCOMOTION
 * ------------------------------------------------------------------ */

function legCycle(
  phase: number,
  amplitude: number,
  knee: number,
  lift: number,
): number[] {
  const p = ((phase % 1) + 1) % 1;
  const hip = -amplitude * Math.cos(TAU * p);
  const swing = p > 0.5 ? Math.sin(Math.PI * ((p - 0.5) / 0.5)) : 0;
  const stride = Math.sin(TAU * p);
  const flex = 6 + knee * swing * swing;
  const ankle = -(hip + flex) * 0.9 - lift * swing - 4 * stride;
  return [hip, flex, ankle];
}

const walk = loopClip(1.05, 16, (u) => {
  const p = u;
  const t = p * TAU;
  const near = legCycle(p, 8, 46, 4);
  const far = legCycle(p + 0.5, 8, 46, 4);
  const axe = Math.cos(t);
  return {
    rootX: 1.4 * Math.sin(t + 0.5),
    rootY: -1 + 1.1 * Math.cos(2 * t),
    hipsRot: 2.8 * Math.cos(t) - 0.6,
    spineRot: 3.2 * Math.cos(t) + 1.2,
    spineY: -0.6,
    chest: 0.45 + 0.2 * Math.cos(2 * t),
    neckRot: -1.4 * Math.cos(t),
    headRot: 1.1 * Math.sin(t),
    legNear: near,
    legFar: far,
    axeArm: [24 + 9 * axe, 112 + 6 * axe, -128 - 8 * axe],
    shieldArm: [10 - 4 * axe, 55 + 3 * axe, -65 + 1],
    cloak: [-3 + 3.2 * Math.cos(t + 0.5), 3 + 2.6 * Math.cos(t + 1.1), 5 + 3.4 * Math.cos(t + 1.7)],
    hair: 2.4 * Math.sin(t + 0.4),
    braid: 3.4 * Math.sin(t + 0.1),
    beard: 1.8 * Math.sin(t + 0.6),
    axe: 1.6 * Math.sin(t),
    shield: 1.2 * Math.sin(t + 0.4),
  };
});

const run = loopClip(0.66, 12, (u) => {
  const p = u;
  const t = p * TAU;
  const near = legCycle(p, 12, 72, 8);
  const far = legCycle(p + 0.5, 12, 72, 8);
  const axe = Math.cos(t);
  return {
    rootX: 2.4 * Math.sin(t + 0.4),
    rootY: -4 + 3.2 * Math.cos(2 * t),
    hipsRot: 4.6 * Math.cos(t) - 1,
    spineRot: 12 + 3.4 * Math.cos(t),
    spineY: -1.6,
    chest: 0.85,
    neckRot: -6 - 1.6 * Math.cos(t),
    headRot: 1.6 - 1.2 * Math.cos(t),
    legNear: near,
    legFar: far,
    axeArm: [18 + 26 * axe, 104 + 14 * axe, -116 - 20 * axe],
    shieldArm: [-2 - 6 * axe, 74 + 5 * axe, -72],
    cloak: [15 + 5 * Math.cos(t + 0.6), 11 + 4.4 * Math.cos(t + 1.2), 8 + 5 * Math.cos(t + 1.8)],
    hair: 6 + 3.2 * Math.sin(t),
    braid: 8 + 4.6 * Math.sin(t + 0.3),
    beard: 4 + 2.4 * Math.sin(t + 0.5),
    axe: 4 * Math.sin(t),
    shield: 2.4 * Math.sin(t + 0.5),
  };
});

/* ------------------------------------------------------------------ *
 * ATTACK — axe chop with anticipation, strike and recovery
 * ------------------------------------------------------------------ */

const attack: RagnarClip = {
  duration: 1.15,
  loop: false,
  autoReturn: "idle",
  keys: [
    key(0, {}),
    key(
      0.16,
      {
        rootX: -12,
        spineRot: -12,
        spineY: -2,
        hipsRot: -6,
        neckRot: -4,
        headRot: -3,
        axeArm: [50, 150, -172],
        axe: -6,
        shieldArm: [4, 66, -66],
        legNear: [16, 10, -26],
        legFar: [-16, 10, 12],
        cloak: [-7, -5, -1],
        beard: -2,
        braid: -3,
      },
      "out",
    ),
    key(
      0.3,
      {
        rootX: -18,
        spineRot: -17,
        spineY: -3,
        hipsRot: -8,
        neckRot: -6,
        headRot: -5,
        axeArm: [62, 154, -176],
        axe: -9,
        shieldArm: [2, 70, -68],
        legNear: [18, 8, -26],
        legFar: [-18, 12, 12],
        cloak: [-11, -7, -2],
        beard: -3,
        braid: -4,
      },
      "in",
    ),
    key(
      0.46,
      {
        rootX: 18,
        rootY: 2,
        hipsRot: 7,
        spineRot: 15,
        spineY: 1,
        neckRot: 4,
        headRot: 6,
        axeArm: [-44, 18, 2],
        axe: 74,
        shieldArm: [16, 44, -58],
        legNear: [24, 18, -42],
        legFar: [-24, 22, 2],
        cloak: [12, 10, 9],
        beard: 4,
        braid: 5,
      },
      "snap",
    ),
    key(
      0.6,
      {
        rootX: 22,
        rootY: 3,
        hipsRot: 5,
        spineRot: 20,
        spineY: 2,
        neckRot: 5,
        headRot: 7,
        axeArm: [-26, 34, -14],
        axe: 66,
        shieldArm: [14, 48, -60],
        legNear: [26, 22, -48],
        legFar: [-24, 26, -2],
        cloak: [16, 13, 11],
        beard: 5,
        braid: 7,
      },
      "out",
    ),
    key(
      0.8,
      {
        rootX: 10,
        spineRot: 8,
        hipsRot: 2,
        axeArm: [16, 92, -104],
        axe: 26,
        shieldArm: [10, 54, -64],
        legNear: [18, 14, -32],
        legFar: [-18, 14, 4],
        cloak: [6, 7, 8],
        beard: 2,
        braid: 3,
      },
      "inOut",
    ),
    key(1.15, {}, "inOut"),
  ],
};

/* ------------------------------------------------------------------ *
 * HIT
 * ------------------------------------------------------------------ */

const hit: RagnarClip = {
  duration: 0.72,
  loop: false,
  autoReturn: "idle",
  keys: [
    key(0, {}),
    key(
      0.08,
      {
        rootX: -13,
        rootY: 1,
        rootRot: -2.5,
        hipsRot: -5,
        spineRot: -16,
        spineY: 1,
        neckRot: -7,
        headRot: -9,
        axeArm: [34, 98, -118],
        shieldArm: [0, 74, -76],
        legNear: [14, 20, -34],
        legFar: [-16, 16, 0],
        cloak: [-12, -6, 2],
        beard: -4,
        braid: -6,
      },
      "snap",
    ),
    key(
      0.24,
      {
        rootX: -10,
        rootRot: -1.6,
        hipsRot: -3,
        spineRot: -12,
        neckRot: -5,
        headRot: -6,
        axeArm: [31, 100, -120],
        shieldArm: [3, 70, -72],
        legNear: [12, 17, -29],
        legFar: [-14, 14, 0],
        cloak: [-8, -4, 3],
        beard: -3,
        braid: -4,
      },
      "out",
    ),
    key(
      0.44,
      {
        rootX: -4,
        spineRot: -3,
        neckRot: -1,
        headRot: -1,
        shieldArm: [7, 61, -68],
        legNear: [12, 9, -21],
        legFar: [-12, 8, 4],
        cloak: [-5, 0, 4],
        beard: -1,
        braid: -1,
      },
      "inOut",
    ),
    key(0.72, {}, "out"),
  ],
};

/* ------------------------------------------------------------------ *
 * DEATH — stagger, buckle to the knees, fall and hold
 * ------------------------------------------------------------------ */

const death: RagnarClip = {
  duration: 2.2,
  loop: false,
  hold: true,
  keys: [
    key(0, {}),
    key(
      0.18,
      {
        rootX: -9,
        rootRot: -3,
        hipsRot: -4,
        spineRot: -13,
        spineY: 1,
        neckRot: -6,
        headRot: -8,
        axeArm: [36, 96, -116],
        shieldArm: [4, 66, -70],
        legNear: [16, 30, -46],
        legFar: [-14, 26, -10],
        cloak: [-10, -4, 3],
        beard: -3,
        braid: -5,
      },
      "out",
    ),
    key(
      0.5,
      {
        rootX: -12,
        rootY: 58,
        rootRot: -5,
        hipsRot: -7,
        spineRot: -16,
        spineY: 2,
        neckRot: -8,
        headRot: -9,
        axeArm: [48, 84, -104],
        shieldArm: [10, 50, -50],
        legNear: [32, 88, -122],
        legFar: [-6, 78, -74],
        cloak: [-14, -7, 0],
        beard: -4,
        braid: -7,
      },
      "in",
    ),
    key(
      0.9,
      {
        rootX: -6,
        rootY: 126,
        rootRot: -9,
        hipsRot: -3,
        spineRot: 26,
        spineY: 3,
        neckRot: 8,
        headRot: 14,
        axeArm: [24, 20, 2],
        shieldArm: [16, 22, 6],
        legNear: [34, 138, -172],
        legFar: [6, 130, -136],
        cloak: [-18, -10, -2],
        beard: 4,
        braid: 7,
        axe: -60,
      },
      "in",
    ),
    key(
      1.35,
      {
        rootX: 2,
        rootY: 142,
        rootRot: -14,
        hipsRot: 2,
        spineRot: 34,
        spineY: 4,
        neckRot: 10,
        headRot: 18,
        axeArm: [14, 12, 2],
        shieldArm: [12, 16, 8],
        legNear: [35, 144, -178],
        legFar: [8, 136, -142],
        cloak: [-20, -12, -3],
        beard: 6,
        braid: 9,
        axe: -96,
      },
      "in",
    ),
    key(
      1.85,
      {
        rootX: 4,
        rootY: 148,
        rootRot: -16,
        hipsRot: 2,
        spineRot: 36,
        spineY: 4,
        neckRot: 11,
        headRot: 20,
        axeArm: [12, 10, 2],
        shieldArm: [11, 15, 8],
        legNear: [35, 146, -180],
        legFar: [8, 138, -144],
        cloak: [-19, -11, -2],
        beard: 7,
        braid: 10,
        axe: -104,
      },
      "out",
    ),
    key(
      2.2,
      {
        rootX: 5,
        rootY: 149,
        rootRot: -17,
        hipsRot: 2,
        spineRot: 37,
        spineY: 4,
        neckRot: 11,
        headRot: 21,
        axeArm: [11, 9, 2],
        shieldArm: [10, 14, 8],
        legNear: [35, 146, -180],
        legFar: [8, 138, -144],
        cloak: [-19, -11, -2],
        beard: 7,
        braid: 10,
        axe: -105,
      },
      "hold",
    ),
  ],
};

/* ------------------------------------------------------------------ *
 * VICTORY — axe lifted high, chest out, cloak settling
 * ------------------------------------------------------------------ */

const victory: RagnarClip = {
  duration: 2,
  loop: false,
  hold: true,
  keys: [
    key(0, {}),
    key(
      0.22,
      {
        rootY: 8,
        hipsRot: -3,
        spineRot: 7,
        spineY: 2,
        neckRot: 3,
        headRot: 2,
        axeArm: [40, 116, -140],
        axe: 10,
        shieldArm: [12, 50, -60],
        legNear: [16, 14, -30],
        legFar: [-16, 12, 4],
        cloak: [3, 4, 6],
      },
      "in",
    ),
    key(
      0.55,
      {
        rootY: -6,
        hipsRot: 3,
        spineRot: -9,
        spineY: -3,
        neckRot: -7,
        headRot: -6,
        axeArm: [118, -8, -62],
        axe: 0,
        shieldArm: [-12, 42, -34],
        legNear: [14, 3, -17],
        legFar: [-14, 3, 11],
        cloak: [-9, -4, 1],
        chest: 0.9,
        hair: -4,
        braid: -6,
        beard: -2,
      },
      "snap",
    ),
    key(
      0.82,
      {
        rootY: -3,
        hipsRot: 2,
        spineRot: -6,
        spineY: -2,
        neckRot: -5,
        headRot: -4,
        axeArm: [115, -7, -60],
        axe: 0,
        shieldArm: [-8, 44, -38],
        legNear: [13, 4, -17],
        legFar: [-13, 4, 9],
        cloak: [-6, -1, 3],
        chest: 0.6,
        hair: 2,
        braid: 3,
        beard: 1,
      },
      "out",
    ),
    key(
      1.3,
      {
        rootY: -4,
        hipsRot: 2,
        spineRot: -7,
        spineY: -2.4,
        neckRot: -5,
        headRot: -4.4,
        axeArm: [117, -8, -61],
        axe: 0,
        shieldArm: [-10, 43, -36],
        legNear: [13, 4, -17],
        legFar: [-13, 4, 9],
        cloak: [-7, -2, 2],
        chest: 0.7,
        hair: -1,
        braid: -2,
        beard: 0,
      },
      "inOut",
    ),
    key(
      2,
      {
        rootY: -4,
        hipsRot: 2,
        spineRot: -7,
        spineY: -2.2,
        neckRot: -5,
        headRot: -4.2,
        axeArm: [116, -8, -60],
        axe: 0,
        shieldArm: [-9, 43, -37],
        legNear: [13, 4, -17],
        legFar: [-13, 4, 9],
        cloak: [-6.6, -1.6, 2.4],
        chest: 0.65,
        hair: 0.5,
        braid: 1,
        beard: 0.4,
      },
      "hold",
    ),
  ],
};

/* ------------------------------------------------------------------ *
 * JUMP
 * ------------------------------------------------------------------ */

const jump: RagnarClip = {
  duration: 1.15,
  loop: false,
  autoReturn: "idle",
  keys: [
    key(0, {}),
    key(
      0.14,
      {
        rootY: 34,
        hipsRot: -4,
        spineRot: 12,
        spineY: 2,
        neckRot: 4,
        headRot: 2,
        axeArm: [34, 108, -126],
        shieldArm: [18, 62, -72],
        legNear: [24, 62, -96],
        legFar: [-4, 56, -56],
        cloak: [-8, -4, 0],
        beard: 2,
      },
      "in",
    ),
    key(
      0.26,
      {
        rootY: -34,
        hipsRot: 2,
        spineRot: -6,
        spineY: -3,
        neckRot: -4,
        headRot: -3,
        axeArm: [6, 112, -124],
        shieldArm: [2, 60, -64],
        legNear: [16, 6, -22],
        legFar: [-16, 6, 12],
        cloak: [10, 8, 6],
        hair: -5,
        braid: -8,
        beard: -2,
      },
      "out",
    ),
    key(
      0.46,
      {
        rootY: -92,
        hipsRot: -4,
        spineRot: -4,
        spineY: -2,
        neckRot: -2,
        headRot: -2,
        axeArm: [-2, 118, -130],
        shieldArm: [-4, 64, -66],
        legNear: [30, 58, -88],
        legFar: [16, 48, -66],
        cloak: [-6, -10, -8],
        hair: -3,
        braid: -5,
        beard: -1,
      },
      "inOut",
    ),
    key(
      0.66,
      {
        rootY: -58,
        hipsRot: 2,
        spineRot: 4,
        neckRot: 1,
        axeArm: [16, 106, -120],
        shieldArm: [6, 56, -62],
        legNear: [22, 34, -60],
        legFar: [4, 28, -34],
        cloak: [6, 8, 10],
        hair: 2,
        braid: 4,
        beard: 1,
      },
      "in",
    ),
    key(
      0.82,
      {
        rootY: 42,
        hipsRot: -3,
        spineRot: 14,
        spineY: 3,
        neckRot: 5,
        headRot: 4,
        axeArm: [36, 96, -114],
        shieldArm: [22, 58, -74],
        legNear: [28, 72, -110],
        legFar: [0, 62, -64],
        cloak: [-10, -6, -2],
        beard: 3,
      },
      "snap",
    ),
    key(
      0.98,
      {
        rootY: 8,
        spineRot: 4,
        neckRot: 1,
        axeArm: [26, 110, -126],
        shieldArm: [12, 56, -66],
        legNear: [16, 22, -40],
        legFar: [-6, 18, -12],
        cloak: [-2, 2, 4],
        beard: 1,
      },
      "out",
    ),
    key(1.15, {}, "inOut"),
  ],
};

export const RAGNAR_CLIPS: Record<RagnarState, RagnarClip> = {
  idle,
  walk,
  run,
  attack,
  hit,
  death,
  victory,
  jump,
};

export const LOOP_STATES = new Set<RagnarState>(["idle", "walk", "run"]);

export function sampleClip(clip: RagnarClip, time: number): RagnarPose {
  const { keys } = clip;
  let t = time;
  if (clip.loop) {
    t = ((time % clip.duration) + clip.duration) % clip.duration;
  } else {
    t = Math.max(0, Math.min(clip.duration, time));
  }

  if (t <= keys[0].t) return clonePose(keys[0].pose);
  if (t >= keys[keys.length - 1].t) {
    return clonePose(keys[keys.length - 1].pose);
  }

  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const u = span <= 0 ? 1 : ease(b.ease, (t - a.t) / span);
      return lerpPose(a.pose, b.pose, u);
    }
  }
  return clonePose(keys[keys.length - 1].pose);
}
