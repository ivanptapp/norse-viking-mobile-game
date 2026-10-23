import { LAGERTHA_ANIMATIONS } from "./lagertha.animations";
import { LAGERTHA_ART, LAGERTHA_ASSETS } from "./LagerthaRig";
import type {
  AnimationDefinition,
  LagerthaAnimation,
  LagerthaAnimationEvent,
  LagerthaAnimationEventName,
  LagerthaDrawOptions,
  LagerthaFacing,
  LagerthaPose,
  PoseKeyframe,
} from "./lagertha.types";

type ImageMap = Partial<Record<LagerthaPose, HTMLImageElement>>;
type EventHandler = (event: LagerthaAnimationEvent) => void;
type CompletionHandler = (animation: LagerthaAnimation, playbackId: number) => void;

interface PositionTween {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startMs: number;
  durationMs: number;
}

interface PoseSample {
  first: LagerthaPose;
  second: LagerthaPose;
  mix: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const smooth = (value: number): number => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function interpolateKeyframes(frames: readonly PoseKeyframe[], time: number): PoseSample {
  if (frames.length === 1) {
    const only = frames[0];
    return { first: only.pose, second: only.pose, mix: 0, x: only.x ?? 0, y: only.y ?? 0, rotation: only.rotation ?? 0, scale: only.scale ?? 1 };
  }
  let index = 0;
  while (index < frames.length - 2 && time > frames[index + 1].at) index++;
  const a = frames[index];
  const b = frames[index + 1];
  const span = Math.max(0.001, b.at - a.at);
  const u = smooth((time - a.at) / span);
  return {
    first: a.pose,
    second: b.pose,
    mix: u,
    x: lerp(a.x ?? 0, b.x ?? 0, u),
    y: lerp(a.y ?? 0, b.y ?? 0, u),
    rotation: lerp(a.rotation ?? 0, b.rotation ?? 0, u),
    scale: lerp(a.scale ?? 1, b.scale ?? 1, u),
  };
}

/** Browser-only canvas renderer/state machine. It never reads or plays the MP4. */
export class LagerthaAnimationEngine {
  private readonly images: ImageMap = {};
  private readonly assetBaseUrl: string;
  private loadPromise?: Promise<void>;
  private animation: LagerthaAnimation = "idle";
  private resumeAfterHit: "idle" | "move" = "idle";
  private elapsedSeconds = 0;
  private lastFrameMs = 0;
  private playbackRate = 1;
  private completed = false;
  private emittedEvents = new Set<LagerthaAnimationEventName>();
  private playbackId = 0;
  private eventHandler?: EventHandler;
  private completionHandler?: CompletionHandler;
  private x = 0;
  private y = 0;
  private facing: LagerthaFacing = "right";
  private moveTween?: PositionTween;
  private disposed = false;

  constructor(assetBaseUrl = "/characters/lagertha") {
    this.assetBaseUrl = assetBaseUrl.replace(/\/$/, "");
  }

