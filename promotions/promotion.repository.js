import { BaseRepository } from "../common/BaseRepository.js";
import pool from "../db/db.js";

export class PromotionRepository extends BaseRepository {
    constructor() {
        super("promotions", ["name", "description", "promotion_type", "status", "discount_type", "discount_value"]);
    }

    async create(data) {
        const sql = `insert into ${this.tableName}
            (name, description, promotion_type, status, discount_type, discount_value)
            values ($1, $2, $3, $4, $5, $6) RETURNING *`;
        const result = await pool.query(sql, [
            data.name,
            data.description ?? null,
            data.promotion_type,
            data.status ?? "active",
            data.discount_type,
            data.discount_value,
        ]);
        return result.rows[0];
    }
}