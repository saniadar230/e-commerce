import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";
import dotenv from "dotenv";

const projectRoot = path.resolve(import.meta.dirname, "..");
const databaseName = "sql_test";

dotenv.config({ path: path.join(projectRoot, ".env") });

const connection = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
};

async function createDatabaseIfMissing() {
  const client = new Client({ ...connection, database: "postgres" });
  await client.connect();

  try {
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName],
    );

    if (result.rowCount === 0) {
      // databaseName is a fixed constant, not user input.
      await client.query(`CREATE DATABASE ${databaseName}`);
      console.log(`Created database: ${databaseName}`);
    } else {
      console.log(`Database already exists: ${databaseName}`);
    }
  } finally {
    await client.end();
  }
}

async function migrateAndSeed() {
  const client = new Client({ ...connection, database: databaseName });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        ran_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsDirectory = path.join(projectRoot, "db", "migrations");
    const migrationFiles = (await fs.readdir(migrationsDirectory))
      .filter((name) => name.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (const filename of migrationFiles) {
      const alreadyApplied = await client.query(
        "SELECT 1 FROM migrations WHERE filename = $1",
        [filename],
      );
      if (alreadyApplied.rowCount > 0) continue;

      const sql = await fs.readFile(
        path.join(migrationsDirectory, filename),
        "utf8",
      );

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO migrations (filename) VALUES ($1)", [
          filename,
        ]);
        await client.query("COMMIT");
        console.log(`Applied migration: ${filename}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Migration failed (${filename}): ${error.message}`, {
          cause: error,
        });
      }
    }

    const seedSql = await fs.readFile(
      path.join(projectRoot, "db", "seed.sql"),
      "utf8",
    );
    await client.query(seedSql);
    console.log("Seed data inserted.");
  } finally {
    await client.end();
  }
}

try {
  if (!connection.host || !connection.user) {
    throw new Error(
      "Set DB_HOST, DB_PORT, and DB_USERNAME in the project .env file.",
    );
  }

  await createDatabaseIfMissing();
  await migrateAndSeed();
  console.log(`Setup complete. Database: ${databaseName}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
