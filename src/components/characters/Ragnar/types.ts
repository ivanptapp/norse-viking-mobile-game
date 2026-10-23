/**
 * Ragnar — public types for the articulated character.
 *
 * The rig is a 2D humanoid skeleton expressed as joint rotations around
 * hand-placed pivots. Every pose field maps 1:1 to a joint in RagnarRig.
 * Angles are degrees and positive rotations turn clockwise in SVG space.
 */

export const RAGNAR_STATES = [
  "idle",
  "walk",
  "run",
  "attack",
  "hit",
  "death",
  "victory",
  "jump",
] as const;

export type RagnarState = (typeof RAGNAR_STATES)[number];

export type EaseName = "linear" | "inOut" | "out" | "in" | "snap" | "hold";

/** Full joint pose. */
export interface RagnarPose {
  /** Root translation in screen pixels and whole-body rotation. */
  rootX: number;
  rootY: number;
  rootRot: number;

  /** Pelvis tilt and vertical squash of the torso. */
  hipsRot: number;
  spineY: number;
  spineRot: number;
  /** 0 = rest, 1 = full inhale. */
  chest: number;

  neckRot: number;
  headRot: number;

  /** Axe arm (his right): shoulder, elbow, wrist. */
  axeArm: number[];
  /** Shield arm (his left): shoulder, elbow, wrist. */
  shieldArm: number[];

  /** Near leg and far leg: hip, knee, ankle. */
  legNear: number[];
  legFar: number[];

  /** Three chained cloak joints. */
  cloak: number[];

  /** Secondary motion for ponytail, temple braid and beard. */
  hair: number;
  braid: number;
  beard: number;

  /** Weapon / shield tilt inside their parent joints. */
  axe: number;
  shield: number;
}

export type RagnarPosePatch = Partial<RagnarPose>;

export interface RagnarPoseKey {
  /** Seconds from the start of the clip. */
  t: number;
  pose: RagnarPose;
  /** Easing used on the segment that ends at this key. */
  ease: EaseName;
}

export interface RagnarClip {
  duration: number;
  loop: boolean;
  keys: RagnarPoseKey[];
  /** State the controller returns to when a one-shot ends. */
  autoReturn?: RagnarState;
  /** Keep the final pose forever (death). */
  hold?: boolean;
}

export interface PlayOptions {
  /** Restart the clip even when it is already active. */
  restart?: boolean;
  /** Cross-fade duration in seconds. */
  fade?: number;
}
