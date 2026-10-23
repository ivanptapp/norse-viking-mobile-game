/**
 * Ragnar's numbers for the shared skeletal-kit pipeline.
 *
 * The drawing is the illustrated kit (public/heroes/ragnar-kit), produced by
 * scripts/build-ragnar-kit.py. Every piece keeps its position in the finished
 * 500 x 600 character, so the artwork only ever rotates: nothing is re-drawn,
 * re-coloured or scaled.
 *
 * `pivot` is the joint the piece turns around, in character space.
 * `slots` is the draw order — document order is the z-order.
 */

import type { JointRule, KitDefinition, KitPart, KitSlot } from "../shared/skeletalKit";

export type KitPartName =
  | "head"
  | "torso"
  | "cape"
  | "cape-tail"
  | "arm-near-upper"
  | "arm-near-lower"
  | "arm-far-upper"
  | "arm-far-lower"
  | "leg-near-upper"
  | "leg-near-lower"
  | "leg-far-upper"
  | "leg-far-lower"
  | "shield"
  | "axe";

export type { KitPart };

const parts = {
  head: { file: "head.png", x: 173, y: 20, width: 154, height: 268, pivot: [264, 107] },
  torso: { file: "torso.png", x: 173, y: 20, width: 154, height: 268, pivot: [264, 107] },
  cape: { file: "cape.png", x: 164, y: 84, width: 152, height: 182, pivot: [264, 126] },
  // Lower half hangs from the seam, so it can lag behind the shoulders.
  "cape-tail": { file: "cape-tail.png", x: 164, y: 84, width: 152, height: 182, pivot: [264, 190] },
  "arm-near-upper": { file: "arm-near-upper.png", x: 295, y: 94, width: 70, height: 160, pivot: [306, 134] },
  "arm-near-lower": { file: "arm-near-lower.png", x: 295, y: 94, width: 70, height: 160, pivot: [307, 147] },
  "arm-far-upper": { file: "arm-far-upper.png", x: 165, y: 94, width: 68, height: 162, pivot: [203, 134] },
  "arm-far-lower": { file: "arm-far-lower.png", x: 165, y: 94, width: 68, height: 162, pivot: [172, 177] },
  "leg-near-upper": { file: "leg-near-upper.png", x: 235, y: 245, width: 120, height: 183, pivot: [273, 256] },
  "leg-near-lower": { file: "leg-near-lower.png", x: 235, y: 245, width: 120, height: 183, pivot: [315, 351] },
  "leg-far-upper": { file: "leg-far-upper.png", x: 180, y: 245, width: 77, height: 194, pivot: [221, 252] },
  "leg-far-lower": { file: "leg-far-lower.png", x: 180, y: 245, width: 77, height: 194, pivot: [252, 345] },
  shield: { file: "shield.png", x: 110, y: 149, width: 130, height: 130, pivot: [206, 234] },
  axe: { file: "axe.png", x: 316, y: 99, width: 86, height: 179, pivot: [340, 231] },
} satisfies Record<KitPartName, KitPart>;

/**
 * Layer tree. Fur mantle first, then far leg, near leg, hips → torso → the
 * shield arm, the axe arm and finally the head, so every overlap (shield over
 * cuirass, near boot over far boot) comes from order instead of z-index.
 */
export const KIT_SLOTS: readonly KitSlot[] = [
  { id: "cloak0", part: "cape", children: [{ id: "cloak2", part: "cape-tail" }] },
  {
    id: "legFarUpper",
    part: "leg-near-upper",
    children: [{ id: "legFarLower", part: "leg-near-lower" }],
  },
  {
    id: "legNearUpper",
    part: "leg-far-upper",
    children: [{ id: "legNearLower", part: "leg-far-lower" }],
  },
  {
    id: "hips",
    children: [
      {
        id: "torso",
        part: "torso",
        children: [
          {
            id: "shieldShoulder",
            part: "arm-far-upper",
            children: [
              {
                id: "shieldElbow",
                part: "arm-far-lower",
                children: [{ id: "shield", part: "shield" }],
              },
            ],
          },
          {
            id: "axeShoulder",
            part: "arm-near-upper",
            children: [
              {
                id: "axeElbow",
                part: "arm-near-lower",
                children: [{ id: "axe", part: "axe" }],
              },
            ],
          },
          { id: "head", part: "head" },
        ],
      },
    ],
  },
];

