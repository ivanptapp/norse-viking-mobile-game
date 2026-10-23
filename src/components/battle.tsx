"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import {
  Coins,
  FastForward,
  Gem,
  Skull,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
  X,
  Swords,
} from "lucide-react";
import { HERO_AVATARS } from "./game-ui";
import { HeroFigure, type FigureState } from "./hero-figure";
import { heroById, RARITY_COLOR } from "@/lib/heroes";
import { ELEMENT_COLOR, isRanged } from "@/lib/sprites";
import { isMuted, setMuted, sfx, type SfxName } from "@/lib/sfx";
import { FxLayer, type Fx } from "./battle/battle-fx";
import {
  ContactShadow,
  BattleTerrain,
  UltPool,
  depthScale,
  type TerrainTone,
} from "./battle/battle-field";
import { BattleNameplate } from "./battle/battle-nameplate";
import { BattleDock } from "./battle/battle-dock";
import {
  signatureFor,
  APPROACH_MS,
  type AttackSignature,
} from "./battle/attack-signatures";

interface Fighter {
  uid: string;
  heroId: string;
  name: string;
  side: string;
  position: string;
  level: number;
  stars: number;
  maxHp: number;
  hp: number;
  energy?: number;
}
interface Dmg {
  uid: string;
  amount: number;
  crit: boolean;
  hpAfter: number;
  died: boolean;
}
interface Heal {
  uid: string;
  amount: number;
  hpAfter: number;
}
interface Step {
  actor: string;
  targets: string[];
  skill: string;
  kind: string;
  ult?: boolean;
  damages: Dmg[];
  heals: Heal[];
  log: string;
}
export interface BattleData {
  victory: boolean;
  steps: Step[];
  allies: Fighter[];
  enemies: Fighter[];
  rounds: number;
  rewards: { gold: number; exp: number; gems: number };
  enemyName: string;
  mode: string;
  arenaDelta?: number;
  background?: string;
}

interface UnitMetric {
  /** Posición del punto de apoyo (los pies) dentro del campo. */
  x: number;
  y: number;
  /** Tamaño base del sprite, antes de la escala de profundidad. */
  base: number;
  /** Escala por profundidad: 1 al frente, ~0.8 al fondo. */
  scale: number;
  /** Altura dibujada del héroe. */
  artH: number;
  /** Altura del pecho, donde impactan los golpes. */
  chest: number;
  dir: 1 | -1;
  depth: number;
}

interface UnitView {
  hp: number;
  energy: number;
  anim: FigureState;
  dx: number;
  dy: number;
  moving: boolean;
  dead: boolean;
  shield?: number;
  /** Duración del desplazamiento en curso (ms a velocidad 1). */
  moveMs?: number;
}

/**
 * Dos líneas de combate.
 *
 * Vanguardia adelantada a la derecha (más cerca del centro) y escolta detrás
 * a la izquierda. Los héroes se ordenan por fila, así que el que aguanta el
 * frente queda delante y los frágiles quedan cubiertos: la formación cuenta
 * una historia aunque no haya jugabilidad táctica detrás.
 */
const LANES = [
  { x: 0.335, y: 0.96 }, // vanguardia centro
  { x: 0.195, y: 0.94 }, // vanguardia ala
  { x: 0.44, y: 0.84 }, // segunda línea
  { x: 0.3, y: 0.72 }, // retaguardia centro
  { x: 0.115, y: 0.7 }, // retaguardia ala
];
/** Alto reservado a cartas y registro: el suelo se calcula por encima. */
const DOCK_HEIGHT = 128;
/** Duración de la presentación de una definitiva dibujada. */
const CUTIN_MS = 1150;
const POS_ORDER: Record<string, number> = { front: 0, mid: 1, back: 2 };

