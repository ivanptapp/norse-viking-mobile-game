import type { RefObject } from "react";
import type { LagerthaAnimation, LagerthaCharacterHandle, LagerthaAnimationEvent } from "./lagertha.types";

export interface LagerthaBattleHooks {
  /** Forward this to the battle system's existing attack/animation telemetry. */
  onAttackStarted?: (event: LagerthaAnimationEvent) => void;
  /** Battle system applies damage/targeting; this adapter deliberately does not. */
  onImpact?: (event: LagerthaAnimationEvent) => void;
  onUltimateFinished?: (event: LagerthaAnimationEvent) => void;
  onAnimationEvent?: (event: LagerthaAnimationEvent) => void;
}

/**
 * Hand-off layer used by BattleOverlay. It de-duplicates animation events and
 * exposes playback control while leaving turn order, targets, and damage in game.
 */
export function createLagerthaBattleAdapter(
  characterRef: RefObject<LagerthaCharacterHandle | null>,
  hooks: LagerthaBattleHooks,
) {
  const delivered = new Set<string>();
  const once = (event: LagerthaAnimationEvent, callback?: (event: LagerthaAnimationEvent) => void) => {
    const key = `${event.playbackId}:${event.name}`;
    if (delivered.has(key)) return;
    delivered.add(key);
    // Bound the set if a battle lasts a long time.
    if (delivered.size > 64) delivered.clear();
    callback?.(event);
  };

  return {
    play(animation: LagerthaAnimation, options?: { restart?: boolean }) {
      return characterRef.current?.play(animation, options);
    },
    playAttack() { return characterRef.current?.play("attack"); },
    playUltimate() { return characterRef.current?.play("ultimate"); },
    playHit() { return characterRef.current?.play("hit"); },
    handleAnimationEvent(event: LagerthaAnimationEvent) {
      once(event, (deduped) => {
        hooks.onAnimationEvent?.(deduped);
        if (deduped.name === "attackStarted") hooks.onAttackStarted?.(deduped);
        else if (deduped.name === "impact") hooks.onImpact?.(deduped);
        else if (deduped.name === "ultimateFinished") hooks.onUltimateFinished?.(deduped);
      });
    },
  };
}
