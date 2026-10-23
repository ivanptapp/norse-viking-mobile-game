import { pgTable, serial, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  nickname: varchar("nickname", { length: 40 }).notNull().unique(),
  level: integer("level").notNull().default(1),
  exp: integer("exp").notNull().default(0),
  gold: integer("gold").notNull().default(8000),
  gems: integer("gems").notNull().default(1500),
  energy: integer("energy").notNull().default(120),
  campaignStage: integer("campaign_stage").notNull().default(0),
  towerFloor: integer("tower_floor").notNull().default(0),
  arenaPoints: integer("arena_points").notNull().default(1000),
  arenaWins: integer("arena_wins").notNull().default(0),
  totalBattles: integer("total_battles").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  summonsDone: integer("summons_done").notNull().default(0),
  teamHeroIds: jsonb("team_hero_ids").$type<number[]>().notNull().default([]),
  claimedQuests: jsonb("claimed_quests").$type<string[]>().notNull().default([]),
  artifactData: jsonb("artifact_data").$type<Record<string, number>>().notNull().default({}),
  runeInventory: jsonb("rune_inventory").$type<Record<string, number>>().notNull().default({}),
  heroRunes: jsonb("hero_runes").$type<Record<string, string[]>>().notNull().default({}),
  heroArtifacts: jsonb("hero_artifacts").$type<Record<string, string>>().notNull().default({}),
  jormungandrHp: integer("jormungandr_hp").notNull().default(50000),
  jormungandrMaxHp: integer("jormungandr_max_hp").notNull().default(50000),
  jormungandrScore: integer("jormungandr_score").notNull().default(0),
  dailyStreak: integer("daily_streak").notNull().default(0),
  seasonPassExp: integer("season_pass_exp").notNull().default(0),
  lastRaidAt: timestamp("last_raid_at"),
  lastDailyAt: timestamp("last_daily_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const playerHeroes = pgTable("player_heroes", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  heroId: varchar("hero_id", { length: 40 }).notNull(),
  level: integer("level").notNull().default(1),
  stars: integer("stars").notNull().default(2),
  shards: integer("shards").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const battleLogs = pgTable("battle_logs", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  mode: varchar("mode", { length: 20 }).notNull(),
  stageId: integer("stage_id"),
  victory: boolean("victory").notNull(),
  rewards: jsonb("rewards").$type<Record<string, number>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
