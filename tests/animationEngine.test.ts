import test from "node:test";
import assert from "node:assert/strict";
import { LagerthaAnimationEngine } from "../src/components/characters/Lagertha/PosePlate/LagerthaAnimationEngine";
import { LAGERTHA_ANIMATIONS, ULTIMATE_IMPACT_SECONDS } from "../src/components/characters/Lagertha/PosePlate/lagertha.animations";
import { RAGNAR_CLIPS, sampleClip } from "../src/components/characters/Ragnar/animations";
import { stageInfo, TOTAL_STAGES } from "../src/lib/heroes";

function makeContext(): CanvasRenderingContext2D {
  const target: Record<string, unknown> = { globalAlpha: 1 };
  return new Proxy(target, {
    get(object, property) {
      if (property in object) return object[String(property)];
      return () => undefined;
    },
    set(object, property, value) {
      object[String(property)] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

test("all public states, including three distinct attack choreographies, have complete keyframes", () => {
  for (const [name, definition] of Object.entries(LAGERTHA_ANIMATIONS)) {
    assert.ok(definition.duration > 0, `${name} duration`);
    assert.equal(definition.keyframes[0].at, 0, `${name} starts at zero`);
    assert.equal(definition.keyframes.at(-1)?.at, definition.duration, `${name} ends at duration`);
    assert.ok(definition.keyframes.every((frame) => Number.isFinite(frame.at)));
  }
  assert.equal(LAGERTHA_ANIMATIONS.idle.loop, true);
  assert.equal(LAGERTHA_ANIMATIONS.move.loop, true);
  for (const name of ["attack", "attack2", "attack3"] as const) {
    assert.equal(LAGERTHA_ANIMATIONS[name].loop, false);
    assert.ok(LAGERTHA_ANIMATIONS[name].events?.some((event) => event.name === "impact"));
  }
  assert.notDeepEqual(
    LAGERTHA_ANIMATIONS.attack.keyframes.map((frame) => frame.pose),
    LAGERTHA_ANIMATIONS.attack2.keyframes.map((frame) => frame.pose),
  );
  assert.notDeepEqual(
    LAGERTHA_ANIMATIONS.attack2.keyframes.map((frame) => frame.pose),
    LAGERTHA_ANIMATIONS.attack3.keyframes.map((frame) => frame.pose),
  );
});

test("ultimate emits start, attack-start, impact and finish once at authored offsets", () => {
  let now = 10_000;
  const previousPerformance = globalThis.performance;
  Object.defineProperty(globalThis, "performance", { configurable: true, value: { now: () => now } });
  try {
    const engine = new LagerthaAnimationEngine();
    const seen: Array<{ name: string; elapsed: number; playbackId: number }> = [];
    const completed: string[] = [];
    engine.setEventHandler((event) => seen.push(event));
    engine.setCompletionHandler((animation) => completed.push(animation));
    const id = engine.play("ultimate");
    assert.equal(seen[0]?.name, "ultimateStarted");
    assert.equal(seen[0]?.elapsed, 0);

    const ctx = makeContext();
    const drawAt = (seconds: number) => {
      now = 10_000 + seconds * 1000;
      engine.draw(ctx, 960, 540, now, { characterHeight: 400, scale: 1, facing: "right", opacity: 1 });
    };
    drawAt(0.68);
    drawAt(2.104);
    assert.equal(seen.filter((event) => event.name === "impact").length, 0);
    drawAt(ULTIMATE_IMPACT_SECONDS);
    drawAt(2.4);
    assert.equal(seen.filter((event) => event.name === "impact").length, 1);
    assert.equal(seen.find((event) => event.name === "impact")?.elapsed, ULTIMATE_IMPACT_SECONDS);
    assert.equal(seen.find((event) => event.name === "impact")?.playbackId, id);
    assert.ok(seen.some((event) => event.name === "attackStarted" && event.playbackId === id));
    drawAt(3.2);
    assert.equal(seen.filter((event) => event.name === "ultimateFinished").length, 1);
    assert.deepEqual(completed, ["ultimate"]);
    assert.equal(engine.getAnimation(), "idle");
    engine.dispose();
  } finally {
    Object.defineProperty(globalThis, "performance", { configurable: true, value: previousPerformance });
  }
});

test("playback rate speeds up impact while preserving its authored event offset", () => {
  let now = 30_000;
  const previousPerformance = globalThis.performance;
  Object.defineProperty(globalThis, "performance", { configurable: true, value: { now: () => now } });
  try {
    const engine = new LagerthaAnimationEngine();
    const seen: Array<{ name: string; elapsed: number }> = [];
    engine.setEventHandler((event) => seen.push(event));
    engine.setPlaybackRate(2);
    const id = engine.play("attack");
    const ctx = makeContext();
    const drawAt = (ms: number) => {
      now = 30_000 + ms;
      engine.draw(ctx, 640, 400, now, { characterHeight: 300, scale: 1, facing: "right", opacity: 1 });
    };
    drawAt(1);
    drawAt(214);
    assert.equal(seen.filter((event) => event.name === "impact").length, 0);
    drawAt(217);
    const impact = seen.find((event) => event.name === "impact");
    assert.equal(impact?.elapsed, 0.43);
    assert.equal(seen.filter((event) => event.name === "impact").length, 1);
    assert.equal(engine.getPlaybackId(), id);
    engine.dispose();
  } finally {
    Object.defineProperty(globalThis, "performance", { configurable: true, value: previousPerformance });
  }
});

test("moveTo eases the root coordinate and returns to idle on arrival", () => {
  const now = 20_000;
  const previousPerformance = globalThis.performance;
  Object.defineProperty(globalThis, "performance", { configurable: true, value: { now: () => now } });
  try {
    const engine = new LagerthaAnimationEngine();
    engine.setPosition(100, 250);
    engine.moveTo(300, 250, 500);
    assert.equal(engine.getAnimation(), "move");
    const ctx = makeContext();
    engine.draw(ctx, 800, 500, now + 250, { characterHeight: 400, scale: 1, facing: "right", opacity: 1 });
    assert.ok(engine.getPosition().x > 100 && engine.getPosition().x < 300);
    engine.draw(ctx, 800, 500, now + 510, { characterHeight: 400, scale: 1, facing: "right", opacity: 1 });
    assert.equal(engine.getPosition().x, 300);
    assert.equal(engine.getAnimation(), "idle");
    engine.dispose();
  } finally {
    Object.defineProperty(globalThis, "performance", { configurable: true, value: previousPerformance });
  }
});

test("Ragnar's three battle attacks are authored as different weight shifts and weapon paths", () => {
  const variants = ["attack", "attack2", "attack3"] as const;
  const midposes = variants.map((variant) => sampleClip(RAGNAR_CLIPS[variant], RAGNAR_CLIPS[variant].duration * 0.48));
  assert.notDeepEqual(midposes[0], midposes[1]);
  assert.notDeepEqual(midposes[1], midposes[2]);
  assert.ok(variants.every((variant) => RAGNAR_CLIPS[variant].autoReturn === "idle"));
});

test("new campaign worlds unlock 24 story stages with distinct boss finales", () => {
  assert.equal(TOTAL_STAGES, 64);
  const jotun = stageInfo(48);
  const svartalf = stageInfo(56);
  const vanaheim = stageInfo(64);
  assert.equal(jotun.chapter.name, "Jötunheim: El pacto de escarcha");
  assert.equal(svartalf.chapter.name, "Svartálfaheim: La forja perdida");
  assert.equal(vanaheim.chapter.name, "Vanaheim: La raíz del alba");
  for (const stage of [jotun, svartalf, vanaheim]) {
    assert.equal(stage.isBoss, true);
    assert.ok(stage.stageName.length > 3);
    assert.ok(stage.story.length > 40);
  }
});

test("Lagertha's three attack clips each announce their own synced impact", () => {
  let now = 50_000;
  const previousPerformance = globalThis.performance;
  Object.defineProperty(globalThis, "performance", { configurable: true, value: { now: () => now } });
  try {
    const engine = new LagerthaAnimationEngine();
    const ctx = makeContext();
    for (const name of ["attack", "attack2", "attack3"] as const) {
      const impactAt = LAGERTHA_ANIMATIONS[name].events?.find((event) => event.name === "impact")?.at;
      assert.ok(impactAt !== undefined);
      const seen: string[] = [];
      engine.setEventHandler((event) => seen.push(event.name));
      engine.play(name);
      engine.draw(ctx, 800, 500, now, { characterHeight: 400, scale: 1, facing: "right", opacity: 1 });
      now += impactAt * 1000 + 2;
      engine.draw(ctx, 800, 500, now, { characterHeight: 400, scale: 1, facing: "right", opacity: 1 });
      assert.equal(seen.filter((event) => event === "impact").length, 1, `${name} impact`);
      now += 1500;
    }
    engine.dispose();
  } finally {
    Object.defineProperty(globalThis, "performance", { configurable: true, value: previousPerformance });
  }
});
