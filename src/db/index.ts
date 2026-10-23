import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};
type Database = ReturnType<typeof drizzle>;
let database: Database | undefined;

function getDatabase(): Database {
  if (database) return database;
  const rawDatabaseUrl = process.env.DATABASE_URL;
  if (!rawDatabaseUrl) throw new Error("DATABASE_URL is required");

  // Clean sslmode so it does not override rejectUnauthorized for remote PostgreSQL.
  const databaseUrl = rawDatabaseUrl
    .replace(/[?&]sslmode=[^&]+/g, "")
    .replace(/\?$/, "");
  const isRemote =
    databaseUrl.includes("supabase.co") ||
    databaseUrl.includes("pooler.supabase.com");
  const pool = globalForDb.__arenaNextJsPostgresqlPool ?? new Pool({
    connectionString: databaseUrl,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }
  database = drizzle(pool);
  return database;
}

// Defer pool creation until the first real query so DB-free routes can be built
// and used without inventing credentials. Keep the regular Drizzle API for callers.
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const instance = getDatabase();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
