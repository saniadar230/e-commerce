import { BaseRepository } from "../common/BaseRepository.js";
import pool from "../db/db.js";

export class CampaignRepository extends BaseRepository {
    constructor() {
        super("campaigns", ["name", "description", "start_date", "end_date", "status"]);
    }

    async create(data) {
        const sql = `insert into ${this.tableName}
            (name, description, start_date, end_date, status)
            values ($1, $2, $3, $4, $5) RETURNING *`;
        const result = await pool.query(sql, [
            data.name,
            data.description ?? null,
            data.start_date,
            data.end_date,
            data.status ?? "draft",
        ]);
        return result.rows[0];
    }
}