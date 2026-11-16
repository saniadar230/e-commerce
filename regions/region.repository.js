import { BaseRepository } from "../common/BaseRepository.js"
import pool from "../db/db.js"

export class RegionRepository extends BaseRepository {
    constructor() {
        // to use base class 
        super("regions", ["name", "code"])
    }

    async create(data) {
        const sql = `insert into ${this.tableName} (name,code) values ($1,$2) RETURNING *`
        const region = await pool.query(sql, [data.name, data.code],)

        return region.rows[0]
    }
}