  preload(): Promise<void> {
    this.disposed = false;
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = Promise.all(
      Object.entries(LAGERTHA_ASSETS).map(([pose, file]) => new Promise<void>((resolve) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          this.images[pose as LagerthaPose] = image;
          resolve();
        };
        image.onerror = () => resolve(); // Keep the character loop alive; report missing art during draw.
        image.src = `${this.assetBaseUrl}/${file}`;
      })),
    ).then(() => undefined);
    return this.loadPromise;
  }

  setEventHandler(handler?: EventHandler): void { this.eventHandler = handler; }
  setCompletionHandler(handler?: CompletionHandler): void { this.completionHandler = handler; }

  getAnimation(): LagerthaAnimation { return this.animation; }
  getPosition(): { x: number; y: number } { return { x: this.x, y: this.y }; }
  getFacing(): LagerthaFacing { return this.facing; }
  getPlaybackId(): number { return this.playbackId; }
  hasPose(pose: LagerthaPose): boolean { return Boolean(this.images[pose]?.complete && this.images[pose]?.naturalWidth); }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.moveTween = undefined;
  }

  setFacing(facing: LagerthaFacing): void { this.facing = facing; }

  setPlaybackRate(rate: number): void {
    const now = performance.now();
    if (this.lastFrameMs > 0) {
      this.elapsedSeconds += Math.max(0, now - this.lastFrameMs) * this.playbackRate / 1000;
      this.lastFrameMs = now;
    }
    this.playbackRate = Math.max(0.25, Math.min(4, rate));
  }

  setControlledAnimation(animation: LagerthaAnimation): void {
    if (animation !== this.animation || this.completed) this.play(animation);
  }

  play(animation: LagerthaAnimation, options: { restart?: boolean } = {}): number {
    if (this.disposed) return this.playbackId;
    if (animation === this.animation && !this.completed && options.restart === false) return this.playbackId;
    if (this.animation === "move" && animation !== "move") this.moveTween = undefined;
    if (animation === "hit") {
      this.resumeAfterHit = this.animation === "move" ? "move" : "idle";
    }
    this.animation = animation;
    this.elapsedSeconds = 0;
    this.lastFrameMs = performance.now();
    this.completed = false;
    this.emittedEvents = new Set();
    this.playbackId += 1;
    this.emitDueEvents(0);
    return this.playbackId;
  }

  moveTo(x: number, y: number, durationMs = 600): void {
    const now = performance.now();
    this.moveTween = {
      fromX: this.x, fromY: this.y, toX: x, toY: y,
      startMs: now, durationMs: Math.max(80, durationMs),
    };
    this.play("move");
  }

  cancelAnimation(returnTo: "idle" | "move" = "idle"): void {
    this.moveTween = undefined;
    this.play(returnTo);
  }

  /** Call on component disposal. Images are left to the browser cache; RAF is owned by the component. */
  dispose(): void {
    this.disposed = true;
    this.eventHandler = undefined;
    this.completionHandler = undefined;
    this.moveTween = undefined;
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number, nowMs: number, options: LagerthaDrawOptions): void {
    if (this.disposed || width <= 0 || height <= 0) return;
    ctx.clearRect(0, 0, width, height);
    this.advancePosition(nowMs);
    const definition = LAGERTHA_ANIMATIONS[this.animation];
    if (!this.lastFrameMs) this.lastFrameMs = nowMs;
    this.elapsedSeconds += Math.max(0, nowMs - this.lastFrameMs) * this.playbackRate / 1000;
    this.lastFrameMs = nowMs;
    const rawElapsed = this.elapsedSeconds;
    let elapsed = rawElapsed;
    if (definition.loop) elapsed = rawElapsed % definition.duration;
    else if (this.completed && definition.holdLastFrame) elapsed = definition.duration;
    else elapsed = Math.min(rawElapsed, definition.duration);

    if (!this.completed) {
      const animationAtFrameStart = this.animation;
      const playbackAtFrameStart = this.playbackId;
      this.emitDueEvents(elapsed);
      if (this.animation === animationAtFrameStart && this.playbackId === playbackAtFrameStart && !definition.loop && rawElapsed >= definition.duration) {
        this.finishPlayback(definition);
      }
    }

    const sample = interpolateKeyframes(definition.keyframes, elapsed);
    const characterHeight = options.characterHeight * options.scale * sample.scale;
    const characterWidth = characterHeight * LAGERTHA_ART.aspect;
    const anchorX = this.x + sample.x;
    const anchorY = this.y + sample.y;
    const direction = this.facing === "left" ? -1 : 1;
    const localElapsed = elapsed;

    ctx.save();
    ctx.globalAlpha = clamp01(options.opacity);
    this.drawEnergy(ctx, anchorX, anchorY, characterHeight, direction, localElapsed, this.animation);

    ctx.translate(anchorX, anchorY);
    ctx.scale(direction, 1);
    ctx.rotate(sample.rotation * Math.PI / 180);
    const dx = -characterWidth / 2;
    const dy = -characterHeight;
    const first = this.images[sample.first];
    const second = this.images[sample.second];
    if (first?.complete && first.naturalWidth > 0) {
      ctx.globalAlpha = clamp01(options.opacity * (sample.first === sample.second ? 1 : 1 - sample.mix));
      ctx.drawImage(first, dx, dy, characterWidth, characterHeight);
    }
    if (sample.second !== sample.first && second?.complete && second.naturalWidth > 0) {
      ctx.globalAlpha = clamp01(options.opacity * sample.mix);
      ctx.drawImage(second, dx, dy, characterWidth, characterHeight);
    }
    ctx.restore();

    if (this.animation === "ultimate") this.drawImpactOverlay(ctx, anchorX, anchorY, characterHeight, localElapsed);
    // Friendly loading fallback if the selected plate failed: outline a non-invasive silhouette marker.
    if (!first?.complete && !second?.complete) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = "#8fc5d8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(anchorX, anchorY - characterHeight * 0.5, characterHeight * 0.24, characterHeight * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private advancePosition(nowMs: number): void {
    if (!this.moveTween) return;
    const tween = this.moveTween;
    const u = clamp01((nowMs - tween.startMs) / tween.durationMs);
    const eased = u * u * (3 - 2 * u);
    this.x = tween.fromX + (tween.toX - tween.fromX) * eased;
    this.y = tween.fromY + (tween.toY - tween.fromY) * eased;
    if (u >= 1) {
      this.moveTween = undefined;
      if (this.animation === "move") {
        const movePlaybackId = this.playbackId;
        this.completionHandler?.("move", movePlaybackId);
        if (this.animation === "move" && this.playbackId === movePlaybackId) this.play("idle");
      }
    }
  }

  private emitDueEvents(elapsed: number): void {
    const animation = this.animation;
    const playbackId = this.playbackId;
    const events = LAGERTHA_ANIMATIONS[animation].events ?? [];
    for (const event of events) {
      if (event.at <= elapsed && !this.emittedEvents.has(event.name)) {
        this.emittedEvents.add(event.name);
        this.eventHandler?.({
          name: event.name, animation, elapsed: event.at,
          playbackId, x: this.x, y: this.y,
        });
        // An event consumer may cancel/restart synchronously. Do not deliver stale
        // later events from the previous playback into the new combat action.
        if (this.animation !== animation || this.playbackId !== playbackId) return;
      }
    }
  }

  private finishPlayback(definition: AnimationDefinition): void {
    if (this.completed) return;
    this.completed = true;
    const finished = this.animation;
    const id = this.playbackId;
    if (finished !== "ultimate") {
      this.eventHandler?.({ name: "animationFinished", animation: finished, elapsed: definition.duration, playbackId: id, x: this.x, y: this.y });
    }
    this.completionHandler?.(finished, id);
    if (this.animation !== finished || this.playbackId !== id) return;
    if (definition.holdLastFrame) {
      return;
    }
    let next = definition.returnTo ?? "idle";
    if (finished === "hit") next = this.resumeAfterHit;
    this.play(next);
  }

  private drawEnergy(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, direction: number, time: number, animation: LagerthaAnimation): void {
    if (animation !== "ultimate" && animation !== "attack") return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(direction, 1);
    const t = time;
    const charge = animation === "ultimate" ? clamp01((t - 0.18) / 0.2) * (1 - clamp01((t - 0.62) / 0.1)) : 0;
    if (charge > 0) {
      const pulse = 0.55 + 0.45 * Math.sin(t * 17);
      ctx.globalAlpha = 0.72 * charge * pulse;
      ctx.lineCap = "round";
      ctx.shadowColor = "#70d7ff";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = "#c7f3ff";
      ctx.lineWidth = Math.max(1.5, h * 0.009);
      ctx.beginPath();
      ctx.moveTo(-h * 0.12, -h * 0.39);
      ctx.lineTo(h * 0.23, -h * 0.73);
      ctx.stroke();
    }

    const slashStart = animation === "ultimate" ? 0.68 : 0.16;
    const slashEnd = animation === "ultimate" ? 1.2 : 0.56;
    if (t >= slashStart && t <= slashEnd) {
      const u = clamp01((t - slashStart) / (slashEnd - slashStart));
      const fade = Math.min(1, u * 9, (1 - u) * 5);
      ctx.globalAlpha = fade * 0.92;
      ctx.lineCap = "round";
      ctx.shadowColor = "#46baff";
      ctx.shadowBlur = h * 0.045;
      ctx.strokeStyle = "rgba(66,174,255,.92)";
      ctx.lineWidth = h * 0.042;
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.46, h * 0.47, h * 0.145, -0.03, Math.PI * (1.05 - 0.2 * u), Math.PI * (1.82 + 0.23 * u));
      ctx.stroke();
      ctx.shadowBlur = h * 0.016;
      ctx.strokeStyle = "rgba(225,248,255,.95)";
      ctx.lineWidth = h * 0.008;
      ctx.stroke();
    }

    if (animation === "ultimate" && t >= 1.22 && t <= 1.62) {
      const u = clamp01((t - 1.22) / 0.4);
      const fade = Math.sin(Math.PI * u);
      ctx.globalAlpha = 0.48 * fade;
      ctx.lineWidth = Math.max(1, h * 0.007);
      ctx.strokeStyle = "#a5e8ff";
      ctx.shadowColor = "#6ccaff";
      ctx.shadowBlur = h * 0.03;
      for (let i = 0; i < 5; i++) {
        const yy = -h * (0.27 + i * 0.105);
        const dx = -h * (0.3 + (i % 3) * 0.1);
        ctx.beginPath();
        ctx.moveTo(dx, yy);
        ctx.lineTo(dx - h * 0.26, yy + Math.sin(t * 18 + i) * h * 0.02);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawImpactOverlay(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, time: number): void {
    const age = time - 2.105;
    if (age < 0 || age > 0.62) return;
    ctx.save();
    ctx.translate(x + h * 0.12, y - h * 0.105);
    const growth = clamp01(age / 0.42);
    const fade = Math.exp(-Math.max(0, age) * 4.3);
    ctx.globalAlpha = 0.82 * fade;
    ctx.strokeStyle = "#79d9ff";
    ctx.lineWidth = h * 0.018;
    ctx.shadowColor = "#75d5ff";
    ctx.shadowBlur = h * 0.05;
    ctx.beginPath();
    ctx.ellipse(0, 0, h * (0.08 + 0.43 * growth), h * (0.025 + 0.11 * growth), 0, Math.PI * 1.04, Math.PI * 1.96);
    ctx.stroke();
    ctx.globalAlpha = fade * 0.56;
    ctx.strokeStyle = "#e1f8ff";
    ctx.lineWidth = h * 0.006;
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.005, h * (0.06 + 0.40 * growth), h * (0.018 + 0.10 * growth), 0, Math.PI * 1.04, Math.PI * 1.96);
    ctx.stroke();
    // Deterministic radial sparks; count is bounded and does not allocate per-particle objects.
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + 0.12;
      const r = h * (0.055 + growth * (0.22 + (i % 4) * 0.045));
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r * 0.42;
      ctx.globalAlpha = fade * (0.5 + 0.35 * ((i % 3) / 2));
      ctx.fillStyle = i % 4 === 0 ? "#ffffff" : "#9be7ff";
      ctx.beginPath();
      ctx.arc(px, py, Math.max(1, h * 0.006), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
