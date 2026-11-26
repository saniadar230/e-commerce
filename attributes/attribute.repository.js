// attribute.repository.js

import { BaseRepository } from "../common/BaseRepository.js";
import pool from "../db/db.js"
import format from "pg-format"

// extends from base repository

export class AttributeRepository extends BaseRepository {
    // -- to use base class contructor -- just use super() === "attribute == this.tablename ------- [] == this.updatedColums for patch req"
    constructor() {
        super("attributes", ["name", "value"])
    }

    // override create --don't use from base repository
    async create(data) {
        const sql = `insert into ${this.tableName} (variant_id,name, value) values ($1, $2, $3) RETURNING *`
        const attribute = await pool.query(sql, [data.variant_id, data.name, data.value])

        return attribute.rows[0]
    }


    async bulkCreateAttributes(variant_id, att, client) {
        const rows = att.map((attr) => [variant_id, attr.name, attr.value]);
        console.log(rows);
        const query = format(`INSERT INTO ${this.tableName} (variant_id, name, value) VALUES %L RETURNING *`, rows);

        const attributes = await client.query(query);
        return attributes.rows;
    }


    // async () {
    //     const sql = `select p.name from products p join ${this.tableName} v on p.id = v.product_id order by p.id asc;`
    //     const result = await pool.query(sql, [])

    //     return result.rows;
    // }

    // find attributes by values
    // ===== one attribute + its values inside =====
    async findByIdWithValues(id) {
        const sql = `
        select
            a.*,

            coalesce(
                json_agg(json_build_object('id', v.id, 'value', v.value) order by v.value)
                    filter (where v.id is not null),
                '[]'
            ) as options

        from ${this.tableName} a

        left join attribute_values v on v.attribute_id = a.id
        where a.id = $1
        group by a.id
    `
        const result = await pool.query(sql, [id])
        return result.rows[0] ?? null
    }

    // ===== list: same query without the id filter, plus pagination =====
    async findAll({ limit = 10, offset = 0, isActive = null } = {}) {
        const params = []
        let where = ""

        // FILTER: true = only active, false = only inactive, null = both
        if (isActive !== null) {
            params.push(isActive)
            where = `where a.is_active = $${params.length}`
        }

        // QUERY 1: the page of attributes, each with its values
        const dataSql = `
        select
            a.*,
            coalesce(
                json_agg(json_build_object('id', v.id, 'value', v.value) order by v.value)
                    filter (where v.id is not null),
                '[]'
            ) as options
        from ${this.tableName} a
        left join attribute_values v on v.attribute_id = a.id
        ${where}
        group by a.id
        order by a.name, a.id
        limit $${params.length + 1} offset $${params.length + 2}
    `
        // QUERY 2: total with the same filter
        const countSql = `select count(*)::int as total from ${this.tableName} a ${where}`

        const [dataResult, countResult] = await Promise.all([
            pool.query(dataSql, [...params, limit, offset]),
            pool.query(countSql, params),
        ])
        return { data: dataResult.rows, total: countResult.rows[0].total }
    }

}