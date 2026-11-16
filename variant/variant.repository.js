import { BaseRepository } from "../common/BaseRepository.js";
import pool from "../db/db.js";

export class VariantRepository extends BaseRepository {
    constructor() {
        super("variants", ["sku", "price", "stock"]);
    }

    // client is optional: inside a transaction we pass the transaction's client
    async create(data, client = pool) {
        const sql = `insert into ${this.tableName} (product_id, sku, price, stock)
                     values ($1, $2, $3, $4) RETURNING *`;
        const result = await client.query(sql, [data.product_id, data.sku, data.price, data.stock ?? 0]);
        return result.rows[0];
    }

    async findByProductId(productId) {
        const sql = `select * from ${this.tableName} where product_id = $1 order by id`;
        const result = await pool.query(sql, [productId]);
        return result.rows;
    }
}