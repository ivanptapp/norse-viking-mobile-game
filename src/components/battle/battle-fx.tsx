"use client";

import type { CSSProperties } from "react";

/**
 * Efectos de la arena.
 *
 * Cada golpe deja una huella distinta en el campo: un tajo, tres garras, un
 * rayo, un círculo rúnico, una onda de tierra… Todos son divs/SVG con
 * animaciones CSS (sin canvas ni sprites), así que el coste de dibujarlos es
 * el mismo en un móvil de gama baja que en un portátil.
 *
 * `BattleOverlay` sólo acumula objetos `Fx`; este módulo los pinta.
 */

export type FxKind =
  | "float" // número de daño / curación
  | "proj" // proyectil en vuelo
  | "burst" // explosión de impacto
  | "ring" // anillo de impacto
  | "heal" // destellos de curación
  | "bolt" // rayo vertical
  | "slash" // tajo curvo
  | "claw" // tres garras
  | "beam" // rayo horizontal sostenido
  | "shock" // onda de tierra
  | "arcane" // círculo rúnico
  | "dust" // polvo levantado
  | "spark" // chispas radiales
  | "sigil"; // runa gigante tras el lanzador

export interface Fx {
  id: number;
  kind: FxKind;
  x: number;
  y: number;
  text?: string;
  /** Palabra que acompaña al golpe ("¡MJÖLNIR!"). */
  label?: string;
  color?: string;
  big?: boolean;
  dx?: number;
  dy?: number;
  rot?: number;
  dur?: number;
  proj?: "arrow" | "orb" | "spear" | "axe" | "hammer" | "dagger";
  h?: number;
  w?: number;
  /** 1 si el efecto nace del lado aliado, -1 del enemigo. */
  dir?: 1 | -1;
}

const START: CSSProperties = { position: "absolute", pointerEvents: "none" };

