// ========= categoryRepository ===========
// how to communicate with DB

import { BaseRepository } from "../common/BaseRepository.js";
import pool from "../db/db.js"

export class CategoryRepository extends BaseRepository {
    // don't need to create constructor -- it should use the parent class constructor
    // if we define it -- we have to use super 
    // constructor(category) {
    //     super(category)
    // }

    // the repository owns its table name, so a caller can't pass a wrong one
    constructor() {
        super("categories")
    }


    // table name is stored in this.tablename
    // ${this.tablename}

    // -- over ride create method
    // (parent_id, name, path)

    async create(data) {
        const client = await pool.connect();

        try {
            // 1. Start transaction
            await client.query("BEGIN");

            // 2. Insert category (path is generated afterwards)
            const insertSql = `
            INSERT INTO ${this.tableName} (parent_id, name)
            VALUES ($1, $2)
            RETURNING *
        `;

            const result = await client.query(insertSql, [
                data.parent_id ?? null,
                data.name
            ]);

            const category = result.rows[0];

            // 3. Generate path
            let path;

            if (category.parent_id === null) {
                // Root category: its own ID
                path = String(category.id);
            } else {
                // Child category: get parent's path
                const parentSql = `
                SELECT path
                FROM ${this.tableName}
                WHERE id = $1
            `;

                const parentResult = await client.query(parentSql, [
                    category.parent_id
                ]);

                if (parentResult.rowCount === 0) {
                    throw new Error("Parent category not found");
                }

                // Append child's ID to parent's path
                path = `${parentResult.rows[0].path}.${category.id}`;
            }

            // 4. Update category path
            const updateSql = `
            UPDATE ${this.tableName}
            SET path = $1::ltree
            WHERE id = $2
            RETURNING *
        `;

            const updatedResult = await client.query(updateSql, [
                path,
                category.id
            ]);

            // 5. Commit transaction
            await client.query("COMMIT");

            return updatedResult.rows[0] ?? null;

        } catch (error) {
            // 6. Undo changes if anything fails
            await client.query("ROLLBACK");
            throw error;

        } finally {
            // 7. Release connection
            client.release();
        }
    }

}
