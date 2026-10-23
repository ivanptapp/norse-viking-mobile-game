/**
 * Lagertha — public types for the articulated cutout rig.
 *
 * The source is one illustration. This rig lifts the head with all of its
 * hair, the sword arm and both legs along seams hidden by the costume, then
 * animates them as a humanoid puppet. Every pose field maps 1:1 to a joint
 * in LagerthaRig.
 */

export const LAGERTHA_STATES = [
  "idle",
  "walk",
  "run",
  "attack",
  "hit",
  "death",
  "victory",
] as const;

export type LagerthaState = (typeof LAGERTHA_STATES)[number];

export type EaseName =
  | "linear"
  | "inOut"
  | "out"
  | "in"
  | "snap"
  | "hold";

/**
 * Full joint pose. Angles are degrees, positive clockwise in SVG space.
 * Root values are screen-pixel offsets from the original drawing.
 */
export interface LagerthaPose {
  rootX: number;
  rootY: number;
  rootRot: number;

  spineX: number;
  spineY: number;
  spineRot: number;
  /** 0 = rest, 1 = full inhale (kept very small). */
  chest: number;

  /** Head rotation around the neck. */
  headRot: number;

  /** Sword arm: shoulder and elbow (the sword is part of the forearm). */
  armUpper: number;
  armLower: number;
  /**
   * Shield arm at the shoulder. The shield is painted on top of the forearm,
   * so the whole arm turns as one rigid piece — like a strapped shield.
   */
  shieldArm: number;

  /** Legs: hip and knee rotations. */
  legNearHip: number;
  legNearKnee: number;
  legFarHip: number;
  legFarKnee: number;
}

export type LagerthaPosePatch = Partial<LagerthaPose>;

export interface LagerthaPoseKey {
  /** Seconds from the start of the clip. */
  t: number;
  pose: LagerthaPosePatch;
  /** Easing used on the segment that ends at this key. */
  ease: EaseName;
}

export interface LagerthaClip {
  duration: number;
  loop: boolean;
  keys: LagerthaPoseKey[];
  /** State the controller returns to when a one-shot ends. */
  autoReturn?: LagerthaState;
  /** Keep the final pose forever (death). */
  hold?: boolean;
}

export interface PlayOptions {
  /** Restart the clip even when it is already active. */
  restart?: boolean;
  /** Cross-fade duration in seconds. */
  fade?: number;
}
