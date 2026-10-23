"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { FenrirAnimator } from "./FenrirAnimator";
import { FenrirCharacter } from "./FenrirCharacter";
import { FENRIR_CLIPS } from "./animations";
import type { FenrirState } from "./types";

const ACTIONS: {
  state: FenrirState;
  label: string;
  hint: string;
  rune: string;
  oneShot: boolean;
}[] = [
  { state: "idle", label: "Reposo", hint: "Respira, parpadea y mueve las orejas", rune: "ᛁ", oneShot: false },
  { state: "walk", label: "Caminar", hint: "Trote diagonal con apoyo de patas", rune: "ᚹ", oneShot: false },
  { state: "run", label: "Correr", hint: "Galope con flexión de columna", rune: "ᚱ", oneShot: false },
  { state: "attack", label: "Atacar", hint: "Anticipación, embestida y mordida", rune: "ᛏ", oneShot: true },
  { state: "howl", label: "Aullar", hint: "Aullido del Fin: cuello y mandíbula", rune: "ᚨ", oneShot: true },
  { state: "hit", label: "Daño", hint: "Reacción corta de retroceso", rune: "ᛖ", oneShot: true },
  { state: "death", label: "Muerte", hint: "Se desploma y no se repite", rune: "ᚾ", oneShot: true },
  { state: "jump", label: "Salto", hint: "Despegue, vuelo y aterrizaje", rune: "ᛃ", oneShot: true },
];

function StageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 52% 16%, #1c3a48 0%, #102028 34%, #080e13 66%, #04070a 100%)",
        }}
      />
      {/* Aurora ribbons */}
      <div
        className="absolute -left-[20%] top-[-18%] h-[70%] w-[90%] opacity-40 blur-3xl"
        style={{
          background:
            "linear-gradient(115deg, transparent 20%, rgba(84,214,214,.42) 42%, rgba(72,132,220,.22) 58%, transparent 78%)",
          transform: "rotate(-8deg)",
        }}
      />
      <div
        className="absolute -right-[18%] top-[-24%] h-[60%] w-[70%] opacity-30 blur-3xl"
        style={{
          background:
            "linear-gradient(240deg, transparent 25%, rgba(138,108,232,.34) 55%, transparent 78%)",
        }}
      />
      {/* Cold moon */}
      <div className="absolute left-[14%] top-[9%] h-16 w-16 rounded-full bg-slate-100/10 shadow-[0_0_50px_18px_rgba(180,226,255,.12)] sm:h-24 sm:w-24">
        <div className="absolute inset-2 rounded-full bg-slate-200/10" />
      </div>

      {/* Jagged Norse peaks */}
      <svg
        viewBox="0 0 900 320"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-[8%] h-[42%] w-full opacity-90"
        aria-hidden="true"
      >
        <path
          d="M0 320 L0 210 L90 150 L150 196 L230 96 L310 186 L390 140 L470 210 L560 110 L650 190 L730 142 L820 205 L900 160 L900 320 Z"
          fill="#0a141a"
        />
        <path
          d="M0 320 L0 254 L80 224 L170 256 L260 200 L350 250 L450 208 L540 258 L640 214 L740 258 L830 226 L900 250 L900 320 Z"
          fill="#060d11"
        />
        <path
          d="M230 96 L252 120 L230 132 L212 116 Z M560 110 L582 132 L560 146 L540 128 Z"
          fill="#8fb8c8"
          opacity="0.18"
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
          stroke="#7fe3ff"
          strokeWidth="1.1"
          opacity="0.17"
          style={{ filter: "drop-shadow(0 0 6px rgba(90,210,255,.35))" }}
        >
          <circle cx="400" cy="470" r="176" />
          <circle cx="400" cy="470" r="164" strokeDasharray="4 14" />
          <circle cx="400" cy="470" r="126" strokeDasharray="2 10" opacity="0.8" />
          <path d="M400 286 L560 470 L240 470 Z" />
          <path d="M400 306 L548 462 M400 306 L252 462" opacity="0.55" />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const x = 400 + Math.cos(angle) * 170;
            const y = 470 + Math.sin(angle) * 170 * 0.98;
            return (
              <path
                key={i}
                d={`M ${x} ${y - 9} L ${x} ${y + 9} M ${x} ${y - 3} L ${x + 8} ${y + 2} L ${x} ${y + 7}`}
                opacity="0.9"
              />
            );
          })}
        </g>
        <ellipse cx="400" cy="476" rx="230" ry="40" fill="#7fe3ff" opacity="0.045" />
      </svg>

      {/* Ground fog */}
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-[#030507] via-[#050a0d]/85 to-transparent" />
      <div
        className="absolute inset-x-0 bottom-[10%] h-[16%] opacity-25 blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, rgba(150,220,240,.5), transparent 70%)",
        }}
      />
    </div>
  );
}

