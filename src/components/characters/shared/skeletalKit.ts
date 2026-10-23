/**
 * Skeletal kit — hero-agnostic half of the illustrated-parts pipeline.
 *
 * A "kit" is a hero drawn once as a finished picture and then cut into pieces
 * that keep their exact position in that picture. Because every piece is
 * placed where it was painted, the artwork only ever *rotates*: nothing is
 * re-drawn, re-coloured, warped or scaled, so the illustration survives the
 * rig intact.
 *
 * This module owns the parts of that idea that do not depend on who the hero
 * is:
 *
 *   - the shape of a kit (canvas, parts, pivots, slots),
 *   - the layer tree the renderer walks,
 *   - the transform strings and the joint-travel clamping.
 *
 * A hero supplies its own numbers (see Ragnar's `ragnarKit.ts`) and its own
 * pose → angle mapping. Nothing here knows about Ragnar, Viking armour or
 * even about animation clips, which is what makes it reusable for Lagertha or
 * any future illustrated hero.
 */

/* ------------------------------------------------------------------ *
 * Geometry
 * ------------------------------------------------------------------ */

/** A rectangle of the source illustration plus the joint it turns around. */
export interface KitPart {
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Joint position in character space. */
  pivot: readonly [number, number];
}

/** A drawing slot: one part, optionally with children that ride on top of it. */
export interface KitSlot {
  /** Joint name. The animator addresses the node by this id. */
  id: string;
  /** Part painted at this layer. Omit for a pure transform node. */
  part?: string;
  children?: readonly KitSlot[];
}

/** Everything a kit renderer needs except the poses themselves. */
export interface KitDefinition {
  assetRoot: string;
  width: number;
  height: number;
  groundY: number;
  parts: Readonly<Record<string, KitPart>>;
  slots: readonly KitSlot[];
  /** Root and shadow pivot, handled outside the slot tree. */
  rootPivot: readonly [number, number];
}

export const n = (value: number | undefined): number =>
  Number.isFinite(value) ? (value as number) : 0;

/** Rotate about a joint given in character space. */
export function around(point: readonly [number, number], degrees: number): string {
  return `rotate(${degrees.toFixed(2)} ${point[0]} ${point[1]})`;
}

/**
 * A painted limb is rigid, so its cut edge leaves the joint once the rotation
 * passes a limit. Clamping keeps every clip inside the budget the artwork was
 * cut for instead of opening a hole at the elbow.
 */
export function clampAngle(value: number, reference: number, limit: number): number {
  const delta = value - reference;
  return Math.max(-limit, Math.min(limit, delta));
}

/** Transform for a slot that rotates about its painted joint. */
export function jointTransform(
  part: KitPart,
  angle: number,
  { translateX = 0, translateY = 0 }: { translateX?: number; translateY?: number } = {},
): string {
  const move =
    translateX || translateY
      ? `translate(${translateX.toFixed(2)} ${translateY.toFixed(2)}) `
      : "";
  return `${move}${around(part.pivot, n(angle))}`;
}

/** Squash/stretch about a point, used for chest breathing. */
export function scaleAbout(
  point: readonly [number, number],
  sx: number,
  sy: number,
): string {
  return `translate(${point[0]} ${point[1]}) scale(${sx.toFixed(4)} ${sy.toFixed(
    4,
  )}) translate(${-point[0]} ${-point[1]})`;
}

/* ------------------------------------------------------------------ *
 * Generic pose spec
 * ------------------------------------------------------------------ */

/**
 * One articulated slot described as data. A hero lists its rules once and
 * `resolveAngles` turns any pose into the clamped rotation each slot gets.
 *
 *   poseKey "axeArm"      → clip array [shoulder, elbow, wrist]
 *   slot    "axeElbow"    → joint id the animator looks up
 *   part    "arm-near-lower" → painted piece whose pivot is the elbow
 */
export interface JointRule {
  slot: string;
  poseKey: string;
  /** Painted joint to rotate about. */
  part: string;
  /** Index into the clip array; ignored when the pose value is a scalar. */
  index?: number;
  /** Angle the drawing already stands in; subtracted from the clip value. */
  reference: number;
  limit: number;
  /** Far-side limbs are painted mirrored, so their rotation flips. */
  mirror?: boolean;
  translateX?: number;
  translateY?: number;
}

function readPose(pose: Record<string, unknown>, key: string, index = 0): number {
  const value = pose[key];
  if (Array.isArray(value)) return n(value[index]);
  return n(value as number | undefined);
}

/** Clamped rotation for every rule in the spec. */
export function resolveAngles(
  rules: readonly JointRule[],
  parts: Readonly<Record<string, KitPart>>,
  pose: Record<string, unknown>,
): Record<string, string> {
  const transforms: Record<string, string> = {};

  for (const rule of rules) {
    const part = parts[rule.part];
    if (!part) continue;
    const angle = clampAngle(
      readPose(pose, rule.poseKey, rule.index ?? 0),
      rule.reference,
      rule.limit,
    );
    transforms[rule.slot] = jointTransform(part, rule.mirror ? -angle : angle, {
      translateX: rule.translateX,
      translateY: rule.translateY,
    });
  }

  return transforms;
}
