import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // migrācijām — tiešais (ne pooled) savienojums, ja ir (Neon: DATABASE_URL_UNPOOLED)
  dbCredentials: { url: (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)! },
  strict: true,
});
