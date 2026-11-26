import { BaseRepository } from "../common/BaseRepository.js"; // adjust path
import pool from "../db/db.js";

// Every method takes an optional { client } so the service can run them
// inside a transaction. Without one, it uses the pool, as before.
class CartRepository extends BaseRepository {
    constructor() {
        super("carts");
    }

    // ===== customer / variant lookups =====
    async findActiveCustomer(customerId, { client = pool, forShare = false } = {}) {
        // -- query: customer that exists and is not deleted
        const sql = `
      SELECT id
      FROM customers
      WHERE id = $1 AND is_deleted = false
      ${forShare ? "FOR SHARE" : ""}
    `;
        const result = await client.query(sql, [customerId]);
        return result.rows[0] ?? null;
    }

    async findVariant(variantId, { client = pool } = {}) {
        // -- query: variant that exists and is not deleted (share-locked)
        const sql = `
      SELECT id, quantity
      FROM variants
      WHERE id = $1 AND is_deleted = false
      FOR SHARE
    `;
        const result = await client.query(sql, [variantId]);
        return result.rows[0] ?? null;
    }

    // ===== carts =====
    async findActiveCart(customerId, { client = pool, forUpdate = false } = {}) {
        // -- query: the customer's active cart
        const sql = `
      SELECT id FROM ${this.tableName}
      WHERE customer_id = $1 AND status = 'active'
      ${forUpdate ? "FOR UPDATE" : ""}
    `;
        const result = await client.query(sql, [customerId]);
        return result.rows[0] ?? null;
    }

    // Implements the base create(): get the active cart, or create it
    async create(customerId, { client = pool } = {}) {
        // -- query: insert cart, or reuse the existing active one
        const sql = `
      INSERT INTO ${this.tableName} (customer_id)
      VALUES ($1)
      ON CONFLICT (customer_id)
      WHERE status = 'active'
      DO UPDATE SET customer_id = $1
      RETURNING id
    `;
        const result = await client.query(sql, [customerId]);
        return result.rows[0];
    }

    async touch(cartId, { client = pool } = {}) {
        // -- query: bump the cart's updated_at
        const sql = `UPDATE ${this.tableName} SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`;
        await client.query(sql, [cartId]);
    }

    // ===== cart_products =====
    // ===== cart_products =====
    // ===== cart_products (paginated) =====
    // returns { data, total } -- total is needed to calculate totalPages
    async findCartProducts(cartId, { limit = 10, offset = 0, client = pool } = {}) {
        // -- query 1: items of this page
        const dataSql = `
      SELECT cp.variant_id, p.name, v.price, cp.quantity
      FROM cart_products cp
      INNER JOIN variants v ON v.id = cp.variant_id
      INNER JOIN products p ON p.id = v.product_id
      WHERE cp.cart_id = $1
      ORDER BY cp.created_at, cp.variant_id
      LIMIT $2 OFFSET $3
    `;

        // -- query 2: total items in this cart
        const countSql = `SELECT COUNT(*) FROM cart_products WHERE cart_id = $1`;

        const [dataResult, countResult] = await Promise.all([
            client.query(dataSql, [cartId, limit, offset]),
            client.query(countSql, [cartId]),
        ]);

        return {
            data: dataResult.rows,
            total: Number(countResult.rows[0].count),
        };
    }
    async addItem(cartId, variantId, stockQuantity, { client = pool } = {}) {
        // -- query: insert item, or +1 quantity (max 10 and max stock)
        const sql = `
      INSERT INTO cart_products (cart_id, variant_id, quantity)
      VALUES ($1, $2, 1)
      ON CONFLICT (cart_id, variant_id)
      DO UPDATE SET
        quantity = cart_products.quantity + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE cart_products.quantity < 10
        AND cart_products.quantity < $3
      RETURNING *
    `;
        const result = await client.query(sql, [cartId, variantId, stockQuantity]);
        return result.rows[0] ?? null;
    }

    async updateItemQuantity(cartId, variantId, quantity, { client = pool } = {}) {
        // -- query: set the item's quantity
        const sql = `
      UPDATE cart_products
      SET quantity = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE cart_id = $2
      AND variant_id = $3
      RETURNING *
    `;
        const result = await client.query(sql, [quantity, cartId, variantId]);
        return result.rows[0] ?? null;
    }

    async removeItem(cartId, variantId, { client = pool } = {}) {
        // -- query: delete the item from the cart
        const sql = `DELETE FROM cart_products WHERE cart_id = $1 AND variant_id = $2 RETURNING *`;
        const result = await client.query(sql, [cartId, variantId]);
        return result.rows[0] ?? null;
    }
}

export default CartRepository;