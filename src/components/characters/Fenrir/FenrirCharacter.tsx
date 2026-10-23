"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { FenrirAnimator } from "./FenrirAnimator";
import { FenrirRig } from "./FenrirRig";
import { poseTransforms } from "./poseTransforms";
import type { FenrirPose, FenrirState } from "./types";

export interface FenrirCharacterProps {
  state?: FenrirState;
  /** Animation speed multiplier (0.05 – 4). */
  speed?: number;
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  /** Receives the live controller so gameplay code can trigger states. */
  onReady?: (animator: FenrirAnimator | null) => void;
  /** Fires whenever the controller enters a new state (including auto-return). */
  onStateChange?: (state: FenrirState) => void;
}

/**
 * Fenrir, fully animated.
 *
 * The SVG rig is rendered once; every frame the animator's pose is written
 * straight to the joint groups' transform attributes. That keeps React out
 * of the hot path, avoids object churn in state, and lets phones decode no
 * textures at all (everything is vector and cached by the browser).
 *
 * The RAF loop stops when the component scrolls out of view, when the tab is
 * hidden, and on unmount. The animator destroys its listeners too.
 */
export function FenrirCharacter({
  state = "idle",
  speed = 1,
  paused = false,
  className,
  style,
  ariaLabel = "Fenrir, el lobo del Ragnarök",
  onReady,
  onStateChange,
}: FenrirCharacterProps) {
  const [animator] = useState(() => new FenrirAnimator(state));
  const joints = useRef<Record<string, SVGGElement | null>>({});
  const hostRef = useRef<HTMLDivElement>(null);
  const onStateChangeRef = useRef(onStateChange);
  const onReadyRef = useRef(onReady);
  const lastPoseRef = useRef<FenrirPose | null>(null);

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

  const applyPose = useCallback((pose: FenrirPose) => {
    const transforms = poseTransforms(pose);
    for (const name in transforms) {
      const node = joints.current[name];
      if (node) node.setAttribute("transform", transforms[name]);
    }
    // Keep the teeth and mouth interior hidden while the mouth is closed:
    // Fenrir should not wear a permanent snarl. They fade in as the jaw opens.
    const fangOpacity = Math.min(1, Math.max(0, (pose.jawOpen - 0.06) / 0.2));
    const fangValue = fangOpacity.toFixed(3);
    for (const name of ["fangsUpper", "fangsLower"] as const) {
      const node = joints.current[name];
      if (node) node.setAttribute("opacity", fangValue);
    }
    const mouthOpacity = Math.min(1, Math.max(0, (pose.jawOpen - 0.02) / 0.16));
    const mouthNode = joints.current.mouthCavity;
    if (mouthNode) mouthNode.setAttribute("opacity", mouthOpacity.toFixed(3));
    lastPoseRef.current = pose;
  }, []);

  /* Keep the controller in sync with props. */
  useEffect(() => {
    animator.setState(state);
  }, [animator, state]);

  useEffect(() => {
    animator.setSpeed(speed);
  }, [animator, speed]);

  useEffect(() => {
    animator.setPaused(paused);
  }, [animator, paused]);

  /* State notifications + imperative handle. */
  useEffect(() => {
    const host = hostRef.current;
    const unsubscribe = animator.subscribe((next) => {
      if (host) {
        host.setAttribute("data-fenrir-state", next);
      }
      onStateChangeRef.current?.(next);
    });
    if (host) {
      host.setAttribute("data-fenrir-state", animator.getState());
      (
        host as unknown as { __fenrirAnimator?: FenrirAnimator }
      ).__fenrirAnimator = animator;
    }
    onStateChangeRef.current?.(animator.getState());
    onReadyRef.current?.(animator);
    return () => {
      unsubscribe();
      if (host) {
        delete (
          host as unknown as { __fenrirAnimator?: FenrirAnimator }
        ).__fenrirAnimator;
      }
      onReadyRef.current?.(null);
    };
  }, [animator]);

  /* Animation loop, visibility handling and cleanup. */
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
      // The animator owns no timers or global listeners; the component's
      // RAF loop is already cancelled above. Keeping it alive makes Fast
      // Refresh / Strict Mode remounts re-attach cleanly.
    };
  }, [animator, applyPose]);

  return (
    <div
      ref={hostRef}
      className={`relative h-full w-full select-none ${className ?? ""}`}
      style={style}
      role="img"
      aria-label={ariaLabel}
      data-fenrir-character=""
      data-fenrir-state={animator.getState()}
    >
      <FenrirRig onJoint={registerJoint} />
    </div>
  );
}

export default FenrirCharacter;
