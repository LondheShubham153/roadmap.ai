import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const tursoUrl = process.env.TURSO_DATABASE_URL;

export const db = tursoUrl
  ? drizzleLibsql(
      createClient({
        url: tursoUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
      { schema },
    )
  : drizzleSqlite(new Database(process.env.SQLITE_PATH ?? "sqlite.db"), { schema });
