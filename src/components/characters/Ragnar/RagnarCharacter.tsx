"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { RagnarAnimator } from "./RagnarAnimator";
import { RagnarKitRig } from "./RagnarKitRig";
import { RagnarRig, type RagnarFrame } from "./RagnarRig";
import { poseTransforms } from "./poseTransforms";
import { poseTransformsKit } from "./poseTransformsKit";
import type { RagnarPose, RagnarState } from "./types";

/** Which artwork drives the same rig: code-drawn vectors or the illustrated kit. */
export type RagnarArt = "vector" | "kit";

export interface RagnarCharacterProps {
  state?: RagnarState;
  /** Animation speed multiplier (0.05 – 4). */
  speed?: number;
  paused?: boolean;
  /** Camera framing: the whole body or a close inspection of the head. */
  frame?: RagnarFrame;
  /** Rendering layer. Clips, rig and controls are identical either way. */
  art?: RagnarArt;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  /** Receives the live controller so gameplay code can trigger states. */
  onReady?: (animator: RagnarAnimator | null) => void;
  /** Fires whenever the controller enters a new state (including auto-return). */
  onStateChange?: (state: RagnarState) => void;
}

/**
 * Ragnar, fully animated.
 *
 * The SVG rig is rendered once; every frame the animator's pose is written
 * straight to the joint groups' transform attributes. That keeps React out
 * of the hot path, avoids object churn in state, and lets phones decode no
 * textures at all (everything is vector and cached by the browser).
 *
 * The RAF loop stops when the component scrolls out of view, when the tab is
 * hidden, and on unmount.
 */
export function RagnarCharacter({
  state = "idle",
  speed = 1,
  paused = false,
  frame = "full",
  art = "kit",
  className,
  style,
  ariaLabel = "Ragnar Lodbrok, el rey vikingo",
  onReady,
  onStateChange,
}: RagnarCharacterProps) {
  const [animator] = useState(() => new RagnarAnimator(state));
  const joints = useRef<Record<string, SVGGElement | null>>({});
  const hostRef = useRef<HTMLDivElement>(null);
  const onStateChangeRef = useRef(onStateChange);
  const onReadyRef = useRef(onReady);
  const lastPoseRef = useRef<RagnarPose | null>(null);

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

  const applyPose = useCallback(
    (pose: RagnarPose) => {
      const transforms =
        art === "kit" ? poseTransformsKit(pose) : poseTransforms(pose);
      for (const name in transforms) {
        const node = joints.current[name];
        if (node) node.setAttribute("transform", transforms[name]);
      }
      lastPoseRef.current = pose;
    },
    [art],
  );

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
      if (host) host.setAttribute("data-ragnar-state", next);
      onStateChangeRef.current?.(next);
    });
    if (host) {
      host.setAttribute("data-ragnar-state", animator.getState());
      (
        host as unknown as { __ragnarAnimator?: RagnarAnimator }
      ).__ragnarAnimator = animator;
    }
    onStateChangeRef.current?.(animator.getState());
    onReadyRef.current?.(animator);
    return () => {
      unsubscribe();
      if (host) {
        delete (host as unknown as { __ragnarAnimator?: RagnarAnimator })
          .__ragnarAnimator;
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
    };
  }, [animator, applyPose]);

  return (
    <div
      ref={hostRef}
      className={`relative h-full w-full select-none ${className ?? ""}`}
      style={style}
      role="img"
      aria-label={ariaLabel}
      data-ragnar-character=""
      data-ragnar-art={art}
      data-ragnar-state={animator.getState()}
    >
      {art === "kit" ? (
        <RagnarKitRig onJoint={registerJoint} frame={frame} />
      ) : (
        <RagnarRig onJoint={registerJoint} frame={frame} />
      )}
    </div>
  );
}

export default RagnarCharacter;
