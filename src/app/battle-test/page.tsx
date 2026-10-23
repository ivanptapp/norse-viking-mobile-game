"use client";

import { useMemo, useState } from "react";
import { Play, RefreshCw, Sparkles } from "lucide-react";
import { BattleOverlay, type BattleData } from "@/components/battle";
import { FxLayer, type Fx } from "@/components/battle/battle-fx";
import { signatureFor } from "@/components/battle/attack-signatures";
import { heroById } from "@/lib/heroes";

/**
 * Laboratorio de la arena.
 *
 * Una batalla simulada con todos los estilos de ataque del juego (tajo,
 * estocada, martillazo, descarga, flechas, garras, rayo y drenaje) para poder
 * ajustar terreno, efectos y cartas sin depender de la energía de una cuenta.
 */

const BACKGROUNDS = [
  { id: "coast", label: "Costa", url: "/images/bf-coast.jpg", tone: "Nieve" },
  { id: "forest", label: "Bosque", url: "/images/bf-forest.jpg", tone: "Niebla" },
  { id: "ragnarok", label: "Ragnarök", url: "/images/bf-ragnarok.jpg", tone: "Brasas" },
  { id: "helheim", label: "Helheim", url: "/images/bf-helheim.jpg", tone: "Nieve" },
  { id: "arena", label: "Arena", url: "/images/bf-arena.jpg", tone: "Brasas" },
  { id: "village", label: "Aldea", url: "/images/bf-village.jpg", tone: "Brasas" },
];

const ALLY_IDS = ["ragnar", "lagertha", "freya", "leif", "ubbe"];
const ENEMY_IDS = ["thor", "hvitserk", "brynhildr", "ivar", "harald"];

interface Blueprint {
  actor: number;
  targets: number[];
  skill: string;
  kind: string;
  ult?: boolean;
  heal?: { target: number; amount: number }[];
  amount?: number;
}

/** Guion de la batalla: cada línea enseña un estilo de ataque distinto. */
const SCRIPT: Blueprint[] = [
  { actor: 0, targets: [0], skill: "Tajo del Cuervo", kind: "single", amount: 420 },
  { actor: 0 + 10, targets: [0], skill: "Martillo de Thor", kind: "aoe", amount: 380 },
  { actor: 3, targets: [1], skill: "Lluvia de Flechas", kind: "aoe", amount: 310 },
  { actor: 11, targets: [1], skill: "Puñal de la Noche", kind: "single", amount: 460 },
  {
    actor: 1,
    targets: [1],
    skill: "Lanza de la Valquiria",
    kind: "single",
    amount: 610,
  },
  { actor: 4, targets: [2], skill: "Filo de Kattegat", kind: "single", amount: 350 },
  { actor: 12, targets: [2], skill: "Tiro Certero", kind: "single", amount: 330 },
  {
    actor: 2,
    targets: [],
    skill: "Bendición de Freyja",
    kind: "heal",
    heal: [
      { target: 0, amount: 520 },
      { target: 1, amount: 380 },
    ],
  },
  { actor: 13, targets: [4], skill: "Estocada Lunar", kind: "single", amount: 400 },
  {
    actor: 0,
    targets: [0, 1, 2],
    skill: "Furia del Norte",
    kind: "aoe",
    ult: true,
    amount: 980,
  },
  {
    actor: 14,
    targets: [0, 1, 2, 3, 4],
    skill: "Rompehielos",
    kind: "aoe",
    ult: true,
    amount: 760,
  },
  {
    actor: 1,
    targets: [2, 3],
    skill: "Canto de las Shieldmaidens",
    kind: "aoe",
    ult: true,
    amount: 900,
  },
  { actor: 3, targets: [3, 4], skill: "Viento del Norte", kind: "aoe", amount: 520 },
  { actor: 4, targets: [4], skill: "Filo de Kattegat", kind: "single", amount: 470 },
  { actor: 2, targets: [4], skill: "Rayo de Freyja", kind: "single", amount: 540 },
];

function makeFighters(ids: string[], side: "ally" | "enemy") {
  return ids.map((heroId, i) => {
    const def = heroById(heroId);
    const level = 12 + (i % 3);
    const maxHp = 2400 + def.hp * 2;
    return {
      uid: `${side === "ally" ? "a" : "e"}${i}`,
      heroId,
      name: def.name,
      side,
      position: def.position,
      level,
      stars: 4,
      maxHp,
      hp: maxHp,
      energy: side === "ally" ? 42 + i * 9 : 34 + i * 8,
    };
  });
}

