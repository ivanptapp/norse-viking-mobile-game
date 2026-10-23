"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { LAGERTHA_CLIPS } from "./animations";
import { LagerthaAnimator } from "./LagerthaAnimator";
import { LagerthaCharacter } from "./LagerthaCharacter";
import type { LagerthaState } from "./types";

const ACTIONS: {
  state: LagerthaState;
  label: string;
  hint: string;
  rune: string;
  oneShot: boolean;
}[] = [
  {
    state: "idle",
    label: "Reposo",
    hint: "Respira, mira y mueve el cabello",
    rune: "ᛚ",
    oneShot: false,
  },
  {
    state: "walk",
    label: "Caminar",
    hint: "Paso de combate con cadera y rodillas",
    rune: "ᚹ",
    oneShot: false,
  },
  {
    state: "run",
    label: "Correr",
    hint: "Zancada, inclinación y capa al viento",
    rune: "ᚱ",
    oneShot: false,
  },
  {
    state: "attack",
    label: "Atacar",
    hint: "Anticipación, tajo de espada y escudo",
    rune: "ᛏ",
    oneShot: true,
  },
  {
    state: "hit",
    label: "Daño",
    hint: "Reacción breve y recuperación",
    rune: "ᛖ",
    oneShot: true,
  },
  {
    state: "death",
    label: "Muerte",
    hint: "Cae de rodillas y queda inmóvil",
    rune: "ᚾ",
    oneShot: true,
  },
  {
    state: "victory",
    label: "Victoria",
    hint: "Alza el escudo y recupera la guardia",
    rune: "ᛊ",
    oneShot: true,
  },
];

const SNOW = Array.from({ length: 14 }, (_, index) => ({
  left: (index * 37 + 11) % 100,
  delay: (index * 1.7) % 12,
  duration: 9 + (index % 5) * 2,
  size: index % 3 === 0 ? 3 : 2,
}));

function StageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 58% 12%, #234448 0%, #12262a 32%, #081316 62%, #040708 100%)",
        }}
      />

      {/* Aurora ribbons */}
      <div
        className="absolute -left-[22%] top-[-20%] h-[66%] w-[92%] opacity-35 blur-3xl"
        style={{
          background:
            "linear-gradient(116deg, transparent 22%, rgba(94,220,190,.38) 44%, rgba(220,168,84,.22) 60%, transparent 80%)",
          transform: "rotate(-7deg)",
        }}
      />
      <div
        className="absolute -right-[20%] top-[-26%] h-[58%] w-[72%] opacity-25 blur-3xl"
        style={{
          background:
            "linear-gradient(244deg, transparent 24%, rgba(112,156,220,.32) 52%, transparent 78%)",
        }}
      />

      {/* Cold moon */}
      <div className="absolute left-[12%] top-[8%] h-14 w-14 rounded-full bg-stone-100/10 shadow-[0_0_48px_16px_rgba(190,232,232,.1)] sm:h-20 sm:w-20">
        <div className="absolute inset-2 rounded-full bg-stone-200/10" />
      </div>

      {/* Norse peaks */}
      <svg
        viewBox="0 0 900 320"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-[7%] h-[40%] w-full opacity-90"
        aria-hidden="true"
      >
        <path
          d="M0 320 L0 208 L92 146 L156 196 L232 92 L312 184 L392 138 L472 208 L562 108 L652 190 L734 140 L822 204 L900 158 L900 320 Z"
          fill="#0a181b"
        />
        <path
          d="M0 320 L0 252 L82 224 L172 258 L262 198 L352 250 L452 206 L542 258 L642 212 L742 258 L832 226 L900 250 L900 320 Z"
          fill="#061114"
        />
        <path
          d="M232 92 L254 118 L232 130 L214 114 Z M562 108 L584 130 L562 144 L542 126 Z"
          fill="#a9d8d4"
          opacity="0.15"
        />
      </svg>

      {/* Rune circle */}
      <svg
        viewBox="0 0 800 520"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <g
          fill="none"
          stroke="#e7c47e"
          strokeWidth="1.1"
          opacity="0.14"
          style={{ filter: "drop-shadow(0 0 7px rgba(231,196,126,.3))" }}
        >
          <circle cx="400" cy="474" r="176" />
          <circle cx="400" cy="474" r="164" strokeDasharray="4 14" />
          <circle cx="400" cy="474" r="126" strokeDasharray="2 10" opacity="0.8" />
          <path d="M400 290 L560 474 L240 474 Z" />
          <path d="M400 310 L548 466 M400 310 L252 466" opacity="0.5" />
          {Array.from({ length: 14 }).map((_, index) => {
            const angle = (index / 14) * Math.PI * 2;
            const x = 400 + Math.cos(angle) * 171;
            const y = 474 + Math.sin(angle) * 171;
            return (
              <path
                key={index}
                d={`M ${x} ${y - 8} L ${x} ${y + 8} M ${x} ${y - 3} L ${
                  x + 7
                } ${y + 2} L ${x} ${y + 7}`}
                opacity="0.9"
              />
            );
          })}
        </g>
        <ellipse cx="400" cy="480" rx="232" ry="38" fill="#e7c47e" opacity="0.04" />
      </svg>

      {/* Slow snow */}
      <div className="absolute inset-0">
        {SNOW.map((flake, index) => (
          <span
            key={index}
            className="particle"
            style={{
              left: `${flake.left}%`,
              top: "-4%",
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
              opacity: 0.35,
            }}
          />
        ))}
      </div>

      {/* Ground fog */}
      <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-[#030606] via-[#050c0d]/90 to-transparent" />
      <div
        className="absolute inset-x-0 bottom-[9%] h-[16%] opacity-25 blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, rgba(195,226,214,.42), transparent 70%)",
        }}
      />
    </div>
  );
}

