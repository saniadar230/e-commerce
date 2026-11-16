import pool from "../db/db.js";
import { removeResponseFields } from "../helperFunctions/helperFunctions.js";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../helperFunctions/apiError.js";

export async function getAllOrders(pageNo, pageSize, sortBy) {
  const totalCount = await pool.query(`SELECT COUNT(*) FROM orders`);

  const totalPages = Math.ceil(totalCount[0].count / pageSize);
  if (pageNo > totalPages)
    throw new ValidationError(
      `Page number cannot be greater than total number of pages: ${totalPages}`
    );

  const orders = await pool.query(`
      SELECT * FROM orders o 
      ORDER BY o.customer_id 
      ${sortBy} LIMIT ${pageSize} OFFSET ${(pageNo - 1) * pageSize}`);

  const totalRecords = totalCount[0].count;
  const hasNextPage = pageNo < totalPages;
  const hasPreviousPage = pageNo !== 1;

  const finalResponse = removeResponseFields(orders);

  return {
    pagination: {
      pageNo,
      pageSize,
      totalRecords,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    data: finalResponse,
  };
}

export async function getOrderById(order_id, customer_id = null) {
  const values = [orderId];

  let query = `
    SELECT id, customer_id, status, total_amount, created_at, updated_at
    FROM orders
    WHERE id = $1
  `;

  if (customerId) {
    values.push(customerId);
    query += ` AND customer_id = $2`;
  }

  const order = await pool.query(query, values);
  if (order.rows.length === 0) {
    throw new NotFoundError("Order not found");
  }

  const items = await pool.query(
    `SELECT oi.variant_id, v.sku, p.name AS product_name,
            oi.quantity, oi.unit_price, oi.discount_amount,
            (oi.quantity * oi.unit_price - oi.discount_amount) AS line_total
       FROM order_items oi
       JOIN variants v ON v.id = oi.variant_id
       JOIN products p ON p.id = v.product_id
      WHERE oi.order_id = $1
      ORDER BY oi.id`,
    [orderId]
  );

  const payments = await pool.query(
    `SELECT id, payment_method, payment_status, amount, refunded_amount, created_at
       FROM payments
      WHERE order_id = $1
      ORDER BY created_at, id`,
    [orderId]
  );

  const finalResponse = removeResponseFields(order.rows);

  return { ...order.rows[0], items: items.rows, payments: payments.rows };
}

export async function getCustomerOrders(customer_id, pageNo, pageSize, sortBy) {
  const totalCount = await pool.query(
    `SELECT COUNT(*) FROM orders o WHERE customer_id = $1`,
    [customer_id]
  );

  const totalPages = Math.ceil(Number(totalCount.rows[0].count) / pageSize);
  if (pageNo > totalPages)
    throw new ValidationError(
      `Page number cannot be greater than total number of pages: ${totalPages}`
    );

  const totalRecords = totalCount.rows[0].count;
  const hasNextPage = pageNo < totalPages;
  const hasPreviousPage = pageNo !== 1;

  const orders = await pool.query(
    `SELECT * FROM orders c 
        WHERE customer_id = $1
        ORDER BY c.id ${sortBy.toUpperCase()} LIMIT $2 OFFSET $3`,
    [customer_id, pageSize, (pageNo - 1) * pageSize]
  );

  const finalResponse = removeResponseFields(order.rows);

  return {
    pagination: {
      pageNo,
      pageSize,
      totalRecords,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    data: finalResponse,
  };
}

// All money values (prices, discounts, totals) are integer cents.
// node-pg returns bigint/numeric columns as strings, so convert with Number().
export async function createOrder(customer_id, region_id, cart_id) {
  return withTransaction(async (client) => {
    // 1. Customer must exist and not be deleted
    const customer = await client.query(
      `SELECT id
        FROM customers
        WHERE id = $1 AND is_deleted = false
        FOR SHARE`,
      [customer_id]
    );
    if (customer.rows.length === 0) {
      throw new NotFoundError("Customer not found");
    }

    const region = await client.query(`SELECT id FROM regions WHERE id = $1`, [
      region_id,
    ]);
    if (region.rows.length === 0) throw new NotFoundError("Region not found");

    // 2. Cart must exist, belong to this customer and be active.
    //    Lock it once here so nobody else can check it out twice.
    const cart = await client.query(
      `SELECT id
         FROM carts
        WHERE id = $1
          AND customer_id = $2
          AND status = 'active'
        FOR UPDATE`,
      [cart_id, customer_id]
    );
    if (cart.rows.length === 0) {
      throw new NotFoundError("Cart not found");
    }

    // 3. Cart lines + variant/product info + most specific promotion per line
    const cartProducts = await client.query(
      `SELECT
          cp.variant_id,
          cp.quantity,
          v.sku,
          ROUND(v.price * 100)::bigint AS unit_price,
          v.stock AS stock_quantity,
          p.name  AS product_name,
          promo.promotion_id,
          promo.discount_type,
          promo.discount_value,
          ROUND(promo.discount_value * 100)::bigint AS discount_value_cents
       FROM cart_products cp
       JOIN variants v ON v.id = cp.variant_id
       JOIN products p ON p.id = v.product_id
       LEFT JOIN LATERAL (
          SELECT pr.id AS promotion_id, pr.discount_type, pr.discount_value
            FROM campaign_applications ca
            JOIN campaigns  cg ON cg.id = ca.campaign_id
                              AND cg.status = 'active'
                              AND NOW() >= cg.start_date AND NOW() < cg.end_date
            JOIN promotions pr ON pr.id = ca.promotion_id AND pr.status = 'active'
           WHERE (ca.region_id IS NULL OR ca.region_id = $2::int)
             AND (
                   ca.scope = 'global'
                OR (ca.scope = 'category' AND ca.category_id = p.category_id)
                OR (ca.scope = 'product'  AND ca.product_id  = p.id)
                OR (ca.scope = 'variant'  AND ca.variant_id  = v.id)
             )
           ORDER BY
             CASE ca.scope WHEN 'variant'  THEN 1
                           WHEN 'product'  THEN 2
                           WHEN 'category' THEN 3
                           ELSE 4 END,
             (ca.region_id IS NULL),   -- region-specific beats region-wide
             ca.id
           LIMIT 1
       ) promo ON true
       WHERE cp.cart_id = $1
       ORDER BY cp.variant_id
       FOR UPDATE OF cp, v
       FOR SHARE OF p`,
      [cartId, regionId]
    );
    if (cartProducts.rows.length === 0)
      throw new NotFoundError("Cart is empty");

    // 4. Validate stock and compute prices (in cents)
    let totalCents = 0;
    const items = cartProducts.rows.map((row) => {
      if (row.stock_quantity < row.quantity) {
        throw new ConflictError(`Insufficient stock for ${row.sku}`);
      }

      const unitPrice = Number(row.unit_price);

      let unitDiscount = 0;
      if (row.promotion_id) {
        unitDiscount =
          row.discount_type === "percentage"
            ? Math.round((unitPrice * Number(row.discount_value)) / 100)
            : Number(row.discount_value_cents); // fixed amount
        unitDiscount = Math.min(unitDiscount, unitPrice);
      }

      // discount_amount = TOTAL discount for the row, as stored in order_items
      const discountAmount = unitDiscount * row.quantity;
      totalCents += unitPrice * row.quantity - discountAmount;

      return {
        variant_id: row.variant_id,
        sku: row.sku,
        product_name: row.product_name,
        quantity: row.quantity,
        unit_price: unitPrice,
        discount_amount: discountAmount,
      };
    });

    if (totalCents <= 0)
      throw new ConflictError("Order total must be greater than zero");

    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, total_amount)
       VALUES ($1, $2)
       RETURNING id, status, created_at`,
      [customerId, totalCents]
    );
    const order = orderResult.rows[0];

    const payment = await client.query(
      `INSERT INTO payments (order_id, payment_method, amount)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [order.id, paymentMethod, totalCents]
    );

    // 6. Insert all order items in one statement.
    //    Prices and promotions are snapshotted so later changes don't alter history.
    await client.query(
      `INSERT INTO order_items (order_id, variant_id, quantity, unit_price, discount_amount)
       SELECT 
          $1::uuid,
          u.variant_id,
          u.quantity,
          u.unit_price,
          u.discount_amount
        FROM UNNEST(
          $2::uuid[],
          $3::int[],
          $4::bigint[],
          $5::bigint[]
        ) AS u(variant_id, quantity, unit_price, discount_amount);`,
      [
        order.id,
        items.map((i) => i.variant_id),
        items.map((i) => i.quantity),
        items.map((i) => i.unit_price),
        items.map((i) => i.discount_amount),
      ]
    );
    // 7. Decrement stock. The guard in WHERE is a safety net on top of the row locks.
    for (const item of items) {
      const upd = await client.query(
        `UPDATE variants
            SET stock = stock - $1
          WHERE id = $2
            AND stock >= $1`,
        [item.quantity, item.variant_id]
      );
      if (upd.rowCount === 0) {
        throw new ConflictError(`Insufficient stock for ${item.sku}`);
      }
    }

    // 8. Close the cart so it can't be checked out again
    await client.query(`UPDATE carts SET status = 'converted' WHERE id = $1`, [
      cart_id,
    ]);

    return {
      order_id: order.id,
      payment_id: payment.rows[0].id,
      payment_method: paymentMethod,
      status: order.status,
      created_at: order.created_at,
      total_amount: totalCents,
      items,
    };
  });
}

