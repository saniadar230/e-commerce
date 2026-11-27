// order.repository.js
import pool from "../../db/db.js";
import { BaseRepository } from "../../common/BaseRepository.js";

const SORT = { asc: "ASC", desc: "DESC" };
const direction = (s) => SORT[String(s).toLowerCase()] ?? "ASC";

export class OrderRepository extends BaseRepository {
    constructor() {
        super("orders");
    }

    // client = transaction client; falls back to pool when not in a transaction
    #db(client) {
        return client ?? pool;
    }

    // ---------- LIST ----------
    async countAll() {
        const r = await pool.query(`SELECT COUNT(*) FROM orders`);
        return Number(r.rows[0].count);
    }

    async findAll(sortBy, limit, offset, customer_id) {
        const string = customer_id ? `LIMIT $2 OFFSET $3` : `LIMIT $1 OFFSET $2`;
        const where = customer_id ? `WHERE customer_id = $1` : ``;


        const r = await pool.query(
            `SELECT * FROM orders ${where}
        ORDER BY created_at ${direction(sortBy)}, id
        ${string}`,
            customer_id ? [customer_id, limit, offset] : [limit, offset]
        );
        return r.rows;
    }

    async countByCustomer(customerId) {
        const r = await pool.query(
            `SELECT COUNT(*) FROM orders WHERE customer_id = $1`,
            [customerId]
        );
        return Number(r.rows[0].count);
    }

    async findByCustomer(customerId, sortBy, limit, offset) {
        const r = await pool.query(
            `SELECT * FROM orders
        WHERE customer_id = $1
        ORDER BY created_at ${direction(sortBy)}, id
        LIMIT $2 OFFSET $3`,
            [customerId, limit, offset]
        );
        return r.rows;
    }

    // ---------- SINGLE ORDER ----------
    async findById(orderId, customerId = null) {
        const values = [orderId];
        let query = `
      SELECT id, customer_id, status, total_amount, created_at, updated_at
        FROM orders
       WHERE id = $1`;
        if (customerId) {
            values.push(customerId);
            query += ` AND customer_id = $2`;
        }
        const r = await pool.query(query, values);
        return r.rows[0] ?? null;
    }

    async findItems(orderId) {
        const r = await pool.query(
            `SELECT oi.variant_id, p.name AS product_name,
              oi.quantity, oi.unit_price,
              (oi.quantity * oi.unit_price) AS line_total
         FROM order_items oi
         JOIN variants v ON v.id = oi.variant_id
         JOIN products p ON p.id = v.product_id
        WHERE oi.order_id = $1
        ORDER BY oi.id`,
            [orderId]
        );
        return r.rows;
    }

    async findPayments(orderId) {
        const r = await pool.query(
            `SELECT id, payment_method, payment_status, amount, refunded_amount, created_at
         FROM payments
        WHERE order_id = $1
        ORDER BY created_at, id`,
            [orderId]
        );
        return r.rows;
    }

    // ---------- CREATE ORDER (all take the transaction client) ----------
    async lockCustomer(client, customerId) {
        const r = await this.#db(client).query(
            `SELECT id FROM customers
        WHERE id = $1 AND is_deleted = false
        FOR SHARE`,
            [customerId]
        );
        return r.rows[0] ?? null;
    }


    async lockActiveCart(client, customerId) {
        const r = await this.#db(client).query(
            `SELECT id FROM carts
        WHERE customer_id = $1 AND status = 'active'
        FOR UPDATE`,
            [customerId]
        );
        return r.rows[0] ?? null;
    }


    async insertOrder(client, customerId, status, totalCents, customerName, customerEmail, customerPhoneNum, delivery_address, paymentType) {

        const r = await this.#db(client).query(
            `INSERT INTO orders (customer_id, status, total_amount, customer_name,email,phone_number,delivery_address,payment_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, status, created_at`,
            [customerId, status, totalCents, customerName, customerEmail, customerPhoneNum, delivery_address, paymentType]
        );
        return r.rows[0];
    }

    async insertItems(client, orderId, items) {
        // bulk insert 
        // unnest -- UNNEST converts arrays into rows by picking values from the same indexs.
        await this.#db(client).query(
            `INSERT INTO order_items (order_id, variant_id, quantity, unit_price)
       SELECT $1::uuid, u.variant_id, u.quantity, u.unit_price
         FROM UNNEST($2::uuid[], $3::int[], $4::decimal[])
              AS u(variant_id, quantity, unit_price)`,
            [
                orderId,
                items.map((i) => i.variant_id),
                items.map((i) => i.quantity),
                items.map((i) => i.unit_price),
            ]
        );
    }

    // returns rowCount so the service can detect "not enough stock"
    async decrementStock(client, variantId, quantity) {
        const r = await this.#db(client).query(
            `UPDATE variants SET quantity = quantity - $1
        WHERE id = $2 AND quantity >= $1`,
            [quantity, variantId]
        );
        return r.rowCount;
    }

    async markCartConverted(client, cartId) {
        await this.#db(client).query(
            `UPDATE carts SET status = 'converted' WHERE id = $1`,
            [cartId]
        );
    }

    // ---------- CANCEL ORDER ----------
    async lockOrderForCustomer(client, orderId, customerId) {
        const r = await this.#db(client).query(
            `SELECT id, status FROM orders
        WHERE id = $1 AND customer_id = $2
        FOR UPDATE`,
            [orderId, customerId]
        );
        return r.rows[0] ?? null;
    }

    async lockPayments(client, orderId) {
        const r = await this.#db(client).query(
            `SELECT id, payment_method, payment_status, stripe_checkout_session_id
         FROM payments WHERE order_id = $1 FOR UPDATE`,
            [orderId]
        );
        return r.rows;
    }

    async failPendingPayments(client, orderId) {
        await this.#db(client).query(
            `UPDATE payments
          SET payment_status = 'failed', failure_reason = 'order_cancelled', updated_at = NOW()
        WHERE order_id = $1 AND payment_status = 'pending'`,
            [orderId]
        );
    }

    async sumItemsByVariant(client, orderId) {
        const r = await this.#db(client).query(
            `SELECT variant_id, SUM(quantity)::int AS quantity
         FROM order_items
        WHERE order_id = $1
        GROUP BY variant_id
        ORDER BY variant_id`,
            [orderId]
        );
        return r.rows;
    }

    async lockVariants(client, variantIds) {
        const r = await this.#db(client).query(
            `SELECT id FROM variants
        WHERE id = ANY($1::uuid[])
        ORDER BY id
        FOR UPDATE`,
            [variantIds]
        );
        return r.rowCount;
    }

    async restoreVariantStock(client, variantIds, quantities) {
        const r = await this.#db(client).query(
            `UPDATE variants v
          SET stock = v.stock + t.quantity
         FROM unnest($1::uuid[], $2::int[]) AS t(variant_id, quantity)
        WHERE v.id = t.variant_id`,
            [variantIds, quantities]
        );
        return r.rowCount;
    }

    async markCancelled(client, orderId) {
        await this.#db(client).query(
            `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
            [orderId]
        );
    }

    async reactivateLatestCart(client, customerId) {
        await this.#db(client).query(
            `UPDATE carts SET status = 'active', updated_at = NOW()
        WHERE id = (
          SELECT id FROM carts
           WHERE customer_id = $1 AND status = 'converted'
           ORDER BY updated_at DESC
           LIMIT 1
        )
        AND NOT EXISTS (
          SELECT 1 FROM carts WHERE customer_id = $1 AND status = 'active'
        )`,
            [customerId]
        );
    }
}