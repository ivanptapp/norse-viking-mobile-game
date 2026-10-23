import {
  DEFAULT_POSE,
  clonePose,
  ease,
  lerpPose,
  makePose,
} from "./pose";
import type {
  EaseName,
  FenrirClip,
  FenrirPose,
  FenrirState,
  PoseKey,
  PosePatch,
} from "./types";

const TAU = Math.PI * 2;

function key(t: number, patch: PosePatch, easing: EaseName = "inOut"): PoseKey {
  return { t, pose: makePose(patch), ease: easing };
}

/* ------------------------------------------------------------------ *
 * Procedural gait helpers.
 *
 * The leg art points straight down at 0°. Positive rotation swings the
 * foot backwards (towards the tail). Stance retraction runs from the
 * front of the cycle to the back; the swing phase lifts and folds the
 * leg so the paw clears the ground.
 * ------------------------------------------------------------------ */

function frontCycle(
  phase: number,
  amplitude: number,
  bend: number,
  baseElbow = 5,
): number[] {
  const p = ((phase % 1) + 1) % 1;
  const swing = p > 0.5 ? Math.sin(Math.PI * ((p - 0.5) / 0.5)) : 0;
  const shoulder = -amplitude * Math.cos(TAU * p);
  const elbow = baseElbow + bend * swing;
  const paw = -(shoulder + elbow) * 0.42;
  return [shoulder, elbow, paw];
}

function rearCycle(
  phase: number,
  amplitude: number,
  bend: number,
  baseKnee = 2,
): number[] {
  const p = ((phase % 1) + 1) % 1;
  const swing = p > 0.5 ? Math.sin(Math.PI * ((p - 0.5) / 0.5)) : 0;
  const hip = -amplitude * Math.cos(TAU * p);
  const knee = baseKnee - bend * 0.9 * swing;
  const hock = 3 + bend * 0.55 * swing;
  const paw = -(hip + knee + hock) * 0.34;
  return [hip, knee, hock, paw];
}

function loopClip(
  duration: number,
  samples: number,
  poseAt: (u: number) => PosePatch,
): FenrirClip {
  const keys: PoseKey[] = [];
  for (let i = 0; i <= samples; i++) {
    const u = (i / samples) % 1;
    keys.push({
      t: (i / samples) * duration,
      pose: makePose(poseAt(u)),
      ease: "linear",
    });
  }
  // Guarantee a seamless loop even when the generator is off by a hair.
  keys[keys.length - 1].pose = clonePose(keys[0].pose);
  return { duration, loop: true, keys };
}

/* ------------------------------------------------------------------ *
 * IDLE — breathing, weight shift, ear flicks, head look, blink.
 * ------------------------------------------------------------------ */

function idleAt(u: number): PosePatch {
  const breath = Math.sin(u * TAU);
  const slow = Math.sin(u * TAU * 2 - 0.6);
  // A single lazy look to the side at ~45% of the clip.
  const look = Math.exp(-Math.pow((u - 0.46) / 0.055, 2));
  const earFlick = Math.exp(-Math.pow((u - 0.7) / 0.018, 2));
  const farEarFlick = Math.exp(-Math.pow((u - 0.31) / 0.014, 2));
  return {
    rootY: DEFAULT_POSE.rootY + breath * 1.9 - 1,
    spineY: breath * 1.1,
    spineRot: breath * 0.45,
    chest: 0.5 + breath * 0.5,
    neckRot: -breath * 1.4 + look * 2.5,
    headRot: breath * 2.2 - look * 7.5,
    earNear: -3 - look * 8 - earFlick * 16,
    earFar: 4 + farEarFlick * 12,
    tail: [
      -18 + slow * 2.8,
      -10 + slow * 4.2,
      -2 + slow * 3.6,
      6 + Math.sin(u * TAU * 2 + 0.9) * 4,
      12 + Math.sin(u * TAU * 2 + 1.75) * 5,
    ],
    frontNear: [6 + slow * 0.8, 12 + slow * 0.9, -6],
    frontFar: [2 - slow * 0.7, 16 + slow * 0.5, -5],
    rearNear: [-6 - slow * 0.9, 6 + slow * 0.8, -8, 3],
    rearFar: [-2 + slow * 0.8, 4, -6, 2],
    eyeOpen: blinkAt(u),
  };
}

/** Two short blinks per idle cycle, plus one in the test lab reset. */
function blinkAt(u: number): number {
  const b1 = Math.exp(-Math.pow((u - 0.27) / 0.013, 2));
  const b2 = Math.exp(-Math.pow((u - 0.78) / 0.015, 2));
  return 1 - Math.min(1, b1 + b2);
}

