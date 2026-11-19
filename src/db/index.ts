import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema> & { $client: ReturnType<typeof postgres> };

// Viens savienojumu baseins uz procesu; dev režīmā saglabājam starp HMR pārlādēm.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres>; db?: DB };

/**
 * Savienojums tiek izveidots pirmajā izmantošanā, nevis importējot moduli —
 * tā `next build` (Vercel) nav vajadzīga datubāze. Neon: DATABASE_URL = pooled adrese.
 */
function getDb(): DB {
  if (globalForDb.db) return globalForDb.db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL nav iestatīts (skat. .env.example)");
  const client = globalForDb.pgClient ?? postgres(url, { max: 5, prepare: false });
  globalForDb.pgClient = client;
  const instance = drizzle(client, { schema }) as DB;
  globalForDb.db = instance;
  return instance;
}

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
export { schema };
