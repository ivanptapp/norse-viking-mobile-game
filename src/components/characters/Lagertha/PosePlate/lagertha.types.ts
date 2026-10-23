export type LagerthaAnimation =
  | "idle"
  | "move"
  | "attack"
  | "hit"
  | "ultimate"
  | "victory"
  | "defeat";

export type LagerthaFacing = "left" | "right";

export type LagerthaPose =
  | "reference"
  | "idle"
  | "crouch"
  | "spin"
  | "slash"
  | "follow"
  | "dash"
  | "rise"
  | "chamber"
  | "impact";

export type LagerthaAnimationEventName =
  | "ultimateStarted"
  | "attackStarted"
  | "impact"
  | "ultimateFinished"
  | "hitStarted"
  | "animationFinished";

export interface LagerthaAnimationEvent {
  name: LagerthaAnimationEventName;
  animation: LagerthaAnimation;
  /** Seconds since this playback began; `impact` is the authoritative damage-sync point. */
  elapsed: number;
  /** Monotonically increasing for each play(), useful for de-duping battle callbacks. */
  playbackId: number;
  x: number;
  y: number;
}

export interface PoseKeyframe {
  at: number;
  pose: LagerthaPose;
  x?: number;
  y?: number;
  rotation?: number;
  /** Uniform scale adjustment for anticipation/recoil; defaults to 1. */
  scale?: number;
}

export interface TimedAnimationEvent {
  at: number;
  name: LagerthaAnimationEventName;
}

export interface AnimationDefinition {
  duration: number;
  loop: boolean;
  returnTo?: LagerthaAnimation;
  /** If true, leave the final frame on screen until another command arrives. */
  holdLastFrame?: boolean;
  keyframes: readonly PoseKeyframe[];
  events?: readonly TimedAnimationEvent[];
}

export interface LagerthaDrawOptions {
  /** Target character height in CSS pixels before the uniform `scale` multiplier. */
  characterHeight: number;
  scale: number;
  facing: LagerthaFacing;
  opacity: number;
}

export interface LagerthaCharacterHandle {
  play(animation: LagerthaAnimation, options?: { restart?: boolean }): number;
  moveTo(x: number, y: number, durationMs?: number): void;
  setFacing(facing: LagerthaFacing): void;
  cancelAnimation(returnTo?: "idle" | "move"): void;
  getAnimation(): LagerthaAnimation;
}
