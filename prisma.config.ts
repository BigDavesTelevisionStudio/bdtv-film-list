import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // For local dev: file:./dev.db — libsql handles local SQLite files natively
    // For production (Turso): libsql://...turso.io with auth token
    url: process.env.TURSO_DATABASE_URL ?? "file:./dev.db",
    adapter: () => {
      const url = process.env.TURSO_DATABASE_URL ?? "file:./dev.db";
      const authToken = process.env.TURSO_AUTH_TOKEN;
      return new PrismaLibSql({ url, authToken });
    },
  } as never,
});
