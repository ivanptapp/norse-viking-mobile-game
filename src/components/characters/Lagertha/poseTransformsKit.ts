import { around, n, resolveAngles, scaleAbout } from "../shared/skeletalKit";
import { KIT_RULES, LAGERTHA_KIT } from "./lagerthaKit";
import type { LagerthaPose } from "./types";

const { rootPivot, hipsPivot, torsoPivot, chestPivot, groundY, parts } = LAGERTHA_KIT;

/**
 * The pose → transform bridge for Lagertha's illustrated kit.
 *
 * Everything that is a plain rotation lives in `KIT_RULES`; this function only
 * adds the four composed joints (root, shadow, spine squash and head) and then
 * hands the same pose to the shared resolver.
 */
export function poseTransformsKit(pose: LagerthaPose): Record<string, string> {
  const breath = n(pose.chest);
  const lift = Math.max(0, -n(pose.rootY));
  const fall = Math.abs(n(pose.rootRot)) / 90;
  const shadowScale = Math.max(0.55, 1 - lift / 260 - fall * 0.25);

  return {
    root: `translate(${n(pose.rootX).toFixed(2)} ${n(pose.rootY).toFixed(2)}) ${around(
      rootPivot,
      n(pose.rootRot),
    )}`,

    shadow: `translate(${rootPivot[0]} ${groundY}) scale(${shadowScale.toFixed(
      3,
    )} ${(shadowScale * 0.9).toFixed(3)}) translate(${-rootPivot[0]} ${-groundY})`,

    hips: around(hipsPivot, n(pose.spineRot) * 0.35),

    torso: `translate(${n(pose.spineX).toFixed(2)} ${n(pose.spineY).toFixed(2)}) ${around(
      torsoPivot,
      n(pose.spineRot) * 0.8,
    )} ${scaleAbout(chestPivot, 1 + breath * 0.005, 1 + breath * 0.009)}`,

    head: around(parts.head.pivot, n(pose.headRot)),

    ...resolveAngles(KIT_RULES, parts, pose as unknown as Record<string, unknown>),
  };
}

export function shadowOpacity(pose: LagerthaPose): number {
  const lift = Math.max(0, -n(pose.rootY));
  const fall = Math.abs(n(pose.rootRot)) / 90;
  return Math.min(0.5, Math.max(0.12, 0.46 - lift / 420 - fall * 0.16));
}

export { LAGERTHA_KIT };
