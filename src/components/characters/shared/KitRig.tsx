"use client";

import { memo } from "react";
import type { KitPart, KitSlot } from "./skeletalKit";

export type KitJointRegistrar = (name: string, node: SVGGElement | null) => void;

function Art({ part, assetRoot }: { part: KitPart; assetRoot: string }) {
  return (
    <image
      href={`${assetRoot}/${part.file}`}
      x={part.x}
      y={part.y}
      width={part.width}
      height={part.height}
      preserveAspectRatio="none"
      pointerEvents="none"
    />
  );
}

function Layer({
  slot,
  parts,
  assetRoot,
  transforms,
  onJoint,
}: {
  slot: KitSlot;
  parts: Readonly<Record<string, KitPart>>;
  assetRoot: string;
  transforms: Record<string, string>;
  onJoint: KitJointRegistrar;
}) {
  const part = slot.part ? parts[slot.part] : undefined;

  return (
    <g
      ref={(node) => onJoint(slot.id, node)}
      data-joint={slot.id}
      transform={transforms[slot.id]}
    >
      {part ? <Art part={part} assetRoot={assetRoot} /> : null}
      {slot.children?.map((child) => (
        <Layer
          key={child.id}
          slot={child}
          parts={parts}
          assetRoot={assetRoot}
          transforms={transforms}
          onJoint={onJoint}
        />
      ))}
    </g>
  );
}

/**
 * Generic renderer for a cut-up illustration.
 *
 * Walks the slot tree and emits one `<g>` per joint, each carrying its painted
 * piece. Document order *is* the z-order, so "shield over torso" or "near boot
 * over far boot" is expressed by where a slot sits in the tree, never by a
 * z-index calculation.
 *
 * The groups are static React output: the animation loop mutates their
 * `transform` attributes directly, so no React render happens per frame.
 */
export const KitRig = memo(function KitRig({
  slots,
  parts,
  assetRoot,
  transforms,
  onJoint,
}: {
  slots: readonly KitSlot[];
  parts: Readonly<Record<string, KitPart>>;
  assetRoot: string;
  transforms: Record<string, string>;
  onJoint: KitJointRegistrar;
}) {
  return (
    <>
      {slots.map((slot) => (
        <Layer
          key={slot.id}
          slot={slot}
          parts={parts}
          assetRoot={assetRoot}
          transforms={transforms}
          onJoint={onJoint}
        />
      ))}
    </>
  );
});

export default KitRig;