function makeBattle(background: string, seed = 0): BattleData {
  const allies = makeFighters(ALLY_IDS, "ally");
  const enemies = makeFighters(ENEMY_IDS, "enemy");
  const roster = [...allies, ...enemies];
  const hp = new Map(roster.map((f) => [f.uid, f.maxHp]));
  const dead = new Set<string>();

  const steps = SCRIPT.map((bp, index) => {
    const actor =
      bp.actor >= 10 ? enemies[bp.actor - 10] : allies[bp.actor];
    const targets = bp.targets
      .map((t) => (bp.actor >= 10 ? allies[t] : enemies[t]))
      .filter((t) => t && !dead.has(t.uid));

    const damages = targets.map((t) => {
      const crit = (index + t.level) % 5 === 0 && !bp.ult;
      const base = bp.amount ?? 340;
      const amount = Math.round(
        base * (crit ? 1.7 : 1) * (0.9 + ((index * 37 + seed * 13) % 21) / 100),
      );
      const before = hp.get(t.uid) ?? t.maxHp;
      const after = Math.max(0, before - amount);
      hp.set(t.uid, after);
      if (after === 0) dead.add(t.uid);
      return {
        uid: t.uid,
        amount,
        crit,
        hpAfter: after,
        died: after === 0,
      };
    });

    const heals = (bp.heal ?? []).map((h) => {
      const target = allies[h.target];
      const before = hp.get(target.uid) ?? target.maxHp;
      const after = Math.min(target.maxHp, before + h.amount);
      hp.set(target.uid, after);
      return { uid: target.uid, amount: h.amount, hpAfter: after };
    });

    const log = bp.ult
      ? `${actor.name} desata «${bp.skill}» y el campo entero se estremece.`
      : bp.kind === "heal"
        ? `${actor.name} invoca «${bp.skill}» y cierra heridas.`
        : `${actor.name} usa «${bp.skill}».`;

    return { actor: actor.uid, targets: damages.map((d) => d.uid), skill: bp.skill, kind: bp.kind, ult: bp.ult, damages, heals, log };
  });

  return {
    victory: true,
    steps,
    allies,
    enemies,
    rounds: 4,
    rewards: { gold: 620, exp: 180, gems: 8 },
    enemyName: "Jarl Sigurd Mano de Hierro",
    mode: "campaign",
    background,
  };
}

/** Catálogo de efectos: cada golpe congelado a media animación. */
const GALLERY: Fx[] = [
  { id: 1, kind: "burst", x: 86, y: 88, color: "#f87171", big: true },
  { id: 2, kind: "ring", x: 86, y: 88, color: "#f87171" },
  { id: 3, kind: "slash", x: 210, y: 84, color: "#e5e7eb", rot: -22, w: 96, h: 54 },
  { id: 4, kind: "claw", x: 330, y: 84, color: "#c084fc", rot: -12 },
  { id: 5, kind: "arcane", x: 86, y: 190, color: "#c4b5fd", w: 120 },
  { id: 6, kind: "shock", x: 210, y: 196, color: "#fde047", w: 190 },
  { id: 7, kind: "beam", x: 292, y: 184, dx: 100, color: "#93c5fd", big: true },
  { id: 8, kind: "dust", x: 86, y: 286, color: "#d6a35c" },
  { id: 9, kind: "spark", x: 210, y: 286, color: "#fbbf24" },
  { id: 10, kind: "heal", x: 330, y: 282 },
  { id: 11, kind: "sigil", x: 210, y: 350, color: "#f59e0b", w: 190, text: "ᚱ" },
  { id: 12, kind: "proj", x: 30, y: 350, dx: 80, dy: -10, rot: -7, dur: 300, proj: "arrow", color: "#fde68a" },
  { id: 13, kind: "bolt", x: 360, y: 0, h: 120, color: "#fde047" },
  { id: 14, kind: "float", x: 320, y: 330, text: "-572", color: "#fde047", big: true },
];

const STYLE_NAMES: Record<string, string> = {
  cleave: "Tajo",
  thrust: "Estocada",
  slam: "Martillazo",
  volley: "Flechas",
  arcane: "Rúnico",
  beam: "Rayo",
  drain: "Drenaje",
  fang: "Garras",
};

