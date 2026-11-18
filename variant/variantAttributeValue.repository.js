// variant attribute value ===== links variant table attribute table and attribute value

import { BaseRepository } from "../common/BaseRepository.js";
import pool from "../db/db.js";

export class VariantAttributeValueRepository extends BaseRepository {
    constructor() {
        super("variant_attribute_values", []);
    }

    // insert all attribute links of one variant (uses the transaction client)
    async createMany(variantId, attributes, client = pool) {
        const sql = `insert into ${this.tableName} (variant_id, attribute_id, attribute_value_id)
                     values ($1, $2, $3)`;
        for (const a of attributes) {
            await client.query(sql, [variantId, a.attribute_id, a.attribute_value_id]);
        }
    }

    async findByVariantId(variantId) {
        // ---- query: attribute names + values of one variant ----
        const sql = `
            select a.id as attribute_id, a.name as attribute,
                   av.id as attribute_value_id, av.value
            from ${this.tableName} vav
            JOIN attributes a ON a.id = vav.attribute_id
            JOIN attribute_values av ON av.id = vav.attribute_value_id
            where vav.variant_id = $1
            order by a.name`;
        const result = await pool.query(sql, [variantId]);
        return result.rows;
    }

    async deleteByVariantId(variantId, client = pool) {
        await client.query(`delete from ${this.tableName} where variant_id = $1`, [variantId]);
    }
}