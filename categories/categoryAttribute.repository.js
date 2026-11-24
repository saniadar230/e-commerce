import { BaseRepository } from "../common/BaseRepository.js";
import pool from "../db/db.js"


// category_attributes 
// category_id , attribute_id
export class CategoryAttributeRepository extends BaseRepository {
    constructor() {
        super("category_attributes", ["required"])
    }
    // over ride from base repository

    async create(data) {
        const sql = `insert into ${this.tableName} (category_id, attribute_id, required) values ($1, $2, $3) RETURNING *`

        // if data.required is null or undefined, use false. Otherwise, use its actual value. -- ?? == nullish coallesing
        const result = await pool.query(sql, [data.category_id, data.attribute_id, data.required ?? false])

        return result.rows[0]
    }

    // new fn -- not overriden form base class 
    // need to join the attributes and category_attributes
    // -- this.tableName = category_attributes
    async findByCategoryId(categoryId) {
        const sql = `select a.id, a.name, a.is_active, ca.required
        from ${this.tableName} ca JOIN attributes a ON a.id = ca.attribute_id
        where ca.category_id = $1 ORDER BY a.name`;

        const result = await pool.query(sql, [categoryId])
        return result.rows // arry can be empty
    }


    async deleteCategoryAttribute(categoryId, attributeId) {
        const sql = `delete from ${this.tableName} where category_id=$1 AND attribute_id = $2 returning *`

        const result = await pool.query(sql, [categoryId, attributeId]);

        return result.rows[0] ?? null
    }
}