"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Castle,
  Swords,
  Map as MapIcon,
  Trophy,
  Sparkles,
  Coins,
  Gem,
  Zap,
  Beer,
  ChevronRight,
  Lock,
  Check,
  ScrollText,
  Store,
  Crown,
  X,
  ArrowUp,
  Star,
  Users,
  Gift,
  TreePine,
  Shield,
  Skull,
  Flame,
  Plus,
  Info,
  Hammer,
  Layers,
  Target,
  Award,
  Timer,
  Hexagon,
} from "lucide-react";
import {
  HEROES,
  CHAPTERS,
  STAGES_PER_CHAPTER,
  TOTAL_STAGES,
  stageInfo,
  heroById,
  heroStats,
  RARITY_STARS,
  QUESTS,
  ARENA_NAMES,
  type HeroDef,
} from "@/lib/heroes";
import {
  ARTIFACTS,
  RUNES,
  seasonTier,
  jormungandrStats,
  artifactById,
  runeById,
} from "@/lib/extra";
import {
  HeroAvatar,
  RarityTag,
  Stars,
  POS_LABEL,
  fmt,
} from "@/components/game-ui";
import { BattleOverlay, type BattleData } from "@/components/battle";

interface PlayerT {
  id: number;
  nickname: string;
  level: number;
  exp: number;
  gold: number;
  gems: number;
  energy: number;
  campaignStage: number;
  towerFloor: number;
  arenaPoints: number;
  arenaWins: number;
  totalBattles: number;
  totalWins: number;
  summonsDone: number;
  teamHeroIds: number[];
  claimedQuests: string[];
  lastDailyAt: string | null;
  artifactData?: Record<string, number>;
  runeInventory?: Record<string, number>;
  heroRunes?: Record<string, string[]>;
  heroArtifacts?: Record<string, string>;
  jormungandrHp?: number;
  jormungandrMaxHp?: number;
  jormungandrScore?: number;
  dailyStreak?: number;
  seasonPassExp?: number;
  lastRaidAt?: string | null;
}
interface OwnedHero {
  id: number;
  heroId: string;
  level: number;
  stars: number;
  shards: number;
  def: HeroDef;
  stats: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
    crit: number;
    power: number;
  };
}

type Tab =
  | "home"
  | "heroes"
  | "campaign"
  | "arena"
  | "summon"
  | "forge"
  | "runes"
  | "raid"
  | "pass";

