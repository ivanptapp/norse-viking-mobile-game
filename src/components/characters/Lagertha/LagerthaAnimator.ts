import { LAGERTHA_CLIPS, LOOP_STATES, sampleClip } from "./animations";
import {
  DEFAULT_LAGERTHA_POSE,
  clamp,
  clonePose,
  lerpPose,
  smoothstep,
} from "./pose";
import type {
  LagerthaPose,
  LagerthaState,
  PlayOptions,
} from "./types";

type StateListener = (state: LagerthaState, previous: LagerthaState) => void;

const PRIORITY: Record<LagerthaState, number> = {
  idle: 0,
  walk: 0,
  run: 0,
  victory: 30,
  attack: 40,
  hit: 60,
  death: 100,
};

const FADE: Record<LagerthaState, number> = {
  idle: 0.26,
  walk: 0.2,
  run: 0.18,
  attack: 0.1,
  hit: 0.06,
  death: 0.2,
  victory: 0.24,
};

/**
 * Lagertha's animation controller.
 *
 * - Frame-rate independent: call `update(dtSeconds)` from your own loop.
 * - Smooth cross-fades between clips.
 * - One-shots cannot be interrupted by lower-priority states; hit and death
 *   can always interrupt.
 * - Death is terminal until `reset()`.
 * - Owns no timers/listeners: `destroy()` only clears subscribers.
 */
export class LagerthaAnimator {
  private state: LagerthaState;
  private previousState: LagerthaState;
  private time = 0;
  private speed = 1;
  private paused = false;
  private pose: LagerthaPose = clonePose(DEFAULT_LAGERTHA_POSE);
  private blendFrom: LagerthaPose | null = null;
  private blendElapsed = 0;
  private blendDuration = 0;
  private oneShotComplete = false;
  private deathLocked = false;
  private destroyed = false;
  private listeners = new Set<StateListener>();

  constructor(initial: LagerthaState = "idle") {
    this.state = initial;
    this.previousState = initial;
    this.pose = sampleClip(LAGERTHA_CLIPS[initial], 0);
  }

  getState(): LagerthaState {
    return this.state;
  }

  getPose(): LagerthaPose {
    return this.pose;
  }

  getSpeed(): number {
    return this.speed;
  }

  isPaused(): boolean {
    return this.paused;
  }

  isOneShotComplete(): boolean {
    return this.oneShotComplete;
  }

  getProgress(): number {
    const clip = LAGERTHA_CLIPS[this.state];
    if (clip.loop) return (this.time % clip.duration) / clip.duration;
    return clamp(this.time / clip.duration, 0, 1);
  }

  getTime(): number {
    return this.time;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setState(next: LagerthaState, options: PlayOptions = {}): boolean {
    if (this.destroyed) return false;

    const current = this.state;
    const sameState = next === current;

    if (sameState && current === "death") return false;

    if (sameState) {
      const clip = LAGERTHA_CLIPS[current];
      if (clip.loop) {
        if (!options.restart) return false;
        this.time = 0;
        this.oneShotComplete = false;
        this.blendFrom = clonePose(this.pose);
        this.blendElapsed = 0;
        this.blendDuration = 0.1;
        return true;
      }
      if (!this.oneShotComplete && !options.restart) return false;
      if (current === "death" && this.deathLocked) return false;
    }

    if (current === "death" && !sameState) return false;
    if (next === "death" && this.deathLocked) return false;

    const currentClip = LAGERTHA_CLIPS[current];
    const currentActiveOneShot = !currentClip.loop && !this.oneShotComplete;
    if (
      !sameState &&
      currentActiveOneShot &&
      PRIORITY[next] < PRIORITY[current] &&
      next !== "hit" &&
      next !== "death"
    ) {
      return false;
    }

    const fade = options.fade ?? FADE[next];
    this.blendFrom = clonePose(this.pose);
    this.blendElapsed = 0;
    this.blendDuration = Math.max(0, fade);
    this.previousState = current;
    this.state = next;
    this.time = 0;
    this.oneShotComplete = false;
    if (next === "death") this.deathLocked = false;

    this.emit();
    return true;
  }

  play(next: LagerthaState, options: PlayOptions = {}): boolean {
    return this.setState(next, options);
  }

  update(dtSeconds: number): void {
    if (this.destroyed || this.paused || dtSeconds <= 0) return;

    const scaled = Math.min(0.1, dtSeconds) * this.speed;
    const clip = LAGERTHA_CLIPS[this.state];
    this.time += scaled;

    if (!clip.loop && !this.oneShotComplete && this.time >= clip.duration) {
      this.oneShotComplete = true;
      if (this.state === "death") this.deathLocked = true;
      if (clip.autoReturn) {
        const finalPose = sampleClip(clip, clip.duration);
        this.pose = finalPose;
        const next = clip.autoReturn;
        this.previousState = this.state;
        this.state = next;
        this.time = 0;
        this.oneShotComplete = false;
        this.blendFrom = clonePose(finalPose);
        this.blendElapsed = 0;
        this.blendDuration = FADE[next];
        this.emit();
        return;
      }
    }

    const target = sampleClip(LAGERTHA_CLIPS[this.state], this.time);
    if (this.blendFrom && this.blendDuration > 0) {
      this.blendElapsed += scaled;
      const u = smoothstep(this.blendElapsed / this.blendDuration);
      this.pose = lerpPose(this.blendFrom, target, u);
      if (u >= 1) this.blendFrom = null;
    } else {
      this.pose = target;
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  setSpeed(speed: number): void {
    this.speed = clamp(speed, 0.05, 4);
  }

  reset(state: LagerthaState = "idle"): void {
    this.previousState = this.state;
    this.state = state;
    this.time = 0;
    this.oneShotComplete = false;
    this.deathLocked = false;
    this.blendFrom = clonePose(this.pose);
    this.blendElapsed = 0;
    this.blendDuration = 0.18;
    this.pose = sampleClip(LAGERTHA_CLIPS[state], 0);
    this.emit();
  }

  destroy(): void {
    this.destroyed = true;
    this.listeners.clear();
  }

  revive(): void {
    this.destroyed = false;
  }

  private emit(): void {
    if (this.state === this.previousState) return;
    for (const listener of this.listeners) {
      listener(this.state, this.previousState);
    }
  }
}

export { LOOP_STATES };
