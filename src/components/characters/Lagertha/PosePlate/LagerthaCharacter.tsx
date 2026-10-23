"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from "react";
import { LagerthaAnimationEngine } from "./LagerthaAnimationEngine";
import type {
  LagerthaAnimation,
  LagerthaAnimationEvent,
  LagerthaCharacterHandle,
  LagerthaFacing,
} from "./lagertha.types";

export interface LagerthaCharacterProps {
  /** Local battlefield coordinates. `x` is the foot-center; `y` is the ground/feet line. */
  x?: number;
  y?: number;
  /** Uniform size multiplier; default character height is 430 CSS px before this scale. */
  scale?: number;
  facing?: LagerthaFacing;
  /** Optional controlled animation. Use the ref API for one-shot triggers. */
  animation?: LagerthaAnimation;
  /** Explicit render order within the absolute battle overlay. */
  zIndex?: number;
  opacity?: number;
  characterHeight?: number;
  assetBaseUrl?: string;
  battleSpeed?: number;
  className?: string;
  style?: CSSProperties;
  onAnimationEvent?: (event: LagerthaAnimationEvent) => void;
  onImpact?: (event: LagerthaAnimationEvent) => void;
  onAnimationComplete?: (animation: LagerthaAnimation, playbackId: number) => void;
  onAssetError?: (assetBaseUrl: string) => void;
}

/**
 * Transparent Canvas 2D Lagertha overlay. Place it as a child of a position:relative
 * battle stage whose contents establish the same local coordinate system as x/y.
 * The canvas itself spans its parent so movement does not need React re-renders.
 */
export const LagerthaCharacter = forwardRef<LagerthaCharacterHandle, LagerthaCharacterProps>(
  function LagerthaCharacter({
    x = 0,
    y = 0,
    scale = 1,
    facing = "right",
    animation,
    zIndex = 10,
    opacity = 1,
    characterHeight = 430,
    assetBaseUrl = "/characters/lagertha-poses",
    battleSpeed = 1,
    className,
    style,
    onAnimationEvent,
    onImpact,
    onAnimationComplete,
    onAssetError,
  }, forwardedRef) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<LagerthaAnimationEngine | null>(null);
    if (!engineRef.current) engineRef.current = new LagerthaAnimationEngine(assetBaseUrl);
    const engine = engineRef.current;
    const latestProps = useRef({ x, y, scale, facing, animation, opacity, characterHeight, onAnimationEvent, onImpact, onAnimationComplete, onAssetError, assetBaseUrl });
    latestProps.current = { x, y, scale, facing, animation, opacity, characterHeight, onAnimationEvent, onImpact, onAnimationComplete, onAssetError, assetBaseUrl };

    useImperativeHandle(forwardedRef, () => ({
      play: (name, options) => engine.play(name, options),
      moveTo: (nextX, nextY, durationMs) => engine.moveTo(nextX, nextY, durationMs),
      setFacing: (nextFacing) => engine.setFacing(nextFacing),
      cancelAnimation: (returnTo) => engine.cancelAnimation(returnTo),
      getAnimation: () => engine.getAnimation(),
    }), [engine]);

    useEffect(() => {
      engine.setEventHandler((event) => {
        latestProps.current.onAnimationEvent?.(event);
        if (event.name === "impact") latestProps.current.onImpact?.(event);
      });
      engine.setCompletionHandler((name, playbackId) => latestProps.current.onAnimationComplete?.(name, playbackId));
      return () => {
        engine.setEventHandler(undefined);
        engine.setCompletionHandler(undefined);
      };
    }, [engine]);

    useEffect(() => {
      engine.setPosition(x, y);
      engine.setFacing(facing);
    }, [engine, x, y, facing]);

    useEffect(() => {
      engine.setPlaybackRate(battleSpeed);
    }, [engine, battleSpeed]);

    useEffect(() => {
      if (animation) engine.setControlledAnimation(animation);
    }, [engine, animation]);

    useEffect(() => {
      let disposed = false;
      let raf = 0;
      let resizeObserver: ResizeObserver | undefined;
      let cssWidth = 0;
      let cssHeight = 0;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d", { alpha: true, desynchronized: true });
      if (!canvas || !ctx) {
        latestProps.current.onAssetError?.(latestProps.current.assetBaseUrl);
        return () => engine.dispose();
      }

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        cssWidth = rect.width;
        cssHeight = rect.height;
        const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
        const width = Math.round(cssWidth * dpr);
        const height = Math.round(cssHeight * dpr);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
      };

      resize();
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
      } else {
        window.addEventListener("resize", resize, { passive: true });
      }

      // Uncontrolled mounts always begin at a deterministic idle frame; a controlled animation
      // is started by the animation prop effect immediately before this lifecycle effect.
      if (engine.getPlaybackId() === 0) engine.play(latestProps.current.animation ?? "idle");
      void engine.preload().then(() => {
        if (disposed) return;
        // Missing individual poses are tolerated; the source/reference plate is required.
        if (!engine.hasPose("reference")) latestProps.current.onAssetError?.(latestProps.current.assetBaseUrl);
        const frame = (now: number) => {
          if (disposed) return;
          resize();
          const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          engine.draw(ctx, cssWidth, cssHeight, now, {
            characterHeight: latestProps.current.characterHeight,
            scale: latestProps.current.scale,
            facing: latestProps.current.facing,
            opacity: latestProps.current.opacity,
          });
          raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
      }).catch(() => latestProps.current.onAssetError?.(latestProps.current.assetBaseUrl));

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        resizeObserver?.disconnect();
        if (typeof ResizeObserver === "undefined") window.removeEventListener("resize", resize);
        engine.dispose();
      };
    }, [engine]);

    const canvasStyle: CSSProperties = {
      position: "absolute",
      inset: 0,
      display: "block",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      zIndex,
      pointerEvents: "none",
      ...style,
    };

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={canvasStyle}
        aria-label="Lagertha, Viking shieldmaiden"
        role="img"
        data-character="lagertha"
      />
    );
  },
);

LagerthaCharacter.displayName = "LagerthaCharacter";
