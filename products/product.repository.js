// ========= productRepository ===========
// how to communicate with DB (products table)

import { BaseRepository } from "../common/BaseRepository.js";
import pool from "../db/db.js"

export class ProductRepository extends BaseRepository {
    // the repository owns its table name + which columns can be updated
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
    async findAll({ limit = 10, offset = 0, categoryId = null } = {}) {
        // no category filter -> parent's version already does the job
        if (categoryId === null) {
            return super.findAll({ limit, offset });
        }

        // ===== query 1: the rows of this page =====
        const dataSql = `
            SELECT p.*
            FROM ${this.tableName} p
            WHERE p.category_id IN (

                -- subquery: ids of this category + all children, grandchildren, deeper
                SELECT id
                FROM categories
                WHERE path <@ (

                    -- sub-subquery: path of the category the user selected
                    SELECT path FROM categories WHERE id = $1
                )
            )
            ORDER BY p.id
            LIMIT $2 OFFSET $3
        `;

        // ===== query 2: total number of matching products =====
        const countSql = `
            SELECT count(*)
            FROM ${this.tableName} p
            WHERE p.category_id IN (

                -- subquery: ids of this category + all descendants
                SELECT id
                FROM categories
                WHERE path <@ (

                    -- sub-subquery: path of the selected category
                    SELECT path FROM categories WHERE id = $1
                )
            )
        `;

        const [dataResult, countResult] = await Promise.all([
            pool.query(dataSql, [categoryId, limit, offset]),
            pool.query(countSql, [categoryId]),
        ]);

        return {
            data: dataResult.rows,
            total: Number(countResult.rows[0].count),
        };
    }
}