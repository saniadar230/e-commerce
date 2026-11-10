import { Pool } from "pg";
import pg from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(import.meta.dirname, "../.env"),
});

pg.types.setTypeParser(1082, (value) => value);

// object containing the DB configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

pool.on("error", (err) => console.error("Idle client error:", err));

export default pool;
