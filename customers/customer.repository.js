import { BaseRepository } from "../common/BaseRepository.js";
import pool from "../db/db.js";

class CustomerRepository extends BaseRepository {
    constructor() {
        // table name + columns PATCH is allowed to update
        super("customers", ["name", "delivery_address"]);
    }

    // Overrides the base findAll: search name OR email, parameterized, with sorting
    async findAll({ limit = 10, offset = 0, search = "", sortBy = "asc" } = {}) {
        // whitelist the direction, because ORDER BY can't use a placeholder
        const direction = sortBy.toUpperCase() === "DESC" ? "DESC" : "ASC";
        const pattern = `${search}%`;

        // -- query 1: rows of this page
        const dataSql = `
      SELECT * FROM ${this.tableName}
      WHERE (name ILIKE $1 OR email ILIKE $1) AND is_deleted = false
      ORDER BY name ${direction}
      LIMIT $2 OFFSET $3
    `;

        // -- query 2: total rows matching the same filter
        const countSql = `
      SELECT COUNT(*) FROM ${this.tableName}
      WHERE (name ILIKE $1 OR email ILIKE $1) AND is_deleted = false
    `;

        const [dataResult, countResult] = await Promise.all([
            pool.query(dataSql, [pattern, limit, offset]),
            pool.query(countSql, [pattern]),
        ]);

        return {
            data: dataResult.rows,
            total: Number(countResult.rows[0].count),
        };
    }

    async findByEmail(email) {
        // -- query: active customer with this email
        const sql = `
      SELECT * FROM ${this.tableName}
      WHERE email = $1 AND is_deleted = false
    `;
        const result = await pool.query(sql, [email]);
        return result.rows[0] ?? null;
    }

    // Implements the base create()
    async create({ name, email, delivery_address }) {
        // -- query: insert and return the new row
        const sql = `
      INSERT INTO ${this.tableName} (name, email, delivery_address)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
        const result = await pool.query(sql, [name, email, delivery_address]);
        return result.rows[0];
    }

    // Overrides the base delete: also sets deleted_at and skips already-deleted rows
    async delete(id) {
        // -- query: soft delete
        const sql = `
      UPDATE ${this.tableName}
      SET is_deleted = true, deleted_at = NOW()
      WHERE id = $1 AND is_deleted = false
      RETURNING *
    `;
        const result = await pool.query(sql, [id]);
        return result.rows[0] ?? null;
    }
}

export default CustomerRepository;