export function FxLayer({ fx }: { fx: readonly Fx[] }) {
  return (
    <>
      {fx.map((e) => {
        switch (e.kind) {
          case "float":
            return (
              <div
                key={e.id}
                className="fx-float z-[79] text-center leading-none font-black"
                style={{
                  ...START,
                  left: e.x,
                  top: e.y,
                  color: e.color,
                  fontSize: e.big ? 26 : 15,
                  textShadow:
                    "0 2px 0 #000, 0 0 12px rgba(0,0,0,.95), 0 1px 4px #000",
                }}
              >
                {e.text}
                {e.big && (
                  <span className="mt-0.5 block text-[8px] tracking-[.18em] text-amber-200">
                    ¡CRÍTICO!
                  </span>
                )}
                {!e.big && e.label && (
                  <span className="mt-0.5 block text-[7px] font-black tracking-[.14em] text-amber-200/90">
                    {e.label}
                  </span>
                )}
              </div>
            );

          case "burst":
            return (
              <div
                key={e.id}
                className="fx-burst z-[72] rounded-full"
                style={{
                  ...START,
                  left: e.x,
                  top: e.y,
                  width: e.big ? 96 : 58,
                  height: e.big ? 96 : 58,
                  background: `radial-gradient(circle, #fff 0%, ${e.color}dd 22%, ${e.color}55 48%, transparent 72%)`,
                  boxShadow: e.big ? `0 0 22px ${e.color}aa` : undefined,
                  mixBlendMode: "screen",
                }}
              />
            );

          case "ring":
            return (
              <div
                key={e.id}
                className="fx-ring z-[71] rounded-full border-2"
                style={{
                  ...START,
                  left: e.x,
                  top: e.y,
                  width: 58,
                  height: 58,
                  borderColor: e.color,
                  boxShadow: `0 0 10px ${e.color}`,
                }}
              />
            );

          case "heal":
            return (
              <div
                key={e.id}
                className="z-[72]"
                style={{ ...START, left: e.x, top: e.y }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="fx-heal absolute font-black"
                    style={{
                      left: (i - 1.5) * 15,
                      animationDelay: `${i * 0.07}s`,
                      fontSize: 14 + (i % 2) * 5,
                      color: "#86efac",
                      textShadow: "0 0 8px #22c55e",
                    }}
                  >
                    ✦
                  </span>
                ))}
              </div>
            );

          case "bolt":
            return (
              <svg
                key={e.id}
                className="fx-bolt z-[73]"
                style={{ ...START, left: e.x - 26, top: 0, width: 52, height: e.h }}
                viewBox={`0 0 52 ${e.h}`}
              >
                <polyline
                  points={`26,0 14,${(e.h ?? 0) * 0.32} 30,${(e.h ?? 0) * 0.54} 16,${(e.h ?? 0) * 0.78} 26,${e.h}`}
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth="5"
                  strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 10px #fde047)" }}
                />
              </svg>
            );

          case "slash": {
            const w = e.w ?? 64;
            const h = e.h ?? 38;
            return (
              <svg
                key={e.id}
                className="z-[73]"
                style={{
                  ...START,
                  left: e.x - w / 2,
                  top: e.y - h / 2,
                  width: w,
                  height: h,
                  transform: `rotate(${e.rot ?? 0}deg)`,
                }}
                viewBox={`0 0 ${w} ${h}`}
              >
                <defs>
                  <linearGradient id={`sl-${e.id}`} x1="0" x2="1">
                    <stop offset="0" stopColor={e.color} stopOpacity="0" />
                    <stop offset=".5" stopColor="#fff" />
                    <stop offset="1" stopColor={e.color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`M4 ${h - 8} Q${w / 2} ${h * 0.02} ${w - 4} ${h - 12}`}
                  fill="none"
                  stroke={`url(#sl-${e.id})`}
                  strokeWidth={e.big ? 8 : 4.5}
                  strokeLinecap="round"
                  strokeDasharray="120"
                  className="fx-slash"
                  style={{ filter: `drop-shadow(0 0 6px ${e.color})` }}
                />
              </svg>
            );
          }

          case "claw":
            return (
              <svg
                key={e.id}
                className="z-[73]"
                style={{
                  ...START,
                  left: e.x - 26,
                  top: e.y - 26,
                  width: 52,
                  height: 52,
                  transform: `rotate(${e.rot ?? -18}deg)`,
                }}
                viewBox="0 0 52 52"
              >
                {[0, 1, 2].map((i) => (
                  <path
                    key={i}
                    d={`M${10 + i * 9} 46 Q${20 + i * 9} 26 ${14 + i * 9} 6`}
                    fill="none"
                    stroke={e.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="60"
                    className="fx-slash"
                    style={{
                      animationDelay: `${i * 0.045}s`,
                      filter: `drop-shadow(0 0 5px ${e.color})`,
                    }}
                  />
                ))}
              </svg>
            );

          case "beam": {
            const len = Math.abs(e.dx ?? 200);
            const left = (e.dx ?? 0) >= 0 ? e.x : e.x + (e.dx ?? 0);
            return (
              <div
                key={e.id}
                className="fx-beam z-[72]"
                style={{
                  ...START,
                  left,
                  top: e.y - (e.big ? 13 : 7),
                  width: len,
                  height: e.big ? 26 : 14,
                  transformOrigin: (e.dx ?? 0) >= 0 ? "left center" : "right center",
                  background: `linear-gradient(180deg, transparent, ${e.color} 30%, #fff 50%, ${e.color} 70%, transparent)`,
                  boxShadow: `0 0 26px 6px ${e.color}`,
                  borderRadius: 999,
                }}
              />
            );
          }

          case "shock":
            return (
              <div
                key={e.id}
                className="fx-shock z-[69] rounded-[50%] border-2"
                style={{
                  ...START,
                  left: e.x - (e.w ?? 150) / 2,
                  top: e.y - (e.w ?? 150) * 0.16,
                  width: e.w ?? 150,
                  height: (e.w ?? 150) * 0.32,
                  borderColor: e.color,
                  boxShadow: `0 0 22px ${e.color}`,
                }}
              />
            );

          case "arcane":
            return (
              <div
                key={e.id}
                className="fx-arcane z-[68]"
                style={{
                  ...START,
                  left: e.x - (e.w ?? 120) / 2,
                  top: e.y - (e.w ?? 120) / 2,
                  width: e.w ?? 120,
                  height: e.w ?? 120,
                  color: e.color,
                }}
              >
                <div className="fx-arcane__spin absolute inset-0 rounded-full border-2 border-dashed" />
                <div className="fx-arcane__spin-rev absolute inset-[18%] rounded-full border border-dotted" />
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${e.color}55 0%, transparent 68%)`,
                  }}
                />
              </div>
            );

          case "dust":
            return (
              <div
                key={e.id}
                className="z-[66]"
                style={{ ...START, left: e.x, top: e.y }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="fx-dust absolute rounded-full"
                    style={{
                      left: (i - 1.5) * 13,
                      width: 12 + (i % 2) * 8,
                      height: 12 + (i % 2) * 8,
                      background: `radial-gradient(circle, ${e.color}cc, transparent 70%)`,
                      animationDelay: `${i * 0.06}s`,
                    }}
                  />
                ))}
              </div>
            );

          case "spark":
            return (
              <div
                key={e.id}
                className="z-[74]"
                style={{ ...START, left: e.x, top: e.y }}
              >
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                  <span
                    key={deg}
                    className="absolute"
                    style={{ transform: `rotate(${deg}deg)` }}
                  >
                    <i
                      className="fx-spark block h-[2px] w-[9px] rounded-full"
                      style={{
                        background: e.color,
                        boxShadow: `0 0 6px ${e.color}`,
                        animationDelay: `${i * 0.012}s`,
                      }}
                    />
                  </span>
                ))}
              </div>
            );

          case "sigil":
            return (
              <div
                key={e.id}
                className="fx-sigil z-[64]"
                style={{
                  ...START,
                  left: e.x - (e.w ?? 260) / 2,
                  top: e.y - (e.w ?? 260) / 2,
                  width: e.w ?? 260,
                  height: e.w ?? 260,
                  color: e.color,
                }}
              >
                <div
                  className="absolute inset-0 rounded-full border-2"
                  style={{ borderColor: e.color, boxShadow: `0 0 40px ${e.color}` }}
                />
                <div className="fx-arcane__spin absolute inset-[10%] rounded-full border-2 border-dashed" />
                <div className="absolute inset-0 flex items-center justify-center font-rune text-[64px] font-black opacity-80">
                  {e.text}
                </div>
              </div>
            );

          default: {
            const proj = e.proj ?? "orb";
            return (
              <div
                key={e.id}
                className="fx-proj z-[73]"
                style={
                  {
                    ...START,
                    left: e.x,
                    top: e.y,
                    "--dx": `${e.dx}px`,
                    "--dy": `${e.dy}px`,
                    "--rot": `${e.rot}deg`,
                    "--dur": `${e.dur}ms`,
                  } as CSSProperties
                }
              >
                {proj === "arrow" ? (
                  <div
                    style={{
                      width: 34,
                      height: 3,
                      marginTop: -1.5,
                      borderRadius: 2,
                      background: `linear-gradient(90deg,#92400e,${e.color ?? "#e7e5e4"})`,
                      boxShadow: `0 0 8px ${e.color ?? "#e7e5e4"}`,
                    }}
                  />
                ) : proj === "spear" ? (
                  <div
                    style={{
                      width: 50,
                      height: 4,
                      marginTop: -2,
                      borderRadius: 2,
                      background: `linear-gradient(90deg,#78350f,${e.color ?? "#f1f5f9"})`,
                      boxShadow: `0 0 16px ${e.color ?? "#f1f5f9"}`,
                    }}
                  />
                ) : proj === "axe" ? (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      marginTop: -10,
                      marginLeft: -10,
                      borderRadius: 4,
                      background: `conic-gradient(from 45deg, #d6d3d1, #78716c, #e7e5e4)`,
                      border: "2px solid #44403c",
                      transform: `rotate(${e.rot ?? 0}deg)`,
                      boxShadow: `0 0 16px ${e.color ?? "#f87171"}`,
                    }}
                  />
                ) : proj === "hammer" ? (
                  <div
                    style={{
                      width: 24,
                      height: 18,
                      marginTop: -9,
                      marginLeft: -12,
                      borderRadius: 3,
                      background: "linear-gradient(180deg,#a8a29e,#57534e)",
                      border: "2px solid #292524",
                      boxShadow: `0 0 18px ${e.color ?? "#fde047"}`,
                    }}
                  />
                ) : proj === "dagger" ? (
                  <div
                    style={{
                      width: 26,
                      height: 3,
                      marginTop: -1.5,
                      borderRadius: 2,
                      background: `linear-gradient(90deg,#57534e,${e.color ?? "#e7e5e4"})`,
                      boxShadow: `0 0 12px ${e.color ?? "#fdba74"}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      marginTop: -10,
                      marginLeft: -10,
                      borderRadius: 999,
                      background: `radial-gradient(circle, #fff 18%, ${e.color} 62%, transparent 70%)`,
                      boxShadow: `0 0 20px 6px ${e.color}`,
                    }}
                  />
                )}
              </div>
            );
          }
        }
      })}
    </>
  );
}
