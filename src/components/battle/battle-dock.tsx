"use client";

import { Zap } from "lucide-react";
import { HERO_AVATARS } from "../game-ui";
import { heroById, RARITY_COLOR } from "@/lib/heroes";

/**
 * Cartas del escuadrón durante la batalla.
 *
 * Ocupan el borde inferior del campo, como en los juegos de arena por turnos:
 * retrato grande, marco del color de la rareza, vida, energía y un aviso
 * dorado cuando la definitiva está lista. Se leen sin apartar la vista de la
 * pelea y dejan el centro de la pantalla libre para los personajes.
 */

export interface DockFighter {
  uid: string;
  heroId: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  energy: number;
  dead: boolean;
}

export function BattleDock({
  fighters,
  activeUid,
  accentOf,
}: {
  fighters: readonly DockFighter[];
  activeUid?: string | null;
  accentOf: (heroId: string) => string;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[80]">
      <div className="battle-dock-backdrop absolute inset-x-0 bottom-0 h-[124px]" />
      <div className="relative flex items-end justify-center gap-1.5 px-2 pb-2">
        {fighters.map((f) => {
          const def = heroById(f.heroId);
          const rarity = RARITY_COLOR[def.rarity] || "#f59e0b";
          const accent = accentOf(f.heroId);
          const hpPct = Math.max(0, Math.min(100, (f.hp / Math.max(1, f.maxHp)) * 100));
          const ready = f.energy >= 100 && !f.dead;
          const active = activeUid === f.uid && !f.dead;
          const avatar = def.avatar || HERO_AVATARS[f.heroId];

          return (
            <div
              key={f.uid}
              className={`battle-card relative flex-1 overflow-hidden rounded-lg ${
                f.dead ? "battle-card--dead" : ""
              } ${ready ? "battle-card--ult" : ""} ${active ? "battle-card--active" : ""}`}
              style={{
                maxWidth: 86,
                aspectRatio: "3 / 4",
                border: `1.5px solid ${f.dead ? "#3f3f46" : rarity}`,
                boxShadow: f.dead
                  ? "0 2px 8px rgba(0,0,0,.7)"
                  : `0 3px 10px rgba(0,0,0,.7), 0 0 0 1px rgba(0,0,0,.6) inset, 0 0 12px ${rarity}33`,
              }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={def.name}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                  draggable={false}
                />
              ) : (
                <div
                  className="absolute inset-0 grid place-items-center font-rune text-2xl font-black text-white/80"
                  style={{ background: def.color }}
                >
                  {def.rune}
                </div>
              )}

              {/* Lectura: arriba oscurece para el nivel, abajo para las barras. */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/85" />

              <div className="absolute inset-x-0 top-0 flex items-center justify-between px-1 pt-0.5">
                <span className="rounded bg-black/70 px-1 text-[7px] font-black text-amber-200">
                  {f.level}
                </span>
                {ready && (
                  <span className="battle-ult-chip rounded bg-amber-400 px-1 text-[7px] font-black text-black">
                    ULT
                  </span>
                )}
                {f.dead && (
                  <span className="rounded bg-red-950/90 px-1 text-[7px] font-black text-red-200">
                    ✝
                  </span>
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 px-1 pb-1">
                <div
                  className="mb-0.5 truncate text-center text-[8px] font-extrabold text-white"
                  style={{ textShadow: "0 1px 2px #000, 0 0 4px #000" }}
                >
                  {def.name.split(" ")[0]}
                </div>

                {/* Vida */}
                <div className="battle-card-bar mb-[2px]">
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${hpPct}%`,
                      background:
                        hpPct < 26
                          ? "linear-gradient(90deg,#ef4444,#fca5a5)"
                          : "linear-gradient(90deg,#16a34a,#4ade80)",
                    }}
                  />
                </div>

                {/* Energía */}
                <div className="battle-card-bar battle-card-bar--energy">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${
                      ready ? "battle-energy-full" : ""
                    }`}
                    style={{
                      width: `${Math.min(100, f.energy)}%`,
                      background: ready
                        ? "linear-gradient(90deg,#fde047,#fbbf24)"
                        : `linear-gradient(90deg,${accent},#f59e0b)`,
                    }}
                  />
                </div>
              </div>

              {ready && (
                <Zap
                  size={11}
                  className="battle-ult-bolt absolute bottom-[19px] right-1 text-amber-200 drop-shadow"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