const idle = loopClip(4.6, 92, idleAt);

/* ------------------------------------------------------------------ *
 * WALK — diagonal trot pairs, paw lift, bob, stable head.
 * ------------------------------------------------------------------ */

const walk = loopClip(1.1, 24, (u) => {
  const bob = Math.cos(u * TAU * 2);
  const sway = Math.sin(u * TAU);
  return {
    rootY: DEFAULT_POSE.rootY - 1.5 + bob * 2.6,
    spineY: bob * 1.4,
    spineRot: sway * 1.6,
    chest: 0.35 + bob * 0.2,
    neckRot: -sway * 1.4 - 0.5,
    headRot: sway * 1.8 + 0.6,
    earNear: -4 + bob * 2,
    earFar: 4 - bob * 2,
    tail: [
      -16 + sway * 4,
      -8 + sway * 5.5,
      0 + sway * 6,
      8 + Math.sin(u * TAU + 0.8) * 7,
      14 + Math.sin(u * TAU + 1.5) * 8,
    ],
    frontNear: frontCycle(u, 17, 34),
    frontFar: frontCycle(u + 0.5, 17, 34),
    rearNear: rearCycle(u + 0.5, 19, 36),
    rearFar: rearCycle(u, 19, 36),
    eyeOpen: 1,
  };
});

/* ------------------------------------------------------------------ *
 * RUN — bounding gallop with spine flex, suspension and streaming tail.
 * ------------------------------------------------------------------ */

const run = loopClip(0.66, 24, (u) => {
  const bounce = Math.sin(u * TAU - 0.5);
  const flex = Math.sin(u * TAU);
  return {
    rootX: DEFAULT_POSE.rootX + 6,
    rootY: DEFAULT_POSE.rootY - 6 + bounce * 13,
    spineY: bounce * 2.4,
    spineRot: flex * 5.2,
    chest: 0.7,
    neckRot: -flex * 5.4 - 2,
    headRot: flex * 4.2 + 1.5,
    earNear: -16 - flex * 5,
    earFar: -10 + flex * 3,
    eyeOpen: 0.95,
    brow: 0.6,
    tail: [
      -10 + flex * 4,
      -4 + flex * 5,
      4 + Math.sin(u * TAU + 0.7) * 7,
      12 + Math.sin(u * TAU + 1.2) * 8,
      18 + Math.sin(u * TAU + 1.7) * 9,
    ],
    frontNear: frontCycle(u, 33, 58, 8),
    frontFar: frontCycle(u + 0.06, 33, 58, 8),
    rearNear: rearCycle(u + 0.42, 36, 62, 4),
    rearFar: rearCycle(u + 0.5, 36, 62, 4),
  };
});

/* ------------------------------------------------------------------ *
 * ATTACK — crouch, coil, lunge, bite, recovery.
 * ------------------------------------------------------------------ */

