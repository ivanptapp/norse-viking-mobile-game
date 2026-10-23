import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: false, databaseConfigured: false, message: "PostgreSQL no está configurado" }, { status: 503 });
  }
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, databaseConfigured: true });
  } catch {
    return Response.json({ ok: false, databaseConfigured: true }, { status: 500 });
  }
}
