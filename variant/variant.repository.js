import { BaseRepository } from "../common/BaseRepository.js";
import pool from "../db/db.js";

export class VariantRepository extends BaseRepository {
    constructor() {
        super("variants", ["price", "quantity"]);
    }

    // client is optional: inside a transaction we pass the transaction's client
    // variant creation
    // product name
    async findAll({
        limit = 10,
        offset = 0,
        search = null,
        searchColumn = "name",
        isDeleted = false,
        product_id
    } = {}) {
        // { is_deleted: false }
        // -- filter: only added when a search is given
        const where = search
            ? `where p.${searchColumn} ilike '%${search}% AND v.is_deleted = ${isDeleted} AND p.is_deleted = ${isDeleted} ${product_id ? `AND p.id = '${product_id}'` : ``}`
            : `WHERE p.is_deleted = ${isDeleted} AND v.is_deleted = ${isDeleted} ${product_id ? `AND p.id = '${product_id}'` : ``}`;

        // -- query 1: rows of this page

        // select * from products p join variants v on p.id = v.product_id join attributes at on v.id = at.variant_id

        const dataSql = `select * from ${this.tableName} v join products p on p.id = v.product_id join attributes at on v.id = at.variant_id  ${where} order by v.id limit $1 offset $2`;

        // -- query 2: total rows matching the same filter
        const countSql = `select count(*) from ${this.tableName} v join products p on p.id = v.product_id join attributes at on v.id = at.variant_id ${where}`;

        const [dataResult, countResult] = await Promise.all([
            pool.query(dataSql, [limit, offset]),
            pool.query(countSql),
        ]);


        return {
            data: dataResult.rows,
            total: Number(countResult.rows[0].count),
        };
    }

    // need an attribute table 

    async findById(id, { isDeleted = false } = {}) {
        const sql = `
      SELECT v.*,
       at.id AS attribute_id,
            at.name AS attribute_name,
            at.value AS attribute_value
      FROM ${this.tableName} v join attributes at on v.id = at.variant_id
      WHERE v.id = $1 AND v.is_deleted = $2 
    `;

        const result = await pool.query(sql, [id, isDeleted]);

        return result.rows;
    }

    async create(data, client = pool) {
        const sql = `insert into ${this.tableName} (product_id, price, quantity)
                     values ($1, $2, $3) RETURNING *`;
        const result = await client.query(sql, [data.product_id, data.price, data.quantity ?? 0]);
        return result.rows[0];
    }

    async findByProductId(productId) {
        const sql = `select * from ${this.tableName} where product_id = $1 order by id`;
        const result = await pool.query(sql, [productId]);
        return result.rows;
    }
}