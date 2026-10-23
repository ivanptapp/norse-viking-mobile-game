"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RagnarAnimator } from "./RagnarAnimator";
import { RagnarCharacter, type RagnarArt } from "./RagnarCharacter";
import type { RagnarFrame } from "./RagnarRig";
import { RAGNAR_CLIPS } from "./animations";
import type { RagnarState } from "./types";

const ACTIONS: {
  state: RagnarState;
  label: string;
  hint: string;
  rune: string;
  oneShot: boolean;
}[] = [
  { state: "idle", label: "Reposo", hint: "Respira, gira la cabeza y asienta el hacha", rune: "ᚱ", oneShot: false },
  { state: "walk", label: "Caminar", hint: "Zancada con relevo de peso y capa", rune: "ᚹ", oneShot: false },
  { state: "run", label: "Correr", hint: "Carrera con inclinación y cabello al viento", rune: "ᚦ", oneShot: false },
  { state: "attack", label: "Atacar", hint: "Anticipación, tajo de hacha y recuperación", rune: "ᛏ", oneShot: true },
  { state: "hit", label: "Daño", hint: "Sacudida breve y vuelta a la guardia", rune: "ᛖ", oneShot: true },
  { state: "death", label: "Muerte", hint: "Se desploma y mantiene la pose final", rune: "ᚾ", oneShot: true },
  { state: "victory", label: "Victoria", hint: "Alza el hacha y sostiene la pose", rune: "ᛋ", oneShot: true },
  { state: "jump", label: "Salto", hint: "Carga, despegue, vuelo y aterrizaje", rune: "ᛃ", oneShot: true },
];

function StageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 22%, #4a351f 0%, #2a2016 32%, #131110 64%, #070707 100%)",
        }}
      />
      {/* Long ember glow behind the warrior */}
      <div
        className="absolute left-1/2 top-[18%] h-[52%] w-[58%] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(224,142,58,.55) 0%, rgba(138,74,30,.25) 45%, transparent 72%)",
        }}
      />
      {/* Aurora / smoke ribbons */}
      <div
        className="absolute -left-[18%] top-[-20%] h-[66%] w-[84%] opacity-25 blur-3xl"
        style={{
          background:
            "linear-gradient(118deg, transparent 22%, rgba(88,160,168,.4) 44%, rgba(52,88,120,.2) 60%, transparent 80%)",
          transform: "rotate(-7deg)",
        }}
      />
      {/* Jagged Norse peaks */}
      <svg
        viewBox="0 0 900 320"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-[7%] h-[44%] w-full opacity-95"
        aria-hidden="true"
      >
        <path
          d="M0 320 L0 214 L86 152 L148 198 L232 92 L312 188 L392 142 L468 212 L562 112 L652 192 L732 144 L822 208 L900 162 L900 320 Z"
          fill="#0e1112"
        />
        <path
          d="M0 320 L0 256 L82 226 L172 258 L262 202 L352 252 L452 210 L542 260 L642 216 L742 260 L832 228 L900 252 L900 320 Z"
          fill="#070a0a"
        />
        <path
          d="M232 92 L254 118 L232 130 L214 114 Z M562 112 L584 136 L562 150 L542 130 Z"
          fill="#c9a575"
          opacity="0.16"
        />
      </svg>

      {/* Rune circle */}
      <svg viewBox="0 0 800 560" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <g
          fill="none"
          stroke="#e3a95c"
          strokeWidth="1.1"
          opacity="0.2"
          style={{ filter: "drop-shadow(0 0 6px rgba(240,170,80,.35))" }}
        >
          <circle cx="400" cy="508" r="182" />
          <circle cx="400" cy="508" r="168" strokeDasharray="4 15" />
          <circle cx="400" cy="508" r="124" strokeDasharray="2 11" opacity="0.85" />
          <path d="M400 322 L574 508 L226 508 Z" />
          <path d="M400 344 L556 500 M400 344 L244 500" opacity="0.5" />
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = (i / 14) * Math.PI * 2;
            const x = 400 + Math.cos(angle) * 175;
            const y = 508 + Math.sin(angle) * 175;
            return (
              <path
                key={i}
                d={`M ${x} ${y - 10} L ${x} ${y + 10} M ${x} ${y - 4} L ${x + 9} ${y + 2} L ${x} ${y + 8}`}
                opacity="0.85"
              />
            );
          })}
        </g>
        <ellipse cx="400" cy="512" rx="238" ry="42" fill="#f0b060" opacity="0.05" />
      </svg>

      {/* Rising embers */}
      <div className="absolute inset-0">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="ember"
            style={{
              left: `${8 + ((i * 37) % 84)}%`,
              bottom: `${4 + ((i * 17) % 30)}%`,
              animationDuration: `${4.5 + (i % 5)}s`,
              animationDelay: `${(i % 7) * 0.7}s`,
              opacity: 0.4 + (i % 3) * 0.18,
            }}
          />
        ))}
      </div>

      {/* Ground fog */}
      <div className="absolute inset-x-0 bottom-0 h-[36%] bg-gradient-to-t from-[#050505] via-[#080706]/85 to-transparent" />
      <div
        className="absolute inset-x-0 bottom-[8%] h-[15%] opacity-30 blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, rgba(240,186,120,.45), transparent 70%)",
        }}
      />
    </div>
  );
}