const attack: FenrirClip = {
  duration: 1.06,
  loop: false,
  autoReturn: "idle",
  keys: [
    key(0, {}),
    key(
      0.16,
      {
        rootX: 362,
        rootY: 305,
        spineRot: 4,
        spineY: 3,
        neckRot: 11,
        headRot: 9,
        jawOpen: 0.12,
        earNear: -24,
        earFar: -18,
        brow: 0.8,
        eyeOpen: 0.9,
        tail: [-22, -16, -8, 2, 8],
        frontNear: [20, 25, -12],
        frontFar: [16, 29, -10],
        rearNear: [6, -16, 12, 2],
        rearFar: [9, -20, 14, 3],
      },
      "out",
    ),
    key(
      0.31,
      {
        rootX: 352,
        rootY: 316,
        spineRot: 7,
        spineY: 5,
        neckRot: 15,
        headRot: 13,
        jawOpen: 0.3,
        earNear: -32,
        earFar: -26,
        brow: 1,
        eyeOpen: 0.82,
        tail: [-28, -20, -10, 0, 5],
        frontNear: [27, 30, -14],
        frontFar: [22, 34, -12],
        rearNear: [9, -20, 15, 2],
        rearFar: [12, -24, 17, 3],
      },
      "out",
    ),
    key(
      0.45,
      {
        rootX: 418,
        rootY: 286,
        spineRot: -5,
        spineY: -2,
        neckRot: -9,
        headRot: -7,
        jawOpen: 0.85,
        earNear: -30,
        earFar: -24,
        brow: 1,
        eyeOpen: 1,
        tail: [-4, 4, 10, 14, 16],
        frontNear: [-38, 9, 14],
        frontFar: [-30, 13, 10],
        rearNear: [22, -7, -13, 6],
        rearFar: [26, -11, -15, 7],
      },
      "snap",
    ),
    key(
      0.56,
      {
        rootX: 450,
        rootY: 300,
        spineRot: 5,
        spineY: 2,
        neckRot: 12,
        headRot: 15,
        jawOpen: 0.06,
        earNear: -18,
        earFar: -14,
        brow: 1,
        eyeOpen: 0.75,
        tail: [0, 8, 14, 18, 20],
        frontNear: [-20, 22, 4],
        frontFar: [-14, 25, 2],
        rearNear: [18, -4, -8, 4],
        rearFar: [21, -7, -9, 5],
      },
      "snap",
    ),
    key(
      0.7,
      {
        rootX: 430,
        rootY: 303,
        spineRot: 3,
        neckRot: 8,
        headRot: 9,
        jawOpen: 0.2,
        earNear: -12,
        earFar: -8,
        brow: 0.7,
        tail: [-4, 4, 10, 14, 16],
        frontNear: [-8, 18, -2],
        frontFar: [-4, 21, -3],
        rearNear: [12, 0, -5, 2],
        rearFar: [15, -3, -6, 3],
      },
      "inOut",
    ),
    key(
      0.86,
      {
        rootX: 382,
        rootY: 296,
        spineRot: 1,
        neckRot: 3,
        headRot: 2,
        jawOpen: 0.1,
        earNear: -7,
        earFar: 0,
        tail: [-10, -4, 3, 10, 14],
        frontNear: [8, 10, -6],
        frontFar: [4, 14, -5],
        rearNear: [2, -2, 1, 1],
        rearFar: [5, -4, 0, 1],
      },
      "inOut",
    ),
    key(1.06, {}),
  ],
};

/* ------------------------------------------------------------------ *
 * HOWL — rise, open jaw, expanded chest, held call, settle.
 * ------------------------------------------------------------------ */

const howl: FenrirClip = {
  duration: 2.95,
  loop: false,
  autoReturn: "idle",
  keys: [
    key(0, {}),
    key(
      0.34,
      {
        rootY: 298,
        spineRot: 2,
        neckRot: 8,
        headRot: 6,
        jawOpen: 0.08,
        earNear: -18,
        earFar: -12,
        tail: [-18, -12, -5, 4, 10],
        frontNear: [8, 12, -5],
        rearNear: [2, -5, 5, 1],
      },
      "out",
    ),
    key(
      0.72,
      {
        rootY: 288,
        spineRot: -2,
        chest: 0.8,
        neckRot: -20,
        headRot: -17,
        jawOpen: 0.38,
        earNear: -26,
        earFar: -20,
        tail: [-8, 0, 8, 13, 16],
        frontNear: [-2, 2, 0],
        rearNear: [-4, 2, -4, 0],
      },
      "out",
    ),
    key(
      1.05,
      {
        rootY: 284,
        spineRot: -4,
        chest: 1,
        neckRot: -32,
        headRot: -27,
        jawOpen: 0.86,
        earNear: -34,
        earFar: -28,
        brow: 0.5,
        eyeOpen: 0.7,
        tail: [-4, 4, 12, 17, 19],
        frontNear: [-6, 0, 2],
        rearNear: [-5, 3, -5, 0],
      },
      "out",
    ),
    key(
      1.55,
      {
        rootY: 286,
        spineRot: -4,
        chest: 0.92,
        neckRot: -30,
        headRot: -25,
        jawOpen: 0.8,
        earNear: -32,
        earFar: -26,
        brow: 0.5,
        eyeOpen: 0.55,
        tail: [-2, 6, 13, 17, 19],
        frontNear: [-4, 1, 1],
        rearNear: [-5, 3, -5, 0],
      },
      "inOut",
    ),
    key(
      2.1,
      {
        rootY: 284,
        spineRot: -4,
        chest: 1,
        neckRot: -33,
        headRot: -28,
        jawOpen: 0.88,
        earNear: -30,
        earFar: -25,
        brow: 0.5,
        eyeOpen: 0.5,
        tail: [-4, 4, 11, 16, 18],
        frontNear: [-6, 0, 2],
        rearNear: [-5, 3, -5, 0],
      },
      "inOut",
    ),
    key(
      2.52,
      {
        rootY: 294,
        spineRot: 0,
        chest: 0.4,
        neckRot: -10,
        headRot: -8,
        jawOpen: 0.25,
        earNear: -12,
        earFar: -5,
        eyeOpen: 0.9,
        tail: [-10, -4, 3, 10, 14],
        frontNear: [2, 5, -1],
        rearNear: [-2, 1, -3, 1],
      },
      "inOut",
    ),
    key(2.95, {}),
  ],
};

