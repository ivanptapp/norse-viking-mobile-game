import { NextResponse } from "next/server";
import { db } from "@/db";
import { players, playerHeroes, battleLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { HEROES, RARITY_STARS, STARTER, stageInfo, towerInfo, heroStats, heroById, QUESTS, ARENA_NAMES, TOTAL_STAGES } from "@/lib/heroes";
import { makeFighter, simulate } from "@/lib/battle";
import { ARTIFACTS, RUNES, artifactById, runeById, jormungandrStats, seasonTier } from "@/lib/extra";

async function getState(playerId: number) {
  const [player] = await db.select().from(players).where(eq(players.id, playerId));
  if (!player) return null;
  const heroes = await db.select().from(playerHeroes).where(eq(playerHeroes.playerId, playerId));
  const enriched = heroes.map(h => ({ ...h, def: heroById(h.heroId), stats: heroStats(heroById(h.heroId), h.level, h.stars) }));
  return { player, heroes: enriched };
}

function levelFromExp(exp: number) { return Math.min(60, 1 + Math.floor(Math.sqrt(exp / 90))); }

async function grantExp(playerId: number, addExp: number, addGold: number, addGems: number) {
  const [p] = await db.select().from(players).where(eq(players.id, playerId));
  const exp = p.exp + addExp; const passExp = (p.seasonPassExp || 0) + addExp;
  await db.update(players).set({ exp, level: levelFromExp(exp), gold: p.gold + addGold, gems: p.gems + addGems, seasonPassExp: passExp, updatedAt: new Date() }).where(eq(players.id, playerId));
}

function runeBonus(heroRunes: string[]) {
  let hp = 0, atk = 0, def = 0, crit = 0, spd = 0;
  for (const id of heroRunes || []) {
    if (id === "fehu") hp += 220;
    if (id === "uruz") atk += 18;
    if (id === "thurisaz") def += 14;
    if (id === "ansuz") crit += 6;
    if (id === "raidho") spd += 7;
    if (id === "sowilo") { atk += 8; hp += 80; }
  }
  return { hp, atk, def, crit, spd };
}

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "PostgreSQL no está configurado" }, { status: 503 });
  }
  const url = new URL(req.url);
  if (url.searchParams.get("leaderboard") === "1") {
    const rows = await db.select({ id: players.id, nickname: players.nickname, level: players.level, arenaPoints: players.arenaPoints, campaignStage: players.campaignStage, towerFloor: players.towerFloor, jormungandrScore: players.jormungandrScore })
      .from(players).orderBy(desc(players.arenaPoints)).limit(20);
    return NextResponse.json({ leaderboard: rows });
  }
  const playerId = Number(url.searchParams.get("playerId"));
  if (!playerId) return NextResponse.json({ error: "playerId requerido" }, { status: 400 });
  const state = await getState(playerId);
  if (!state) return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
  return NextResponse.json(state);
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "PostgreSQL no está configurado; la batalla de prueba está disponible sin cuenta." }, { status: 503 });
  }
  const body = await req.json();
  const { action } = body;

  try {
    if (action === "create_player") {
      const nickname = String(body.nickname || "").trim().slice(0, 24);
      if (nickname.length < 3) return NextResponse.json({ error: "Tu nombre de jarl debe tener al menos 3 letras" }, { status: 400 });
      const [existing] = await db.select().from(players).where(eq(players.nickname, nickname));
      if (existing) { const s = await getState(existing.id); return NextResponse.json({ ...s, resumed: true }); }
      const [p] = await db.insert(players).values({ nickname }).returning();
      const ids: number[] = [];
      for (const s of STARTER) {
        const [h] = await db.insert(playerHeroes).values({ playerId: p.id, heroId: s.heroId, level: s.level, stars: s.stars }).returning();
        ids.push(h.id);
      }
      // kit de bienvenida: runas y fragmentos artefacto
      const runeInventory: Record<string, number> = { fehu: 2, uruz: 2, thurisaz: 1, ansuz: 1 };
      const artifactData: Record<string, number> = { mjolnir: 1, skofnung: 1, mjolnir_shards: 4, skofnung_shards: 4, brisingamen_shards: 6 };
      await db.update(players).set({ teamHeroIds: ids, runeInventory, artifactData } as never).where(eq(players.id, p.id));
      const s = await getState(p.id);
      return NextResponse.json({ ...s, resumed: false });
    }

    const playerId = Number(body.playerId);
    const [player] = await db.select().from(players).where(eq(players.id, playerId));
    if (!player) return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });

    if (action === "summon") {
      const count = body.count === 10 ? 10 : 1;
      const cost = count === 10 ? 2500 : 270;
      if (player.gems < cost) return NextResponse.json({ error: "Piedras rúnicas insuficientes" }, { status: 400 });
      const owned = await db.select().from(playerHeroes).where(eq(playerHeroes.playerId, playerId));
      const results: { heroId: string; isNew: boolean; shards: number }[] = [];
      for (let i = 0; i < count; i++) {
        const roll = Math.random() * 100;
        let pool = HEROES.filter(h => h.rarity === "Raro");
        if (count === 10 && i === 9 && !results.some(r => ["Épico", "Legendario", "Mítico"].includes(heroById(r.heroId).rarity))) pool = HEROES.filter(h => h.rarity === "Épico");
        else if (roll < 3) pool = HEROES.filter(h => h.rarity === "Mítico");
        else if (roll < 15) pool = HEROES.filter(h => h.rarity === "Legendario");
        else if (roll < 45) pool = HEROES.filter(h => h.rarity === "Épico");
        const def = pool[Math.floor(Math.random() * pool.length)];
        const dupe = owned.find(h => h.heroId === def.id) || results.find(r => r.heroId === def.id && r.isNew);
        const shardGain = def.rarity === "Mítico" ? 40 : def.rarity === "Legendario" ? 30 : def.rarity === "Épico" ? 20 : 12;
        if (dupe) {
          const target = owned.find(h => h.heroId === def.id);
          if (target) await db.update(playerHeroes).set({ shards: target.shards + shardGain }).where(eq(playerHeroes.id, target.id));
          results.push({ heroId: def.id, isNew: false, shards: shardGain });
        } else {
          const [nh] = await db.insert(playerHeroes).values({ playerId, heroId: def.id, level: 1, stars: RARITY_STARS[def.rarity] }).returning();
          owned.push(nh);
          results.push({ heroId: def.id, isNew: true, shards: 0 });
        }
      }
      await db.update(players).set({ gems: player.gems - cost, summonsDone: player.summonsDone + count, updatedAt: new Date() }).where(eq(players.id, playerId));
      const s = await getState(playerId);
      return NextResponse.json({ ...s, summonResults: results });
    }

    if (action === "upgrade") {
      const [h] = await db.select().from(playerHeroes).where(eq(playerHeroes.id, Number(body.playerHeroId)));
      if (!h || h.playerId !== playerId) return NextResponse.json({ error: "Héroe no encontrado" }, { status: 404 });
      if (body.kind === "level") {
        const times = body.times === 10 ? 10 : 1;
        let level = h.level, gold = player.gold, spent = 0;
        for (let i = 0; i < times; i++) {
          const cost = 100 + level * 90;
          if (gold < cost || level >= 80) break;
          gold -= cost; spent += cost; level++;
        }
        if (spent === 0) return NextResponse.json({ error: level >= 80 ? "Nivel máximo" : "Oro insuficiente" }, { status: 400 });
        await db.update(playerHeroes).set({ level }).where(eq(playerHeroes.id, h.id));
        await db.update(players).set({ gold, updatedAt: new Date() }).where(eq(players.id, playerId));
      } else if (body.kind === "star") {
        const need = h.stars * 15;
        if (h.stars >= 6) return NextResponse.json({ error: "Estrellas máximas (6)" }, { status: 400 });
        if (h.shards < need) return NextResponse.json({ error: `Necesitas ${need} fragmentos de alma` }, { status: 400 });
        await db.update(playerHeroes).set({ stars: h.stars + 1, shards: h.shards - need }).where(eq(playerHeroes.id, h.id));
      }
      const s = await getState(playerId);
      return NextResponse.json(s);
    }

    if (action === "set_team") {
      const ids = (body.heroIds as number[]).slice(0, 5);
      await db.update(players).set({ teamHeroIds: ids, updatedAt: new Date() }).where(eq(players.id, playerId));
      const s = await getState(playerId);
      return NextResponse.json(s);
    }

    // ---- Artefactos ----
    if (action === "artifact_upgrade") {
      const aid = String(body.artifactId);
      const art = ARTIFACTS.find(a => a.id === aid);
      if (!art) return NextResponse.json({ error: "Artefacto no encontrado" }, { status: 404 });
      const cur = (player.artifactData as Record<string, number>) || {};
      const lvl = cur[aid] || 0;
      if (lvl >= 5) return NextResponse.json({ error: "Artefacto al máximo (5)" }, { status: 400 });
      if (lvl > 5) return NextResponse.json({ error: "Artefacto corrupto, contacta soporte" }, { status: 400 });
      const needShards = (lvl + 1) * 10; const needGold = (lvl + 1) * 1500;
      const haveShards = cur[aid + "_shards"] ?? 0;
      if (haveShards < needShards) return NextResponse.json({ error: `Fragmentos insuficientes: ${haveShards}/${needShards} de ${art.name}` }, { status: 400 });
      if (player.gold < needGold) return NextResponse.json({ error: "Oro insuficiente" }, { status: 400 });
      const nextData = { ...cur, [aid]: lvl + 1, [aid + "_shards"]: haveShards - needShards } as Record<string, number>;
      await db.update(players).set({ gold: player.gold - needGold, artifactData: nextData, updatedAt: new Date() } as never).where(eq(players.id, playerId));
      const s = await getState(playerId);
      return NextResponse.json(s);
    }
    if (action === "artifact_equip") {
      const heroDbId = String(body.heroDbId); const aid = body.artifactId ? String(body.artifactId) : null;
      const heroArtifacts = { ...((player.heroArtifacts as Record<string, string>) || {}) };
      if (aid) {
        const lvl = ((player.artifactData as Record<string, number>) || {})[aid] || 0;
        if (lvl === 0) return NextResponse.json({ error: "Artefacto aún no forjado" }, { status: 400 });
        // desequipar de otro héroe si estaba equipado
        for (const k of Object.keys(heroArtifacts)) if (heroArtifacts[k] === aid) delete heroArtifacts[k];
        heroArtifacts[heroDbId] = aid;
      } else delete heroArtifacts[heroDbId];
      await db.update(players).set({ heroArtifacts, updatedAt: new Date() } as never).where(eq(players.id, playerId));
      const s = await getState(playerId);
      return NextResponse.json(s);
    }
    if (action === "artifact_claim_shards") {
      // recompensa de torre/raid: da 8 shards aleatorios
      const aid = ARTIFACTS[Math.floor(Math.random() * ARTIFACTS.length)].id;
      const cur = { ...((player.artifactData as Record<string, number>) || {}) };
      cur[aid + "_shards"] = (cur[aid + "_shards"] || 0) + 8;
      cur[aid] = cur[aid] || 0;
      await db.update(players).set({ artifactData: cur, updatedAt: new Date() } as never).where(eq(players.id, playerId));
      const s = await getState(playerId);
      return NextResponse.json({ ...s, artifactReward: { id: aid, amount: 8 } });
    }

    // ---- Runas ----
    if (action === "rune_equip") {
      const heroDbId = String(body.heroDbId); const runeId = String(body.runeId);
      const inv = { ...((player.runeInventory as Record<string, number>) || {}) };
      const hr = { ...((player.heroRunes as Record<string, string[]>) || {}) };
      if ((inv[runeId] || 0) <= 0) return NextResponse.json({ error: "No tienes esa runa" }, { status: 400 });
      const cur = hr[heroDbId] || [];
      if (cur.length >= 3) return NextResponse.json({ error: "Máximo 3 runas por héroe" }, { status: 400 });
      inv[runeId]--; if (inv[runeId] <= 0) delete inv[runeId];
      hr[heroDbId] = [...cur, runeId];
      await db.update(players).set({ runeInventory: inv, heroRunes: hr, updatedAt: new Date() } as never).where(eq(players.id, playerId));
      const s = await getState(playerId);
      return NextResponse.json(s);
    }
    if (action === "rune_unequip") {
      const heroDbId = String(body.heroDbId); const idx = Number(body.index);
      const inv = { ...((player.runeInventory as Record<string, number>) || {}) };
      const hr = { ...((player.heroRunes as Record<string, string[]>) || {}) };
      const cur = hr[heroDbId] || [];
      if (idx < 0 || idx >= cur.length) return NextResponse.json({ error: "Runa no encontrada" }, { status: 400 });
      const rid = cur[idx]; inv[rid] = (inv[rid] || 0) + 1;
      hr[heroDbId] = cur.filter((_, i) => i !== idx);
      await db.update(players).set({ runeInventory: inv, heroRunes: hr, updatedAt: new Date() } as never).where(eq(players.id, playerId));
      const s = await getState(playerId);
      return NextResponse.json(s);
    }
    if (action === "rune_roll") {
      if (player.gold < 800) return NextResponse.json({ error: "Necesitas 800 de oro" }, { status: 400 });
      const rid = RUNES[Math.floor(Math.random() * RUNES.length)].id;
      const inv = { ...((player.runeInventory as Record<string, number>) || {}) };
      inv[rid] = (inv[rid] || 0) + 1;
      await db.update(players).set({ gold: player.gold - 800, runeInventory: inv, updatedAt: new Date() } as never).where(eq(players.id, playerId));
      const s = await getState(playerId);
      return NextResponse.json({ ...s, runeReward: rid });
    }

    // ---- Batalla ----
    if (action === "battle") {
      const mode = body.mode as "campaign" | "arena" | "tower" | "raid";
      const owned = await db.select().from(playerHeroes).where(eq(playerHeroes.playerId, playerId));
      const team = (player.teamHeroIds || []).map(id => owned.find(h => h.id === id)).filter(Boolean);
      if (team.length === 0) return NextResponse.json({ error: "Forma tu escuadrón primero" }, { status: 400 });

      // runas -> bonus aplicado a fighters (solo visual, pero potencia real via stats extra)
      const heroRunes = (player.heroRunes as Record<string, string[]>) || {};

      const CHAPTER_BG = ["/images/bf-coast.jpg", "/images/bf-forest.jpg", "/images/bf-village.jpg", "/images/bf-helheim.jpg", "/images/bf-ragnarok.jpg"];
      let background = CHAPTER_BG[0];
      let enemyIds: string[] = [], enemyLevel = 1, scale = 1, rewards: { gold: number; exp: number; gems: number } = { gold: 0, exp: 0, gems: 0 }, stageId: number | null = null, enemyName = "Enemigos";

      if (mode === "raid") {
        // Jörmungandr solo raid: enemigo único gigante + 2 adds
        if (player.energy < 8) return NextResponse.json({ error: "Sin energía para la incursión" }, { status: 400 });
        const now = new Date();
        if (player.lastRaidAt && now.getTime() - new Date(player.lastRaidAt).getTime() < 30 * 1000) return NextResponse.json({ error: "La serpiente aún se retuerce. Espera 30s" }, { status: 400 });
        enemyName = jormungandrStats(player.jormungandrScore).name;
        background = "/images/bf-helheim.jpg";
        enemyIds = ["fenrir", "hel", "loki"]; // cuerpo de la serpiente
        enemyLevel = Math.max(6, Math.round(team.reduce((a, h) => a + h!.level, 0) / team.length) + 2 + Math.floor(player.jormungandrScore / 8000));
        scale = 0.9 + player.jormungandrScore / 40000;
        rewards = { gold: 600, exp: 40, gems: 25 };
        await db.update(players).set({ energy: player.energy - 8, lastRaidAt: now } as never).where(eq(players.id, playerId));
        // refresh player after energy deduct
        const [refreshed] = await db.select().from(players).where(eq(players.id, playerId));
        Object.assign(player, refreshed);
      } else if (mode === "campaign") {
        stageId = Math.min(TOTAL_STAGES, Math.max(1, Number(body.stageId) || player.campaignStage + 1));
        if (stageId > player.campaignStage + 1) return NextResponse.json({ error: "Etapa bloqueada" }, { status: 400 });
        if (player.energy < 6) return NextResponse.json({ error: "Sin energía. Compra hidromiel en la aldea." }, { status: 400 });
        const info = stageInfo(stageId);
        enemyIds = info.enemies; enemyLevel = info.enemyLevel; scale = info.scale;
        rewards = { ...info.rewards };
        enemyName = `${info.chapter.name} · Etapa ${info.within}${info.isBoss ? " · JEFE" : ""}`;
        background = CHAPTER_BG[info.chapter.id - 1] ?? CHAPTER_BG[0];
        await db.update(players).set({ energy: player.energy - 6 }).where(eq(players.id, playerId));
      } else if (mode === "tower") {
        const floor = player.towerFloor + 1;
        stageId = floor;
        const info = towerInfo(floor);
        enemyIds = info.enemies; enemyLevel = info.enemyLevel; scale = info.scale; rewards = { ...info.rewards };
        enemyName = `Yggdrasil · Piso ${floor}`;
        background = [CHAPTER_BG[1], CHAPTER_BG[3], CHAPTER_BG[4]][floor % 3];
      } else {
        const oppIdx = Math.max(0, Math.min(ARENA_NAMES.length - 1, Number(body.opponentIdx) || 0));
        enemyName = ARENA_NAMES[oppIdx];
        background = "/images/bf-arena.jpg";
        const teamPower = team.reduce((a, h) => {
          const hr = heroRunes[String(h!.id)] || []; const b = runeBonus(hr);
          return a + heroStats(heroById(h!.heroId), h!.level, h!.stars).power + b.atk * 12 + b.hp / 10;
        }, 0);
        const targetScale = 0.78 + oppIdx * 0.045 + player.arenaWins * 0.004;
        const shuffled = [...HEROES].sort(() => Math.random() - 0.5).slice(0, 5);
        enemyIds = shuffled.map(h => h.id);
        enemyLevel = Math.max(1, Math.round(team.reduce((a, h) => a + h!.level, 0) / team.length));
        const basePower = shuffled.reduce((a, h) => a + heroStats(h, enemyLevel, RARITY_STARS[h.rarity]).power, 0);
        scale = basePower > 0 ? (teamPower * targetScale) / basePower : 1;
        rewards = { gold: 300 + oppIdx * 60, exp: 22, gems: 20 + oppIdx * 4 };
        stageId = oppIdx;
      }

      const allies = team.map((h, i) => {
        const f = makeFighter(h!.heroId, h!.level, h!.stars, "ally", i);
        // aplicar runas
        const rb = runeBonus(heroRunes[String(h!.id)] || []);
        f.maxHp += rb.hp; f.hp += rb.hp; f.atk += rb.atk; f.def += rb.def; f.crit += rb.crit; f.spd += rb.spd;
        // artefacto equipado
        const aid = (player.heroArtifacts as Record<string, string>)?.[String(h!.id)];
        if (aid) {
          const art = artifactById(aid); const lvl = ((player.artifactData as Record<string, number>) || {})[aid] || 0;
          f.atk += (art.stats.atk || 0) * (0.6 + lvl * 0.35);
          f.maxHp += (art.stats.hp || 0) * (0.5 + lvl * 0.3); f.hp = f.maxHp;
          f.def += (art.stats.def || 0); f.spd += (art.stats.spd || 0); f.crit += (art.stats.crit || 0);
        }
        return f;
      });
      const enemies = enemyIds.map((id, i) => makeFighter(id, enemyLevel, RARITY_STARS[heroById(id).rarity], "enemy", i, scale));
      const initAllies = allies.map(f => ({ ...f })); const initEnemies = enemies.map(f => ({ ...f }));
      const result = simulate(allies, enemies);

      // runa drop chance
      let runeDrop: string | null = null;
      if (Math.random() < 0.22) runeDrop = RUNES[Math.floor(Math.random() * RUNES.length)].id;

      const finalRewards = result.victory ? rewards : { gold: Math.round(rewards.gold * 0.18), exp: Math.round(rewards.exp * 0.3), gems: 0 };
      await grantExp(playerId, finalRewards.exp, finalRewards.gold, finalRewards.gems);
      const [p2] = await db.select().from(players).where(eq(players.id, playerId));
      const patch: Record<string, unknown> = { totalBattles: p2.totalBattles + 1, totalWins: p2.totalWins + (result.victory ? 1 : 0), updatedAt: new Date() };
      let arenaDelta = 0;
      let raidDamage = 0;
      if (mode === "raid") {
        // daño infligido = poder del equipo con variación
        const teamPower2 = team.reduce((a, h) => a + heroStats(heroById(h!.heroId), h!.level, h!.stars).power, 0);
        raidDamage = Math.round(teamPower2 * (0.9 + Math.random() * 0.5) * (result.victory ? 1.25 : 0.6));
        const newHp = Math.max(0, p2.jormungandrHp - raidDamage);
        const newScore = p2.jormungandrScore + raidDamage;
        if (newHp <= 0) {
          const nextMax = jormungandrStats(newScore).hp;
          patch.jormungandrHp = nextMax; patch.jormungandrMaxHp = nextMax; patch.jormungandrScore = newScore;
          // recompensa extra por derrotar
          (patch as Record<string, number>).gems = p2.gems + 120; (patch as Record<string, number>).gold = p2.gold + 2500;
          const inv = { ...((p2.runeInventory as Record<string, number>) || {}) };
          const rid = RUNES[Math.floor(Math.random() * RUNES.length)].id; inv[rid] = (inv[rid] || 0) + 2;
          patch.runeInventory = inv;
          const ad = { ...((p2.artifactData as Record<string, number>) || {}) };
          const aid = ARTIFACTS[Math.floor(Math.random() * ARTIFACTS.length)].id; ad[aid + "_shards"] = (ad[aid + "_shards"] || 0) + 12;
          patch.artifactData = ad;
        } else {
          patch.jormungandrHp = newHp; patch.jormungandrScore = newScore;
        }
        finalRewards.gold += Math.round(raidDamage / 40); finalRewards.exp += Math.round(raidDamage / 180);
        await db.update(players).set({ ...patch, gold: (p2.gold + finalRewards.gold), gems: p2.gems + (newHp === 0 ? 120 : 0) } as never).where(eq(players.id, playerId));
      } else {
        let arenaDeltaLocal = 0;
        if (result.victory && mode === "campaign" && stageId! > p2.campaignStage) patch.campaignStage = stageId!;
        if (result.victory && mode === "tower") patch.towerFloor = stageId!;
        if (mode === "arena") {
          arenaDeltaLocal = result.victory ? 18 + (stageId || 0) * 2 : -10;
          patch.arenaPoints = Math.max(100, p2.arenaPoints + arenaDeltaLocal);
          if (result.victory) patch.arenaWins = p2.arenaWins + 1;
        }
        arenaDelta = arenaDeltaLocal;
        if (runeDrop) {
          const inv = { ...((p2.runeInventory as Record<string, number>) || {}) };
          inv[runeDrop] = (inv[runeDrop] || 0) + 1; patch.runeInventory = inv;
        }
        await db.update(players).set(patch as never).where(eq(players.id, playerId));
      }
      if (mode !== "raid" && runeDrop) await db.update(players).set({ gold: p2.gold + finalRewards.gold } as never).where(eq(players.id, playerId));
      await db.insert(battleLogs).values({ playerId, mode, stageId, victory: result.victory, rewards: finalRewards });

      const s = await getState(playerId);
      return NextResponse.json({
        ...s,
        battle: { victory: result.victory, steps: result.steps, allies: initAllies, enemies: initEnemies, rounds: result.rounds, rewards: finalRewards, enemyName, mode, arenaDelta, background, raidDamage, runeDrop },
      });
    }

    if (action === "claim_daily") {
      const now = new Date();
      if (player.lastDailyAt && now.getTime() - new Date(player.lastDailyAt).getTime() < 8 * 3600 * 1000)
        return NextResponse.json({ error: "Vuelve en unas horas por más hidromiel" }, { status: 400 });
      const streak = (player.dailyStreak || 0) + 1;
      const bonus = streak % 7 === 0 ? 500 : 0;
      await db.update(players).set({ gems: player.gems + 240 + bonus, gold: player.gold + 1200, energy: Math.min(300, player.energy + 60), lastDailyAt: now, dailyStreak: streak, updatedAt: now } as never).where(eq(players.id, playerId));
      const s = await getState(playerId);
      return NextResponse.json({ ...s, dailyReward: { gems: 240 + bonus, gold: 1200, energy: 60, streak } });
    }

    if (action === "claim_quest") {
      const q = QUESTS.find(x => x.id === body.questId);
      if (!q) return NextResponse.json({ error: "Misión no encontrada" }, { status: 404 });
      if ((player.claimedQuests || []).includes(q.id)) return NextResponse.json({ error: "Ya reclamada" }, { status: 400 });
      const progress = (player as unknown as Record<string, number>)[q.metric] ?? 0;
      if (progress < q.target) return NextResponse.json({ error: "Aún no completada" }, { status: 400 });
      await db.update(players).set({ gems: player.gems + q.reward.gems, gold: player.gold + q.reward.gold, claimedQuests: [...(player.claimedQuests || []), q.id], updatedAt: new Date() }).where(eq(players.id, playerId));
      const s = await getState(playerId);
      return NextResponse.json(s);
    }

    if (action === "buy") {
      if (body.item === "energy") {
        if (player.gems < 80) return NextResponse.json({ error: "Piedras insuficientes" }, { status: 400 });
        await db.update(players).set({ gems: player.gems - 80, energy: Math.min(300, player.energy + 80), updatedAt: new Date() }).where(eq(players.id, playerId));
      } else if (body.item === "gold") {
        if (player.gems < 100) return NextResponse.json({ error: "Piedras insuficientes" }, { status: 400 });
        await db.update(players).set({ gems: player.gems - 100, gold: player.gold + 6000, updatedAt: new Date() }).where(eq(players.id, playerId));
      } else if (body.item === "gems_pack") {
        if (player.gold < 5000) return NextResponse.json({ error: "Necesitas 5.000 de oro" }, { status: 400 });
        await db.update(players).set({ gold: player.gold - 5000, gems: player.gems + 140, updatedAt: new Date() }).where(eq(players.id, playerId));
      }
      const s = await getState(playerId);
      return NextResponse.json(s);
    }

    if (action === "claim_pass") {
      const tier = Number(body.tier);
      if (seasonTier(player.seasonPassExp || 0) < tier) return NextResponse.json({ error: "Tier aún bloqueado" }, { status: 400 });
      const claimed = (player.claimedQuests || []).includes(`pass_${tier}`);
      if (claimed) return NextResponse.json({ error: "Ya reclamado" }, { status: 400 });
      const reward = tier % 5 === 0 ? { gems: 300, gold: 4000 } : { gems: 80, gold: 1200 };
      await db.update(players).set({ gems: player.gems + reward.gems, gold: player.gold + reward.gold, claimedQuests: [...(player.claimedQuests || []), `pass_${tier}`], updatedAt: new Date() } as never).where(eq(players.id, playerId));
      const s = await getState(playerId);
      return NextResponse.json(s);
    }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error del servidor: los dioses están enfadados" }, { status: 500 });
  }
}