function FxGallery() {
  return (
    <div className="fx-gallery relative mt-4 overflow-hidden rounded-xl border border-stone-800 bg-[url('/images/bf-forest.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative h-[380px]">
        <FxLayer fx={GALLERY} />
      </div>
      <div className="relative flex flex-wrap gap-1 bg-black/60 px-2 py-1.5">
        {Object.entries(STYLE_NAMES).map(([style, label]) => {
          const sig = signatureFor(
            style === "volley" ? "leif" : style === "drain" ? "hel" : style === "fang" ? "fenrir" : "ragnar",
          );
          return (
            <span
              key={style}
              className="rounded border px-1.5 py-0.5 text-[9px] font-bold"
              style={{ borderColor: `${sig.accent}66`, color: sig.accent }}
            >
              {label}
            </span>
          );
        })}
      </div>
      <style>{`
        .fx-gallery .fx-burst,
        .fx-gallery .fx-ring,
        .fx-gallery .fx-slash,
        .fx-gallery .fx-beam,
        .fx-gallery .fx-shock,
        .fx-gallery .fx-arcane,
        .fx-gallery .fx-dust,
        .fx-gallery .fx-spark,
        .fx-gallery .fx-heal,
        .fx-gallery .fx-bolt,
        .fx-gallery .fx-proj,
        .fx-gallery .fx-sigil,
        .fx-gallery .fx-float {
          animation-play-state: paused !important;
        }
        .fx-gallery .fx-burst { animation-delay: -0.16s !important; }
        .fx-gallery .fx-ring { animation-delay: -0.22s !important; }
        .fx-gallery .fx-slash { animation-delay: -0.12s !important; }
        .fx-gallery .fx-beam { animation-delay: -0.2s !important; }
        .fx-gallery .fx-shock { animation-delay: -0.28s !important; }
        .fx-gallery .fx-arcane { animation-delay: -0.3s !important; }
        .fx-gallery .fx-dust { animation-delay: -0.34s !important; }
        .fx-gallery .fx-spark { animation-delay: -0.18s !important; }
        .fx-gallery .fx-heal { animation-delay: -0.35s !important; }
        .fx-gallery .fx-bolt { animation-delay: -0.2s !important; }
        .fx-gallery .fx-proj { animation-delay: -0.15s !important; }
        .fx-gallery .fx-sigil { animation-delay: -0.45s !important; }
        .fx-gallery .fx-float { animation-delay: -0.4s !important; }
      `}</style>
    </div>
  );
}

export default function BattleTestPage() {
  const [bg, setBg] = useState(BACKGROUNDS[0].url);
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [gallery, setGallery] = useState(false);
  const battle = useMemo(() => makeBattle(bg, run), [bg, run]);

  if (playing) {
    return (
      <BattleOverlay
        key={run}
        battle={battle}
        onClose={() => setPlaying(false)}
      />
    );
  }

  return (
    <main className="min-h-dvh bg-[#070a09] px-4 py-6 text-stone-200">
      <h1 className="font-display text-2xl font-black text-amber-300">
        Arena · laboratorio
      </h1>
      <p className="mt-1 max-w-md text-xs text-stone-400">
        Batalla simulada para ajustar el terreno, los efectos de ataque y las
        cartas del escuadrón sin gastar energía.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {BACKGROUNDS.map((b) => (
          <button
            key={b.id}
            onClick={() => setBg(b.url)}
            className={`overflow-hidden rounded-xl border-2 text-left transition ${
              bg === b.url
                ? "border-amber-400"
                : "border-stone-800 hover:border-stone-600"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.url}
              alt={b.label}
              className="h-16 w-full object-cover"
            />
            <div className="bg-black/60 px-2 py-1">
              <div className="text-[11px] font-bold">{b.label}</div>
              <div className="text-[9px] text-stone-400">{b.tone}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={() => {
            setRun((r) => r + 1);
            setPlaying(true);
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-black text-black"
        >
          <Play size={16} /> ¡A la batalla!
        </button>
        <button
          onClick={() => setRun((r) => r + 1)}
          className="flex items-center justify-center gap-2 rounded-xl border border-stone-700 bg-black/40 px-4 text-xs font-bold text-stone-300"
        >
          <RefreshCw size={14} /> Reiniciar
        </button>
      </div>

      <button
        onClick={() => setGallery((v) => !v)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-700 bg-black/40 py-2 text-xs font-bold text-stone-300"
      >
        <Sparkles size={14} /> {gallery ? "Ocultar" : "Ver"} catálogo de efectos
      </button>

      {gallery && <FxGallery />}

      <div className="mt-6 rounded-xl border border-stone-800 bg-black/30 p-3 text-[11px] leading-relaxed text-stone-400">
        <p className="font-bold text-stone-200">Héroes en liza</p>
        <p className="mt-1">
          {ALLY_IDS.map((id) => heroById(id).name).join(" · ")} contra{" "}
          {ENEMY_IDS.map((id) => heroById(id).name).join(" · ")}.
        </p>
        <p className="mt-2">
          Ragnar taja, Lagertha estoquea, Thor martillea, Freya canaliza,
          Leif dispara, Hvitserk y Sigurd arañan, Odín atraviesa con un rayo y
          Hel drena vida.
        </p>
      </div>
    </main>
  );
}
