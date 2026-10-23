"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { LagerthaAnimator } from "./LagerthaAnimator";
import { LagerthaKitRig, type LagerthaFrame } from "./LagerthaKitRig";
import { poseTransformsKit, shadowOpacity } from "./poseTransformsKit";
import type { LagerthaPose, LagerthaState } from "./types";

export interface LagerthaCharacterProps {
  state?: LagerthaState;
  /** Animation speed multiplier (0.05 – 4). */
  speed?: number;
  /** Camera framing: the whole body or a close inspection of the face. */
  frame?: LagerthaFrame;
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  /** Receives the live controller so gameplay code can trigger states. */
  onReady?: (animator: LagerthaAnimator | null) => void;
  /** Fires whenever the controller enters a new state. */
  onStateChange?: (state: LagerthaState) => void;
}

/**
 * Lagertha, fully animated from her illustrated kit.
 *
 * The SVG atlas is rendered once. Every frame writes joint transforms
 * straight to the DOM, keeping React out of the hot path. The RAF loop
 * stops when the character scrolls out of view or the tab is hidden, and
 * the animator owns no timers or global listeners.
 */
export function LagerthaCharacter({
  state = "idle",
  speed = 1,
  paused = false,
  frame = "full",
  className,
  style,
  ariaLabel = "Lagertha, la doncella escudera",
  onReady,
  onStateChange,
}: LagerthaCharacterProps) {
  const [animator] = useState(() => new LagerthaAnimator(state));
  const joints = useRef<Record<string, SVGGElement | null>>({});
  const hostRef = useRef<HTMLDivElement>(null);
  const onStateChangeRef = useRef(onStateChange);
  const onReadyRef = useRef(onReady);
  const lastPoseRef = useRef<LagerthaPose | null>(null);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const registerJoint = useCallback((name: string, node: SVGGElement | null) => {
    if (node) joints.current[name] = node;
    else delete joints.current[name];
  }, []);

  const applyPose = useCallback((pose: LagerthaPose) => {
    const transforms = poseTransformsKit(pose);
    for (const name in transforms) {
      const node = joints.current[name];
      if (node) node.setAttribute("transform", transforms[name]);
    }
    const shadow = joints.current.shadow;
    if (shadow) shadow.setAttribute("opacity", shadowOpacity(pose).toFixed(3));

    lastPoseRef.current = pose;
  }, []);

  useEffect(() => {
    animator.setState(state);
  }, [animator, state]);

  useEffect(() => {
    animator.setSpeed(speed);
  }, [animator, speed]);

  useEffect(() => {
    animator.setPaused(paused);
  }, [animator, paused]);

  useEffect(() => {
    const host = hostRef.current;
    const unsubscribe = animator.subscribe((next) => {
      if (host) host.setAttribute("data-lagertha-state", next);
      onStateChangeRef.current?.(next);
    });
    if (host) {
      host.setAttribute("data-lagertha-state", animator.getState());
      (host as unknown as { __lagerthaAnimator?: LagerthaAnimator }).__lagerthaAnimator =
        animator;
    }
    onStateChangeRef.current?.(animator.getState());
    onReadyRef.current?.(animator);
    return () => {
      unsubscribe();
      if (host) {
        delete (host as unknown as { __lagerthaAnimator?: LagerthaAnimator })
          .__lagerthaAnimator;
      }
      onReadyRef.current?.(null);
    };
  }, [animator]);

  useEffect(() => {
    animator.revive();
    const host = hostRef.current;
    let raf = 0;
    let last = 0;
    let visible = true;
    let tabVisible = typeof document === "undefined" ? true : !document.hidden;

    const frame = (now: number) => {
      raf = 0;
      if (!visible || !tabVisible) return;
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      animator.update(dt);
      const pose = animator.getPose();
      if (pose !== lastPoseRef.current) applyPose(pose);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || !visible || !tabVisible) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    };

    applyPose(animator.getPose());
    start();

    const observer =
      host && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              visible = entries.some((entry) => entry.isIntersecting);
              if (visible) start();
              else stop();
            },
            { rootMargin: "120px" },
          )
        : null;
    if (observer && host) observer.observe(host);

    const onVisibility = () => {
      tabVisible = !document.hidden;
      if (tabVisible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [animator, applyPose]);

  return (
    <div
      ref={hostRef}
      className={`relative h-full w-full select-none ${className ?? ""}`}
      style={style}
      role="img"
      aria-label={ariaLabel}
      data-lagertha-character=""
      data-lagertha-state={animator.getState()}
    >
      <LagerthaKitRig onJoint={registerJoint} frame={frame} />
    </div>
  );
}

export default LagerthaCharacter;
