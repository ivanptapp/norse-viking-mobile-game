"use client";
import { Axe, Crosshair, Crown, Eye, Flame, Hammer, Heart, Moon, Shield, Skull, Sparkles, Sun, Sword, Swords, Zap, Star } from "lucide-react";
import { heroById, RARITY_COLOR, type HeroDef } from "@/lib/heroes";

/**
 * Mapeo de avatares ilustrados para los héroes Míticos y Legendarios.
 * Apunta directamente a los archivos en public/heroes/{id}.png
 */
export const HERO_AVATARS: Record<string, string> = {
  // Míticos
  odin: "/heroes/odin.png",
  thor: "/heroes/thor.png",
  ragnar: "/heroes/ragnar.png",
  freya: "/heroes/freya.png",
  hel: "/heroes/hel.png",
  

  // Legendarios
  lagertha: "/heroes/lagertha.png",
  loki: "/heroes/loki.png", 
  heimdall: "/heroes/heimdall.png", 
  bjorn: "/heroes/bjorn.png", 
  ivar: "/heroes/ivar.png", 
  fenrir: "/heroes/fenrir.png", 
  brynhildr: "/heroes/brynhildr.png", 

  // --- Épicos (8) --- 
  uhtred: "/heroes/uhtred.png", 
  harald: "/heroes/harald.png", 
  rollo: "/heroes/rollo.png", 
  tyr: "/heroes/tyr.png", 
  sigurd: "/heroes/sigurd.png", 
  floki: "/heroes/floki.png", 
  erik: "/heroes/erik.png", 
  balder: "/heroes/balder.png",

  // --- Raros (5) --- 
  ubbe: "/heroes/ubbe.png", 
  hvitserk: "/heroes/hvitserk.png", 
  athelstan: "/heroes/athelstan.png", 
  freydis: "/heroes/freydis.png", 
  leif: "/heroes/leif.png",
};

export const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Axe, Crosshair, Crown, Eye, Flame, Hammer, Heart, Moon, Shield, Skull, Sparkles, Sun, Sword, Swords, Zap,
};

/**
 * HeroAvatar: Avatar cuadrado estático para menús, escuadrón, cartas, Aldea, Héroes y Forja.
 * - Si el héroe tiene avatar ilustrado en public/heroes/{id}.png, muestra la imagen enmarcada
 *   con su borde de rareza, icono de clase, runa distintiva y estrellas.
 * - Si la imagen no carga o no existe todavía, hace fallback automático e inmediato al diseño
 *   original plano con su color base y runa gigante.
 */
export function HeroAvatar({ heroId, size = 64, stars }: { heroId: string; size?: number; stars?: number }) {
  const def: HeroDef = heroById(heroId);
  const Icon = ICONS[def.icon] || Sword;
  const rc = RARITY_COLOR[def.rarity] || "#d4af37";
  const avatarUrl = def.avatar || HERO_AVATARS[heroId];

  if (avatarUrl) {
    return (
      <div
        className="relative shrink-0 rounded-xl overflow-hidden select-none bg-slate-950 shadow-md group"
        style={{
          width: size,
          height: size,
          border: `2px solid ${rc}`,
          boxShadow: `0 3px 10px rgba(0,0,0,0.6), 0 0 10px ${rc}44`,
        }}
      >
        {/* Imagen del héroe con fallback visual silencioso en caso de error de carga */}
        <img
          src={avatarUrl}
          alt={def.name}
          className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-200 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />

        {/* Gradiente inferior para legibilidad del nombre */}
        <div className="absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

        {/* Icono de clase / rol en la esquina superior derecha */}
        <div className="absolute top-0.5 right-0.5 bg-black/75 backdrop-blur-[2px] rounded p-0.5 text-amber-300 border border-white/10 shadow">
          <Icon size={Math.max(10, size * 0.18)} />
        </div>

        {/* Runa en la esquina superior izquierda */}
        <div className="absolute top-0.5 left-0.5 bg-black/75 backdrop-blur-[2px] px-1 rounded text-amber-300 font-mono font-black border border-white/10 shadow leading-tight text-[9px]">
          {def.rune}
        </div>

        {/* Nombre del héroe en la franja inferior */}
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-center pb-0.5 pointer-events-none">
          <span
            className="text-white font-extrabold truncate px-1 text-center drop-shadow-[0_1px_2px_rgba(0,0,0,1)] tracking-wide"
            style={{ fontSize: Math.max(7, size * 0.12) }}
          >
            {def.name.split(" ")[0]}
          </span>
        </div>

        {/* Estrellas de ascensión */}
        {stars !== undefined && (
          <div className="absolute bottom-[24%] left-0.5 flex gap-px pointer-events-none drop-shadow">
            {Array.from({ length: Math.min(6, stars) }).map((_, i) => (
              <Star key={i} size={Math.max(6, size * 0.11)} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Fallback procedural plano (color + runa central) ---
  return (
    <div
      className="relative shrink-0 rounded-xl overflow-hidden select-none"
      style={{
        width: size,
        height: size,
        backgroundColor: def.color,
        border: `2px solid ${rc}`,
        boxShadow: `inset 0 -14px 22px rgba(0,0,0,.55), inset 0 8px 14px rgba(255,255,255,.12)`,
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center font-rune font-black text-white/90"
        style={{ fontSize: size * 0.52, textShadow: "0 3px 10px rgba(0,0,0,.8)" }}
      >
        {def.rune}
      </div>
      <div className="absolute top-0.5 right-0.5 bg-black/55 rounded-md p-0.5 text-amber-300">
        <Icon size={Math.max(11, size * 0.2)} />
      </div>
      <div className="absolute bottom-0 inset-x-0 h-[26%] bg-black/45 flex items-end justify-center pb-px">
        <span className="text-white font-bold truncate px-0.5" style={{ fontSize: Math.max(7, size * 0.115) }}>
          {def.name.split(" ")[0]}
        </span>
      </div>
      {stars !== undefined && (
        <div className="absolute top-0.5 left-0.5 flex gap-px">
          {Array.from({ length: Math.min(6, stars) }).map((_, i) => (
            <Star key={i} size={Math.max(7, size * 0.13)} className="fill-amber-400 text-amber-400" />
          ))}
        </div>
      )}
    </div>
  );
}

export function RarityTag({ rarity }: { rarity: string }) {
  const c = RARITY_COLOR[rarity as keyof typeof RARITY_COLOR] || "#aaa";
  return (
    <span
      className="text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded"
      style={{ color: "#0b0f0d", backgroundColor: c }}
    >
      {rarity}
    </span>
  );
}

export function Stars({ n, size = 12 }: { n: number; size?: number }) {
  return (
    <span className="flex gap-px">
      {Array.from({ length: 6 }).map((_, i) => (
        <Star key={i} size={size} className={i < n ? "fill-amber-400 text-amber-400" : "text-stone-600"} />
      ))}
    </span>
  );
}

export const ROLE_ICON: Record<string, string> = {
  Tanque: "Shield",
  Guerrero: "Swords",
  Asesino: "Sword",
  Mago: "Sparkles",
  Apoyo: "Heart",
  Tirador: "Crosshair",
};

export const POS_LABEL: Record<string, string> = {
  front: "Vanguardia",
  mid: "Centro",
  back: "Retaguardia",
};

export function fmt(n: number) {
  return n >= 10000 ? `${(n / 1000).toFixed(1).replace(".0", "")}k` : n.toLocaleString("es-ES");
}
