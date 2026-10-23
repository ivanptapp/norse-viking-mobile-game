/**
 * Lagertha's numbers for the shared skeletal-kit pipeline.
 *
 * The drawing is the illustrated paper-doll sheet (assets/heroes/lagertha_parts.png),
 * assembled and cut by scripts/build-lagertha-kit.py. Every piece keeps its
 * position in the finished 540 x 900 character, so the artwork only ever
 * rotates: nothing is re-drawn, re-coloured or scaled.
 *
 * `pivot` is the joint the piece turns around, in character space.
 * `slots` is the draw order — document order is the z-order.
 */

import type { JointRule, KitDefinition, KitPart, KitSlot } from "../shared/skeletalKit";
import { LAGERTHA_KIT_PARTS } from "./lagerthaKitParts";

export type KitPartName =
  | "head"
  | "torso"
  | "arm-sword-upper"
  | "arm-sword-lower"
  | "arm-shield"
  | "leg-near-upper"
  | "leg-near-lower"
  | "leg-far-upper"
  | "leg-far-lower";

export type { KitPart };

const parts: Record<KitPartName, KitPart> = LAGERTHA_KIT_PARTS;

/**
 * Layer tree. Far leg first, then the near leg, then the torso (the cape is
 * painted into it), the head and finally both arms — so the shield covers the
 * cuirass and the near boot covers the far one by draw order, not by z-index.
 */
export const KIT_SLOTS: readonly KitSlot[] = [
  {
    id: "legFarUpper",
    part: "leg-far-upper",
    children: [{ id: "legFarKnee", part: "leg-far-lower" }],
  },
  {
    id: "legNearUpper",
    part: "leg-near-upper",
    children: [{ id: "legNearKnee", part: "leg-near-lower" }],
  },
  {
    id: "hips",
    children: [
      {
        id: "torso",
        part: "torso",
        children: [
          { id: "head", part: "head" },
          {
            id: "swordShoulder",
            part: "arm-sword-upper",
            children: [{ id: "swordElbow", part: "arm-sword-lower" }],
          },
          { id: "shieldShoulder", part: "arm-shield" },
        ],
      },
    ],
  },
];

export const LAGERTHA_KIT = {
  assetRoot: "/heroes/lagertha-kit",
  width: 540,
  height: 900,
  groundY: 860,
  /** Root rotation and shadow centre, at the feet. */
  rootPivot: [240, 860] as const,
  /** Pelvis: the torso turns here. */
  hipsPivot: [240, 548] as const,
  /** Waist: spine bend. */
  torsoPivot: [258, 438] as const,
  /** Ribcage: breathing squash. */
  chestPivot: [258, 320] as const,
  parts,
  slots: KIT_SLOTS,
} satisfies KitDefinition & {
  hipsPivot: readonly [number, number];
  torsoPivot: readonly [number, number];
  chestPivot: readonly [number, number];
};

/**
 * A painted limb is rigid, so it has a limited travel budget before its cut
 * edge leaves the joint. The shoulder ball hides the shoulder cut completely
 * (a sphere does not care that it turned), the fur cuff hides the elbow, and
 * the knee guard plus boot fur hide the knee — which is why the legs get a
 * longer stride than a rigid cut would normally allow.
 */
const LIMIT = { shoulder: 42, elbow: 46, hip: 34, knee: 54 } as const;

/**
 * Pose field → joint.
 *
 * References are zero on purpose: Lagertha's clips are authored as deltas on
 * top of the drawing (0 = exactly as painted), so the renderer must not
 * subtract a painted angle the way Ragnar's absolute-angle clips do.
 */
export const KIT_RULES: readonly JointRule[] = [
  {
    slot: "swordShoulder",
    poseKey: "armUpper",
    part: "arm-sword-upper",
    reference: 0,
    limit: LIMIT.shoulder,
  },
  {
    slot: "swordElbow",
    poseKey: "armLower",
    part: "arm-sword-lower",
    reference: 0,
    limit: LIMIT.elbow,
  },
  {
    // Rigid shield arm: the shield is painted on top of the forearm, so it
    // turns as one piece at the shoulder, exactly like a strapped shield.
    slot: "shieldShoulder",
    poseKey: "shieldArm",
    part: "arm-shield",
    reference: 0,
    limit: LIMIT.shoulder,
  },
  {
    slot: "legNearUpper",
    poseKey: "legNearHip",
    part: "leg-near-upper",
    reference: 0,
    limit: LIMIT.hip,
  },
  {
    slot: "legNearKnee",
    poseKey: "legNearKnee",
    part: "leg-near-lower",
    reference: 0,
    limit: LIMIT.knee,
  },
  {
    slot: "legFarUpper",
    poseKey: "legFarHip",
    part: "leg-far-upper",
    reference: 0,
    limit: LIMIT.hip,
  },
  {
    slot: "legFarKnee",
    poseKey: "legFarKnee",
    part: "leg-far-lower",
    reference: 0,
    limit: LIMIT.knee,
  },
];
