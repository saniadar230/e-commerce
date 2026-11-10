import pool from "../db.js";
import fs from "fs/promises";
import path from "path";

async function migrateDatabase() {
  const client = await pool.connect();

  try {
    const __dirname = import.meta.dirname;
    const pathName = path.join(__dirname, "migrations");
    const files = await fs.readdir(pathName, "utf-8");

    await client.query(`CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    filename TEXT UNIQUE NOT NULL,
    ran_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);

    for (const file of files) {
      const filePath = path.join(pathName, file);
      const sql = await fs.readFile(filePath, "utf-8");

      const rows = await client.query(
        "SELECT filename FROM migrations ORDER BY ran_at ASC"
      );

      const alreadyRun = rows.rows.find((r) => r.filename === file);
      if (alreadyRun) continue;

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          `INSERT into migrations(filename) VALUES('${file}')`
        );
        await client.query("COMMIT");
        console.log(`Done: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`Failed: ${file}`, err);
        throw err;
      }
    }
  } finally {
    client.release();
  }
}

await migrateDatabase();