/** Multiplicador de caja por héroe dibujado con su propio encuadre. */
function artScaleOf(heroId: string): number {
  switch (heroId.toLowerCase()) {
    case "ragnar":
      return 1.2;
    case "lagertha":
      return 1.24;
    case "fenrir":
      return 1.08;
    default:
      return 1;
  }
}

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = Number.parseInt(full, 16);
  if (!Number.isFinite(num)) return `rgba(248,113,113,${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function terrainToneOf(background: string): TerrainTone {
  if (background.includes("helheim") || background.includes("coast")) return "snow";
  if (
    background.includes("ragnarok") ||
    background.includes("village") ||
    background.includes("arena")
  )
    return "ember";
  return "mist";
}

export function BattleOverlay({
  battle,
  onClose,
}: {
  battle: BattleData;
  onClose: () => void;
}) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [field, setField] = useState({ w: 390, h: 460 });
  const speedRef = useRef(1);
  const [speed, setSpeed] = useState(1);
  const [muted, setMutedState] = useState(false);
  const cancelRef = useRef(false);
  const fxId = useRef(0);

  const all = useMemo(() => [...battle.allies, ...battle.enemies], [battle]);
  const byUid = useMemo(
    () =>
      Object.fromEntries(all.map((f) => [f.uid, f])) as Record<string, Fighter>,
    [all],
  );

  const [ultimateVideo, setUltimateVideo] = useState<{
    src: string;
    skill: string;
    hero: string;
  } | null>(null);
  const slots = useMemo(() => {
    const m: Record<string, { x: number; y: number; dir: 1 | -1 }> = {};
    (["ally", "enemy"] as const).forEach((side) => {
      const team = side === "ally" ? battle.allies : battle.enemies;
      [...team]
        .sort(
          (a, b) =>
            POS_ORDER[a.position] - POS_ORDER[b.position] || a.level - b.level,
        )
        .forEach((f, i) => {
          const lane = LANES[Math.min(i, LANES.length - 1)];
          m[f.uid] = {
            x: side === "ally" ? lane.x : 1 - lane.x,
            y: lane.y,
            dir: side === "ally" ? 1 : -1,
          };
        });
    });
    return m;
  }, [battle]);

  const [units, setUnits] = useState<Record<string, UnitView>>(() => {
    const m: Record<string, UnitView> = {};
    all.forEach(
      (f) =>
        (m[f.uid] = {
          hp: f.hp,
          energy: f.energy ?? 28 + Math.floor(Math.random() * 22),
          anim: "idle",
          dx: 0,
          dy: 0,
          moving: false,
          dead: false,
        }),
    );
    return m;
  });
  const unitsRef = useRef(units);
  useEffect(() => {
    unitsRef.current = units;
  }, [units]);

  const [fx, setFx] = useState<Fx[]>([]);
  const [cutin, setCutin] = useState<{ uid: string; name: string } | null>(
    null,
  );
  const [flash, setFlash] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [intro, setIntro] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [log, setLog] = useState(
    "Los cuernos de guerra resuenan… ¡preparad el acero!",
  );
  const [slowMo, setSlowMo] = useState(false);

  useEffect(() => setMutedState(isMuted()), []);
  useLayoutEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const upd = () => {
      const r = el.getBoundingClientRect();
      setField({ w: r.width, h: r.height });
    };
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /**
   * Geometría de cada luchador: dónde está de pie, cuánto mide y a qué altura
   * le impactan los golpes. Se recalcula cuando cambia el campo, así que girar
   * el móvil recompone la formación en vez de romperla.
   */
  const metrics = useMemo(() => {
    const out: Record<string, UnitMetric> = {};
    const base = Math.round(
      Math.max(66, Math.min(170, field.w * 0.225, field.h * 0.3)),
    );
    const arenaH = Math.max(150, field.h - DOCK_HEIGHT);
    for (const uid of Object.keys(slots)) {
      const slot = slots[uid];
      const scale = depthScale(slot.y);
      const art = artScaleOf(byUid[uid]?.heroId ?? "");
      out[uid] = {
        x: slot.x * field.w,
        y: arenaH * slot.y,
        base,
        scale,
        artH: base * art * scale,
        chest: base * art * scale * 0.52,
        dir: slot.dir,
        depth: slot.y,
      };
    }
    return out;
  }, [slots, byUid, field]);

  /* La misma geometría, pero viva para el bucle de combate y sus efectos. */
  const metricsRef = useRef(metrics);
  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);
  const metric = useCallback(
    (uid: string): UnitMetric =>
      metricsRef.current[uid] ?? {
        x: 0,
        y: 0,
        base: 80,
        scale: 1,
        artH: 80,
        chest: 42,
        dir: 1,
        depth: 0.9,
      },
    [],
  );

  const patch = useCallback((p: Record<string, Partial<UnitView>>) => {
    const next = { ...unitsRef.current };
    for (const k of Object.keys(p))
      next[k] = { ...next[k], ...p[k] } as UnitView;
    unitsRef.current = next;
    setUnits(next);
  }, []);

  const addFx = useCallback((item: Omit<Fx, "id">, ttl = 900) => {
    const id = ++fxId.current;
    setFx((f) => [...f, { ...item, id } as Fx]);
    setTimeout(
      () => setFx((f) => f.filter((x) => x.id !== id)),
      ttl / speedRef.current,
    );
  }, []);

  const sleep = useCallback(
    (ms: number) =>
      new Promise<void>((r) =>
        setTimeout(r, ms / (slowMo ? 0.55 : speedRef.current)),
      ),
    [slowMo],
  );

  /** Huella visual de cada estilo de golpe. */
  const impactFx = useCallback(
    (
      sig: AttackSignature,
      uid: string,
      actorUid: string | null,
      crit: boolean,
      ult: boolean,
    ) => {
      const m = metric(uid);
      const top = m.y - m.chest;
      const feet = m.y;
      const big = crit || ult;

      addFx(
        { kind: "burst", x: m.x, y: top, color: sig.accent, big },
        520,
      );

      switch (sig.style) {
        case "cleave":
          addFx(
            {
              kind: "slash",
              x: m.x,
              y: top,
              color: sig.accent,
              rot: -24,
              big,
              w: ult ? 116 : 84,
              h: ult ? 66 : 48,
            },
            430,
          );
          addFx({ kind: "spark", x: m.x, y: top, color: sig.trail }, 420);
          addFx({ kind: "dust", x: m.x, y: feet - 2, color: sig.trail }, 720);
          break;
        case "thrust":
          addFx(
            {
              kind: "slash",
              x: m.x,
              y: top,
              color: sig.accent,
              rot: -8,
              w: ult ? 140 : 104,
              h: ult ? 40 : 26,
              big,
            },
            360,
          );
          addFx({ kind: "spark", x: m.x, y: top, color: sig.accent }, 380);
          break;
        case "slam":
          addFx(
            { kind: "shock", x: m.x, y: feet, color: sig.accent, w: ult ? 230 : 160 },
            620,
          );
          addFx({ kind: "dust", x: m.x, y: feet - 4, color: sig.trail }, 760);
          addFx({ kind: "spark", x: m.x, y: top, color: sig.accent }, 400);
          break;
        case "volley":
          addFx({ kind: "spark", x: m.x, y: top, color: sig.accent }, 380);
          addFx({ kind: "ring", x: m.x, y: feet, color: sig.trail }, 560);
          break;
        case "arcane":
          addFx(
            { kind: "arcane", x: m.x, y: feet - 4, color: sig.accent, w: ult ? 168 : 116 },
            760,
          );
          addFx({ kind: "spark", x: m.x, y: top, color: sig.accent }, 460);
          break;
        case "beam":
          if (actorUid) {
            const a = metric(actorUid);
            const startX = a.x + a.dir * a.base * 0.18;
            addFx(
              {
                kind: "beam",
                x: startX,
                y: a.y - a.chest * 1.02,
                dx: m.x - startX,
                color: sig.accent,
                big: ult,
              },
              520,
            );
          }
          addFx({ kind: "spark", x: m.x, y: top, color: sig.accent }, 500);
          break;
        case "drain":
          if (actorUid) {
            const a = metric(actorUid);
            const startX = a.x + a.dir * a.base * 0.18;
            addFx(
              {
                kind: "beam",
                x: startX,
                y: a.y - a.chest * 1.02,
                dx: m.x - startX,
                color: sig.trail,
                big: ult,
              },
              560,
            );
          }
          addFx({ kind: "arcane", x: m.x, y: feet - 4, color: sig.trail, w: 104 }, 700);
          addFx({ kind: "spark", x: m.x, y: top, color: sig.accent }, 460);
          break;
        case "fang":
          addFx({ kind: "claw", x: m.x, y: top, color: sig.accent }, 420);
          addFx({ kind: "spark", x: m.x, y: top, color: sig.trail }, 380);
          break;
      }

      if (ult) {
        addFx(
          { kind: "shock", x: m.x, y: feet, color: sig.accent, w: 260 },
          640,
        );
        addFx({ kind: "ring", x: m.x, y: top, color: sig.accent }, 620);
      }
    },
    [metric, addFx],
  );

  const applyStep = useCallback(
    (s: Step) => {
      const cur = unitsRef.current;
      const p: Record<string, Partial<UnitView>> = {};
      const actor = byUid[s.actor];
      const sig = signatureFor(actor.heroId);
      for (const d of s.damages) {
        const m = metric(d.uid);
        p[d.uid] = {
          hp: d.hpAfter,
          energy: Math.min(100, cur[d.uid].energy + 16),
          anim: d.died ? "dead" : "hit",
          dead: d.died,
        };
        addFx(
          {
            kind: "float",
            x: m.x + (Math.random() * 20 - 10),
            y: m.y - m.artH * 1.1,
            text: `-${d.amount}`,
            label: d.crit || s.ult ? sig.word : undefined,
            color: d.crit ? "#fde047" : "#fecaca",
            big: d.crit,
          },
          1100,
        );
        impactFx(sig, d.uid, s.actor, !!d.crit, !!s.ult);
      }
      for (const h of s.heals) {
        const m = metric(h.uid);
        p[h.uid] = { ...(p[h.uid] || {}), hp: h.hpAfter } as Partial<UnitView>;
        addFx(
          {
            kind: "float",
            x: m.x,
            y: m.y - m.artH * 1.1,
            text: `+${h.amount}`,
            color: "#86efac",
          },
          1100,
        );
        addFx({ kind: "heal", x: m.x, y: m.y - m.artH * 0.44 }, 950);
        addFx({ kind: "arcane", x: m.x, y: m.y - 4, color: "#86efac", w: 104 }, 720);
      }
      const a = cur[s.actor];
      p[s.actor] = {
        ...(p[s.actor] || {}),
        energy: s.ult ? 18 : Math.min(100, a.energy + 24),
      };
      patch(p);
      const hitIds = s.damages.filter((d) => !d.died).map((d) => d.uid);
      if (hitIds.length)
        setTimeout(() => {
          const r: Record<string, Partial<UnitView>> = {};
          hitIds.forEach((id) => {
            if (!unitsRef.current[id]?.dead) r[id] = { anim: "idle" };
          });
          if (Object.keys(r).length) patch(r);
        }, 440 / speedRef.current);
    },
    [byUid, metric, addFx, patch, impactFx],
  );

  const impact = useCallback(
    (s: Step) => {
      applyStep(s);
      const sig = signatureFor(byUid[s.actor].heroId);
      if (s.damages.length) {
        const sound: SfxName = s.damages.some((d) => d.crit)
          ? "crit"
          : sig.sound;
        sfx(sound);
      }
      if (s.damages.some((d) => d.died)) setTimeout(() => sfx("death"), 140);
      if (s.ult && s.damages.length) {
        setFlash(withAlpha(sig.accent, 0.5));
        setShake(true);
        setSlowMo(true);
        setTimeout(() => {
          setFlash(null);
          setShake(false);
        }, 480 / speedRef.current);
        setTimeout(() => setSlowMo(false), 900 / speedRef.current);
      } else if (s.damages.some((d) => d.crit) || sig.shake >= 3) {
        setSlowMo(true);
        setTimeout(() => setSlowMo(false), 450 / speedRef.current);
      }
      if (sig.shake >= 2 && !s.ult) {
        setShake(true);
        setTimeout(() => setShake(false), 260 / speedRef.current);
      }
    },
    [applyStep, byUid],
  );

  useEffect(() => {
    cancelRef.current = false;
    let alive = true;

    const run = async () => {
      setIntro(true);
      sfx("horn");
      await sleep(1000);
      setIntro(false);

      for (let i = 0; i < battle.steps.length; i++) {
        if (cancelRef.current || !alive) return;

        const s = battle.steps[i];
        setStepIdx(i);
        setActiveUid(s.actor);
        setLog(s.log);

        const def = heroById(byUid[s.actor].heroId);
        const m = metric(s.actor);
        const sig = signatureFor(byUid[s.actor].heroId);
        const heal = s.heals.length > 0;

        if (s.ult) {
          const actor = byUid[s.actor];
          const isRagnar = actor.heroId.toLowerCase() === "ragnar";

          sfx("ult");

          // Runa gigante y estallido de energía tras el lanzador.
          addFx(
            {
              kind: "sigil",
              x: m.x,
              y: m.y - m.artH * 0.5,
              color: sig.accent,
              w: Math.min(320, m.base * 3.4),
              text: def.rune,
            },
            1000,
          );
          addFx(
            {
              kind: "shock",
              x: m.x,
              y: m.y,
              color: sig.accent,
              w: Math.min(330, m.base * 3.6),
            },
            760,
          );

          if (isRagnar) {
            setCutin(null);
            setUltimateVideo({
              src: "/videos/ultimates/ragnar-ultimate.mp4",
              skill: def.ult.name,
              hero: def.name,
            });
            await sleep(3200);
            setUltimateVideo(null);
          } else {
            setCutin({ uid: s.actor, name: def.ult.name });
            await sleep(CUTIN_MS);
            setCutin(null);
          }

          if (cancelRef.current || !alive) return;
        }

        if (heal) {
          patch({ [s.actor]: { anim: "cast" } });
          sfx("cast");
          addFx({ kind: "arcane", x: m.x, y: m.y - 6, color: sig.accent, w: 130 }, 800);
          await sleep(320);

          if (s.ult) {
            setFlash(withAlpha(sig.accent, 0.28));
            setTimeout(() => setFlash(null), 450 / speedRef.current);
          }

          applyStep(s);
          sfx("heal");
          await sleep(540);

          patch({ [s.actor]: { anim: "idle" } });
        } else if (sig.approach === "stand" || isRanged(def)) {
          patch({ [s.actor]: { anim: "shoot" } });
          await sleep(sig.style === "volley" ? 130 : 190);

          sfx(sig.sound === "hit" ? "shoot" : sig.sound);

          const start = {
            x: m.x + m.dir * m.base * 0.3,
            y: m.y - m.chest * 1.5,
          };
          const proj =
            sig.style === "thrust"
              ? "spear"
              : sig.style === "volley"
                ? "arrow"
                : sig.style === "fang"
                  ? "dagger"
                  : sig.style === "slam"
                    ? "hammer"
                    : "orb";

          // Descarga mágica: el rayo sale al instante, sin viaje.
          if (sig.style === "beam" || sig.style === "drain") {
            addFx(
              {
                kind: "burst",
                x: start.x,
                y: start.y + m.chest * 0.35,
                color: sig.accent,
                big: !!s.ult,
              },
              380,
            );
            await sleep(160);
            impact(s);
          } else {
            const targets = s.targets.length ? s.targets : [s.actor];
            for (const t of targets) {
              const tm = metric(t);
              const end = { x: tm.x, y: tm.y - tm.chest };
              const dx = end.x - start.x;
              const dy = end.y - start.y;
              addFx(
                {
                  kind: "proj",
                  x: start.x,
                  y: start.y,
                  dx,
                  dy,
                  rot: (Math.atan2(dy, dx) * 180) / Math.PI,
                  dur: (sig.style === "volley" ? 240 : 300) / speedRef.current,
                  proj,
                  color: sig.accent,
                },
                380,
              );
            }

            await sleep(sig.style === "volley" ? 280 : 330);
            impact(s);
          }
          await sleep(380);

          patch({ [s.actor]: { anim: "idle" } });
        } else {
          // Cuerpo a cuerpo.
          const targetUid = s.targets[0] ?? s.actor;
          const tm = metric(targetUid);
          const reach = m.base * (sig.approach === "lunge" ? 0.92 : 0.8) * m.scale;
          const dx = tm.x - m.dir * reach - m.x;
          const dy = 0;
          const blink = sig.approach === "blink";
          const moveMs =
            byUid[s.actor].heroId.toLowerCase() === "ragnar"
              ? 1200
              : APPROACH_MS[sig.approach] || 600;

          if (blink) {
            addFx({ kind: "spark", x: m.x, y: m.y - m.chest, color: sig.trail }, 320);
            addFx({ kind: "dust", x: m.x, y: m.y - 2, color: sig.trail }, 460);
          } else {
            addFx({ kind: "dust", x: m.x, y: m.y - 2, color: sig.trail }, 620);
          }

          patch({
            [s.actor]: {
              dx,
              dy,
              moving: true,
              anim: blink ? "attack" : "walk",
              moveMs,
            },
          });

          sfx("dash");
          await sleep(blink ? 180 : moveMs);

          if (cancelRef.current || !alive) return;

          patch({ [s.actor]: { anim: "attack" } });
          await sleep(sig.windup);

          if (cancelRef.current || !alive) return;

          impact(s);
          await sleep(320);

          if (cancelRef.current || !alive) return;

          addFx({ kind: "dust", x: tm.x - m.dir * reach * 0.6, y: m.y - 2, color: sig.trail }, 560);

          patch({
            [s.actor]: {
              anim: blink ? "attack" : "walk",
              dx: 0,
              dy: 0,
              moveMs: blink ? 160 : moveMs,
            },
          });

          await sleep(blink ? 180 : moveMs);

          if (cancelRef.current || !alive) return;

          patch({
            [s.actor]: {
              anim: "idle",
              moving: false,
            },
          });
        }

        await sleep(130);
      }

      if (!alive || cancelRef.current) return;

      setActiveUid(null);
      await sleep(500);
      setFinished(true);
      sfx(battle.victory ? "win" : "lose");
    };

    void run();

    return () => {
      alive = false;
      cancelRef.current = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle]);

  const skip = () => {
    cancelRef.current = true;
    const p: Record<string, Partial<UnitView>> = {};
    all.forEach(
      (f) =>
        (p[f.uid] = {
          anim: "idle",
          dx: 0,
          dy: 0,
          moving: false,
        } as Partial<UnitView>),
    );
    battle.steps.forEach((s) => {
      s.damages.forEach(
        (d) =>
          (p[d.uid] = {
            ...p[d.uid],
            hp: d.hpAfter,
            dead: d.died || !!(p[d.uid] as UnitView)?.dead,
            anim: d.died ? "dead" : "idle",
          } as Partial<UnitView>),
      );
      s.heals.forEach(
        (h) => (p[h.uid] = { ...p[h.uid], hp: h.hpAfter } as Partial<UnitView>),
      );
    });
    patch(p);
    setFx([]);
    setCutin(null);
    setUltimateVideo(null);
    setFlash(null);
    setIntro(false);
    setSlowMo(false);
    setActiveUid(null);
    setStepIdx(battle.steps.length - 1);
    setFinished(true);
  };

  const cycleSpeed = () => {
    // 0.5x para mirar la coreografía, 3x para farmear.
    const n = speed === 0.5 ? 1 : speed === 1 ? 2 : speed === 2 ? 3 : 0.5;
    speedRef.current = n;
    setSpeed(n);
  };
  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    setMutedState(m);
  };

  const aliveAllies = battle.allies.filter(
    (a) => (units[a.uid]?.hp ?? 0) > 0,
  ).length;
  const starsEarned = !battle.victory
    ? 0
    : aliveAllies === battle.allies.length
      ? 3
      : aliveAllies >= Math.ceil(battle.allies.length / 2)
        ? 2
        : 1;
  const bg = battle.background || "/images/bf-coast.jpg";
  const tone = terrainToneOf(bg);
  const isSnow = tone === "snow";
  const isEmber = tone === "ember";
  const progress = Math.max(0, (stepIdx + 1) / Math.max(1, battle.steps.length));

  /** Turnos que vienen: la próxima acción se ve antes de que ocurra. */
  const queue = useMemo(() => {
    const out: { key: string; heroId: string; side: string }[] = [];
    for (let i = Math.max(0, stepIdx + 1); i < battle.steps.length; i++) {
      const actor = byUid[battle.steps[i].actor];
      if (!actor) continue;
      if (out.length && out[out.length - 1].key === actor.uid) continue;
      out.push({ key: actor.uid, heroId: actor.heroId, side: actor.side });
      if (out.length >= 5) break;
    }
    return out;
  }, [battle.steps, byUid, stepIdx]);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-[#060807] select-none"
      data-battle-step={stepIdx}
      style={{ "--spd": speed } as CSSProperties}
    >
      {/* ------------------------------- HUD ------------------------------- */}
      <div className="wood relative z-30 flex shrink-0 items-center gap-2 border-b border-amber-900/60 px-2 py-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 truncate font-display text-[11px] font-black uppercase tracking-wider text-amber-300">
            <Swords size={13} className="shrink-0" />
            <span className="truncate">{battle.enemyName}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={`rounded px-1.5 py-px text-[9px] font-black ${
                speed > 1 ? "bg-amber-400 text-black" : "bg-teal-500 text-black"
              }`}
            >
              AUTO x{speed}
            </span>
            <div className="relative h-[7px] max-w-[150px] flex-1 overflow-hidden rounded-full border border-white/10 bg-black/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all"
                style={{ width: `${progress * 100}%` }}
              />
              <div className="absolute inset-0 shimmer opacity-60" />
            </div>
            <span className="whitespace-nowrap text-[9px] font-bold text-stone-400">
              {aliveAllies}/{battle.allies.length} en pie
            </span>
          </div>
        </div>

        {/* Cola de turnos: quién actúa después. */}
        <div className="flex items-center gap-[3px]">
          {queue.map((q, i) => {
            const def = heroById(q.heroId);
            const face = HERO_AVATARS[q.heroId] || def.avatar;
            const size = i === 0 ? 27 : 21;
            return (
              <div
                key={`${q.key}-${i}`}
                className={`overflow-hidden rounded-md transition-all ${
                  i === 0
                    ? "ring-2 ring-amber-400"
                    : "opacity-55 ring-1 ring-white/10"
                }`}
                style={{
                  width: size,
                  height: size,
                  background: def.color,
                }}
              >
                {face ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={face}
                    alt={def.name}
                    className="h-full w-full object-cover object-top"
                    draggable={false}
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center font-rune text-[10px] font-black text-white/80">
                    {def.rune}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={toggleMute}
          className="rounded-lg border border-stone-700 bg-black/60 p-1.5 text-stone-200"
          aria-label="Silenciar"
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <button
          onClick={cycleSpeed}
          className="min-w-[40px] rounded-lg border border-amber-700/60 bg-black/60 px-1.5 py-1.5 text-xs font-black text-amber-300"
        >
          x{speed}
        </button>
        {!finished && (
          <button
            onClick={skip}
            className="flex items-center gap-1 rounded-lg border border-stone-600 bg-black/60 px-1.5 py-1.5 text-xs font-extrabold text-stone-200"
          >
            <FastForward size={12} />
          </button>
        )}
      </div>

      {/* ------------------------------ CAMPO ------------------------------ */}
      <div
        ref={fieldRef}
        className={`relative flex-1 overflow-hidden ${
          shake ? "field-shake" : ""
        } ${slowMo ? "brightness-[1.06]" : ""}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bg}
          alt=""
          className="battle-background absolute inset-0 h-full w-full object-cover bg-drift"
          style={{ objectPosition: "center 86%" }}
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/35" />

        <BattleTerrain tone={tone} />

        {/* Partículas ambientales */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {isSnow &&
            Array.from({ length: 20 }).map((_, i) => (
              <span
                key={i}
                className="particle"
                style={{
                  left: `${(i * 17) % 100}%`,
                  animationDuration: `${3 + (i % 4)}s`,
                  animationDelay: `${(i * 0.3) % 2}s`,
                  width: 2 + (i % 3),
                  height: 2 + (i % 3),
                }}
              />
            ))}
          {isEmber &&
            Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className="ember"
                style={{
                  left: `${(i * 23) % 100}%`,
                  bottom: `${(i * 11) % 40}%`,
                  animationDuration: `${2.2 + (i % 3)}s`,
                  animationDelay: `${(i * 0.4) % 1.5}s`,
                }}
              />
            ))}
        </div>

        {/* Línea media: separa los dos bandos. */}
        <div className="pointer-events-none absolute left-1/2 top-[24%] h-[56%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-amber-300/25 to-transparent" />

        {/* --------------------------- LUCHADORES --------------------------- */}
        {all.map((f) => {
          const u = units[f.uid];
          const mt = metrics[f.uid];
          const flip = mt.dir === -1;
          const heroId = f.heroId.toLowerCase();
          const rigged =
            heroId === "ragnar" || heroId === "lagertha" || heroId === "fenrir";
          const deadOpacity = u.dead && !rigged ? 0.35 : 1;
          const energyReady = u.energy >= 100 && !u.dead;
          const accent = ELEMENT_COLOR[heroById(f.heroId).element] || "#f87171";

          return (
            <div
              key={f.uid}
              className="absolute"
              style={{
                left: mt.x,
                top: mt.y,
                width: 0,
                height: 0,
                zIndex: u.moving ? 65 : 10 + Math.round(mt.depth * 28),
                opacity: deadOpacity,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 0,
                  height: 0,
                  transform: `translate(${u.dx}px, ${u.dy}px)`,
                  transition: `transform ${
                    (u.moving ? (u.moveMs ?? 620) : 260) / speed
                  }ms cubic-bezier(.2,.8,.2,1)`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 0,
                    height: 0,
                    transform: `scale(${mt.scale.toFixed(3)})`,
                    transformOrigin: "0 0",
                  }}
                >
                  <ContactShadow
                    width={mt.base * 0.72}
                    strength={u.dead ? 0.6 : 1}
                  />
                  {energyReady && (
                    <UltPool width={mt.base} color={withAlpha(accent, 0.55)} />
                  )}

                  <div
                    style={{
                      position: "absolute",
                      left: -mt.base / 2,
                      top: -mt.base,
                      width: mt.base,
                      height: mt.base,
                      transformOrigin: "50% 100%",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        transform: flip ? "scaleX(-1)" : undefined,
                        filter: energyReady
                          ? "drop-shadow(0 0 7px rgba(251,191,36,.85))"
                          : "drop-shadow(0 6px 6px rgba(0,0,0,.45))",
                      }}
                    >
                      <HeroFigure
                        heroId={f.heroId}
                        size={mt.base * artScaleOf(f.heroId)}
                        state={u.dead ? "dead" : u.anim}
                        delay={
                          ((parseInt(f.uid.slice(1), 10) || 0) * 0.43 +
                            (flip ? 0.22 : 0)) %
                          2.2
                        }
                      />
                    </div>
                  </div>
                </div>

                {u.dead && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 text-[11px] font-black text-stone-400"
                    style={{ top: -(mt.base * artScaleOf(f.heroId) * mt.scale * 0.4) }}
                  >
                    ✝
                  </div>
                )}
              </div>

              {!u.dead && (
                <div
                  className="absolute z-[40]"
                  style={{
                    left: -Math.max(48, mt.base * 0.7) / 2,
                    top: -(mt.base * artScaleOf(f.heroId) * mt.scale) - 8,
                    width: Math.max(48, mt.base * 0.7),
                  }}
                >
                  <BattleNameplate
                    name={f.name}
                    level={f.level}
                    hp={u.hp}
                    maxHp={f.maxHp}
                    enemy={flip}
                    width={Math.max(48, mt.base * 0.7)}
                    accent={accent}
                    showName={activeUid === f.uid}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* ------------------------------ FX ------------------------------ */}
        <FxLayer fx={fx} />

        {/* ------------------------- CUT-IN DEFINITIVA ------------------------- */}
        {cutin &&
          (() => {
            const f = byUid[cutin.uid];
            const d = heroById(f.heroId);
            const left = slots[cutin.uid].dir === 1;
            const col = ELEMENT_COLOR[d.element] || "#f59e0b";
            const rarity = RARITY_COLOR[d.rarity] || "#f59e0b";
            const face =
              f.heroId === "ragnar"
                ? "/images/portrait-ragnar.jpg"
                : HERO_AVATARS[f.heroId] || d.avatar;
            return (
              <div className="pointer-events-none absolute inset-0 z-[84]">
                <div className="absolute inset-0 bg-black/78 backdrop-blur-[2px]" />
                <div
                  className="fx-ult-rays absolute inset-0"
                  style={{ ["--ult" as string]: col }}
                />

                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
                  <div
                    className={`fx-cutin-band relative overflow-hidden ${
                      left ? "fx-cutin-l" : "fx-cutin-r"
                    }`}
                    style={{
                      width: "112%",
                      marginLeft: left ? "-6%" : "-6%",
                      padding: "14px 22px",
                      background: left
                        ? "linear-gradient(90deg, rgba(6,9,11,.97) 0%, rgba(6,9,11,.9) 58%, rgba(6,9,11,.45) 100%)"
                        : "linear-gradient(270deg, rgba(6,9,11,.97) 0%, rgba(6,9,11,.9) 58%, rgba(6,9,11,.45) 100%)",
                      borderTop: `2px solid ${col}`,
                      borderBottom: `2px solid ${col}`,
                      boxShadow: `0 12px 44px rgba(0,0,0,.75), 0 0 34px ${col}55`,
                      transform: "skewX(-7deg)",
                    }}
                  >
                    {/* Resplandor del elemento tras el retrato. */}
                    <div
                      className="absolute inset-y-0"
                      style={{
                        left: left ? 0 : undefined,
                        right: left ? undefined : 0,
                        width: "55%",
                        background: `radial-gradient(ellipse at ${left ? "12%" : "88%"} 50%, ${col}66 0%, transparent 66%)`,
                      }}
                    />
                    {/* Runa de agua: marca de la casa. */}
                    <div
                      className="absolute font-rune text-[150px] font-black leading-none opacity-[.14]"
                      style={{
                        right: left ? "4%" : undefined,
                        left: left ? undefined : "4%",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: col,
                      }}
                    >
                      {d.rune}
                    </div>

                    <div
                      className="relative flex items-center gap-3.5"
                      style={{
                        flexDirection: left ? "row" : "row-reverse",
                        transform: "skewX(7deg)",
                      }}
                    >
                      <div className="relative shrink-0">
                        <div
                          className="h-[86px] w-[86px] overflow-hidden rounded-xl border-2"
                          style={{
                            borderColor: rarity,
                            boxShadow: `0 0 18px ${col}aa, 0 6px 16px rgba(0,0,0,.8)`,
                          }}
                        >
                          {face ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={face}
                              alt={d.name}
                              className="h-full w-full object-cover object-top"
                              draggable={false}
                            />
                          ) : (
                            <div
                              className="grid h-full w-full place-items-center font-rune text-3xl font-black text-white/80"
                              style={{ background: d.color }}
                            >
                              {d.rune}
                            </div>
                          )}
                        </div>
                        <span
                          className="absolute -bottom-1.5 grid h-[15px] min-w-[26px] place-items-center rounded bg-black/90 px-1 text-[8px] font-black text-amber-200"
                          style={{ left: left ? 4 : undefined, right: left ? undefined : 4 }}
                        >
                          Nv. {f.level}
                        </span>
                      </div>

                      <div
                        className={`min-w-0 flex-1 ${left ? "" : "text-right"}`}
                        style={{ textShadow: "0 2px 10px #000" }}
                      >
                        <div
                          className="text-[9px] font-black uppercase tracking-[.38em]"
                          style={{ color: col }}
                        >
                          Definitiva
                        </div>
                        <div className="font-display text-[19px] font-black leading-tight text-white">
                          {cutin.name}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-[.12em] text-white/70">
                          {d.name} · {d.element}
                        </div>
                        <div className="mt-1 line-clamp-2 text-[10px] italic leading-snug text-white/60">
                          «{d.ult.desc}»
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        {ultimateVideo && (
          <div className="pointer-events-none absolute inset-0 z-[86] overflow-hidden bg-black">
            <video
              key={ultimateVideo.src}
              src={ultimateVideo.src}
              autoPlay
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 h-full w-full object-contain"
              onEnded={() => setUltimateVideo(null)}
              onError={() => setUltimateVideo(null)}
            />
            {/* Encuadre cinematográfico: la banda ancha se enmarca, no se recorta. */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/55" />
            <div className="fx-ult-rays absolute inset-0" style={{ ["--ult" as string]: "#f59e0b" }} />
            <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-2 pt-3">
              <span className="h-px w-10 bg-amber-400/60" />
              <span className="text-[9px] font-black uppercase tracking-[.42em] text-amber-300">
                Definitiva
              </span>
              <span className="h-px w-10 bg-amber-400/60" />
            </div>
            <div className="absolute inset-x-0 bottom-0 pb-3 text-center">
              <div className="font-display text-lg font-black text-amber-200 drop-shadow">
                {ultimateVideo.skill}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[.3em] text-white/70">
                {ultimateVideo.hero}
              </div>
            </div>
          </div>
        )}

        {intro && (
          <div className="pointer-events-none absolute inset-0 z-[84] flex flex-col items-center justify-center">
            <div
              className="fx-intro font-display text-4xl font-black leading-none tracking-[.14em] text-amber-300"
              style={{ textShadow: "0 0 30px #f59e0b, 0 6px 14px #000" }}
            >
              ¡A LA
              <br />
              BATALLA!
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.4em] text-amber-200/80">
              <span className="h-px w-8 bg-amber-500/60" />
              {battle.mode === "arena"
                ? "Holmgang"
                : battle.mode === "raid"
                  ? "Incursión"
                  : "Saga"}
              <span className="h-px w-8 bg-amber-500/60" />
            </div>
          </div>
        )}

        {flash && (
          <div
            className="fx-flash pointer-events-none absolute inset-0 z-[76]"
            style={{ background: flash }}
          />
        )}

        {/* Registro de combate, justo encima de las cartas. */}
        <div
          className="pointer-events-none absolute inset-x-2 z-[81] flex items-center gap-1.5 text-[10px] font-semibold text-stone-100/95"
          style={{ bottom: 118, textShadow: "0 1px 3px #000" }}
        >
          <span className="shrink-0 rounded-full border border-white/10 bg-black/60 px-1.5 py-0.5">
            ⚔
          </span>
          <span className="truncate rounded-full bg-black/35 px-1.5 py-0.5">
            {log}
          </span>
        </div>

        {/* --------------------------- CARTAS --------------------------- */}
        <BattleDock
          fighters={battle.allies.map((f) => ({
            uid: f.uid,
            heroId: f.heroId,
            name: f.name,
            level: f.level,
            hp: units[f.uid]?.hp ?? 0,
            maxHp: f.maxHp,
            energy: units[f.uid]?.energy ?? 0,
            dead: units[f.uid]?.dead ?? false,
          }))}
          activeUid={activeUid}
          accentOf={(heroId) =>
            ELEMENT_COLOR[heroById(heroId).element] || "#f59e0b"
          }
        />

        {/* --------------------------- RESULTADO --------------------------- */}
        {finished && (
          <div className="absolute inset-0 z-[95] flex items-center justify-center bg-black/80 p-5">
            <div className="stone rune-border card-reveal w-full max-w-xs rounded-2xl p-5 text-center">
              {battle.victory ? (
                <Trophy size={46} className="floaty mx-auto text-amber-400" />
              ) : (
                <Skull size={46} className="mx-auto text-red-400" />
              )}
              <h3
                className="mt-2 font-display text-2xl font-black"
                style={{ color: battle.victory ? "#fbbf24" : "#f87171" }}
              >
                {battle.victory ? "¡VICTORIA!" : "DERROTA"}
              </h3>
              <div className="mt-2 flex justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <Star
                    key={i}
                    size={32}
                    className={
                      i < starsEarned
                        ? "card-reveal fill-amber-400 text-amber-400"
                        : "text-stone-700"
                    }
                    style={{ animationDelay: `${0.25 + i * 0.18}s` }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs leading-snug text-stone-400">
                {battle.victory
                  ? starsEarned === 3
                    ? "¡Escuadrón intacto! Los skalds grabarán esta gesta en piedra rúnica."
                    : starsEarned === 2
                      ? "Victoria con bajas. Sube niveles y runas para el pleno de 3★."
                      : "Victoria agónica. Refuerza tu escuadrón."
                  : "Los cuervos sobrevuelan el campo. Reagrupa, mejora artefactos y vuelve."}{" "}
                · {battle.rounds} rondas
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="flex items-center gap-1 rounded-lg bg-black/50 px-2.5 py-1.5 text-sm font-bold text-amber-300">
                  <Coins size={15} />+{battle.rewards.gold}
                </span>
                <span className="flex items-center gap-1 rounded-lg bg-black/50 px-2.5 py-1.5 text-sm font-bold text-teal-300">
                  <Zap size={15} />+{battle.rewards.exp} EXP
                </span>
                {battle.rewards.gems > 0 && (
                  <span className="flex items-center gap-1 rounded-lg bg-black/50 px-2.5 py-1.5 text-sm font-bold text-cyan-300">
                    <Gem size={15} />+{battle.rewards.gems}
                  </span>
                )}
                {battle.mode === "arena" && (
                  <span className="flex items-center gap-1 rounded-lg bg-black/50 px-2.5 py-1.5 text-sm font-bold text-orange-300">
                    <Trophy size={15} />
                    {(battle.arenaDelta ?? 0) >= 0 ? "+" : ""}
                    {battle.arenaDelta}
                  </span>
                )}
                {battle.mode === "raid" && (
                  <span className="flex items-center gap-1 rounded-lg bg-black/50 px-2.5 py-1.5 text-sm font-bold text-emerald-300">
                    🐍 Daño infligido
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-black text-black hover:bg-amber-400"
              >
                <X size={17} /> Recoger botín
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
