import { LAGERTHA_ART } from "./rig";
import { clamp } from "./pose";
import type { LagerthaPose } from "./types";

const { rootPivot, torsoPivot, chestPivot, groundY } = LAGERTHA_ART;

const n = (value: number | undefined) =>
  Number.isFinite(value) ? (value as number) : 0;

/** Rotate around a point in the rig's original drawing coordinates. */
function around(x: number, y: number, degrees: number): string {
  return `translate(${x} ${y}) rotate(${degrees}) translate(${-x} ${-y})`;
}

export function poseTransforms(pose: LagerthaPose): Record<string, string> {
  const breath = clamp(n(pose.chest), -1, 2);

  return {
    root: `translate(${n(pose.rootX)} ${n(pose.rootY)}) ${around(
      rootPivot.x,
      rootPivot.y,
      n(pose.rootRot),
    )}`,

    shadow: (() => {
      const lift = Math.max(0, -n(pose.rootY));
      const fall = Math.abs(n(pose.rootRot)) / 90;
      const scale = Math.max(0.55, 1 - lift / 260 - fall * 0.25);
      return `translate(${rootPivot.x} ${groundY}) scale(${scale} ${
        scale * 0.9
      }) translate(${-rootPivot.x} ${-groundY})`;
    })(),

    torso: `translate(${n(pose.spineX)} ${n(pose.spineY)}) ${around(
      torsoPivot.x,
      torsoPivot.y,
      n(pose.spineRot),
    )} translate(${chestPivot.x} ${chestPivot.y}) scale(${
      1 + breath * 0.006
    } ${1 + breath * 0.012}) translate(${-chestPivot.x} ${-chestPivot.y})`,

    head: around(292, 194, n(pose.headRot)),

    armUpper: around(195, 195, n(pose.armUpper)),
    armLower: around(150, 252, n(pose.armLower)),

    legNearHip: around(198, 333, n(pose.legNearHip)),
    legNearKnee: around(178, 391, n(pose.legNearKnee)),
    legFarHip: around(335, 333, n(pose.legFarHip)),
    legFarKnee: around(335, 392, n(pose.legFarKnee)),
  };
}

export function shadowOpacity(pose: LagerthaPose): number {
  const lift = Math.max(0, -n(pose.rootY));
  const fall = Math.abs(n(pose.rootRot)) / 90;
  return clamp(0.42 - lift / 420 - fall * 0.16, 0.1, 0.42);
}