export default function GamePage() {
  const [player, setPlayer] = useState<PlayerT | null>(null);
  const [heroes, setHeroes] = useState<OwnedHero[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("home");
  const [nickname, setNickname] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [battle, setBattle] = useState<BattleData | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [viewDef, setViewDef] = useState<HeroDef | null>(null);
  const [summonResults, setSummonResults] = useState<
    { heroId: string; isNew: boolean; shards: number }[] | null
  >(null);
  const [modal, setModal] = useState<"quests" | "shop" | "rank" | null>(null);
  const [chapterSel, setChapterSel] = useState(1);
  const [stageSel, setStageSel] = useState<number | null>(null);
  const [factionFilter, setFactionFilter] = useState("Todos");
  const [leaderboard, setLeaderboard] = useState<
    {
      id: number;
      nickname: string;
      level: number;
      arenaPoints: number;
      campaignStage: number;
      towerFloor: number;
      jormungandrScore?: number;
    }[]
  >([]);
  const [forgeEquipPick, setForgeEquipPick] = useState<string | null>(null); // artifactId to equip

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 3600);
  };
  const applyState = useCallback(
    (d: { player?: PlayerT; heroes?: OwnedHero[] }) => {
      if (d.player) {
        setPlayer(d.player);
        localStorage.setItem("valhalla_player_id", String(d.player.id));
      }
      if (d.heroes) setHeroes(d.heroes);
      if (
        (d as unknown as { artifactReward?: { id: string; amount: number } })
          .artifactReward
      ) {
        const r = (
          d as unknown as { artifactReward: { id: string; amount: number } }
        ).artifactReward;
        showToast(`+${r.amount} fragmentos de ${artifactById(r.id).name}`);
      }
      if ((d as unknown as { runeReward?: string }).runeReward) {
        const rid = (d as unknown as { runeReward: string }).runeReward;
        const rn = runeById(rid);
        showToast(`Runa obtenida: ${rn.name} ${rn.rune} — ${rn.stat}`);
      }
      if (
        (
          d as unknown as {
            battle?: { runeDrop?: string; raidDamage?: number };
          }
        ).battle?.runeDrop
      ) {
        const b = (d as unknown as { battle: { runeDrop: string } }).battle;
        const rn = runeById(b.runeDrop);
        showToast(`¡Runa caída! ${rn.name} ${rn.rune}`);
      }
    },
    [],
  );

  useEffect(() => {
    const id = localStorage.getItem("valhalla_player_id");
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/game?playerId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.player) applyState(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [applyState]);

  const post = async (payload: Record<string, unknown>) => {
    const r = await fetch("/api/game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) {
      showToast(d.error || "Algo salió mal");
      return null;
    }
    applyState(d);
    return d;
  };

  const team = useMemo(
    () =>
      (player?.teamHeroIds || [])
        .map((id) => heroes.find((h) => h.id === id))
        .filter(Boolean) as OwnedHero[],
    [player, heroes],
  );
  const teamPower = useMemo(() => {
    if (!player) return 0;
    // power base + runes + artifacts (approx for display)
    return team.reduce((a, h) => {
      const hr = player.heroRunes?.[String(h.id)] || [];
      let bonus = 0;
      hr.forEach((id) => {
        if (id === "uruz") bonus += 220;
        if (id === "fehu") bonus += 160;
        if (id === "raidho") bonus += 90;
      });
      const aid = player.heroArtifacts?.[String(h.id)];
      if (aid) bonus += (player.artifactData?.[aid] || 0) * 320;
      return a + h.stats.power + bonus;
    }, 0);
  }, [team, player]);

  const detail = detailId
    ? heroes.find((h) => h.id === detailId) || null
    : null;
  const claimable = player
    ? QUESTS.filter(
        (q) =>
          !player.claimedQuests.includes(q.id) &&
          ((player as unknown as Record<string, number>)[q.metric] || 0) >=
            q.target,
      ).length
    : 0;
  const dailyReady =
    !player?.lastDailyAt ||
    Date.now() - new Date(player.lastDailyAt).getTime() > 8 * 3600 * 1000;
  const createPlayer = async () => {
    if (busy) return;
    setBusy(true);
    const d = await post({ action: "create_player", nickname });
    setBusy(false);
    if (d)
      showToast(
        d.resumed
          ? `¡Bienvenido de nuevo, ${nickname}!`
          : "¡Tu saga comienza! Ragnar y Lagertha se unen a ti.",
      );
  };
  const startBattle = async (
    mode: string,
    extra: Record<string, unknown> = {},
  ) => {
    if (!player || busy) return;
    if (team.length === 0) {
      showToast("Forma tu escuadrón en Héroes");
      setTab("heroes");
      return;
    }
    setBusy(true);
    setStageSel(null);
    const d = await post({
      action: "battle",
      playerId: player.id,
      mode,
      ...extra,
    });
    setBusy(false);
    if (d?.battle) setBattle(d.battle);
  };
  const toggleTeam = async (h: OwnedHero) => {
    if (!player) return;
    const ids = [...(player.teamHeroIds || [])];
    if (ids.includes(h.id)) {
      const d = await post({
        action: "set_team",
        playerId: player.id,
        heroIds: ids.filter((x) => x !== h.id),
      });
      if (d) showToast(`${h.def.name} sale del escuadrón`);
    } else {
      if (ids.length >= 5) {
        showToast("Escuadrón completo (5)");
        return;
      }
      const d = await post({
        action: "set_team",
        playerId: player.id,
        heroIds: [...ids, h.id],
      });
      if (d) showToast(`${h.def.name} se une`);
    }
  };
  const doSummon = async (count: number) => {
    if (!player || busy) return;
    setBusy(true);
    const d = await post({ action: "summon", playerId: player.id, count });
    setBusy(false);
    if (d?.summonResults) setSummonResults(d.summonResults);
  };
  const loadRank = () =>
    fetch("/api/game?leaderboard=1")
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard || []))
      .catch(() => {});

  if (loading)
    return (
      <div className="min-h-dvh bg-[#070a09] flex items-center justify-center">
        <div className="text-amber-400 font-display font-black tracking-widest animate-pulse">
          ᚹ VALHALLA ᚹ
        </div>
      </div>
    );

  if (!player)
    return (
      <div className="min-h-dvh bg-black flex justify-center">
        <div className="game-shell relative w-full max-w-[430px] h-dvh flex flex-col bg-[#0b100d] overflow-hidden sm:border-x sm:border-amber-900/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/valhalla.jpg"
            alt=""
            className="absolute inset-0 w-full h-[62%] object-cover"
          />
          <div className="absolute inset-x-0 top-0 h-[62%] bg-black/35" />
          <div className="relative flex-1 flex flex-col justify-end">
            <div className="px-6 pb-2 text-center">
              <div className="text-amber-300 text-[13px] font-rune font-extrabold tracking-[.35em]">
                ᚱ ᚨ ᚷ ᚾ ᚨ ᚱ ᚱ ᚾ ᛁ ᚨ
              </div>
              <h1
                className="font-display font-black text-[44px] leading-none text-amber-400 mt-1"
                style={{ textShadow: "0 4px 24px rgba(0,0,0,.9)" }}
              >
                VALHALLA
              </h1>
              <p className="font-display font-bold text-stone-100 tracking-widest text-sm">
                LEYENDAS NÓRDICAS
              </p>
              <p className="text-stone-300 text-[13px] mt-2 leading-snug">
                Reúne a{" "}
                <b className="text-white">
                  Ragnar, Lagertha, Ivar, Björn, Uhtred
                </b>{" "}
                y a los dioses <b className="text-white">Odín y Thor</b>.
              </p>
            </div>
            <div className="px-6 mt-4">
              <div className="flex justify-center gap-2 mb-4">
                {["ragnar", "lagertha", "thor", "odin", "ivar"].map((id) => (
                  <div
                    key={id}
                    className="floaty"
                    style={{ animationDelay: `${Math.random()}s` }}
                  >
                    <HeroAvatar heroId={id} size={54} />
                  </div>
                ))}
              </div>
              <div className="stone rune-border rounded-2xl p-4">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
                  Nombre de tu jarl
                </label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createPlayer()}
                  placeholder="Ej: Erik Sangre de Lobo"
                  maxLength={24}
                  className="mt-2 w-full bg-black/60 border border-stone-700 rounded-xl px-3.5 py-3 text-white placeholder:text-stone-500 outline-none focus:border-amber-500 font-semibold"
                />
                <button
                  onClick={createPlayer}
                  disabled={busy}
                  className="glow-gold mt-3 w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-display font-black rounded-xl py-3.5 text-[15px]"
                >
                  {busy ? "FORJANDO…" : "⚔ FORJAR MI LEYENDA"}
                </button>
                <p className="text-center text-stone-500 text-[11px] mt-2.5">
                  Recibes a Ragnar, Lagertha y runas iniciales. Mismo nombre =
                  continuar.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 py-4 text-center">
                {[
                  ["24", "Héroes"],
                  ["8", "Artefactos Æsir"],
                  ["6", "Runas élder"],
                ].map(([a, b]) => (
                  <div key={b} className="bg-black/45 rounded-xl py-2">
                    <div className="font-display font-black text-amber-300">
                      {a}
                    </div>
                    <div className="text-[10px] text-stone-400 font-semibold">
                      {b}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {toast && (
            <div className="absolute bottom-5 inset-x-6 bg-red-950 border border-red-700 text-red-100 text-sm font-semibold rounded-xl px-4 py-3 text-center z-50">
              {toast}
            </div>
          )}
        </div>
      </div>
    );

  const expBase = 90 * Math.pow(player.level - 1, 2),
    expNext = 90 * Math.pow(player.level, 2);
  const expPct = Math.min(
    100,
    ((player.exp - expBase) / Math.max(1, expNext - expBase)) * 100,
  );
  const nextStage = Math.min(TOTAL_STAGES, player.campaignStage + 1);
  const arenaOpponents = (() => {
    const s = new Set<number>();
    const o: number[] = [];
    for (let i = 0; o.length < 5 && i < 40; i++) {
      const v = (player.totalBattles * 7 + i * 5 + 2) % ARENA_NAMES.length;
      if (!s.has(v)) {
        s.add(v);
        o.push(v);
      }
    }
    return o.sort((a, b) => a - b);
  })();
  const rankTier =
    player.arenaPoints >= 1700
      ? "Rey del Norte"
      : player.arenaPoints >= 1450
        ? "Jarl"
        : player.arenaPoints >= 1250
          ? "Hersir"
          : player.arenaPoints >= 1100
            ? "Berserker"
            : "Thrall";
  const runeTotal = Object.values(player.runeInventory || {}).reduce(
    (a, b) => a + b,
    0,
  );
  const artifactCount = ARTIFACTS.filter(
    (a) => (player.artifactData?.[a.id] || 0) > 0,
  ).length;
  const jInfo = jormungandrStats(player.jormungandrScore || 0);
  const jHpPct = Math.max(
    0,
    ((player.jormungandrHp || 0) / (player.jormungandrMaxHp || 1)) * 100,
  );
  const passTier = seasonTier(player.seasonPassExp || 0);
  const passPct = (((player.seasonPassExp || 0) % 300) / 300) * 100;

  return (
    <div className="min-h-dvh bg-black flex justify-center">
      {/* Aviso orientación horizontal */}
      <div className="rotate-banner hidden fixed inset-0 z-[100] bg-black/95 flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-2xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mb-4 animate-bounce">
          <svg
            viewBox="0 0 24 24"
            className="w-12 h-12 text-amber-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M8 12h8M12 8v8" />
          </svg>
        </div>
        <h2 className="font-display font-black text-2xl text-amber-400">
          GIRA TU MÓVIL
        </h2>
        <p className="text-stone-300 text-sm mt-2 max-w-[280px]">
          Valhalla está diseñado para batallas épicas en{" "}
          <b className="text-white">pantalla horizontal</b>.
        </p>
        <div className="mt-4 text-4xl animate-pulse">⟳</div>
      </div>

      <div className="game-shell relative w-full max-w-[430px] h-dvh flex flex-col bg-[#0b100d] overflow-hidden sm:border-x sm:border-amber-900/40">
        {" "}
        <header className="game-header shrink-0 wood border-b border-amber-900/50 px-3 pt-2.5 pb-2 z-20">
          <div className="header-main flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-600 border-2 border-amber-300 flex items-center justify-center font-display font-black text-black text-lg shrink-0">
              {player.nickname[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 w-[98px]">
              <div className="font-bold text-[13px] truncate leading-tight">
                {player.nickname}
              </div>
              <div className="text-[10px] text-amber-300 font-extrabold">
                Nv.{player.level} · {rankTier} · Racha {player.dailyStreak || 0}
                🔥
              </div>
              <div className="h-1.5 bg-black/70 rounded-full mt-0.5 overflow-hidden flex">
                <div
                  className="h-full bg-teal-400"
                  style={{ width: `${expPct}%` }}
                />
                <div
                  className="flex-1 bg-amber-500/30"
                  style={{ width: `${passPct}%` }}
                />
              </div>
            </div>
            <div className="flex-1" />
            <Res
              icon={<Beer size={13} className="text-amber-300" />}
              value={player.energy}
              onPlus={() => setModal("shop")}
            />
            <Res
              icon={<Coins size={13} className="text-yellow-400" />}
              value={fmt(player.gold)}
              onPlus={() => setModal("shop")}
            />
            <Res
              icon={<Gem size={13} className="text-cyan-300" />}
              value={fmt(player.gems)}
              onPlus={() => setModal("shop")}
            />
          </div>
          <div className="header-actions flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setTab("forge")}
              className="shrink-0 flex items-center gap-1.5 bg-black/50 border border-amber-900/40 rounded-full px-2.5 py-1"
            >
              <Hammer size={13} className="text-amber-300" />
              <span className="text-[10px] font-extrabold">FORJA</span>
              <span className="text-[9px] text-stone-400">
                {artifactCount}/8
              </span>
            </button>
            <button
              onClick={() => setTab("runes")}
              className="shrink-0 flex items-center gap-1.5 bg-black/50 border border-amber-900/40 rounded-full px-2.5 py-1"
            >
              <Hexagon size={13} className="text-amber-300" />
              <span className="text-[10px] font-extrabold">RUNAS</span>
              <span className="text-[9px] text-stone-400">
                {runeTotal} libres
              </span>
            </button>
            <button
              onClick={() => setTab("raid")}
              className="shrink-0 flex items-center gap-1.5 bg-black/50 border border-amber-900/40 rounded-full px-2.5 py-1"
            >
              <Target size={13} className="text-amber-300" />
              <span className="text-[10px] font-extrabold">JÖRMUNGANDR</span>
              <span className="text-[9px] text-stone-400">
                {Math.round(jHpPct)}% HP
              </span>
            </button>
            <button
              onClick={() => setTab("pass")}
              className="shrink-0 flex items-center gap-1.5 bg-black/50 border border-amber-900/40 rounded-full px-2.5 py-1"
            >
              <Award size={13} className="text-amber-300" />
              <span className="text-[10px] font-extrabold">PASE</span>
              <span className="text-[9px] text-stone-400">
                Tier {passTier}/20
              </span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
          {tab === "home" && (
            <div>
              <div className="home-hero relative h-44">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/valhalla.jpg"
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-3.5">
                  <div className="text-[10px] tracking-[.3em] text-amber-300 font-extrabold">
                    KATTEGAT · TU ALDEA
                  </div>
                  <div className="font-display font-black text-xl leading-tight">
                    El salón aguarda, {player.nickname.split(" ")[0]}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {team.map((h) => (
                      <HeroAvatar key={h.id} heroId={h.heroId} size={38} />
                    ))}
                    {Array.from({ length: 5 - team.length }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[38px] h-[38px] rounded-xl border-2 border-dashed border-stone-500 bg-black/50"
                      />
                    ))}
                    <div className="ml-auto text-right">
                      <div className="text-[9px] text-stone-300 font-bold uppercase">
                        Poder
                      </div>
                      <div className="font-display font-black text-amber-300 text-lg leading-none">
                        {fmt(teamPower)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 space-y-3">
                <button
                  onClick={() => {
                    setTab("campaign");
                    setChapterSel(Math.ceil(nextStage / STAGES_PER_CHAPTER));
                  }}
                  className="glow-gold w-full bg-amber-500 text-black rounded-2xl p-3.5 flex items-center gap-3 text-left"
                >
                  <Swords size={26} />
                  <span className="flex-1">
                    <span className="block font-display font-black">
                      CONTINUAR LA SAGA
                    </span>
                    <span className="block text-xs font-semibold opacity-80">
                      {
                        CHAPTERS[Math.ceil(nextStage / STAGES_PER_CHAPTER) - 1]
                          .name
                      }{" "}
                      · Etapa {((nextStage - 1) % 8) + 1}/8 ·{" "}
                      {player.campaignStage}/{TOTAL_STAGES}
                    </span>
                  </span>
                  <ChevronRight />
                </button>

                {dailyReady && (
                  <button
                    onClick={async () => {
                      const d = await post({
                        action: "claim_daily",
                        playerId: player.id,
                      });
                      if (d)
                        showToast(
                          `Ofrenda diaria · Racha ${d.player.dailyStreak} · +${d.dailyReward.gems} piedras`,
                        );
                    }}
                    className="w-full stone rune-border rounded-2xl p-3 flex items-center gap-3 text-left"
                  >
                    <Gift className="text-rose-400" size={24} />
                    <span className="flex-1">
                      <b className="text-sm block">
                        Ofrenda diaria{" "}
                        {player.dailyStreak
                          ? `(racha ${player.dailyStreak})`
                          : ""}
                      </b>
                      <span className="text-xs text-stone-400">
                        240 piedras · 1.200 oro · 60 energía{" "}
                        {((player.dailyStreak || 0) + 1) % 7 === 0
                          ? "· ¡BONUS 500 piedras!"
                          : ""}
                      </span>
                    </span>
                    <span className="bg-rose-600 text-xs font-extrabold px-2 py-1 rounded-lg">
                      RECLAMAR
                    </span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <MenuCard
                    img="/images/drakkar.jpg"
                    title="Campaña"
                    sub={`${player.campaignStage}/${TOTAL_STAGES} etapas`}
                    icon={<MapIcon size={17} />}
                    onClick={() => setTab("campaign")}
                  />
                  <MenuCard
                    img="/images/valhalla.jpg"
                    title="Arena Holmgang"
                    sub={`${player.arenaPoints} pts · ${rankTier}`}
                    icon={<Trophy size={17} />}
                    onClick={() => {
                      setTab("arena");
                      loadRank();
                    }}
                  />
                  <MenuCard
                    img="/images/yggdrasil.jpg"
                    title="Torre Yggdrasil"
                    sub={`Piso ${player.towerFloor}`}
                    icon={<TreePine size={17} />}
                    onClick={() => startBattle("tower")}
                    action="ESCALAR"
                  />
                  <MenuCard
                    img="/images/yggdrasil.jpg"
                    title="Altar de Odín"
                    sub="Invoca dioses y jarls"
                    icon={<Sparkles size={17} />}
                    onClick={() => setTab("summon")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <HomeAction
                    title="Forja Æsir"
                    desc={`${artifactCount}/8 forjados`}
                    color="#d97706"
                    onClick={() => setTab("forge")}
                    icon={<Hammer size={18} />}
                  />
                  <HomeAction
                    title="Runas Élder"
                    desc={`${runeTotal} runas libres`}
                    color="#7c3aed"
                    onClick={() => setTab("runes")}
                    icon={<Hexagon size={18} />}
                  />
                  <HomeAction
                    title="Jörmungandr"
                    desc={jInfo.name}
                    color="#064e3b"
                    onClick={() => setTab("raid")}
                    icon={<Target size={18} />}
                  />
                  <HomeAction
                    title="Pase Einherjar"
                    desc={`Tier ${passTier}/20`}
                    color="#a16207"
                    onClick={() => setTab("pass")}
                    icon={<Award size={18} />}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => setModal("quests")}
                    className="stone rune-border rounded-xl p-2.5 text-center relative"
                  >
                    <ScrollText className="mx-auto text-amber-300" size={20} />
                    <div className="text-xs font-extrabold mt-1">Misiones</div>
                    {claimable > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-rose-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                        {claimable}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setModal("shop")}
                    className="stone rune-border rounded-xl p-2.5 text-center"
                  >
                    <Store className="mx-auto text-amber-300" size={20} />
                    <div className="text-xs font-extrabold mt-1">Mercado</div>
                  </button>
                  <button
                    onClick={() => {
                      setModal("rank");
                      loadRank();
                    }}
                    className="stone rune-border rounded-xl p-2.5 text-center"
                  >
                    <Crown className="mx-auto text-amber-300" size={20} />
                    <div className="text-xs font-extrabold mt-1">
                      Salón Fama
                    </div>
                  </button>
                </div>

                <div className="stone rune-border rounded-2xl p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-sm text-amber-200">
                      TU ESCUADRÓN
                    </h3>
                    <button
                      onClick={() => setTab("heroes")}
                      className="text-xs font-extrabold text-teal-300"
                    >
                      EDITAR ›
                    </button>
                  </div>
                  <div className="mt-2.5 space-y-2">
                    {team.map((h) => {
                      const aid = player.heroArtifacts?.[String(h.id)];
                      const runes = player.heroRunes?.[String(h.id)] || [];
                      return (
                        <button
                          key={h.id}
                          onClick={() => setDetailId(h.id)}
                          className="w-full flex items-center gap-2.5 bg-black/35 rounded-xl p-2 text-left"
                        >
                          <HeroAvatar heroId={h.heroId} size={44} />
                          <span className="flex-1 min-w-0">
                            <b className="text-[13px] block truncate">
                              {h.def.name}
                            </b>
                            <span className="text-[11px] text-stone-400">
                              {h.def.role} · Nv.{h.level}{" "}
                              {aid ? `· ${artifactById(aid).name}` : ""}
                            </span>
                            <span className="flex gap-1 mt-0.5">
                              {runes.map((rid) => (
                                <span
                                  key={rid}
                                  className="text-[9px] bg-stone-800 px-1 rounded font-bold"
                                >
                                  {runeById(rid).rune}
                                </span>
                              ))}
                              {runes.length === 0 && (
                                <span className="text-[9px] text-stone-500">
                                  sin runas
                                </span>
                              )}
                            </span>
                          </span>
                          <Stars n={h.stars} />
                          <span className="font-display font-black text-amber-300 text-sm w-14 text-right">
                            {fmt(h.stats.power)}
                          </span>
                        </button>
                      );
                    })}
                    {team.length === 0 && (
                      <p className="text-stone-400 text-sm text-center py-2">
                        Aún no tienes escuadrón.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    [player.totalWins, "Victorias"],
                    [player.arenaWins, "Arena"],
                    [heroes.length + "/24", "Héroes"],
                    [
                      (player.jormungandrScore || 0) > 0
                        ? fmt(player.jormungandrScore || 0)
                        : "—",
                      "Daño Jörm",
                    ],
                  ].map(([v, l]) => (
                    <div
                      key={l as string}
                      className="bg-black/40 rounded-xl py-2.5"
                    >
                      <div className="font-display font-black text-amber-300 text-[13px]">
                        {v as string}
                      </div>
                      <div className="text-[9px] text-stone-400 font-bold uppercase">
                        {l as string}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-[11px] text-stone-500 pb-1">
                  Añade a pantalla de inicio para jugar como app nativa.
                </p>
              </div>
            </div>
          )}

          {tab === "heroes" && (
            <div className="p-3 space-y-3">
              <div className="stone rune-border rounded-2xl p-3">
                <div className="flex justify-between items-center">
                  <h2 className="font-display font-bold text-amber-200 text-sm">
                    ESCUADRÓN
                  </h2>
                  <span className="text-xs font-extrabold text-amber-300">
                    PODER {fmt(teamPower)}
                  </span>
                </div>
                <div className="flex gap-2 mt-2.5 justify-between">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const h = team[i];
                    return h ? (
                      <button
                        key={h.id}
                        onClick={() => setDetailId(h.id)}
                        className="text-center relative"
                      >
                        <HeroAvatar heroId={h.heroId} size={58} />
                        <div className="text-[9px] font-bold mt-1 text-stone-300">
                          Lv.{h.level}
                        </div>
                        {h.def.role === "Tanque" && (
                          <Shield
                            size={10}
                            className="absolute -top-1 -right-1 text-teal-300"
                          />
                        )}
                      </button>
                    ) : (
                      <div
                        key={i}
                        className="w-[58px] h-[58px] rounded-xl border-2 border-dashed border-stone-600 bg-black/40 flex items-center justify-center text-stone-500"
                      >
                        <Plus />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {["Todos", "Vikingos", "Asgard", "Valkirias", "Jotunheim"].map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setFactionFilter(f)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-extrabold border ${factionFilter === f ? "bg-amber-500 text-black border-amber-400" : "bg-black/50 text-stone-300 border-stone-700"}`}
                    >
                      {f}
                    </button>
                  ),
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[...heroes]
                  .filter(
                    (h) =>
                      factionFilter === "Todos" ||
                      h.def.faction === factionFilter,
                  )
                  .sort((a, b) => b.stats.power - a.stats.power)
                  .map((h) => {
                    const runes = player.heroRunes?.[String(h.id)] || [];
                    const aid = player.heroArtifacts?.[String(h.id)];
                    return (
                      <button
                        key={h.id}
                        onClick={() => setDetailId(h.id)}
                        className="stone rounded-xl p-2 text-center relative border border-stone-800"
                      >
                        {team.some((t) => t.id === h.id) && (
                          <span className="absolute top-1 left-1 z-10 bg-teal-500 text-black text-[8px] font-black px-1 rounded">
                            EQUIPO
                          </span>
                        )}
                        {aid && (
                          <span className="absolute top-1 right-1 z-10 bg-amber-500 text-black text-[8px] font-black px-1 rounded">
                            ⚒
                          </span>
                        )}
                        <div className="flex justify-center">
                          <HeroAvatar heroId={h.heroId} size={64} />
                        </div>
                        <div className="text-[11px] font-extrabold mt-1.5 leading-tight h-7 overflow-hidden">
                          {h.def.name}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Nv.{h.level} · {h.def.role}
                        </div>
                        <div className="flex justify-center gap-0.5 mt-0.5">
                          {runes.slice(0, 3).map((rid) => (
                            <span
                              key={rid}
                              className="text-[8px] bg-black/60 px-0.5 rounded"
                            >
                              {runeById(rid).rune}
                            </span>
                          ))}
                        </div>
                        <div className="font-display font-black text-amber-300 text-[13px]">
                          {fmt(h.stats.power)}
                        </div>
                      </button>
                    );
                  })}
              </div>

              <h3 className="font-display font-bold text-stone-300 text-sm pt-1">
                POR DESCUBRIR · {heroes.length}/24
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {HEROES.filter(
                  (d) =>
                    !heroes.some((h) => h.heroId === d.id) &&
                    (factionFilter === "Todos" || d.faction === factionFilter),
                ).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setViewDef(d)}
                    className="text-center opacity-70"
                  >
                    <div className="flex justify-center grayscale brightness-[.55]">
                      <HeroAvatar heroId={d.id} size={56} />
                    </div>
                    <div className="text-[9px] font-bold mt-1 text-stone-400 leading-tight">
                      {d.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "campaign" && (
            <div className="campaign-screen p-3 space-y-3">
              <h2 className="font-display font-black text-lg text-amber-200">
                SAGAS · CAMPAÑA
              </h2>
              <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x">
                {CHAPTERS.map((ch) => {
                  const unlocked =
                    player.campaignStage >= (ch.id - 1) * STAGES_PER_CHAPTER ||
                    ch.id === 1;
                  const done = Math.min(
                    STAGES_PER_CHAPTER,
                    Math.max(
                      0,
                      player.campaignStage - (ch.id - 1) * STAGES_PER_CHAPTER,
                    ),
                  );
                  return (
                    <button
                      key={ch.id}
                      onClick={() => unlocked && setChapterSel(ch.id)}
                      className={`relative shrink-0 w-40 h-24 rounded-2xl overflow-hidden text-left snap-start border-2 ${chapterSel === ch.id ? "border-amber-400" : "border-transparent"} ${unlocked ? "" : "grayscale brightness-50"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ch.img}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/55 p-2.5 flex flex-col justify-end">
                        <div className="text-[9px] font-extrabold text-amber-300 tracking-widest">
                          CAPÍTULO {ch.id} · {done}/8
                        </div>
                        <div className="font-display font-bold text-[13px] leading-tight">
                          {ch.name}
                        </div>
                        {!unlocked && (
                          <Lock
                            size={15}
                            className="absolute top-2 right-2 text-stone-300"
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-stone-400 text-xs italic">
                {CHAPTERS[chapterSel - 1].desc}
              </p>
              <div className="stone rune-border rounded-2xl p-3">
                <div className="grid grid-cols-4 gap-2.5">
                  {Array.from({ length: STAGES_PER_CHAPTER }).map((_, i) => {
                    const sid = (chapterSel - 1) * STAGES_PER_CHAPTER + i + 1;
                    const cleared = sid <= player.campaignStage,
                      isNext = sid === nextStage,
                      locked = sid > nextStage;
                    const info = stageInfo(sid);
                    return (
                      <button
                        key={sid}
                        title={info.stageName}
                        aria-label={`${info.stageName}${info.isBoss ? ", jefe" : ""}`}
                        disabled={locked}
                        onClick={() => setStageSel(sid)}
                        className={`campaign-stage relative aspect-square rounded-2xl flex flex-col items-center justify-center font-display font-black border-2 ${cleared ? "bg-teal-900/70 border-teal-600 text-teal-200" : isNext ? "bg-amber-500 border-amber-300 text-black glow-gold" : "bg-black/60 border-stone-700 text-stone-500"}`}
                      >
                        {info.isBoss ? (
                          <Skull size={20} />
                        ) : (
                          <span className="text-lg">{i + 1}</span>
                        )}
                        <span className="text-[8px] font-body font-extrabold uppercase">
                          {info.isBoss
                            ? "Jefe"
                            : cleared
                              ? "Hecho"
                              : isNext
                                ? "Siguiente"
                                : "Bloq"}
                        </span>
                        {cleared && (
                          <Check size={13} className="absolute top-1 right-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-stone-400">
                  <Beer size={14} className="text-amber-300" /> 6 energía ·
                  Tienes <b className="text-white">{player.energy}</b>
                </div>
              </div>
              <div className="tower-card relative rounded-2xl overflow-hidden rune-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/yggdrasil.jpg"
                  alt=""
                  className="tower-image w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black/55 p-3.5 flex flex-col justify-end">
                  <div className="font-display font-black text-amber-200">
                    TORRE DE YGGDRASIL
                  </div>
                  <p className="text-xs text-stone-300">
                    Escala sin energía. Piso {player.towerFloor} · Cada 5 pisos:
                    runas + piedras.
                  </p>
                  <button
                    onClick={() => startBattle("tower")}
                    disabled={busy}
                    className="mt-2 self-start bg-teal-500 text-black font-extrabold text-sm rounded-lg px-4 py-2 disabled:opacity-60"
                  >
                    Piso {player.towerFloor + 1} ›
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "arena" && (
            <div className="p-3 space-y-3">
              <div className="relative rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/valhalla.jpg"
                  alt=""
                  className="w-full h-28 object-cover"
                />
                <div className="absolute inset-0 bg-black/55 p-3.5 flex flex-col justify-end">
                  <div className="font-display font-black text-lg text-amber-300">
                    ARENA HOLMGANG
                  </div>
                  <div className="text-xs text-stone-200">
                    <b>{player.arenaPoints}</b> pts · {rankTier} ·{" "}
                    {player.arenaWins} victorias
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black/40 rounded-xl p-2.5">
                <Shield size={16} className="text-amber-300 shrink-0" />
                <p className="text-[11px] text-stone-300">
                  Tu poder: <b className="text-amber-300">{fmt(teamPower)}</b>.
                  Sin energía. Gana runas y piedras.
                </p>
              </div>
              {arenaOpponents.map((idx) => {
                const est = Math.round(
                  teamPower * (0.78 + idx * 0.045 + player.arenaWins * 0.004),
                );
                return (
                  <div
                    key={idx}
                    className="stone rune-border rounded-2xl p-3 flex items-center gap-3"
                  >
                    <div className="w-11 h-11 rounded-full bg-red-950 border-2 border-red-800 flex items-center justify-center font-display font-black text-red-300">
                      {ARENA_NAMES[idx][0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-sm truncate">
                        {ARENA_NAMES[idx]}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        ~{fmt(est)} ·{" "}
                        <span
                          className={
                            est > teamPower
                              ? "text-red-400 font-bold"
                              : "text-teal-300 font-bold"
                          }
                        >
                          {est > teamPower ? "Duro" : "A tu alcance"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => startBattle("arena", { opponentIdx: idx })}
                      disabled={busy}
                      className="bg-amber-500 text-black font-black text-xs rounded-lg px-3 py-2.5 disabled:opacity-60"
                    >
                      RETAR
                    </button>
                  </div>
                );
              })}
              <RankList rows={leaderboard} meId={player.id} />
            </div>
          )}

          {tab === "summon" && (
            <div>
              <div className="relative h-52">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/yggdrasil.jpg"
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center p-4 text-center">
                  <div className="text-amber-300 font-display font-black text-xl">
                    ALTAR DE ODÍN
                  </div>
                  <p className="text-stone-200 text-xs mt-1 max-w-[270px]">
                    Las valkirias traen héroes del Valhalla.
                  </p>
                  <div className="flex gap-2 mt-3">
                    {["odin", "thor", "ragnar", "freya", "hel"].map((id) => (
                      <button
                        key={id}
                        onClick={() => setViewDef(heroById(id))}
                        className="floaty"
                      >
                        <HeroAvatar heroId={id} size={46} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {[
                    ["Mítico", "3%", "#f43f5e"],
                    ["Legendario", "12%", "#f59e0b"],
                    ["Épico", "30%", "#a78bfa"],
                    ["Raro", "55%", "#38bdf8"],
                  ].map(([r, p, c]) => (
                    <div
                      key={r as string}
                      className="bg-black/50 rounded-lg py-2"
                    >
                      <div
                        className="font-black"
                        style={{ color: c as string }}
                      >
                        {p as string}
                      </div>
                      <div className="text-[9px] font-bold text-stone-400 uppercase">
                        {r as string}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => doSummon(1)}
                  disabled={busy}
                  className="w-full stone rune-border rounded-2xl p-3.5 flex items-center gap-3 disabled:opacity-60"
                >
                  <Sparkles className="text-cyan-300" size={24} />
                  <span className="flex-1 text-left">
                    <b className="block font-display">INVOCAR ×1</b>
                    <span className="text-xs text-stone-400">
                      Una valkiria, un héroe
                    </span>
                  </span>
                  <span className="flex items-center gap-1 font-black text-cyan-300">
                    <Gem size={16} />
                    270
                  </span>
                </button>
                <button
                  onClick={() => doSummon(10)}
                  disabled={busy}
                  className="glow-gold w-full bg-amber-500 text-black rounded-2xl p-3.5 flex items-center gap-3 disabled:opacity-60"
                >
                  <Flame size={24} />
                  <span className="flex-1 text-left">
                    <b className="block font-display">INVOCAR ×10</b>
                    <span className="text-xs font-semibold opacity-80">
                      ¡Épico+ garantizado! Ahorras 200
                    </span>
                  </span>
                  <span className="flex items-center gap-1 font-black">
                    <Gem size={16} />
                    2.500
                  </span>
                </button>
                <p className="text-[11px] text-stone-500 text-center">
                  Duplicados → fragmentos para ascender a 6★. Las batallas
                  también dan runas.
                </p>
                <button
                  onClick={() => setModal("shop")}
                  className="w-full bg-black/50 border border-stone-700 rounded-xl py-2.5 text-sm font-extrabold text-amber-300"
                >
                  Conseguir piedras
                </button>
              </div>
            </div>
          )}

          {tab === "forge" && (
            <div className="p-3 space-y-3">
              <h2 className="font-display font-black text-lg text-amber-300">
                FORJA ÆSIR
              </h2>
              <p className="text-stone-400 text-xs">
                8 artefactos legendarios. Sube de nivel con oro + fragmentos
                (caen en Torre y Jörmungandr). Equipa 1 por héroe.
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {ARTIFACTS.map((a) => {
                  const lvl = player.artifactData?.[a.id] || 0;
                  const shards = player.artifactData?.[a.id + "_shards"] || 0;
                  const need = (lvl + 1) * 10;
                  const goldNeed = (lvl + 1) * 1500;
                  const maxed = lvl >= 5;
                  const equippedCount = Object.values(
                    player.heroArtifacts || {},
                  ).filter((v) => v === a.id).length;
                  return (
                    <div
                      key={a.id}
                      className="stone rune-border rounded-2xl p-3 flex gap-3"
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center font-display font-black text-xl shrink-0"
                        style={{
                          background: a.color,
                          color: "#fff",
                          border: `2px solid ${lvl > 0 ? "#fbbf24" : "#57534e"}`,
                        }}
                      >
                        {a.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-black text-[13px]">
                          {a.name}{" "}
                          {lvl > 0 && (
                            <span className="text-amber-300">Lv.{lvl}</span>
                          )}{" "}
                          {equippedCount > 0 && (
                            <span className="text-teal-300 text-[10px]">
                              · equipado
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-400 truncate">
                          {a.lore}
                        </div>
                        <div
                          className="text-[11px] font-bold mt-1"
                          style={{ color: a.color }}
                        >
                          {a.bonus}
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          <button
                            disabled={maxed || busy}
                            onClick={async () => {
                              const d = await post({
                                action: "artifact_upgrade",
                                playerId: player.id,
                                artifactId: a.id,
                              });
                              if (d) showToast(`${a.name} → Lv.${lvl + 1}`);
                            }}
                            className={`text-[11px] font-black px-3 py-1.5 rounded-lg ${maxed ? "bg-stone-700 text-stone-400" : "bg-amber-500 text-black"}`}
                          >
                            {maxed
                              ? "MAX Lv.5"
                              : `Mejorar · ${goldNeed} oro · ${need} frag`}
                          </button>
                          {lvl > 0 && (
                            <button
                              onClick={() => setForgeEquipPick(a.id)}
                              className="text-[11px] font-bold bg-stone-700 text-stone-200 px-3 py-1.5 rounded-lg"
                            >
                              Equipar
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-500 mt-1">
                          Fragmentos: {shards} · Portador: {a.bearer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={async () => {
                  const d = await post({
                    action: "artifact_claim_shards",
                    playerId: player.id,
                  });
                  if (d) showToast("Fragmentos reclamados");
                }}
                disabled={busy}
                className="w-full bg-teal-600 text-white font-bold rounded-xl py-2.5 text-sm"
              >
                Reclamar 8 fragmentos aleatorios (demo)
              </button>

              {forgeEquipPick && (
                <div className="stone rune-border rounded-2xl p-3">
                  <div className="font-bold text-sm">
                    ¿A quién le confías{" "}
                    <span className="text-amber-300">
                      {artifactById(forgeEquipPick).name}
                    </span>
                    ?
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {heroes.slice(0, 12).map((h) => {
                      const cur = player.heroArtifacts?.[String(h.id)];
                      return (
                        <button
                          key={h.id}
                          onClick={async () => {
                            await post({
                              action: "artifact_equip",
                              playerId: player.id,
                              heroDbId: String(h.id),
                              artifactId: forgeEquipPick,
                            });
                            setForgeEquipPick(null);
                            showToast(
                              `${h.def.name} empuña ${artifactById(forgeEquipPick).name}`,
                            );
                          }}
                          className={`stone rounded-xl p-2 text-center border ${cur === forgeEquipPick ? "border-amber-400" : "border-stone-800"}`}
                        >
                          <div className="flex justify-center">
                            <HeroAvatar heroId={h.heroId} size={56} />
                          </div>
                          <div className="text-[10px] font-bold mt-1 truncate">
                            {h.def.name}
                          </div>
                          {cur === forgeEquipPick && (
                            <div className="text-[9px] text-amber-300 font-bold">
                              EQUIPADO
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setForgeEquipPick(null)}
                    className="mt-2 w-full text-stone-400 text-xs font-bold py-1"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "runes" && (
            <div className="p-3 space-y-3">
              <h2 className="font-display font-black text-lg text-amber-300">
                RUNAS ÉLDER
              </h2>
              <p className="text-stone-400 text-xs">
                6 runas. Caen en batallas (22%). Equipa hasta 3 por héroe. Se
                pueden desequipar gratis. Tira runas con oro.
              </p>
              <div className="stone rune-border rounded-2xl p-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm">
                    Inventario · {runeTotal} piezas
                  </h3>
                  <button
                    disabled={busy}
                    onClick={async () => {
                      const d = await post({
                        action: "rune_roll",
                        playerId: player.id,
                      });
                      if (d) showToast("Runa tallada");
                    }}
                    className="bg-amber-500 text-black text-xs font-black px-3 py-1.5 rounded-lg"
                  >
                    Tallar (800 oro)
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2.5">
                  {RUNES.map((r) => {
                    const have = player.runeInventory?.[r.id] || 0;
                    return (
                      <div
                        key={r.id}
                        className={`rounded-xl p-2.5 text-center border ${have ? "bg-black/40 border-amber-700/40" : "bg-black/20 border-stone-800 opacity-60"}`}
                      >
                        <div
                          className="font-rune text-2xl"
                          style={{ color: r.color }}
                        >
                          {r.rune}
                        </div>
                        <div className="font-bold text-[11px]">{r.name}</div>
                        <div className="text-[10px] text-stone-400">
                          {r.stat}
                        </div>
                        <div
                          className={`text-xs font-black mt-1 ${have ? "text-amber-300" : "text-stone-500"}`}
                        >
                          x{have}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                {heroes.slice(0, 10).map((h) => {
                  const equipped = player.heroRunes?.[String(h.id)] || [];
                  return (
                    <div
                      key={h.id}
                      className="stone rounded-xl p-2.5 flex items-center gap-2.5"
                    >
                      <HeroAvatar heroId={h.heroId} size={46} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[13px] truncate">
                          {h.def.name}{" "}
                          <span className="text-amber-300 font-display">
                            {fmt(h.stats.power)}
                          </span>
                        </div>
                        <div className="flex gap-1 mt-1">
                          {[0, 1, 2].map((i) => {
                            const rid = equipped[i];
                            return rid ? (
                              <button
                                key={i}
                                onClick={async () => {
                                  await post({
                                    action: "rune_unequip",
                                    playerId: player.id,
                                    heroDbId: String(h.id),
                                    index: i,
                                  });
                                }}
                                className="w-9 h-9 rounded-lg flex flex-col items-center justify-center text-[14px] font-rune border"
                                style={{
                                  background: runeById(rid).color + "30",
                                  borderColor: runeById(rid).color,
                                  color: runeById(rid).color,
                                }}
                              >
                                {runeById(rid).rune}
                                <span className="text-[7px] font-body">
                                  quitar
                                </span>
                              </button>
                            ) : (
                              <span
                                key={i}
                                className="w-9 h-9 rounded-lg bg-black/40 border border-dashed border-stone-600"
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {RUNES.filter(
                          (r) => (player.runeInventory?.[r.id] || 0) > 0,
                        )
                          .slice(0, 3)
                          .map((r) => (
                            <button
                              key={r.id}
                              disabled={busy || equipped.length >= 3}
                              onClick={async () => {
                                await post({
                                  action: "rune_equip",
                                  playerId: player.id,
                                  heroDbId: String(h.id),
                                  runeId: r.id,
                                });
                              }}
                              className="text-[10px] font-bold bg-stone-700 text-white px-2 py-1 rounded-lg disabled:opacity-40"
                            >
                              +{r.rune}
                            </button>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "raid" && (
            <div className="p-3 space-y-3">
              <div className="relative rounded-2xl overflow-hidden h-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/bf-helheim.jpg"
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/45 p-3.5 flex flex-col justify-end">
                  <div className="font-display font-black text-lg text-emerald-200">
                    JÖRMUNGANDR
                  </div>
                  <div className="text-xs text-stone-200">
                    {jInfo.name} · Tu récord:{" "}
                    <b>{fmt(player.jormungandrScore || 0)} daño</b>
                  </div>
                  <div className="h-3 bg-black/70 rounded-full border border-emerald-800 mt-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${jHpPct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-emerald-200 font-bold mt-1">
                    {fmt(player.jormungandrHp || 0)} /{" "}
                    {fmt(player.jormungandrMaxHp || 50000)} PV
                  </div>
                </div>
              </div>
              <p className="text-stone-400 text-xs">
                Ataca con tu escuadrón. El daño infligido es tu puntuación
                permanente (compites en el Salón de la Fama). Al derrotarla: 2
                runas + 12 fragmentos + 120 piedras + renace más fuerte. Cuesta
                8 energía.
              </p>
              <button
                onClick={() => startBattle("raid")}
                disabled={busy || (player.energy || 0) < 8}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-display font-black rounded-xl py-3.5 flex items-center justify-center gap-2 text-lg"
              >
                <Target size={20} /> ¡ATACAR A LA SERPIENTE!
              </button>
              {player.energy < 8 && (
                <p className="text-red-300 text-xs text-center font-bold">
                  Necesitas 8 de energía
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  [fmt(player.jormungandrScore || 0), "Daño total"],
                  ["120", "Piedras al derrotar"],
                  ["12", "Fragmentos Æsir"],
                ].map(([v, l]) => (
                  <div key={l} className="bg-black/40 rounded-xl py-2.5">
                    <div className="font-display font-black text-emerald-300">
                      {v}
                    </div>
                    <div className="text-[9px] text-stone-400 font-bold">
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "pass" && (
            <div className="p-3 space-y-3">
              <h2 className="font-display font-black text-lg text-amber-300">
                PASE EINHERJAR
              </h2>
              <div className="stone rune-border rounded-2xl p-3 flex items-center gap-3">
                <Award className="text-amber-400" size={26} />
                <div className="flex-1">
                  <div className="font-bold text-sm">
                    Temporada 1 · Tier {passTier}/20
                  </div>
                  <div className="h-2 bg-black/60 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${passPct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-stone-400 mt-1">
                    {player.seasonPassExp || 0} EXP de pase · Gana EXP en
                    cualquier batalla
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: 20 }).map((_, i) => {
                  const tier = i + 1;
                  const unlocked = passTier >= tier;
                  const claimed = (player.claimedQuests || []).includes(
                    `pass_${tier}`,
                  );
                  const big = tier % 5 === 0;
                  return (
                    <div
                      key={tier}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${unlocked ? "bg-black/40 border-amber-700/30" : "bg-black/20 border-stone-800 opacity-60"}`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-black text-sm shrink-0 ${big ? "bg-amber-500 text-black" : "bg-stone-700 text-stone-300"}`}
                      >
                        {tier}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-xs">
                          {big ? "Cofre grande" : "Recompensa"} · Tier {tier}
                        </div>
                        <div className="text-[11px] text-stone-400 flex gap-2">
                          <span className="flex items-center gap-1">
                            <Gem size={11} className="text-cyan-300" />
                            {big ? 300 : 80}
                          </span>
                          <span className="flex items-center gap-1">
                            <Coins size={11} className="text-yellow-400" />
                            {big ? 4000 : 1200}
                          </span>
                        </div>
                      </div>
                      {claimed ? (
                        <span className="text-teal-300 font-black text-xs flex items-center gap-1">
                          <Check size={14} /> Hecho
                        </span>
                      ) : (
                        <button
                          disabled={!unlocked || busy}
                          onClick={async () => {
                            const d = await post({
                              action: "claim_pass",
                              playerId: player.id,
                              tier,
                            });
                            if (d) showToast(`¡Tier ${tier} reclamado!`);
                          }}
                          className={`text-xs font-black px-3 py-1.5 rounded-lg ${unlocked ? "bg-amber-500 text-black" : "bg-stone-700 text-stone-500"}`}
                        >
                          Reclamar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
        <nav
          className="absolute bottom-0 inset-x-0 wood border-t border-amber-900/60 z-20"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="grid grid-cols-5 px-1 py-1.5">
            <NavBtn
              active={tab === "home"}
              icon={<Castle size={21} />}
              label="Aldea"
              onClick={() => setTab("home")}
            />
            <NavBtn
              active={tab === "heroes"}
              icon={<Users size={21} />}
              label="Héroes"
              onClick={() => setTab("heroes")}
            />
            <button
              onClick={() => setTab("summon")}
              className="flex flex-col items-center -mt-5"
            >
              <span
                className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-[#241a12] ${tab === "summon" ? "bg-amber-400 text-black" : "bg-amber-600 text-black"} shadow-lg`}
              >
                <Sparkles size={24} />
              </span>
              <span
                className={`text-[10px] font-extrabold mt-0.5 ${tab === "summon" ? "text-amber-300" : "text-stone-400"}`}
              >
                Invocar
              </span>
            </button>
            <NavBtn
              active={tab === "campaign"}
              icon={<MapIcon size={21} />}
              label="Sagas"
              onClick={() => setTab("campaign")}
              badge={player.energy >= 6}
            />
            <NavBtn
              active={tab === "arena"}
              icon={<Trophy size={21} />}
              label="Arena"
              onClick={() => {
                setTab("arena");
                loadRank();
              }}
            />
          </div>
        </nav>
        {battle && (
          <BattleOverlay battle={battle} onClose={() => setBattle(null)} />
        )}
        {stageSel &&
          (() => {
            const info = stageInfo(stageSel);
            const enemyPower = info.enemies.reduce((a, id) => {
              const d = heroById(id);
              return (
                a +
                Math.round(
                  heroStats(d, info.enemyLevel, RARITY_STARS[d.rarity]).power *
                    info.scale,
                )
              );
            }, 0);
            return (
              <Overlay onClose={() => setStageSel(null)}>
                <h3 className="font-display font-black text-amber-300">
                  {info.chapter.name}
                </h3>
                <p className="text-sm font-bold text-stone-100">{info.stageName}</p>
                <p className="text-xs leading-relaxed text-stone-300">{info.story}</p>
                <p className="text-[11px] text-stone-400">
                  Etapa {info.within}{info.isBoss ? " · JEFE" : ""} · Nv.{info.enemyLevel}
                </p>
                <div className="flex gap-2 justify-center my-3">
                  {info.enemies.map((id, i) => (
                    <HeroAvatar key={i} heroId={id} size={52} />
                  ))}
                </div>
                <div className="flex justify-center gap-3 text-sm font-extrabold">
                  <span className="text-teal-300">{fmt(teamPower)}</span>
                  <span className="text-stone-500">VS</span>
                  <span className="text-red-300">~{fmt(enemyPower)}</span>
                </div>
                <div className="flex justify-center gap-2 mt-3 text-xs font-bold">
                  <span className="bg-black/50 px-2 py-1 rounded-lg text-amber-300 flex gap-1 items-center">
                    <Coins size={13} />
                    {info.rewards.gold}
                  </span>
                  <span className="bg-black/50 px-2 py-1 rounded-lg text-teal-300 flex gap-1 items-center">
                    <Zap size={13} />
                    {info.rewards.exp} EXP
                  </span>
                  {info.rewards.gems > 0 && (
                    <span className="bg-black/50 px-2 py-1 rounded-lg text-cyan-300 flex gap-1 items-center">
                      <Gem size={13} />
                      {info.rewards.gems}
                    </span>
                  )}
                  <span className="bg-black/50 px-2 py-1 rounded-lg text-stone-300 flex gap-1 items-center">
                    <Beer size={13} />
                    -6
                  </span>
                </div>
                {enemyPower > teamPower * 1.25 && (
                  <p className="text-red-300 text-xs font-semibold mt-2.5 flex gap-1 justify-center items-center">
                    <Info size={13} /> Muy superior: usa Forja y Runas.
                  </p>
                )}
                <button
                  onClick={() => startBattle("campaign", { stageId: stageSel })}
                  disabled={busy}
                  className="glow-gold mt-4 w-full bg-amber-500 text-black font-display font-black rounded-xl py-3 disabled:opacity-60"
                >
                  {busy ? "…" : "¡A LA BATALLA!"}
                </button>
              </Overlay>
            );
          })()}
        {detail && (
          <Overlay onClose={() => setDetailId(null)} wide>
            <HeroSheet def={detail.def} owned={detail} player={player} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                disabled={busy}
                onClick={async () => {
                  await post({
                    action: "upgrade",
                    playerId: player.id,
                    playerHeroId: detail.id,
                    kind: "level",
                    times: 1,
                  });
                }}
                className="bg-teal-600 rounded-xl py-2.5 font-extrabold text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <ArrowUp size={15} /> Nv+1 · <Coins size={14} />
                {100 + detail.level * 90}
              </button>
              <button
                disabled={busy}
                onClick={async () => {
                  await post({
                    action: "upgrade",
                    playerId: player.id,
                    playerHeroId: detail.id,
                    kind: "level",
                    times: 10,
                  });
                }}
                className="bg-teal-800 rounded-xl py-2.5 font-extrabold text-[13px] disabled:opacity-60"
              >
                Niv +10
              </button>
              <button
                disabled={busy}
                onClick={async () => {
                  const d = await post({
                    action: "upgrade",
                    playerId: player.id,
                    playerHeroId: detail.id,
                    kind: "star",
                  });
                  if (d) showToast("¡Ascensión!");
                }}
                className="bg-amber-600 text-black rounded-xl py-2.5 font-extrabold text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Star size={15} /> Ascender · {detail.shards}/
                {detail.stars * 15}
              </button>
              <button
                disabled={busy}
                onClick={() => toggleTeam(detail)}
                className={`rounded-xl py-2.5 font-extrabold text-[13px] disabled:opacity-60 ${team.some((t) => t.id === detail.id) ? "bg-red-900 text-red-200" : "bg-stone-700 text-white"}`}
              >
                {team.some((t) => t.id === detail.id)
                  ? "Quitar"
                  : "Al escuadrón"}
              </button>
            </div>
            {/* runas & artefacto del héroe */}
            <div className="mt-3 stone rounded-xl p-2.5">
              <div className="font-bold text-xs text-amber-200">
                RUNAS · {(player.heroRunes?.[String(detail.id)] || []).length}/3
                equipadas
              </div>
              <div className="flex gap-1.5 mt-1.5">
                {(player.heroRunes?.[String(detail.id)] || []).map((rid, i) => (
                  <button
                    key={i}
                    onClick={async () => {
                      await post({
                        action: "rune_unequip",
                        playerId: player.id,
                        heroDbId: String(detail.id),
                        index: i,
                      });
                    }}
                    className="flex-1 rounded-lg py-1.5 text-center border"
                    style={{
                      background: runeById(rid).color + "22",
                      borderColor: runeById(rid).color,
                    }}
                  >
                    <span
                      className="font-rune text-lg"
                      style={{ color: runeById(rid).color }}
                    >
                      {runeById(rid).rune}
                    </span>
                    <span className="block text-[8px] font-bold text-stone-300">
                      tocar para quitar
                    </span>
                  </button>
                ))}
                {Array.from({
                  length:
                    3 - (player.heroRunes?.[String(detail.id)] || []).length,
                }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-[52px] rounded-lg bg-black/40 border border-dashed border-stone-600"
                  />
                ))}
              </div>
              {player.heroArtifacts?.[String(detail.id)] && (
                <div className="mt-2 flex items-center gap-2 bg-black/40 rounded-lg px-2 py-1.5">
                  <span className="text-[11px] font-bold text-amber-300">
                    ⚒{" "}
                    {artifactById(player.heroArtifacts[String(detail.id)]).name}{" "}
                    Lv.
                    {player.artifactData?.[
                      player.heroArtifacts[String(detail.id)]
                    ] || 0}
                  </span>
                  <button
                    onClick={async () => {
                      await post({
                        action: "artifact_equip",
                        playerId: player.id,
                        heroDbId: String(detail.id),
                        artifactId: null,
                      });
                    }}
                    className="ml-auto text-[10px] bg-stone-700 px-2 py-1 rounded-lg"
                  >
                    Desequipar
                  </button>
                </div>
              )}
            </div>
          </Overlay>
        )}
        {viewDef && (
          <Overlay onClose={() => setViewDef(null)} wide>
            <HeroSheet def={viewDef} player={player} />
            <button
              onClick={() => {
                setViewDef(null);
                setTab("summon");
              }}
              className="mt-3 w-full bg-amber-500 text-black font-black rounded-xl py-3"
            >
              Invocarlo en el Altar
            </button>
          </Overlay>
        )}
        {summonResults && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-5 overflow-y-auto">
            <div className="font-display font-black text-amber-300 text-xl tracking-wide text-center">
              LAS VALKIRIAS HAN HABLADO
            </div>
            <div
              className={`grid ${summonResults.length > 1 ? "grid-cols-3" : "grid-cols-1"} gap-3 mt-5`}
            >
              {summonResults.map((r, i) => {
                const d = heroById(r.heroId);
                return (
                  <div
                    key={i}
                    className="card-reveal text-center stone rounded-2xl p-2.5 border-2"
                    style={{
                      borderColor:
                        d.rarity === "Mítico"
                          ? "#f43f5e"
                          : d.rarity === "Legendario"
                            ? "#f59e0b"
                            : d.rarity === "Épico"
                              ? "#a78bfa"
                              : "#38bdf8",
                      animationDelay: `${i * 0.12}s`,
                    }}
                  >
                    <div className="flex justify-center">
                      <HeroAvatar
                        heroId={r.heroId}
                        size={summonResults.length > 1 ? 64 : 110}
                      />
                    </div>
                    <div className="text-[11px] font-extrabold mt-1.5 leading-tight">
                      {d.name}
                    </div>
                    <div className="mt-1">
                      <RarityTag rarity={d.rarity} />
                    </div>
                    <div
                      className={`text-[10px] font-black mt-1 ${r.isNew ? "text-teal-300" : "text-stone-400"}`}
                    >
                      {r.isNew ? "¡NUEVO!" : `+${r.shards} fragmentos`}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setSummonResults(null)}
              className="mt-6 bg-amber-500 text-black font-display font-black rounded-xl px-8 py-3"
            >
              AL VALHALLA
            </button>
          </div>
        )}
        {modal === "quests" && (
          <Overlay onClose={() => setModal(null)} wide>
            <h3 className="font-display font-black text-amber-300 text-center">
              SAGAS Y MISIONES
            </h3>
            <div className="space-y-2 mt-3 max-h-[55dvh] overflow-y-auto no-scrollbar">
              {QUESTS.map((q) => {
                const prog = Math.min(
                  q.target,
                  (player as unknown as Record<string, number>)[q.metric] || 0,
                );
                const claimed = player.claimedQuests.includes(q.id),
                  done = prog >= q.target;
                return (
                  <div
                    key={q.id}
                    className="bg-black/45 rounded-xl p-2.5 flex gap-2.5 items-center"
                  >
                    <div className="flex-1 min-w-0">
                      <b className="text-[13px] block">{q.name}</b>
                      <span className="text-[11px] text-stone-400">
                        {q.desc} · {prog}/{q.target}
                      </span>
                      <div className="h-1.5 bg-stone-800 rounded-full mt-1">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${(prog / q.target) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1 justify-end">
                        <Gem size={11} />
                        {q.reward.gems}
                      </div>
                      {claimed ? (
                        <span className="text-[10px] text-teal-300 font-extrabold flex items-center gap-1">
                          <Check size={12} />
                          Hecho
                        </span>
                      ) : (
                        <button
                          disabled={!done || busy}
                          onClick={async () => {
                            const d = await post({
                              action: "claim_quest",
                              playerId: player.id,
                              questId: q.id,
                            });
                            if (d) showToast("Recompensa reclamada");
                          }}
                          className={`text-[10px] font-black px-2 py-1.5 rounded-lg mt-0.5 ${done ? "bg-amber-500 text-black" : "bg-stone-800 text-stone-500"}`}
                        >
                          RECLAMAR
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Overlay>
        )}
        {modal === "shop" && (
          <Overlay onClose={() => setModal(null)}>
            <h3 className="font-display font-black text-amber-300 text-center">
              MERCADO DE HEDEBY
            </h3>
            <div className="space-y-2 mt-3">
              {[
                [
                  "energy",
                  <Beer key="e" size={20} className="text-amber-300" />,
                  "Barril de hidromiel",
                  "+80 energía",
                  "80 piedras",
                ],
                [
                  "gold",
                  <Coins key="g" size={20} className="text-yellow-400" />,
                  "Botín",
                  "+6.000 oro",
                  "100 piedras",
                ],
                [
                  "gems_pack",
                  <Gem key="m" size={20} className="text-cyan-300" />,
                  "Trueque orfebre",
                  "+140 piedras",
                  "5.000 oro",
                ],
              ].map(([item, icon, name, gain, cost]) => (
                <div
                  key={item as string}
                  className="bg-black/45 rounded-xl p-3 flex items-center gap-3"
                >
                  {icon}
                  <div className="flex-1">
                    <b className="text-sm block">{name as string}</b>
                    <span className="text-xs text-teal-300 font-bold">
                      {gain as string}
                    </span>
                  </div>
                  <button
                    disabled={busy}
                    onClick={async () => {
                      const d = await post({
                        action: "buy",
                        playerId: player.id,
                        item,
                      });
                      if (d) showToast("Trato hecho");
                    }}
                    className="bg-amber-500 text-black text-xs font-black px-3 py-2 rounded-lg disabled:opacity-60"
                  >
                    {cost as string}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-3 text-xs font-bold">
              <span className="flex gap-1 items-center text-amber-300">
                <Coins size={13} />
                {fmt(player.gold)}
              </span>
              <span className="flex gap-1 items-center text-cyan-300">
                <Gem size={13} />
                {fmt(player.gems)}
              </span>
              <span className="flex gap-1 items-center text-amber-200">
                <Beer size={13} />
                {player.energy}
              </span>
            </div>
          </Overlay>
        )}
        {modal === "rank" && (
          <Overlay onClose={() => setModal(null)} wide>
            <h3 className="font-display font-black text-amber-300 text-center">
              SALÓN DE LA FAMA
            </h3>
            <div className="mt-3">
              <RankList rows={leaderboard} meId={player.id} />
            </div>
          </Overlay>
        )}
        {busy && !battle && (
          <div className="absolute inset-0 z-40 bg-black/35 flex items-center justify-center pointer-events-none">
            <div className="bg-black/80 border border-amber-800 rounded-xl px-4 py-2.5 font-display font-bold text-amber-300 animate-pulse text-sm">
              ᚱ Consultando a las nornas…
            </div>
          </div>
        )}
        {toast && (
          <div className="absolute bottom-24 inset-x-5 z-[60] bg-stone-900 border border-amber-700 text-amber-100 text-[13px] font-semibold rounded-xl px-4 py-3 text-center shadow-2xl">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

function Res({
  icon,
  value,
  onPlus,
}: {
  icon: React.ReactNode;
  value: string | number;
  onPlus: () => void;
}) {
  return (
    <button
      onClick={onPlus}
      className="flex items-center gap-1 bg-black/60 border border-stone-700 rounded-full pl-2 pr-1 py-1 text-[11px] font-extrabold"
    >
      {icon}
      {value}
      <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center">
        <Plus size={10} />
      </span>
    </button>
  );
}
function NavBtn({
  active,
  icon,
  label,
  onClick,
  badge,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center py-1 rounded-lg ${active ? "text-amber-300" : "text-stone-400"}`}
    >
      {icon}
      <span className="text-[10px] font-extrabold mt-0.5">{label}</span>
      {badge && (
        <span className="absolute top-0 right-3 w-2 h-2 bg-rose-500 rounded-full" />
      )}
    </button>
  );
}
function MenuCard({
  img,
  title,
  sub,
  icon,
  onClick,
  action,
}: {
  img: string;
  title: string;
  sub: string;
  icon: React.ReactNode;
  onClick: () => void;
  action?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="relative h-24 rounded-2xl overflow-hidden text-left rune-border"
    >
      <img
        src={img}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/55 p-2.5 flex flex-col justify-end">
        <div className="flex items-center gap-1.5 font-display font-bold text-[13px] text-amber-100">
          {icon}
          {title}
        </div>
        <div className="text-[10px] text-stone-300 font-semibold">{sub}</div>
        {action && (
          <span className="absolute top-2 right-2 bg-teal-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded">
            {action}
          </span>
        )}
      </div>
    </button>
  );
}
function HomeAction({
  title,
  desc,
  color,
  onClick,
  icon,
}: {
  title: string;
  desc: string;
  color: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl p-3 text-left flex items-center gap-2.5 stone border"
      style={{ borderColor: color }}
    >
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
        style={{ background: color }}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <b className="block text-xs leading-tight">{title}</b>
        <span className="text-[10px] text-stone-400">{desc}</span>
      </span>
    </button>
  );
}
function Overlay({
  children,
  onClose,
  wide,
}: {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div
      className="absolute inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`stone rune-border w-full ${wide ? "max-w-[400px]" : "max-w-sm"} rounded-t-3xl sm:rounded-3xl p-4 max-h-[88dvh] overflow-y-auto no-scrollbar relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 bg-black/60 border border-stone-700 rounded-full flex items-center justify-center text-stone-300 z-10"
        >
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}
function RankList({
  rows,
  meId,
}: {
  rows: {
    id: number;
    nickname: string;
    level: number;
    arenaPoints: number;
    campaignStage: number;
    towerFloor: number;
    jormungandrScore?: number;
  }[];
  meId: number;
}) {
  if (rows.length === 0)
    return (
      <div className="stone rune-border rounded-2xl p-3">
        <h3 className="font-display font-bold text-amber-200 text-sm">
          CLASIFICACIÓN
        </h3>
        <p className="text-stone-400 text-xs mt-2">Cargando…</p>
      </div>
    );
  return (
    <div className="stone rune-border rounded-2xl p-3">
      <h3 className="font-display font-bold text-amber-200 text-sm">
        CLASIFICACIÓN DE JARLS
      </h3>
      <div className="mt-2 space-y-1.5">
        {rows.map((r, i) => (
          <div
            key={r.id}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] ${r.id === meId ? "bg-amber-500/20 border border-amber-600" : "bg-black/35"}`}
          >
            <span
              className={`font-display font-black w-6 ${i === 0 ? "text-amber-300" : i === 1 ? "text-stone-300" : i === 2 ? "text-orange-400" : "text-stone-500"}`}
            >
              {i + 1}
            </span>
            <span className="flex-1 font-bold truncate">
              {r.nickname}
              {r.id === meId && (
                <span className="text-amber-300 text-[10px]"> · TÚ</span>
              )}
            </span>
            <span className="text-[10px] text-stone-400">
              {r.arenaPoints} pts
            </span>
            <span className="font-black text-amber-300 w-10 text-right">
              Nv.{r.level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
function HeroSheet({
  def,
  owned,
  player,
}: {
  def: HeroDef;
  owned?: OwnedHero;
  player?: PlayerT;
}) {
  const stats = owned
    ? owned.stats
    : heroStats(def, 1, RARITY_STARS[def.rarity]);
  const maxBar = { hp: 2600, atk: 320, def: 140, spd: 110 };
  const Bar = ({
    label,
    v,
    max,
    color,
  }: {
    label: string;
    v: number;
    max: number;
    color: string;
  }) => (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-14 font-extrabold text-stone-400">{label}</span>
      <div className="flex-1 h-2 bg-black/60 rounded-full overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${Math.min(100, (v / max) * 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="w-10 text-right font-bold">{v}</span>
    </div>
  );
  return (
    <div>
      <div className="flex gap-3">
        <HeroAvatar heroId={def.id} size={92} />
        <div className="min-w-0 flex-1 pr-6">
          <h3 className="font-display font-black text-lg leading-tight text-amber-100">
            {def.name}
          </h3>
          <div className="text-stone-400 text-xs italic">{def.title}</div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap items-center">
            <RarityTag rarity={def.rarity} />
            <span className="text-[10px] bg-black/50 px-1.5 py-0.5 rounded font-bold">
              {def.faction}
            </span>
            <span className="text-[10px] bg-black/50 px-1.5 py-0.5 rounded font-bold">
              {def.role}
            </span>
          </div>
          <div className="mt-1.5">
            <Stars n={owned?.stars || RARITY_STARS[def.rarity]} size={14} />
          </div>
          <div className="text-xs mt-1">
            <span className="text-stone-400">
              {owned
                ? `Nivel ${owned.level} · ${owned.shards} frag · `
                : "Nv.1 · "}
            </span>
            <b className="text-amber-300">Poder {fmt(stats.power)}</b>
            {player?.heroArtifacts?.[String(owned?.id)] && (
              <span className="text-amber-300">
                {" "}
                · {artifactById(player.heroArtifacts[String(owned?.id)]).name}
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="text-amber-200/90 text-[13px] italic mt-2.5 text-center">
        «{def.quote}»
      </p>
      <div className="space-y-1.5 mt-2 bg-black/40 rounded-xl p-2.5">
        <Bar label="PV" v={stats.hp} max={maxBar.hp} color="#4ade80" />
        <Bar label="ATQ" v={stats.atk} max={maxBar.atk} color="#f87171" />
        <Bar label="DEF" v={stats.def} max={maxBar.def} color="#60a5fa" />
        <Bar label="VEL" v={stats.spd} max={maxBar.spd} color="#facc15" />
        <div className="text-[11px] text-stone-400 pt-0.5">
          Posición: <b className="text-stone-200">{POS_LABEL[def.position]}</b>{" "}
          · Crítico: <b className="text-stone-200">{stats.crit}%</b>
        </div>
      </div>
      <div className="space-y-1.5 mt-2.5">
        {def.skills.map((s) => (
          <div key={s.name} className="bg-black/40 rounded-lg px-2.5 py-2">
            <b className="text-xs text-teal-200">{s.name}</b>{" "}
            <span className="text-[10px] text-stone-500 font-bold">
              ×{s.mult}
            </span>
            <div className="text-[11px] text-stone-400">{s.desc}</div>
          </div>
        ))}
        <div className="bg-amber-950/70 border border-amber-700 rounded-lg px-2.5 py-2">
          <b className="text-xs text-amber-300">DEFINITIVA · {def.ult.name}</b>
          <div className="text-[11px] text-amber-100/70">{def.ult.desc}</div>
        </div>
      </div>
      <p className="text-[11px] text-stone-500 leading-snug mt-2.5">
        {def.lore}
      </p>
    </div>
  );
}