export const RAGNAR_KIT = {
  assetRoot: "/heroes/ragnar-kit",
  width: 500,
  height: 600,
  groundY: 445,
  /** Root rotation and shadow centre, at the feet. */
  rootPivot: [264, 432] as const,
  hipsPivot: [264, 286] as const,
  torsoPivot: [264, 232] as const,
  chestPivot: [264, 190] as const,
  parts,
  slots: KIT_SLOTS,
} satisfies KitDefinition & {
  hipsPivot: readonly [number, number];
  torsoPivot: readonly [number, number];
  chestPivot: readonly [number, number];
};

/**
 * Clip angles the drawing is standing in. The renderer subtracts them, so the
 * posed kit is the rest pose and every clip becomes a delta on top of it.
 */
export const KIT_REFERENCE = {
  axeShoulder: 24,
  axeElbow: 112,
  shieldShoulder: 10,
  shieldElbow: 55,
  legNearHip: 10,
  legNearKnee: 4,
  legFarHip: -10,
  legFarKnee: 4,
} as const;

/**
 * A painted limb is rigid, so it has a limited travel budget before its cut
 * edge leaves the joint. These caps keep every clip inside that budget.
 */
/**
 * Travel budget per joint.
 *
 * Shoulder and elbow stay at 34: past that the painted forearm folds into the
 * cuirass and the axe head crosses the chest, because the artwork was drawn
 * with the arm hanging, not raised. Legs tolerate more — the boot fur hides
 * the cut — so the stride gets a longer reach than a rigid cut normally would.
 */
const LIMIT = { shoulder: 34, elbow: 34, hip: 30, knee: 34 } as const;

/**
 * Pose field → joint. `legNear` uses the far-side artwork: the near leg is
 * painted on the viewer's left, which the builder cut from the far layer.
 */
export const KIT_RULES: readonly JointRule[] = [
  {
    slot: "cloak0",
    poseKey: "cloak",
    index: 0,
    part: "cape",
    reference: 0,
    limit: 26,
  },
  {
    // The tail trails the shoulders: it reads the widest cloak channel, which
    // the clips already animate a few frames behind the torso.
    slot: "cloak2",
    poseKey: "cloak",
    index: 2,
    part: "cape-tail",
    reference: 0,
    limit: 32,
  },
  {
    slot: "axe",
    poseKey: "axe",
    part: "axe",
    reference: 0,
    limit: 9,
  },
  {
    slot: "shield",
    poseKey: "shield",
    part: "shield",
    reference: 0,
    limit: 7,
  },
  {
    slot: "axeShoulder",
    poseKey: "axeArm",
    index: 0,
    part: "arm-near-upper",
    reference: KIT_REFERENCE.axeShoulder,
    limit: LIMIT.shoulder,
  },
  {
    slot: "axeElbow",
    poseKey: "axeArm",
    index: 1,
    part: "arm-near-lower",
    reference: KIT_REFERENCE.axeElbow,
    limit: LIMIT.elbow,
  },
  {
    slot: "shieldShoulder",
    poseKey: "shieldArm",
    index: 0,
    part: "arm-far-upper",
    reference: KIT_REFERENCE.shieldShoulder,
    limit: LIMIT.shoulder,
  },
  {
    slot: "shieldElbow",
    poseKey: "shieldArm",
    index: 1,
    part: "arm-far-lower",
    reference: KIT_REFERENCE.shieldElbow,
    limit: LIMIT.elbow,
  },
  {
    slot: "legNearUpper",
    poseKey: "legNear",
    index: 0,
    part: "leg-far-upper",
    reference: KIT_REFERENCE.legNearHip,
    limit: LIMIT.hip,
  },
  {
    slot: "legNearLower",
    poseKey: "legNear",
    index: 1,
    part: "leg-far-lower",
    reference: KIT_REFERENCE.legNearKnee,
    limit: LIMIT.knee,
  },
  {
    slot: "legFarUpper",
    poseKey: "legFar",
    index: 0,
    part: "leg-near-upper",
    reference: KIT_REFERENCE.legFarHip,
    limit: LIMIT.hip,
    mirror: true,
  },
  {
    slot: "legFarLower",
    poseKey: "legFar",
    index: 1,
    part: "leg-near-lower",
    reference: KIT_REFERENCE.legFarKnee,
    limit: LIMIT.knee,
    mirror: true,
  },
];
