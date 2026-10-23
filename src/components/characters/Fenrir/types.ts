/**
 * Fenrir — public types for the articulated character.
 *
 * The rig is a 2D hierarchical skeleton expressed as joint rotations around
 * hand-placed pivots. Every pose field maps 1:1 to a joint in FenrirRig.
 */

export const FENRIR_STATES = [
  "idle",
  "walk",
  "run",
  "attack",
  "howl",
  "hit",
  "death",
  "jump",
] as const;

export type FenrirState = (typeof FENRIR_STATES)[number];

export type EaseName =
  | "linear"
  | "inOut"
  | "out"
  | "in"
  | "snap"
  | "hold";

/**
 * Full joint pose. Angles are degrees; positive rotations turn clockwise in
 * SVG space (the character faces +x). Arrays hold chained joint angles.
 */
export interface FenrirPose {
  /** Root translation / rotation — used for body bob, lunges and falls. */
  rootX: number;
  rootY: number;
  rootRot: number;

  /** Torso: vertical offset, lean and chest breathing (0..1). */
  spineY: number;
  spineRot: number;
  chest: number;

  /** Neck and head, relative to torso / neck. */
  neckRot: number;
  headRot: number;
  /** 0 = jaw closed, 1 = fully open. */
  jawOpen: number;

  /** Ear rotations, eye lid openness (0..1) and brow tension. */
  earNear: number;
  earFar: number;
  eyeOpen: number;
  brow: number;

  /** Five chained tail joints. */
  tail: number[];

  /** Front legs: shoulder, elbow, paw. */
  frontNear: number[];
  frontFar: number[];

  /** Rear legs: hip, knee, hock, paw. */
  rearNear: number[];
  rearFar: number[];
}

export type PosePatch = Partial<FenrirPose>;

export interface PoseKey {
  /** Seconds from the start of the clip. */
  t: number;
  pose: FenrirPose;
  /** Easing used on the segment that ends at this key. */
  ease: EaseName;
}

export interface FenrirClip {
  duration: number;
  loop: boolean;
  keys: PoseKey[];
  /** State the controller returns to when a one-shot ends. */
  autoReturn?: FenrirState;
  /** Keep the final pose forever (death). */
  hold?: boolean;
}

export interface PlayOptions {
  /** Restart the clip even when it is already the active one. */
  restart?: boolean;
  /** Cross-fade duration in seconds. Defaults to a per-state value. */
  fade?: number;
}
