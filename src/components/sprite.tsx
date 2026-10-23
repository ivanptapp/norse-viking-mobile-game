"use client";
import { heroById } from "@/lib/heroes";
import { spriteCfg, HERO_AVATARS } from "@/lib/sprites";

export type SpriteState = "idle" | "attack" | "shoot" | "cast" | "hit" | "dead";

function shade(hex: string, pct: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (pct > 0 ? (255 - c) * pct : c * pct))));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/**
 * Sprite de Héroe Vikingo / Nórdico para la interfaz o vista compacta (100x120).
 * Si el héroe cuenta con avatar ilustrado generado, renderiza el retrato con su marco rúnico,
 * aura de su facción y animación acorde al estado (spr / spr-body).
 * Si no lo tiene todavía, usa el sprite SVG procedural tradicional como fallback.
 */
export function VikingSprite({
  heroId,
  size = 88,
  state = "idle",
  delay = 0,
}: {
  heroId: string;
  size?: number;
  state?: SpriteState;
  delay?: number;
}) {
  const def = heroById(heroId);
  const cfg = spriteCfg(heroId);

  // Bestias cuadrúpedas (ej. Fenrir)
  if (cfg.beast === "wolf") return <WolfSprite size={size} state={state} delay={delay} />;

  // Avatar ilustrado generado (Odín, Thor, Ragnar, Freya, Hel, etc.)
  const avatarUrl = cfg.avatar || (HERO_AVATARS && HERO_AVATARS[heroId]);

  if (avatarUrl) {
    const height = Math.round(size * 1.2);
    const boxSize = Math.round(size * 0.88);

    return (
      <div
        className={`spr spr-${state} relative select-none flex flex-col items-center justify-end`}
        style={{
          width: size,
          height: height,
          animationDelay: `${delay}s`,
        }}
      >
        {/* Sombra en el suelo */}
        <div
          className="absolute bottom-1 w-16 h-3 rounded-full bg-black/60 blur-[2px] transition-transform duration-300"
          style={{ transform: state === "dead" ? "scale(0.35)" : "scale(1)" }}
        />

        {/* Cuerpo animado del sprite */}
        <div
          className="spr-body relative flex flex-col items-center origin-bottom transition-all"
          style={{ animationDelay: `${delay}s` }}
        >
          {/* Retrato con marco rúnico */}
          <div
            className="relative rounded-xl overflow-hidden shadow-xl border-2 border-amber-400/80 bg-gradient-to-b from-slate-900 to-black ring-2 ring-black/70"
            style={{
              width: boxSize,
              height: boxSize,
              boxShadow: `0 6px 18px -3px ${def.color}bb, inset 0 0 12px rgba(0,0,0,0.8)`,
            }}
          >
            {/* Imagen del Avatar */}
            <img
              src={avatarUrl}
              alt={def.name}
              className="w-full h-full object-cover select-none pointer-events-none"
              loading="eager"
            />

            {/* Efecto de ataque o casteo */}
            {(state === "attack" || state === "cast" || state === "shoot") && (
              <div className="absolute inset-0 bg-amber-300/25 mix-blend-screen animate-pulse pointer-events-none" />
            )}

            {/* Efecto de daño recibido */}
            {state === "hit" && (
              <div className="absolute inset-0 bg-red-600/40 mix-blend-multiply animate-ping pointer-events-none" />
            )}

            {/* Runa en la esquina superior izquierda */}
            <div className="absolute top-1 left-1 flex items-center bg-black/85 backdrop-blur-sm px-1.5 py-0.2 rounded border border-white/20 shadow">
              <span className="text-[10px] font-black text-amber-300 font-mono leading-tight">{def.rune}</span>
            </div>

            {/* Rol o facción en la esquina inferior */}
            <div className="absolute bottom-0.5 right-1 bg-black/80 backdrop-blur-sm px-1 rounded text-[8px] font-bold text-slate-300 border border-white/10 uppercase">
              {def.role}
            </div>
          </div>

          {/* Nombre / Insignia debajo del retrato */}
          <div className="relative -mt-2 z-10 flex items-center justify-center">
            <span
              className="text-[9px] font-black px-2 py-0.2 rounded-full border shadow tracking-wider uppercase"
              style={{
                backgroundColor: shade(def.color, -0.45),
                borderColor: def.color,
                color: "#f8fafc",
              }}
            >
              {def.name}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- Fallback SVG procedimental para héroes sin avatar generado ---
  const base = def.color, dark = shade(base, -0.32), mid = shade(base, -0.12), light = shade(base, 0.28);

  return (
    <svg viewBox="0 0 100 120" width={size} height={size * 1.2} className={`spr spr-${state}`} style={{ overflow: "visible", display: "block" }}>
      {/* sombra */}
      <ellipse cx="50" cy="116" rx="25" ry="5.5" fill="rgba(0,0,0,.5)" />
      <g className="spr-body" style={{ animationDelay: `${delay}s` }}>
        {/* capa */}
        {cfg.cape && (
          <g>
            <path d="M32 48 Q18 74 28 102 L44 98 Q34 76 46 50 Z" fill={cfg.cape} opacity=".95" />
            <path d="M30 56 Q22 72 27 92" stroke="rgba(0,0,0,.2)" strokeWidth="1.2" fill="none" />
          </g>
        )}
        {/* piernas y botas */}
        <path d="M37 84 L33 108 L42 108 L44 84 Z" fill="#2a1e14" />
        <path d="M56 84 L58 108 L67 108 L63 84 Z" fill="#3b2e1e" />
        <path d="M30 103 L43 103 L43 110 L30 110 Z" fill="#111" rx="2" />
        <path d="M57 103 L70 103 L70 110 L57 110 Z" fill="#111" />
        <rect x="32" y="91" width="12" height="4" rx="1" fill="#1a1a1a" />
        <rect x="56" y="91" width="13" height="4" rx="1" fill="#1a1a1a" />
        {/* torso chibi grande */}
        <path d="M28 44 Q28 42 32 40 L68 40 Q72 42 72 44 L74 86 L26 86 Z" fill={base} />
        {/* brillo pecho */}
        <path d="M30 42 Q50 38 62 42 L60 52 Q50 48 34 52 Z" fill={light} opacity=".18" />
        {/* cota de malla / detalles */}
        {cfg.armor && (
          <g opacity=".9">
            <path d="M30 50 H70 M30 56 H71 M30 62 H71 M30 68 H71 M30 74 H71" stroke="#d1d5db" strokeWidth="1.6" strokeDasharray="3 3" />
            <rect x="30" y="46" width="40" height="40" fill="none" stroke="#9ca3af" strokeWidth="1" rx="2" opacity=".25" />
          </g>
        )}
        {/* cinturón */}
        <rect x="26" y="80" width="48" height="7" rx="2" fill="#1c1917" />
        <rect x="44" y="78" width="12" height="11" rx="2" fill="#d4a017" stroke="#92400e" />
        <circle cx="50" cy="83.5" r="2.5" fill="#fef3c7" />
        {/* emblema pecho */}
        <g opacity=".85">
          <path d="M50 55 L55 64 L50 73 L45 64 Z" fill="#fef3c7" stroke="#d4a017" strokeWidth=".8" />
          <text x="50" y="67" textAnchor="middle" fontSize="7" fontWeight="900" fill={dark}>{def.rune}</text>
        </g>
        {/* brazo izquierdo */}
        <path d="M28 48 L22 74 L30 76 L36 50 Z" fill={cfg.skin} />
        {/* cabeza CHIBI GRANDE */}
        {cfg.female ? (
          <path d="M24 22 Q24 10 50 8 Q76 10 76 22 Q76 40 68 56 L30 56 Q24 40 24 22 Z" fill={cfg.hair} />
        ) : (
          <path d="M28 18 Q50 6 72 18 Q72 42 62 52 L38 52 Q28 42 28 18 Z" fill={cfg.hair} />
        )}
        <ellipse cx="50" cy="36" rx="17" ry="15" fill={cfg.skin} />
        <ellipse cx="42" cy="40" rx="3" ry="1.8" fill="#e8a07a" opacity=".35" />
        <ellipse cx="58" cy="40" rx="3" ry="1.8" fill="#e8a07a" opacity=".35" />
        <ellipse cx="44.5" cy="33" rx="4.2" ry="4.8" fill="#fff" />
        <ellipse cx="55.5" cy="33" rx="4.2" ry="4.8" fill="#fff" />
        <circle cx="44.5" cy="34" r="2.6" fill="#1e293b" />
        <circle cx="55.5" cy="34" r="2.6" fill="#1e293b" />
        <circle cx="43.5" cy="32.2" r="1" fill="#fff" />
        <circle cx="54.5" cy="32.2" r="1" fill="#fff" />
        {cfg.eyepatch ? (
          <g>
            <ellipse cx="55.5" cy="33" rx="5" ry="5.5" fill="#111" />
            <path d="M55 27 L62 24 L61 28 Z" fill="#111" />
            <path d="M48 30 Q55 22 62 24" stroke="#d4a017" strokeWidth="1.4" fill="none" />
          </g>
        ) : null}
        <ellipse cx="50" cy="39" rx="1.2" ry="1" fill="#c98a6a" />
        <path d="M48 43 Q50 45 52 43" stroke="#7c2d12" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        {cfg.beard && <path d="M34 38 Q50 58 66 38 Q50 47 34 38 Z" fill={cfg.hair} stroke="rgba(0,0,0,.25)" strokeWidth=".6" />}
        {cfg.beard && <path d="M42 41 Q50 39 58 41" stroke={dark} strokeWidth="1.2" fill="none" />}
        <Helmet heroId={heroId} cfg={cfg} dark={dark} />

        {/* brazo arma */}
        <g className="spr-arm" style={{ transformOrigin: "56px 54px" }}>
          <path d="M54 50 L78 32 L84 40 L60 60 Z" fill={cfg.skin} stroke="rgba(0,0,0,.15)" strokeWidth=".6" />
          <Weapon cfg={cfg} />
          <path d="M74 14 L76 26" stroke="#fff" strokeWidth="1.4" opacity=".5" />
        </g>

        {cfg.shield && (
          <g>
            <circle cx="66" cy="72" r="16" fill={dark} stroke="#fde68a" strokeWidth="3.5" />
            <circle cx="66" cy="72" r="16" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1.5" />
            <path d="M66 56 V88 M50 72 H82" stroke="#1c1917" strokeWidth="2.5" opacity=".5" />
            <circle cx="66" cy="72" r="5.5" fill="#e5e7eb" stroke="#d4a017" strokeWidth="1.5" />
            <circle cx="66" cy="72" r="2" fill="#111" />
            <text x="66" y="77" textAnchor="middle" fontSize="6" fontWeight="900" fill="#1c1917">ᛉ</text>
          </g>
        )}
      </g>
    </svg>
  );
}

function Helmet({ heroId, cfg, dark }: { heroId: string; cfg: ReturnType<typeof spriteCfg>; dark: string }) {
  const hair = cfg.hair;
  switch (cfg.helm) {
    case "nasal":
      return <g><path d="M29 28 A21 21 0 0 1 71 28 Z" fill="#6b7280" stroke="#374151" strokeWidth="1.5" /><rect x="28" y="26" width="44" height="6" rx="1.5" fill="#9ca3af" stroke="#4b5563" /><rect x="55" y="28" width="5" height="12" rx="1.5" fill="#4b5563" /><circle cx="50" cy="22" r="1.4" fill="#d1d5db" /></g>;
    case "horned":
      return <g>
        <path d="M30 26 Q12 22 16 6 Q26 16 34 24 Z" fill="#fefce8" stroke="#a3a3a3" strokeWidth="1" />
        <path d="M70 26 Q88 22 84 6 Q74 16 66 24 Z" fill="#fefce8" stroke="#a3a3a3" strokeWidth="1" />
        <path d="M29 28 A21 21 0 0 1 71 28 Z" fill="#4b5563" stroke="#1f2937" strokeWidth="1.5" />
        <rect x="28" y="26" width="44" height="6" rx="1" fill="#9ca3af" />
      </g>;
    case "winged":
      return <g>
        <path d="M30 26 Q10 24 12 12 Q24 16 34 22 Z" fill="#fef3c7" stroke="#b45309" />
        <path d="M70 26 Q90 24 88 12 Q76 16 66 22 Z" fill="#fef3c7" stroke="#b45309" />
        <path d="M29 28 A21 21 0 0 1 71 28 Z" fill="#d4a017" stroke="#92400e" strokeWidth="1.5" />
        <rect x="28" y="26" width="44" height="6" rx="1" fill="#fde68a" />
      </g>;
    case "valkyrie":
      return <g>
        <path d="M30 26 Q10 22 14 10 Q26 15 36 22 Z" fill="#f8fafc" stroke="#94a3b8" />
        <path d="M70 26 Q90 22 86 10 Q74 15 64 22 Z" fill="#f8fafc" stroke="#94a3b8" />
        <path d="M29 28 A21 21 0 0 1 71 28 Z" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
        <rect x="28" y="26" width="44" height="6" rx="1" fill="#e2e8f0" />
      </g>;
    case "crown":
      return <g><path d="M28 28 L32 14 L40 24 L50 10 L60 24 L68 14 L72 28 Z" fill="#0f172a" stroke="#475569" strokeWidth="1.2" /><circle cx="50" cy="18" r="2.8" fill="#34d399" stroke="#064e3b" /></g>;
    case "hood":
      return <path d="M26 38 Q26 8 50 6 Q74 8 74 38 Q64 28 50 30 Q36 28 26 38 Z" fill={dark} opacity=".95" />;
    default:
      return heroId === "loki" ? <path d="M30 28 Q50 12 70 28 Q50 22 30 28 Z" fill={hair} opacity=".9" /> : null;
  }
}

function Weapon({ cfg }: { cfg: ReturnType<typeof spriteCfg> }) {
  switch (cfg.weapon) {
    case "sword":
      return <g>
        <path d="M76 32 L76 6 L79 -2 L82 6 L82 32 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
        <line x1="79" y1="6" x2="79" y2="28" stroke="#fff" strokeWidth="1" opacity=".6" />
        <rect x="70" y="31" width="18" height="5" rx="1.5" fill="#d4a017" stroke="#92400e" />
        <rect x="76" y="36" width="6" height="10" rx="1" fill="#3f2a14" />
        <circle cx="79" cy="47" r="3" fill="#d4a017" stroke="#92400e" />
      </g>;
    case "axe":
      return <g>
        <rect x="77" y="6" width="5" height="42" rx="2.5" fill="#5b3a1e" />
        <path d="M82 10 Q104 12 100 30 Q90 24 82 26 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
        <path d="M82 12 Q95 14 92 26" stroke="#fff" strokeWidth="1" opacity=".45" />
      </g>;
    case "greataxe":
      return <g>
        <rect x="77" y="2" width="6" height="50" rx="3" fill="#431407" />
        <path d="M83 6 Q106 8 102 30 Q92 23 83 25 Z" fill="#e2e8f0" stroke="#475569" />
        <path d="M77 6 Q54 8 58 30 Q68 23 77 25 Z" fill="#e2e8f0" stroke="#475569" />
      </g>;
    case "hammer":
      return <g>
        <rect x="77" y="18" width="6" height="30" rx="3" fill="#5c3a1a" />
        <rect x="62" y="2" width="34" height="18" rx="3" fill="#9ca3af" stroke="#475569" strokeWidth="1.5" />
        <rect x="66" y="6" width="26" height="10" rx="2" fill="#e2e8f0" />
        <circle className="spr-orb" cx="79" cy="11" r="14" fill="#fde047" opacity=".22" />
      </g>;
    case "spear":
      return <g>
        <rect x="78" y="-10" width="3" height="58" rx="1.5" fill="#78350f" />
        <path d="M79.5 -18 L72 -4 L87 -4 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
        <circle className="spr-orb" cx="79.5" cy="-8" r="9" fill="#93c5fd" opacity=".28" />
      </g>;
    case "daggers":
      return <g>
        <path d="M77 34 L77 14 L79.5 8 L82 14 L82 34 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
        <rect x="73" y="33" width="13" height="3.5" rx="1" fill="#334155" />
      </g>;
    case "bow":
      return <g>
        <path d="M82 24 Q106 54 82 84" stroke="#7c2d12" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M82 24 L82 84" stroke="#e7e5e4" strokeWidth="1" />
        <line x1="66" y1="54" x2="96" y2="54" stroke="#d6d3d1" strokeWidth="2.2" />
        <path d="M96 54 L90 50 L90 58 Z" fill="#f5f5f4" stroke="#57534e" />
      </g>;
    case "staff":
      return <g>
        <rect x="77" y="2" width="5" height="52" rx="2.5" fill="#451a03" />
        <circle className="spr-orb" cx="79.5" cy="0" r="12" fill={cfg.orb} opacity=".32" />
        <circle cx="79.5" cy="0" r="7" fill={cfg.orb} stroke="#fff" strokeWidth=".8" opacity=".9" />
        <circle cx="77" cy="-2" r="2.2" fill="#fff" opacity=".75" />
      </g>;
    case "book":
      return <g>
        <rect x="76" y="44" width="18" height="14" rx="1.5" fill="#7f1d1d" stroke="#fde68a" strokeWidth="1" />
        <path d="M85 46 V58 M80 52 H90" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" />
        <circle className="spr-orb" cx="85" cy="51" r="13" fill="#fef3c7" opacity=".2" />
      </g>;
    default: return null;
  }
}

function WolfSprite({ size, state, delay }: { size: number; state: SpriteState; delay: number }) {
  return (
    <svg viewBox="0 0 100 120" width={size} height={size * 1.2} className={`spr spr-${state}`} style={{ display: "block", overflow: "visible" }}>
      <ellipse cx="52" cy="116" rx="30" ry="5.5" fill="rgba(0,0,0,.5)" />
      <g className="spr-body" style={{ animationDelay: `${delay}s` }}>
        <path d="M12 72 Q0 60 8 44" stroke="#1c1917" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M20 66 Q34 48 52 56 Q68 48 84 64 Q52 62 20 66 Z" fill="#292524" />
        <ellipse cx="50" cy="78" rx="32" ry="19" fill="#1c1917" />
        <path d="M20 70 Q30 54 52 58 Q70 54 82 70 Q52 68 20 70 Z" fill="#44403c" />
        <ellipse cx="68" cy="42" rx="18" ry="16" fill="#1c1917" />
        <path d="M52 28 L58 12 L66 28 Z" fill="#1c1917" stroke="#44403c" />
        <path d="M68 28 L74 10 L82 28 Z" fill="#1c1917" stroke="#44403c" />
        <circle cx="62" cy="40" r="3.5" fill="#ef4444" />
        <circle cx="74" cy="40" r="3.5" fill="#ef4444" />
        <circle cx="61" cy="39" r="1.2" fill="#fff" />
        <circle cx="73" cy="39" r="1.2" fill="#fff" />
        <ellipse cx="76" cy="52" rx="10" ry="7" fill="#44403c" />
        <path d="M74 50 L88 48 L90 56 L78 58 Z" fill="#7f1d1d" />
        <path d="M84 50 L86 56 L88 50 M90 51 L91 56 L93 51" stroke="#f8fafc" strokeWidth="1.6" fill="none" />
        <path d="M22 84 L16 108 L28 108 L32 86 Z" fill="#1c1917" />
        <path d="M36 84 L32 108 L44 108 L48 86 Z" fill="#292524" />
        <path d="M62 84 L60 108 L72 108 L76 86 Z" fill="#292524" />
        <path d="M76 84 L74 108 L86 108 L80 84 Z" fill="#1c1917" />
        <g className="spr-arm" style={{ transformOrigin: "78px 56px" }}>
          <path d="M68 56 L96 44 L104 54 L94 70 L74 74 Z" fill="#1c1917" />
          <path d="M78 68 L98 66 L92 76 L78 74 Z" fill="#7f1d1d" />
        </g>
      </g>
    </svg>
  );
}