export function RagnarLab() {
  const animatorRef = useRef<RagnarAnimator | null>(null);
  const [active, setActive] = useState<RagnarState>("idle");
  const [selected, setSelected] = useState<RagnarState>("idle");
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [scale, setScale] = useState(1);
  const [background, setBackground] = useState(true);
  const [frame, setFrame] = useState<RagnarFrame>("full");
  const [art, setArt] = useState<RagnarArt>("kit");

  const handleReady = useCallback((animator: RagnarAnimator | null) => {
    animatorRef.current = animator;
  }, []);

  const handleStateChange = useCallback((state: RagnarState) => {
    setActive(state);
  }, []);

  const trigger = useCallback((next: RagnarState) => {
    const animator = animatorRef.current;
    // Death is terminal in the controller too: only Reiniciar revives him.
    if (animator?.getState() === "death" && next !== "death") return;
    setSelected(next);
    setPaused(false);
    animator?.play(next, { restart: true });
  }, []);

  const reset = useCallback(() => {
    setSelected("idle");
    setPaused(false);
    setSpeed(1);
    animatorRef.current?.reset("idle");
    setActive("idle");
  }, []);

  // Number keys 1-8 drive the lab without hunting for buttons.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < ACTIONS.length) {
        event.preventDefault();
        trigger(ACTIONS[index].state);
      } else if (event.key === " ") {
        event.preventDefault();
        setPaused((value) => !value);
      } else if (event.key === "r" || event.key === "R") {
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trigger, reset]);

  const current = ACTIONS.find((action) => action.state === active) ?? ACTIONS[0];
  const clip = RAGNAR_CLIPS[active];

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-[#070605] text-stone-100">
      {background ? (
        <StageBackground />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[#0d0b09]">
          <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:26px_26px]" />
        </div>
      )}

      <header className="relative z-20 flex items-start justify-between gap-4 px-5 pt-5 sm:px-8 sm:pt-7">
        <div>
          <div className="font-rune text-[11px] font-bold tracking-[.5em] text-amber-300/80">
            ᚱ ᚨ ᚷ ᚾ ᚨ ᚱ
          </div>
          <h1
            className="font-display text-3xl font-black leading-none tracking-wide text-stone-50 sm:text-5xl"
            style={{ textShadow: "0 3px 22px rgba(0,0,0,.85)" }}
          >
            RAGNAR
          </h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[.28em] text-stone-400 sm:text-xs">
            Laboratorio de animación · El rey vikingo
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link
            href="/"
            className="rounded-full border border-amber-700/40 bg-black/40 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-200/90 backdrop-blur transition hover:border-amber-500/70 hover:text-amber-100 sm:text-xs"
          >
            ← Valhalla
          </Link>
          <Link
            href="/fenrir-test"
            className="text-[9px] font-bold uppercase tracking-widest text-stone-500 transition hover:text-stone-300 sm:text-[10px]"
          >
            Ver a Fenrir →
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col">
        {/* Stage */}
        <section className="relative flex min-h-[340px] flex-1 items-end justify-center px-2 pb-0 sm:min-h-[420px]">
          <div className="relative h-[46vh] min-h-[340px] w-full max-w-[820px] sm:h-[52vh]">
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2"
              style={{
                height: `${scale * 100}%`,
                aspectRatio: art === "kit" ? "318 / 500" : "640 / 760",
                transition: "height .25s ease-out",
              }}
            >
              <RagnarCharacter
                state={selected}
                speed={speed}
                paused={paused}
                frame={frame}
                art={art}
                onReady={handleReady}
                onStateChange={handleStateChange}
              />
            </div>
          </div>

          {/* Current state readout */}
          <div className="absolute left-3 top-2 flex flex-col gap-1 sm:left-6 sm:top-4">
            <div className="flex items-center gap-2 rounded-lg border border-amber-400/25 bg-black/45 px-2.5 py-1.5 backdrop-blur">
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
              {art === "kit" ? "25 joints · kit ilustrado" : "25 joints · SVG vectorial"}
            </span>
            <span className="text-[10px] text-stone-500">
              {clip.duration.toFixed(2)}s · ×{speed.toFixed(2)}
            </span>
          </div>
        </section>

        {/* Controls */}
        <section className="relative z-20 border-t border-white/5 bg-gradient-to-b from-[#12100d]/95 to-[#080706]/98 px-3 pb-5 pt-3 backdrop-blur-md sm:px-6 sm:pb-6">
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
                      ? "border-amber-500/40 bg-amber-950/40 text-amber-200"
                      : "border-stone-700 bg-black/35 text-stone-400"
                  }`}
                >
                  Fondo {background ? "on" : "off"}
                </button>
                <button
                  onClick={() => setArt((value) => (value === "vector" ? "kit" : "vector"))}
                  className={`flex-1 rounded-xl border px-2 py-2 text-[9px] font-black uppercase tracking-wider transition sm:flex-none sm:text-[10px] sm:tracking-widest ${
                    art === "kit"
                      ? "border-amber-400/60 bg-amber-500/10 text-amber-200"
                      : "border-stone-700 bg-black/35 text-stone-400"
                  }`}
                  aria-label="Cambiar entre arte vectorial y kit ilustrado"
                >
                  {art === "kit" ? "Arte kit" : "Arte vector"}
                </button>
                <button
                  onClick={() =>
                    setFrame((value) => (value === "full" ? "bust" : value === "bust" ? "face" : "full"))
                  }
                  className={`flex-1 rounded-xl border px-2 py-2 text-[9px] font-black uppercase tracking-wider transition sm:flex-none sm:text-[10px] sm:tracking-widest ${
                    frame === "full"
                      ? "border-stone-700 bg-black/35 text-stone-400"
                      : "border-amber-400/60 bg-amber-500/10 text-amber-200"
                  }`}
                  aria-label="Cambiar encuadre de cámara"
                >
                  {frame === "full" ? "Vista cuerpo" : frame === "bust" ? "Vista busto" : "Vista rostro"}
                </button>
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] font-semibold uppercase tracking-widest text-stone-600">
              <span>Fase: {active}</span>
              <span className="text-stone-500">
                Teclas 1–8 · espacio pausa · R reinicia
              </span>
              <span className="text-stone-500">
                Los one-shot vuelven solos a reposo · muerte y victoria mantienen la pose
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default RagnarLab;
