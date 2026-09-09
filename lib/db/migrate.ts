import "dotenv/config";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./client";

migrate(db as Parameters<typeof migrate>[0], { migrationsFolder: "./drizzle" });
console.log("Migrations applied.");