/* ------------------------------------------------------------------ *
 * HIT — fast recoil, brace, settle.
 * ------------------------------------------------------------------ */

const hit: FenrirClip = {
  duration: 0.52,
  loop: false,
  autoReturn: "idle",
  keys: [
    key(0, {}),
    key(
      0.06,
      {
        rootX: 354,
        rootY: 297,
        spineRot: -3,
        neckRot: 10,
        headRot: 7,
        jawOpen: 0.4,
        earNear: -28,
        earFar: -22,
        brow: 1,
        eyeOpen: 0.35,
        tail: [-22, -14, -6, 4, 9],
        frontNear: [14, 20, -9],
        frontFar: [10, 24, -8],
        rearNear: [5, -10, 8, 1],
        rearFar: [8, -13, 10, 2],
      },
      "snap",
    ),
    key(
      0.18,
      {
        rootX: 344,
        rootY: 303,
        spineRot: -5,
        neckRot: 13,
        headRot: 10,
        jawOpen: 0.32,
        earNear: -30,
        earFar: -24,
        brow: 0.9,
        eyeOpen: 0.25,
        tail: [-26, -18, -8, 2, 7],
        frontNear: [18, 24, -11],
        frontFar: [14, 28, -10],
        rearNear: [7, -14, 10, 2],
        rearFar: [10, -17, 12, 3],
      },
      "out",
    ),
    key(
      0.32,
      {
        rootX: 364,
        rootY: 291,
        spineRot: 1,
        neckRot: -2,
        headRot: -2,
        jawOpen: 0.16,
        earNear: -10,
        earFar: -4,
        eyeOpen: 0.8,
        tail: [-14, -8, 0, 8, 13],
        frontNear: [0, 6, -2],
        frontFar: [-3, 10, -2],
        rearNear: [-3, 2, -2, 0],
        rearFar: [0, 0, -1, 0],
      },
      "inOut",
    ),
    key(0.52, {}),
  ],
};

/* ------------------------------------------------------------------ *
 * DEATH — stagger, legs buckle, body drops, stays down.
 * ------------------------------------------------------------------ */

const death: FenrirClip = {
  duration: 1.85,
  loop: false,
  hold: true,
  keys: [
    key(0, {}),
    key(
      0.16,
      {
        rootX: 356,
        rootY: 295,
        spineRot: -3,
        neckRot: 10,
        headRot: 8,
        jawOpen: 0.3,
        earNear: -28,
        earFar: -22,
        brow: 1,
        eyeOpen: 0.5,
        tail: [-24, -16, -6, 3, 8],
        frontNear: [12, 18, -8],
        frontFar: [8, 22, -7],
      },
      "out",
    ),
    key(
      0.45,
      {
        rootX: 348,
        rootY: 322,
        spineRot: 7,
        spineY: 5,
        neckRot: 16,
        headRot: 13,
        jawOpen: 0.45,
        earNear: -38,
        earFar: -32,
        brow: 1,
        eyeOpen: 0.35,
        tail: [-30, -22, -12, -2, 4],
        frontNear: [34, 44, -22],
        frontFar: [30, 48, -20],
        rearNear: [13, -24, 18, 3],
        rearFar: [16, -28, 20, 4],
      },
      "in",
    ),
    key(
      0.85,
      {
        rootX: 352,
        rootY: 374,
        rootRot: 6,
        spineRot: 10,
        spineY: 7,
        neckRot: 30,
        headRot: 22,
        jawOpen: 0.55,
        earNear: -44,
        earFar: -38,
        brow: 1,
        eyeOpen: 0.2,
        tail: [-34, -26, -16, -6, 0],
        frontNear: [58, 66, -34],
        frontFar: [54, 70, -32],
        rearNear: [26, -34, 30, 6],
        rearFar: [30, -38, 32, 7],
      },
      "in",
    ),
    key(
      1.3,
      {
        rootX: 358,
        rootY: 405,
        rootRot: 7,
        spineRot: 12,
        spineY: 8,
        neckRot: 35,
        headRot: 27,
        jawOpen: 0.22,
        earNear: -48,
        earFar: -42,
        brow: 0.8,
        eyeOpen: 0.06,
        tail: [-38, -30, -20, -10, -4],
        frontNear: [66, 76, -38],
        frontFar: [62, 80, -36],
        rearNear: [30, -38, 34, 7],
        rearFar: [34, -42, 36, 8],
      },
      "out",
    ),
    key(
      1.85,
      {
        rootX: 360,
        rootY: 409,
        rootRot: 7,
        spineRot: 12,
        spineY: 8,
        neckRot: 35,
        headRot: 28,
        jawOpen: 0.12,
        earNear: -48,
        earFar: -42,
        brow: 0.6,
        eyeOpen: 0,
        tail: [-39, -31, -21, -11, -5],
        frontNear: [67, 77, -39],
        frontFar: [63, 81, -37],
        rearNear: [31, -39, 35, 7],
        rearFar: [35, -43, 37, 8],
      },
      "out",
    ),
  ],
};

