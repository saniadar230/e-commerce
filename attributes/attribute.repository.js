// attribute.repository.js

import { BaseRepository } from "../common/BaseRepository.js";
import pool from "../db/db.js"


// extends from base repository

export class AttributeRepository extends BaseRepository {
    // -- to use base class contructor -- just use super() === "attribute == this.tablename ------- [] == this.updatedColums for patch req"
    constructor() {
        super("attributes", ["name"])
    }

    // override create --don't use from base repository
    async create(data) {
        const sql = `insert into ${this.tableName} (name) values ($1) RETURNING *`
        const attribute = await pool.query(sql, [data.name],)

        return attribute.rows[0]
    }

}