export function FenrirLab() {
  const animatorRef = useRef<FenrirAnimator | null>(null);
  const [active, setActive] = useState<FenrirState>("idle");
  const [selected, setSelected] = useState<FenrirState>("idle");
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [scale, setScale] = useState(1);
  const [background, setBackground] = useState(true);

  const handleReady = useCallback((animator: FenrirAnimator | null) => {
    animatorRef.current = animator;
  }, []);

  const handleStateChange = useCallback((state: FenrirState) => {
    setActive(state);
  }, []);

  const trigger = (next: FenrirState) => {
    const animator = animatorRef.current;
    // Death is terminal in the controller too: only Reiniciar revives him.
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
  const clip = FENRIR_CLIPS[active];

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-[#04070a] text-stone-100">
      {background ? (
        <StageBackground />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[#0a0e12]">
          <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(255,255,255,.14)_1px,transparent_1px)] [background-size:26px_26px]" />
        </div>
      )}

      <header className="relative z-20 flex items-start justify-between gap-4 px-5 pt-5 sm:px-8 sm:pt-7">
        <div>
          <div className="font-rune text-[11px] font-bold tracking-[.5em] text-cyan-300/80">
            ᚠ ᛖ ᚾ ᚱ ᛁ ᚱ
          </div>
          <h1
            className="font-display text-3xl font-black leading-none tracking-wide text-stone-50 sm:text-5xl"
            style={{ textShadow: "0 3px 22px rgba(0,0,0,.85)" }}
          >
            FENRIR
          </h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[.28em] text-stone-400 sm:text-xs">
            Laboratorio de animación · El lobo del Ragnarök
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-full border border-amber-700/40 bg-black/40 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-200/90 backdrop-blur transition hover:border-amber-500/70 hover:text-amber-100 sm:text-xs"
        >
          ← Valhalla
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col">
        {/* Stage */}
        <section className="relative flex min-h-[300px] flex-1 items-end justify-center px-2 pb-0 sm:min-h-[380px]">
          <div className="relative h-[42vh] min-h-[300px] w-full max-w-[900px] sm:h-[48vh]">
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2"
              style={{
                width: `${scale * 100}%`,
                aspectRatio: "780 / 520",
                transition: "width .25s ease-out",
              }}
            >
              <FenrirCharacter
                state={selected}
                speed={speed}
                paused={paused}
                onReady={handleReady}
                onStateChange={handleStateChange}
              />
            </div>
          </div>

          {/* Current state readout */}
          <div className="absolute left-3 top-2 flex flex-col gap-1 sm:left-6 sm:top-4">
            <div className="flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-black/45 px-2.5 py-1.5 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200">
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
              29 joints · SVG vectorial
            </span>
            <span className="text-[10px] text-stone-500">
              {clip.duration.toFixed(2)}s · ×{speed.toFixed(2)}
            </span>
          </div>
        </section>

        {/* Controls */}
        <section className="relative z-20 border-t border-white/5 bg-gradient-to-b from-[#0a1116]/95 to-[#050809]/98 px-3 pb-5 pt-3 backdrop-blur-md sm:px-6 sm:pb-6">
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
                        ? "border-cyan-400/60 bg-cyan-400/10 shadow-[0_0_18px_-6px_rgba(90,220,255,.55)]"
                        : "border-stone-700/60 bg-black/35 hover:border-stone-500/70 hover:bg-black/55"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-rune text-sm font-bold ${
                        isActive
                          ? "border-cyan-300/70 bg-cyan-300/15 text-cyan-100"
                          : "border-stone-600/60 bg-white/[.03] text-stone-400 group-hover:text-stone-200"
                      }`}
                    >
                      {action.rune}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block truncate text-[11px] font-extrabold uppercase tracking-wider ${
                          isActive ? "text-cyan-100" : "text-stone-200"
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
                  className="h-1 w-full accent-cyan-400"
                  aria-label="Velocidad de animación"
                />
                <span className="w-9 shrink-0 text-right font-mono text-[10px] font-bold text-cyan-200">
                  {speed.toFixed(2)}×
                </span>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-stone-800 bg-black/30 px-3 py-2">
                <span className="w-16 shrink-0 text-[8px] font-black uppercase tracking-wider text-stone-400 sm:text-[9px] sm:tracking-widest">
                  Escala
                </span>
                <input
                  type="range"
                  min={0.55}
                  max={1.4}
                  step={0.05}
                  value={scale}
                  onChange={(event) => setScale(Number(event.target.value))}
                  className="h-1 w-full accent-amber-400"
                  aria-label="Escala del personaje"
                />
                <span className="w-9 shrink-0 text-right font-mono text-[10px] font-bold text-amber-200">
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
                  Reiniciar
                </button>
                <button
                  onClick={() => setBackground((value) => !value)}
                  className={`flex-1 rounded-xl border px-2 py-2 text-[9px] font-black uppercase tracking-wider transition sm:flex-none sm:text-[10px] sm:tracking-widest ${
                    background
                      ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-200"
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
                hasta reiniciar
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default FenrirLab;