/* ------------------------------------------------------------------ *
 * JUMP — anticipation, launch, tucked apex, landing, recovery.
 * ------------------------------------------------------------------ */

const jump: FenrirClip = {
  duration: 1.3,
  loop: false,
  autoReturn: "idle",
  keys: [
    key(0, {}),
    key(
      0.17,
      {
        rootY: 322,
        spineRot: 5,
        spineY: 3,
        neckRot: 7,
        headRot: 4,
        earNear: -14,
        earFar: -8,
        tail: [-22, -14, -6, 4, 9],
        frontNear: [24, 28, -12],
        frontFar: [20, 32, -11],
        rearNear: [8, -18, 14, 2],
        rearFar: [11, -22, 16, 3],
      },
      "out",
    ),
    key(
      0.33,
      {
        rootY: 246,
        rootRot: -3,
        spineRot: -5,
        neckRot: -8,
        headRot: -6,
        jawOpen: 0.25,
        earNear: -22,
        earFar: -16,
        tail: [-8, 0, 8, 12, 15],
        frontNear: [-42, 12, 18],
        frontFar: [-36, 16, 15],
        rearNear: [30, -12, -16, 8],
        rearFar: [34, -16, -18, 9],
      },
      "snap",
    ),
    key(
      0.56,
      {
        rootY: 186,
        rootRot: -4,
        spineRot: -2,
        neckRot: -6,
        headRot: -8,
        jawOpen: 0.12,
        earNear: -18,
        earFar: -12,
        tail: [-2, 6, 14, 19, 22],
        frontNear: [-26, 62, 8],
        frontFar: [-20, 66, 6],
        rearNear: [-16, 54, -26, 10],
        rearFar: [-12, 58, -28, 11],
      },
      "out",
    ),
    key(
      0.8,
      {
        rootY: 252,
        spineRot: 2,
        neckRot: 2,
        headRot: 6,
        jawOpen: 0.08,
        tail: [-6, 2, 10, 15, 18],
        frontNear: [-12, 22, 10],
        frontFar: [-8, 26, 8],
        rearNear: [12, 10, -8, 4],
        rearFar: [15, 7, -9, 5],
      },
      "in",
    ),
    key(
      0.93,
      {
        rootY: 318,
        spineRot: 6,
        spineY: 4,
        neckRot: 9,
        headRot: 5,
        jawOpen: 0.2,
        earNear: -24,
        earFar: -18,
        tail: [-18, -10, -2, 6, 11],
        frontNear: [26, 30, -13],
        frontFar: [22, 34, -12],
        rearNear: [10, -20, 16, 3],
        rearFar: [13, -24, 18, 4],
      },
      "snap",
    ),
    key(
      1.1,
      {
        rootY: 291,
        spineRot: 1,
        neckRot: 2,
        headRot: 1,
        earNear: -8,
        earFar: -2,
        tail: [-13, -7, 0, 8, 13],
        frontNear: [7, 9, -4],
        frontFar: [3, 13, -3],
        rearNear: [0, 1, -2, 1],
        rearFar: [3, -1, -1, 0],
      },
      "inOut",
    ),
    key(1.3, {}),
  ],
};

export const FENRIR_CLIPS: Record<FenrirState, FenrirClip> = {
  idle,
  walk,
  run,
  attack,
  howl,
  hit,
  death,
  jump,
};

/** Loop states are the only states that may be held indefinitely. */
export const LOOP_STATES = new Set<FenrirState>(["idle", "walk", "run"]);

export function sampleClip(clip: FenrirClip, time: number): FenrirPose {
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
