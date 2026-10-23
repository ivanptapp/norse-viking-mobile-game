"use client";

/**
 * Placa de unidad: lo mínimo para leer el combate de un vistazo.
 *
 * Nivel y barra de vida. El nombre sólo aparece cuando el héroe actúa, para
 * que cinco placas no se pisen entre sí en mitad de la refriega; los nombres
 * completos viven en las cartas del escuadrón.
 */
export function BattleNameplate({
  name,
  level,
  hp,
  maxHp,
  enemy,
  width,
  accent,
  showName = false,
}: {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  enemy: boolean;
  width: number;
  accent: string;
  showName?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100));
  const low = pct < 26;

  return (
    <div style={{ width }} className="select-none">
      {showName && (
        <div
          className="mb-[2px] truncate text-center text-[9px] font-extrabold uppercase tracking-[.05em] text-white"
          style={{ textShadow: "0 1px 3px #000, 0 0 8px #000" }}
        >
          {name}
        </div>
      )}

      <div
        className="flex items-center gap-[3px]"
        style={{ flexDirection: enemy ? "row-reverse" : "row" }}
      >
        <span
          className="grid h-[11px] min-w-[11px] place-items-center rounded-[2px] px-[2px] text-[7px] font-black leading-none text-black"
          style={{
            background: `linear-gradient(180deg, ${accent}, ${accent}bb)`,
            boxShadow: `0 0 5px ${accent}66`,
          }}
        >
          {level}
        </span>

        <div
          className="relative h-[5px] flex-1 overflow-hidden rounded-full border border-black/70"
          style={{
            background: "rgba(3,6,5,.85)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,.9), 0 1px 3px rgba(0,0,0,.55)",
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
            style={{
              width: `${pct}%`,
              background: low
                ? "linear-gradient(180deg,#fca5a5,#dc2626 60%,#7f1d1d)"
                : enemy
                  ? "linear-gradient(180deg,#fca5a5,#b91c1c 60%,#7f1d1d)"
                  : "linear-gradient(180deg,#bbf7d0,#22c55e 60%,#15803d)",
              boxShadow: low
                ? "0 0 7px #ef4444"
                : enemy
                  ? "0 0 5px rgba(248,113,113,.5)"
                  : "0 0 5px rgba(74,222,128,.45)",
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/25" />
          {low && (
            <div className="battle-hp-alert pointer-events-none absolute inset-0" />
          )}
        </div>
      </div>
    </div>
  );
}