export async function restoreStock(client, orderId) {
  // Total quantity per variant
  const items = await client.query(
    `SELECT variant_id, SUM(quantity)::int AS quantity
      FROM order_items
      WHERE order_id = $1
      ORDER BY variant_id`,
    [orderId]
  );
  if (items.rows.length === 0) return;

  const variantIds = items.rows.map((r) => r.variant_id);
  const quantities = items.rows.map((r) => r.quantity);

  // Lock variants in id order (same order createOrder locks them) to avoid deadlocks
  const locked = await client.query(
    `SELECT id FROM variants
      WHERE id = ANY($1::uuid[])
      ORDER BY id
      FOR UPDATE`,
    [variantIds]
  );
  if (locked.rowCount !== variantIds.length) {
    throw new ConflictError(
      "Could not lock every order variant to restore stock"
    );
  }

  const restored = await client.query(
    `UPDATE variants v
        SET stock = v.stock + t.quantity
       FROM unnest($1::uuid[], $2::int[]) AS t(variant_id, quantity)
      WHERE v.id = t.variant_id`,
    [variantIds, quantities]
  );
  if (restored.rowCount !== variantIds.length) {
    throw new ConflictError("Could not restore stock for every order item");
  }
}

export async function cancelOrder(orderId, customerId) {
  const { response, sessionsToExpire } = await withTransaction(
    async (client) => {
      const found = await client.query(
        `SELECT id, status FROM orders
        WHERE id = $1 AND customer_id = $2
        FOR UPDATE`,
        [orderId, customerId]
      );
      if (found.rows.length === 0) throw new NotFoundError("Order not found");

      const { status } = found.rows[0];
      if (status === "cancelled") {
        return {
          response: { order_id: orderId, status },
          sessionsToExpire: [],
        };
      }
      if (status !== "pending") {
        throw new ConflictError(
          `An order that is ${status} cannot be cancelled`
        );
      }

      const pays = await client.query(
        `SELECT id, payment_status, stripe_checkout_session_id
         FROM payments WHERE order_id = $1 FOR UPDATE`,
        [orderId]
      );
      if (
        pays.rows.some((p) =>
          ["paid", "partially_refunded"].includes(p.payment_status)
        )
      ) {
        throw new ConflictError("Order is already paid; it must be refunded");
      }

      await client.query(
        `UPDATE payments
          SET payment_status = 'failed', failure_reason = 'order_cancelled', updated_at = NOW()
        WHERE order_id = $1 AND payment_status = 'pending'`,
        [orderId]
      );

      await restoreStock(client, orderId);
      await client.query(
        `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
        [orderId]
      );

      return {
        response: { order_id: orderId, status: "cancelled" },
        sessionsToExpire: pays.rows
          .filter(
            (p) =>
              p.payment_status === "pending" && p.stripe_checkout_session_id
          )
          .map((p) => p.stripe_checkout_session_id),
      };
    }
  );

  // Best-effort, after commit: close any open Stripe checkout page
  for (const id of sessionsToExpire) {
    try {
      await stripe.checkout.sessions.expire(id);
    } catch {
      /* already expired/completed */
    }
  }
  return response;
}
