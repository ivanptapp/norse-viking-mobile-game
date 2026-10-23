import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const rawDatabaseUrl = process.env.DATABASE_URL;

if (!rawDatabaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// Limpiamos sslmode de la URL para que no anule rejectUnauthorized: false
const databaseUrl = rawDatabaseUrl
  .replace(/[?&]sslmode=[^&]+/g, "")
  .replace(/\?$/, "");

const isRemote =
  databaseUrl.includes("supabase.co") ||
  databaseUrl.includes("pooler.supabase.com");

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);