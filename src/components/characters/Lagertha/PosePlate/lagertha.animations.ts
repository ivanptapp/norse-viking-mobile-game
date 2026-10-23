import type { AnimationDefinition, LagerthaAnimation } from "./lagertha.types";

/**
 * Pose plates are full-body transparent PNGs exported from the existing Lagertha
 * artwork. Between plates the browser cross-fades and continuously interpolates
 * root transforms. This is deliberately data-driven so timing can be tuned without
 * changing the Canvas renderer.
 */
export const LAGERTHA_ANIMATIONS: Record<LagerthaAnimation, AnimationDefinition> = {
  idle: {
    duration: 1.8,
    loop: true,
    keyframes: [
      { at: 0, pose: "reference", y: 0, rotation: 0, scale: 1 },
      { at: 0.45, pose: "idle", y: -1.5, rotation: -0.3, scale: 1.004 },
      { at: 0.9, pose: "reference", y: -3, rotation: 0, scale: 1.008 },
      { at: 1.35, pose: "idle", y: -1.5, rotation: 0.3, scale: 1.004 },
      { at: 1.8, pose: "reference", y: 0, rotation: 0, scale: 1 },
    ],
  },
  move: {
    duration: 0.76,
    loop: true,
    keyframes: [
      { at: 0, pose: "reference", y: 0, rotation: 0, scale: 1 },
      { at: 0.18, pose: "dash", y: -5, rotation: -1, scale: 1 },
      { at: 0.38, pose: "crouch", y: 0, rotation: 0.6, scale: 1 },
      { at: 0.57, pose: "dash", y: -5, rotation: -1, scale: 1 },
      { at: 0.76, pose: "reference", y: 0, rotation: 0, scale: 1 },
    ],
  },
  attack: {
    duration: 0.88,
    loop: false,
    returnTo: "idle",
    keyframes: [
      { at: 0, pose: "crouch", y: 0, rotation: 0, scale: 1 },
      { at: 0.16, pose: "slash", x: 8, y: -2, rotation: -1, scale: 1.015 },
      { at: 0.42, pose: "follow", x: 12, y: 0, rotation: 1, scale: 1.01 },
      { at: 0.63, pose: "reference", x: 4, y: 0, rotation: 0, scale: 1 },
      { at: 0.88, pose: "reference", x: 0, y: 0, rotation: 0, scale: 1 },
    ],
    events: [
      { at: 0, name: "attackStarted" },
      { at: 0.43, name: "impact" },
    ],
  },
  attack2: {
    duration: 0.92,
    loop: false,
    returnTo: "idle",
    keyframes: [
      { at: 0, pose: "reference", x: 0, y: 0, rotation: 0, scale: 1 },
      { at: 0.14, pose: "crouch", x: -7, y: 0, rotation: -1.5, scale: 0.985 },
      { at: 0.31, pose: "chamber", x: -9, y: -2, rotation: -1, scale: 0.985 },
      { at: 0.46, pose: "follow", x: 16, y: -1, rotation: 1.8, scale: 1.025 },
      { at: 0.59, pose: "slash", x: 19, y: 1, rotation: 1, scale: 1.02 },
      { at: 0.76, pose: "reference", x: 7, y: 0, rotation: 0, scale: 1.005 },
      { at: 0.92, pose: "reference", x: 0, y: 0, rotation: 0, scale: 1 },
    ],
    events: [
      { at: 0, name: "attackStarted" },
      { at: 0.47, name: "impact" },
    ],
  },
  attack3: {
    duration: 1.04,
    loop: false,
    returnTo: "idle",
    keyframes: [
      { at: 0, pose: "reference", x: 0, y: 0, rotation: 0, scale: 1 },
      { at: 0.16, pose: "crouch", x: -8, y: 2, rotation: 2, scale: 0.98 },
      { at: 0.34, pose: "spin", x: -4, y: -1, rotation: 8, scale: 0.99 },
      { at: 0.51, pose: "slash", x: 14, y: -2, rotation: -2, scale: 1.025 },
      { at: 0.64, pose: "impact", x: 20, y: 0, rotation: 1, scale: 1.035 },
      { at: 0.78, pose: "follow", x: 14, y: 1, rotation: 2, scale: 1.02 },
      { at: 0.91, pose: "reference", x: 5, y: 0, rotation: 0, scale: 1.005 },
      { at: 1.04, pose: "reference", x: 0, y: 0, rotation: 0, scale: 1 },
    ],
    events: [
      { at: 0, name: "attackStarted" },
      { at: 0.64, name: "impact" },
    ],
  },
  hit: {
    duration: 0.44,
    loop: false,
    returnTo: "idle",
    keyframes: [
      { at: 0, pose: "reference", x: 0, y: 0, rotation: 0, scale: 1 },
      { at: 0.08, pose: "crouch", x: -12, y: 1, rotation: -2, scale: 0.985 },
      { at: 0.2, pose: "reference", x: -4, y: -1, rotation: 1, scale: 1 },
      { at: 0.44, pose: "reference", x: 0, y: 0, rotation: 0, scale: 1 },
    ],
    events: [{ at: 0, name: "hitStarted" }],
  },
  ultimate: {
    duration: 3.2,
    loop: false,
    returnTo: "idle",
    keyframes: [
      { at: 0, pose: "reference", x: 0, y: 0, rotation: 0, scale: 1 },
      { at: 0.42, pose: "crouch", x: -2, y: 0, rotation: -1.2, scale: 0.99 },
      { at: 0.67, pose: "spin", x: 0, y: -1, rotation: 0, scale: 1 },
      { at: 0.84, pose: "slash", x: 0, y: 0, rotation: 0, scale: 1 },
      { at: 1.08, pose: "follow", x: 4, y: 0, rotation: 0.7, scale: 1.015 },
      { at: 1.22, pose: "dash", x: 12, y: -3, rotation: -1.5, scale: 1.02 },
      { at: 1.5, pose: "rise", x: 26, y: 0, rotation: 0, scale: 1 },
      { at: 1.88, pose: "rise", x: 34, y: 0, rotation: 0, scale: 1 },
      { at: 1.96, pose: "chamber", x: 36, y: 0, rotation: 0, scale: 1 },
      { at: 2.06, pose: "chamber", x: 38, y: -3, rotation: 0, scale: 1.015 },
      { at: 2.105, pose: "impact", x: 38, y: 0, rotation: 0, scale: 1.035 },
      { at: 2.48, pose: "impact", x: 38, y: 0, rotation: 0, scale: 1 },
      { at: 2.78, pose: "idle", x: 22, y: 0, rotation: 0, scale: 1 },
      { at: 3.2, pose: "idle", x: 18, y: 0, rotation: 0, scale: 1 },
    ],
    events: [
      { at: 0, name: "ultimateStarted" },
      { at: 0.67, name: "attackStarted" },
      { at: 2.105, name: "impact" },
      { at: 3.2, name: "ultimateFinished" },
    ],
  },
  victory: {
    duration: 1.2,
    loop: false,
    holdLastFrame: true,
    keyframes: [
      { at: 0, pose: "reference", y: 0, rotation: 0, scale: 1 },
      { at: 0.26, pose: "follow", x: 2, y: -4, rotation: -0.6, scale: 1.02 },
      { at: 0.62, pose: "idle", x: 0, y: -2, rotation: 0, scale: 1 },
      { at: 1.2, pose: "idle", x: 0, y: 0, rotation: 0, scale: 1 },
    ],
  },
  defeat: {
    duration: 1.1,
    loop: false,
    holdLastFrame: true,
    keyframes: [
      { at: 0, pose: "reference", y: 0, rotation: 0, scale: 1 },
      { at: 0.28, pose: "crouch", x: -5, y: 0, rotation: 2.5, scale: 0.97 },
      { at: 0.72, pose: "crouch", x: -7, y: 5, rotation: 4, scale: 0.94 },
      { at: 1.1, pose: "crouch", x: -7, y: 5, rotation: 4, scale: 0.94 },
    ],
  },
};

export const ULTIMATE_IMPACT_SECONDS = 2.105;
