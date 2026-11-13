import pool from "./db/db.js";

export default async function withTransaction(transactionFn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await transactionFn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.release();
  }
}
