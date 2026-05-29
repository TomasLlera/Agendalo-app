import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer auto-loads .env files — load them here.
// `.env.local` takes precedence over `.env` (dotenv keeps the first value seen).
loadEnv({ path: [".env.local", ".env"] });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Direct (non-pooled) connection for migrations / introspection.
    url: process.env.DIRECT_URL,
  },
});