export function LagerthaLab() {
  const animatorRef = useRef<LagerthaAnimator | null>(null);
  const [active, setActive] = useState<LagerthaState>("idle");
  const [selected, setSelected] = useState<LagerthaState>("idle");
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [scale, setScale] = useState(1);
  const [background, setBackground] = useState(true);

  const handleReady = useCallback((animator: LagerthaAnimator | null) => {
    animatorRef.current = animator;
  }, []);

  const handleStateChange = useCallback((state: LagerthaState) => {
    setActive(state);
  }, []);

  const trigger = (next: LagerthaState) => {
    const animator = animatorRef.current;
    if (animator?.getState() === "death" && next !== "death") return;
    setSelected(next);
    setPaused(false);
    animator?.play(next, { restart: true });
  };

  const reset = () => {
    setSelected("idle");
    setPaused(false);
    setSpeed(1);
    animatorRef.current?.reset("idle");
    setActive("idle");
  };

  const current = ACTIONS.find((action) => action.state === active) ?? ACTIONS[0];
  const clip = LAGERTHA_CLIPS[active];

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-[#040708] text-stone-100">
      {background ? (
        <StageBackground />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[#081013]">
          <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(255,255,255,.14)_1px,transparent_1px)] [background-size:26px_26px]" />
        </div>
      )}

      <header className="relative z-20 flex items-start justify-between gap-3 px-4 pt-4 sm:px-8 sm:pt-7">
        <div className="min-w-0">
          <div className="font-rune text-[11px] font-bold tracking-[.5em] text-amber-200/80">
            ᛚ ᚨ ᚷ ᛖ ᚱ ᚦ ᚨ
          </div>
          <h1
            className="font-display text-2xl font-black leading-none tracking-wide text-stone-50 sm:text-5xl"
            style={{ textShadow: "0 3px 22px rgba(0,0,0,.85)" }}
          >
            LAGERTHA
          </h1>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[.22em] text-stone-400 sm:text-xs sm:tracking-[.28em]">
            Laboratorio de animación · La doncella escudera
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Link
            href="/"
            className="rounded-full border border-amber-700/40 bg-black/40 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-widest text-amber-200/90 backdrop-blur transition hover:border-amber-500/70 hover:text-amber-100 sm:text-xs"
          >
            ← Valhalla
          </Link>
          <Link
            href="/fenrir-test"
            className="rounded-full border border-cyan-700/40 bg-black/40 px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-cyan-200/80 backdrop-blur transition hover:border-cyan-500/70 hover:text-cyan-100 sm:text-[10px]"
          >
            Fenrir →
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col">
        {/* Stage */}
        <section className="relative flex min-h-[330px] flex-1 items-end justify-center px-2 pb-0 sm:min-h-[380px]">
          <div className="relative h-[44vh] min-h-[330px] max-h-[600px] w-full max-w-[820px]">
            <div
              className="absolute inset-0 origin-bottom transition-transform duration-200"
              style={{ transform: `scale(${scale})` }}
            >
              <LagerthaCharacter
                state={selected}
                speed={speed}
                paused={paused}
                onReady={handleReady}
                onStateChange={handleStateChange}
              />
            </div>
          </div>

          {/* State readout */}
          <div className="absolute left-3 top-2 flex max-w-[62%] flex-col gap-1 sm:left-6 sm:top-4">
            <div className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-black/45 px-2.5 py-1.5 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-[.2em] text-amber-200">
                {current.label}
              </span>
              <span className="text-[9px] font-bold text-stone-500">
                {clip.loop ? "LOOP" : "ONE-SHOT"}
              </span>
            </div>
            <span className="pl-1 text-[10px] text-stone-400">{current.hint}</span>
            {paused && (
              <span className="w-fit rounded border border-amber-500/40 bg-amber-950/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-300">
                Pausado
              </span>
            )}
          </div>

          <div className="absolute right-3 top-2 hidden flex-col items-end gap-1 text-right sm:flex sm:right-6 sm:top-4">
            <span className="text-[9px] font-bold uppercase tracking-[.25em] text-stone-500">
              Rig
            </span>
            <span className="font-display text-xs font-bold text-stone-300">
              11 joints · 9 piezas del kit
            </span>
            <span className="text-[10px] text-stone-500">
              {clip.duration.toFixed(2)}s · ×{speed.toFixed(2)}
            </span>
          </div>
        </section>

        {/* Controls */}
        <section className="relative z-20 border-t border-white/5 bg-gradient-to-b from-[#0a1213]/95 to-[#050809]/98 px-3 pb-5 pt-3 backdrop-blur-md sm:px-6 sm:pb-6">
          <div className="mx-auto w-full max-w-4xl">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {ACTIONS.map((action) => {
                const isActive = active === action.state;
                const isSelected = selected === action.state;
                return (
                  <button
                    key={action.state}
                    onClick={() => trigger(action.state)}
                    className={`group relative flex items-center gap-2 overflow-hidden rounded-xl border px-2.5 py-2 text-left transition ${
                      isSelected
                        ? "border-amber-400/60 bg-amber-400/10 shadow-[0_0_18px_-6px_rgba(245,190,90,.55)]"
                        : "border-stone-700/60 bg-black/35 hover:border-stone-500/70 hover:bg-black/55"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-rune text-sm font-bold ${
                        isActive
                          ? "border-amber-300/70 bg-amber-300/15 text-amber-100"
                          : "border-stone-600/60 bg-white/[.03] text-stone-400 group-hover:text-stone-200"
                      }`}
                    >
                      {action.rune}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block truncate text-[11px] font-extrabold uppercase tracking-wider ${
                          isActive ? "text-amber-100" : "text-stone-200"
                        }`}
                      >
                        {action.label}
                      </span>
                      <span className="block truncate text-[9px] text-stone-500">
                        {action.oneShot ? "one-shot" : "bucle"} · {action.state}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <label className="flex items-center gap-2 rounded-xl border border-stone-800 bg-black/30 px-3 py-2">
                <span className="w-16 shrink-0 text-[8px] font-black uppercase tracking-wider text-stone-400 sm:text-[9px] sm:tracking-widest">
                  Velocidad
                </span>
                <input
                  type="range"
                  min={0.2}
                  max={2}
                  step={0.05}
                  value={speed}
                  onChange={(event) => setSpeed(Number(event.target.value))}
                  className="h-1 w-full accent-amber-400"
                  aria-label="Velocidad de animación"
                />
                <span className="w-9 shrink-0 text-right font-mono text-[10px] font-bold text-amber-200">
                  {speed.toFixed(2)}×
                </span>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-stone-800 bg-black/30 px-3 py-2">
                <span className="w-16 shrink-0 text-[8px] font-black uppercase tracking-wider text-stone-400 sm:text-[9px] sm:tracking-widest">
                  Escala
                </span>
                <input
                  type="range"
                  min={0.65}
                  max={1.25}
                  step={0.05}
                  value={scale}
                  onChange={(event) => setScale(Number(event.target.value))}
                  className="h-1 w-full accent-teal-400"
                  aria-label="Escala del personaje"
                />
                <span className="w-9 shrink-0 text-right font-mono text-[10px] font-bold text-teal-200">
                  {Math.round(scale * 100)}%
                </span>
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => setPaused((value) => !value)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition sm:flex-none ${
                    paused
                      ? "border-amber-400/60 bg-amber-400/15 text-amber-200"
                      : "border-stone-700 bg-black/35 text-stone-300 hover:border-stone-500"
                  }`}
                >
                  {paused ? "▶ Seguir" : "❚❚ Pausar"}
                </button>
                <button
                  onClick={reset}
                  className="flex-1 rounded-xl border border-stone-700 bg-black/35 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-stone-300 transition hover:border-stone-500 sm:flex-none"
                >
                  Pose inicial
                </button>
                <button
                  onClick={() => setBackground((value) => !value)}
                  className={`flex-1 rounded-xl border px-2 py-2 text-[9px] font-black uppercase tracking-wider transition sm:flex-none sm:text-[10px] sm:tracking-widest ${
                    background
                      ? "border-amber-500/40 bg-amber-950/40 text-amber-200"
                      : "border-stone-700 bg-black/35 text-stone-400"
                  }`}
                >
                  Fondo {background ? "on" : "off"}
                </button>
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] font-semibold uppercase tracking-widest text-stone-600">
              <span>Fase: {active}</span>
              <span className="text-stone-500">
                Los one-shot vuelven solos a reposo · la muerte queda bloqueada
                hasta pulsar Pose inicial
              </span>
              <a
                href="/heroes/figure_lagertha.png"
                target="_blank"
                rel="noreferrer"
                className="text-amber-700/80 underline decoration-dotted underline-offset-2 transition hover:text-amber-400"
              >
                Arte original
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LagerthaLab;
