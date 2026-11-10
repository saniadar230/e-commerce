import postgres from "postgres";

export const sql = postgres({
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "Sodone123!",
  database: "sql_test",
});
