import type { LagerthaPose } from "./lagertha.types";

/**
 * Asset manifest for the browser-side pose-plate fallback.
 *
 * Inspection result: the source collection has one RGBA full-body illustration and
 * generated RGB full-body pose renders, not clean, independently authored limb
 * layers. There are no parent/child bones, reusable joint cutouts, or IK solver in
 * the Python source. It applies sparse thin-plate-spline image warps to whole pose
 * plates and extracts one approximate sword-arm mask for selected shots. The browser
 * therefore uses transparent full-body plates and smooth Canvas crossfades/root
 * transforms; it does not claim to be a true bone-articulated rig.
 */
export const LAGERTHA_ASSETS: Readonly<Record<LagerthaPose, string>> = {
  reference: "reference.png",
  idle: "idle.png",
  crouch: "crouch.png",
  spin: "spin.png",
  slash: "slash.png",
  follow: "follow.png",
  dash: "dash.png",
  rise: "rise.png",
  chamber: "chamber.png",
  impact: "impact.png",
};

/** The pose exports share a 896 × 1199 source canvas; source PNG alpha is retained. */
export const LAGERTHA_ART = {
  sourceWidth: 896,
  sourceHeight: 1199,
  aspect: 896 / 1199,
  defaultHeight: 430,
  poseBlendSeconds: 0.11,
} as const;

export const LAGERTHA_POSE_NAMES: readonly LagerthaPose[] = Object.keys(LAGERTHA_ASSETS) as LagerthaPose[];
