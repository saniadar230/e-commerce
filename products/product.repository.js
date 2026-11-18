// ========= productRepository ===========
// how to communicate with DB (products table)

import { BaseRepository } from "../common/BaseRepository.js";
import pool from "../db/db.js"

export class ProductRepository extends BaseRepository {
    // super access the base class constructor
    // id is NOT in the list, so nobody can change it

    constructor() {
        super("products", ["name", "description", "category_id"])
    }

    // -- override create (insert columns differ per table)
    async create(data) {
        const sql = `
            INSERT INTO ${this.tableName} (category_id, name, description)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const result = await pool.query(sql, [
            data.category_id,
            data.name,
            data.description ?? null
        ]);

        return result.rows[0];
    }

    // -- override findAll: same as the parent + optional category filter
    // categoryId given  -> products of that category AND all its descendants
    // categoryId empty   -> all products
    async findAll({ limit = 10, offset = 0, categoryId = null, search = null } = {}) {
        const conditions = []
        const params = []

        // FILTER 1: category + all its descendants
        if (categoryId) {
            params.push(categoryId)
            conditions.push(`p.category_id IN (
            select id from categories
            where path <@ (select path from categories where id = $${params.length})
        )`)
        }

        // FILTER 2: name search (case-insensitive)
        if (search) {
            params.push(`%${search}%`)
            conditions.push(`p.name ILIKE $${params.length}`)
        }

        const where = conditions.length ? `where ${conditions.join(" and ")}` : ""

        // QUERY 1: the page (name first so it looks sorted, id keeps it stable)
        const dataSql = `
        select p.* from ${this.tableName} p
        ${where}
        order by p.name, p.id
        limit $${params.length + 1} offset $${params.length + 2}
    `
        // QUERY 2: total count with the same filters
        const countSql = `select count(*) from ${this.tableName} p ${where}`

        const [dataResult, countResult] = await Promise.all([
            pool.query(dataSql, [...params, limit, offset]),
            pool.query(countSql, params),
        ])

        return { data: dataResult.rows, total: Number(countResult.rows[0].count) }
    }


}