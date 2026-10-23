import { FENRIR_CLIPS, LOOP_STATES, sampleClip } from "./animations";
import {
  DEFAULT_POSE,
  clamp,
  clonePose,
  lerpPose,
  smoothstep,
} from "./pose";
import type {
  FenrirPose,
  FenrirState,
  PlayOptions,
} from "./types";

type StateListener = (state: FenrirState, previous: FenrirState) => void;

/**
 * One-shot priority. A lower-priority one-shot cannot cut off a
 * higher-priority one that is still playing. Loops sit at 0 and can be
 * replaced by anything.
 */
const PRIORITY: Record<FenrirState, number> = {
  idle: 0,
  walk: 0,
  run: 0,
  jump: 20,
  howl: 30,
  attack: 40,
  hit: 60,
  death: 100,
};

const FADE: Record<FenrirState, number> = {
  idle: 0.24,
  walk: 0.22,
  run: 0.2,
  attack: 0.1,
  howl: 0.22,
  hit: 0.06,
  death: 0.2,
  jump: 0.12,
};

/**
 * Fenrir's animation controller.
 *
 * - Frame-rate independent: call `update(dtSeconds)` from your own loop.
 * - Smooth cross-fades between clips.
 * - One-shots (attack/howl/hit/death/jump) cannot be interrupted by
 *   lower-priority states; death is terminal until `reset()`.
 * - Death never restarts by itself.
 * - No timers, listeners or RAF handles of its own: `destroy()` clears
 *   subscribers, so it is safe to drop when the character is removed.
 */
export class FenrirAnimator {
  private state: FenrirState;
  private previousState: FenrirState;
  private time = 0;
  private speed = 1;
  private paused = false;
  private pose: FenrirPose = clonePose(DEFAULT_POSE);
  private blendFrom: FenrirPose | null = null;
  private blendElapsed = 0;
  private blendDuration = 0;
  private oneShotComplete = false;
  private deathLocked = false;
  private destroyed = false;
  private listeners = new Set<StateListener>();

  constructor(initial: FenrirState = "idle") {
    this.state = initial;
    this.previousState = initial;
    this.pose = sampleClip(FENRIR_CLIPS[initial], 0);
  }

  getState(): FenrirState {
    return this.state;
  }

  getPose(): FenrirPose {
    return this.pose;
  }

  getSpeed(): number {
    return this.speed;
  }

  isPaused(): boolean {
    return this.paused;
  }

  /** True once a non-looping clip reached its last frame. */
  isOneShotComplete(): boolean {
    return this.oneShotComplete;
  }

  getProgress(): number {
    const clip = FENRIR_CLIPS[this.state];
    if (clip.loop) {
      return (this.time % clip.duration) / clip.duration;
    }
    return clamp(this.time / clip.duration, 0, 1);
  }

  /** Seconds since the current clip started (clamped for one-shots). */
  getTime(): number {
    return this.time;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Request a new state.
   *
   * Returns false when the request was rejected (locked one-shot, death
   * already finished, or the same loop already running). Pass
   * `{ restart: true }` to replay a completed one-shot or restart a loop.
   */
  setState(next: FenrirState, options: PlayOptions = {}): boolean {
    if (this.destroyed) return false;

    const current = this.state;
    const sameState = next === current;

    // Death is terminal: only reset() revives Fenrir, so a held or replayed
    // death cannot restart itself.
    if (sameState && current === "death") return false;

    if (sameState) {
      const clip = FENRIR_CLIPS[current];
      if (clip.loop) {
        if (!options.restart) return false;
        this.time = 0;
        this.oneShotComplete = false;
        this.blendFrom = clonePose(this.pose);
        this.blendElapsed = 0;
        this.blendDuration = 0.1;
        return true;
      }
      // One-shot: replay only when it already finished, or explicitly asked.
      if (!this.oneShotComplete && !options.restart) return false;
      if (current === "death" && this.deathLocked) return false;
    }

    if (current === "death" && !sameState) {
      // Death is terminal. Only reset() may revive the character.
      return false;
    }

    if (next === "death" && this.deathLocked) return false;

    const currentClip = FENRIR_CLIPS[current];
    const currentActiveOneShot = !currentClip.loop && !this.oneShotComplete;
    if (
      !sameState &&
      currentActiveOneShot &&
      PRIORITY[next] < PRIORITY[current] &&
      next !== "hit" && // hit reactions may always interrupt
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

  /** Alias used by gameplay code that prefers trigger wording. */
  play(next: FenrirState, options: PlayOptions = {}): boolean {
    return this.setState(next, options);
  }

  update(dtSeconds: number): void {
    if (this.destroyed || this.paused || dtSeconds <= 0) return;

    const scaled = Math.min(0.1, dtSeconds) * this.speed;

    const clip = FENRIR_CLIPS[this.state];
    this.time += scaled;

    if (!clip.loop && !this.oneShotComplete && this.time >= clip.duration) {
      this.oneShotComplete = true;
      if (this.state === "death") this.deathLocked = true;
      if (clip.autoReturn) {
        // Start the return transition from the final pose.
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

    const target = sampleClip(FENRIR_CLIPS[this.state], this.time);
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

  /**
   * Return to a clean locomotion state. Clears the death lock, so use this
   * when spawning Fenrir again or when the test lab resets the character.
   */
  reset(state: FenrirState = "idle"): void {
    this.previousState = this.state;
    this.state = state;
    this.time = 0;
    this.oneShotComplete = false;
    this.deathLocked = false;
    this.blendFrom = clonePose(this.pose);
    this.blendElapsed = 0;
    this.blendDuration = 0.18;
    this.pose = sampleClip(FENRIR_CLIPS[state], 0);
    this.emit();
  }

  /** Free listeners; the owning component cancels its own RAF loop. */
  destroy(): void {
    this.destroyed = true;
    this.listeners.clear();
  }

  /**
   * Re-arm a controller whose owner effect was torn down and re-run
   * (React Strict Mode development mounts do exactly this).
   */
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
