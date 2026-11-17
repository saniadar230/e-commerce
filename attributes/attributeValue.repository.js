// attributeValue.repository.js
import { BaseRepository } from "../common/BaseRepository.js";
import pool from "../db/db.js"



export class AttributeValueRepository extends BaseRepository {
    // table name = attribute_values
    // AttributeValue table contains colums === id, attribute_id, value
    constructor() {
        // value be renameable (“Red” to “Crimson”)
        super("attribute_values", ["value"])
    }


    async create(data) {
        const sql = `insert into ${this.tableName} (attribute_id, value) values ($1, $2) RETURNING *`

        const attribute_values = await pool.query(sql, [data.attribute_id, data.value])

        return attribute_values.rows[0]
    }


    // override findAll -- adds optional filter by attribute_id
    async findAll({ limit, offset, attribute_id }) {
        const params = [];
        let where = ""; // need in both queries

        if (attribute_id) {
            params.push(attribute_id);
            where = `WHERE attribute_id = $${params.length}`;
        }

        // ---- query 1: total rows (for meta.total) ---- by defualt postgres gives bigint -- :: we converting into int
        const countSql = `SELECT COUNT(*)::int AS total FROM ${this.tableName} ${where}`;

        // ---- query 2: the page of rows ----
        const dataSql = `
            SELECT * FROM ${this.tableName}
            ${where}
            ORDER BY id
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        const [countRes, dataRes] = await Promise.all([
            pool.query(countSql, params),
            pool.query(dataSql, [...params, limit, offset]),
        ]);

        return { data: dataRes.rows, total: countRes.rows[0].total };
    }
}
