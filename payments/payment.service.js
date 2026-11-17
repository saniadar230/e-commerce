import pool from "../db/db.js";
import withTransaction from "../helperFunctions/withTransaction.js";
import stripe from "../config/stripe.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../helperFunctions/apiError.js";

// Gives an order's stock back to its variants. Must run inside a transaction.
// The caller must have locked the order and checked its status first, so
// stock is never restored twice.
export async function restoreStock(client, orderId) {
  const items = await client.query(
    `SELECT variant_id, SUM(quantity)::int AS quantity
       FROM order_items
      WHERE order_id = $1
      GROUP BY variant_id
      ORDER BY variant_id`,
    [orderId]
  );
  if (items.rows.length === 0) return;

  const variantIds = items.rows.map((r) => r.variant_id);
  const quantities = items.rows.map((r) => r.quantity);

  // Lock variants in id order (same order createOrder uses) to avoid deadlocks
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

async function buildLineItems(payment) {
  const items = await pool.query(
    `SELECT oi.quantity, oi.unit_price, oi.discount_amount,
            p.name AS product_name, v.sku
       FROM order_items oi
       JOIN variants v ON v.id = oi.variant_id
       JOIN products p ON p.id = v.product_id
      WHERE oi.order_id = $1
      ORDER BY oi.id`,
    [payment.order_id]
  );
  if (items.rows.length === 0)
    throw new ConflictError("Order has no items to pay for");

  let total = 0;
  const lineItems = items.rows.map((r) => {
    const quantity = Number(r.quantity);
    const unitPrice = Number(r.unit_price);
    const discount = Number(r.discount_amount);
    const lineTotal = quantity * unitPrice - discount;
    if (lineTotal <= 0)
      throw new ConflictError(`Item ${r.sku} has no payable price`);
    total += lineTotal;

    if (discount === 0) {
      return {
        quantity,
        price_data: {
          currency: payment.currency,
          unit_amount: unitPrice,
          product_data: { name: r.product_name, description: r.sku },
        },
      };
    }
    // Discounted: exact row total as one unit, so the sum never drifts by a cent
    return {
      quantity: 1,
      price_data: {
        currency: payment.currency,
        unit_amount: lineTotal,
        product_data: {
          name: `${r.product_name} (x${quantity}, discounted)`,
          description: r.sku,
        },
      },
    };
  });

  if (total !== Number(payment.amount)) {
    throw new ConflictError(
      `Order items total (${total}) does not match payment amount (${payment.amount})`
    );
  }
  return lineItems;
}

// Guard: throws unless this payment can start an online (Stripe) checkout
function paymentAction(payment) {
  if (payment.payment_method === "cod") {
    throw new ConflictError(
      "Cash-on-delivery orders do not have an online payment session"
    );
  }
  if (payment.payment_method === "bank_transfer") {
    throw new ConflictError(
      "Bank orders do not have an online payment session"
    );
  }
  if (payment.order_status !== "pending") {
    throw new ConflictError(
      `An order that is ${payment.order_status} cannot be paid`
    );
  }
  if (payment.payment_status !== "pending") {
    throw new ConflictError(`Payment is ${payment.payment_status}`);
  }
}

async function findCustomerOrderPayment(
  client,
  orderId,
  customerId,
  lock = false
) {
  const result = await client.query(
    `SELECT p.id, p.order_id, p.payment_method, p.payment_status, p.amount,
            p.currency, p.stripe_checkout_session_id,
            p.created_at, p.updated_at, o.status AS order_status
       FROM payments p
       JOIN orders o ON o.id = p.order_id
      WHERE p.order_id = $1
        AND o.customer_id = $2
      ORDER BY p.created_at DESC, p.id
      LIMIT 1${lock ? " FOR UPDATE OF p, o" : ""}`,
    [orderId, customerId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError("Order payment not found");
  }
  return result.rows[0];
}

async function createStripeSession(payment) {
  // 1. Reuse or reject an existing session for this attempt
  if (payment.stripe_checkout_session_id) {
    const existing = await stripe.checkout.sessions.retrieve(
      payment.stripe_checkout_session_id
    );

    if (existing.status === "open") {
      return {
        payment_id: payment.id,
        order_id: payment.order_id,
        payment_method: payment.payment_method,
        payment_status: payment.payment_status,
        amount: payment.amount,
        currency: payment.currency,
        checkout_url: existing.url,
      };
    }
    if (existing.status === "complete") {
      // Customer already paid; the webhook just hasn't been processed yet
      throw new ConflictError(
        "Payment is being processed, please wait a moment"
      );
    }
    // status === "expired": fall through and create a fresh session
  }

  // 2. Build line items first so a mismatch fails before touching Stripe
  const lineItems = await buildLineItems(payment);

  // 3. Create the session
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: lineItems,
      metadata: { payment_id: payment.id, order_id: payment.order_id },
      payment_intent_data: { metadata: { payment_id: payment.id } },
      success_url: `${process.env.FRONTEND_URL}/orders/${payment.order_id}?paid=1`,
      cancel_url: `${process.env.FRONTEND_URL}/orders/${payment.order_id}?cancelled=1`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min is Stripe's minimum
    },
    {
      idempotencyKey: `checkout-${payment.id}-${
        payment.stripe_checkout_session_id ?? "first"
      }`,
    }
  );

  // 4. Save the session id on the payment (only while still pending)
  const saved = await pool.query(
    `UPDATE payments
        SET stripe_checkout_session_id = $1, updated_at = NOW()
      WHERE id = $2 AND payment_status = 'pending'`,
    [session.id, payment.id]
  );
  if (saved.rowCount === 0) {
    // Payment changed state (e.g. order cancelled) while we talked to Stripe
    try {
      await stripe.checkout.sessions.expire(session.id);
    } catch {
      /* ignore */
    }
    throw new ConflictError("Payment is no longer pending");
  }

  return {
    payment_id: payment.id,
    order_id: payment.order_id,
    payment_method: payment.payment_method,
    payment_status: payment.payment_status,
    amount: payment.amount,
    currency: payment.currency,
    checkout_url: session.url,
  };
}

export async function startPayment(orderId, customerId) {
  const payment = await findCustomerOrderPayment(pool, orderId, customerId);
  paymentAction(payment);
  return createStripeSession(payment);
}

export async function retryPayment(orderId, customerId) {
  const payment = await withTransaction(async (client) => {
    const payment = await findCustomerOrderPayment(
      client,
      orderId,
      customerId,
      true
    );
    if (payment.payment_method === "cod") {
      throw new ConflictError("Cash-on-delivery payments cannot be retried");
    }
    if (payment.payment_method === "bank_transfer") {
      throw new ConflictError(
        "Bank-transfer payments cannot be retried through online checkout"
      );
    }
    if (payment.order_status !== "pending") {
      throw new ConflictError(
        `An order that is ${payment.order_status} cannot be paid`
      );
    }
    if (payment.payment_status === "pending") {
      return payment;
    }
    if (payment.payment_status !== "failed") {
      throw new ConflictError(
        `Payment is ${payment.payment_status} and cannot be retried`
      );
    }

    const retry = await client.query(
      `INSERT INTO payments (order_id, payment_method, amount, currency)
       VALUES ($1, $2, $3, $4)
       RETURNING id, order_id, payment_method, payment_status, amount,
                 currency, stripe_checkout_session_id, 'pending'::text AS order_status`,
      [
        payment.order_id,
        payment.payment_method,
        payment.amount,
        payment.currency,
      ]
    );
    return retry.rows[0];
  });
  paymentAction(payment);
  return createStripeSession(payment);
}

export async function getOrderPayments(orderId, customerId) {
  const result = await pool.query(
    `SELECT p.id, p.order_id, p.payment_method, p.payment_status, p.amount,
            p.created_at, p.updated_at
       FROM payments p
       JOIN orders o ON o.id = p.order_id
      WHERE o.id = $1 AND o.customer_id = $2
      ORDER BY p.created_at DESC, p.id`,
    [orderId, customerId]
  );
  if (result.rows.length === 0) {
    throw new NotFoundError("Order payments not found");
  }
  return result.rows;
}

export async function getAllPayments(filters) {
  const { status, method, orderId, pageNo, pageSize, sortBy } = filters;
  const conditions = [];
  const values = [];

  if (status) {
    values.push(status);
    conditions.push(`p.payment_status = $${values.length}`);
  }
  if (method) {
    values.push(method);
    conditions.push(`p.payment_method = $${values.length}`);
  }
  if (orderId) {
    values.push(orderId);
    conditions.push(`p.order_id = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  const count = await pool.query(
    `SELECT COUNT(*) FROM payments p ${whereClause}`,
    values
  );
  const totalRecords = Number(count.rows[0].count);
  const totalPages = Math.ceil(totalRecords / pageSize);

  if (totalRecords > 0 && pageNo > totalPages) {
    throw new ValidationError(
      `Page number cannot be greater than total number of pages: ${totalPages}`
    );
  }

  const listValues = [...values, pageSize, (pageNo - 1) * pageSize];
  const result = await pool.query(
    `SELECT p.id, p.order_id, p.payment_method, p.payment_status, p.amount,
            p.refunded_amount, p.created_at, p.updated_at
       FROM payments p
       ${whereClause}
      ORDER BY p.created_at ${sortBy === "asc" ? "ASC" : "DESC"}, p.id ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    listValues
  );

  return {
    pagination: {
      pageNo,
      pageSize,
      totalRecords,
      totalPages,
      hasNextPage: pageNo < totalPages,
      hasPreviousPage: pageNo > 1,
    },
    data: result.rows,
  };
}

export async function getPaymentById(paymentId) {
  const result = await pool.query(
    `SELECT id, order_id, payment_method, payment_status, amount,
            refunded_amount, created_at, updated_at
       FROM payments
      WHERE id = $1`,
    [paymentId]
  );
  if (result.rows.length === 0) {
    throw new NotFoundError("Payment not found");
  }
  return result.rows[0];
}

// Manual confirmation for COD / bank transfer. Card goes through the webhook.
export async function markPaymentPaid(paymentId) {
  return withTransaction(async (client) => {
    const result = await client.query(
      `SELECT p.id, p.order_id, p.payment_method, p.payment_status
         FROM payments p
         JOIN orders o ON o.id = p.order_id
        WHERE p.id = $1
        FOR UPDATE OF p, o`,
      [paymentId]
    );
    if (result.rows.length === 0) throw new NotFoundError("Payment not found");

    const payment = result.rows[0];
    if (payment.payment_status === "paid") return payment;
    if (payment.payment_method === "card") {
      throw new ConflictError(
        "Card payments must be confirmed by a verified provider webhook"
      );
    }
    if (payment.payment_status !== "pending") {
      throw new ConflictError(`Payment is ${payment.payment_status}`);
    }

    const updated = await client.query(
      `UPDATE payments
          SET payment_status = 'paid', paid_at = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING id, order_id, payment_method, payment_status, amount`,
      [paymentId]
    );
    return updated.rows[0];
  });
}

// Give up on an order: fail the payment, cancel the order, restore stock
export async function failPayment(paymentId) {
  const { response, sessionId } = await withTransaction(async (client) => {
    const found = await client.query(
      `SELECT p.id, p.order_id, p.payment_status, p.stripe_checkout_session_id,
              o.status AS order_status
         FROM payments p
         JOIN orders o ON o.id = p.order_id
        WHERE p.id = $1
        FOR UPDATE OF p, o`,
      [paymentId]
    );
    if (found.rows.length === 0) throw new NotFoundError("Payment not found");

    const payment = found.rows[0];
    if (
      payment.payment_status === "failed" &&
      payment.order_status === "cancelled"
    ) {
      return {
        response: {
          payment_id: paymentId,
          order_id: payment.order_id,
          payment_status: "failed",
          order_status: "cancelled",
        },
        sessionId: null,
      };
    }
    if (payment.payment_status !== "pending") {
      throw new ConflictError(
        `Payment is ${payment.payment_status} and cannot be failed`
      );
    }
    if (payment.order_status !== "pending") {
      throw new ConflictError(
        `Order is ${payment.order_status} and cannot be cancelled for payment failure`
      );
    }

    await restoreStock(client, payment.order_id);

    await client.query(
      `UPDATE payments
          SET payment_status = 'failed', failure_reason = 'admin_failed', updated_at = NOW()
        WHERE id = $1`,
      [paymentId]
    );
    await client.query(
      `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [payment.order_id]
    );

    return {
      response: {
        payment_id: paymentId,
        order_id: payment.order_id,
        payment_status: "failed",
        order_status: "cancelled",
      },
      sessionId: payment.stripe_checkout_session_id,
    };
  });

  // After commit: close the open checkout page so it can't be paid (best effort)
  if (sessionId) {
    try {
      await stripe.checkout.sessions.expire(sessionId);
    } catch {
      /* already expired or completed */
    }
  }
  return response;
}

export async function refundPayment(paymentId, amount) {
  return withTransaction(async (client) => {
    const result = await client.query(
      `SELECT id, order_id, payment_method, payment_status, amount,
              refunded_amount, stripe_payment_intent_id
         FROM payments WHERE id = $1 FOR UPDATE`,
      [paymentId]
    );
    if (result.rows.length === 0) throw new NotFoundError("Payment not found");

    const p = result.rows[0];
    if (!["paid", "partially_refunded"].includes(p.payment_status)) {
      throw new ConflictError(
        `Payment is ${p.payment_status}; only paid payments can be refunded`
      );
    }

    const remaining = Number(p.amount) - Number(p.refunded_amount);
    const refundAmount = amount !== undefined ? Number(amount) : remaining;
    if (refundAmount > remaining) {
      throw new ConflictError(
        `Refund exceeds refundable amount (${remaining})`
      );
    }

    if (p.payment_method === "card") {
      await stripe.refunds.create(
        { payment_intent: p.stripe_payment_intent_id, amount: refundAmount },
        {
          idempotencyKey: `refund-${p.id}-${Number(
            p.refunded_amount
          )}-${refundAmount}`,
        }
      );
    }

    const newRefunded = Number(p.refunded_amount) + refundAmount;
    const status =
      newRefunded === Number(p.amount) ? "refunded" : "partially_refunded";
    const updated = await client.query(
      `UPDATE payments SET refunded_amount = $2, payment_status = $3, updated_at = NOW()
        WHERE id = $1
        RETURNING id, order_id, payment_method, payment_status, amount, refunded_amount`,
      [paymentId, newRefunded, status]
    );
    return updated.rows[0];
  });
}

// ---------------------------------------------------------------------
// Stripe webhook
// ---------------------------------------------------------------------

export async function handleStripeEvent(event) {
  await withTransaction(async (client) => {
    // Dedup: if we've seen this event id, do nothing
    const seen = await client.query(
      `INSERT INTO stripe_events (id, type) VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [event.id, event.type]
    );
    if (seen.rowCount === 0) return;

    const obj = event.data.object;
    switch (event.type) {
      case "checkout.session.completed":
        if (obj.payment_status === "paid") await markCardPaid(client, obj);
        break;
      case "checkout.session.expired":
        await markCardAttemptFailed(client, obj, event.type);
        break;
      case "charge.refunded":
        await syncRefund(client, obj);
        break;
      default:
        break;
    }
  });
}

async function markCardPaid(client, session) {
  const paymentId = session.metadata?.payment_id;
  if (!paymentId) return;

  const found = await client.query(
    `SELECT id, amount, payment_status FROM payments WHERE id = $1 FOR UPDATE`,
    [paymentId]
  );
  if (found.rows.length === 0) return;

  const payment = found.rows[0];
  if (payment.payment_status === "paid") return;

  if (Number(session.amount_total) !== Number(payment.amount)) {
    throw new ConflictError(`Amount mismatch on payment ${paymentId}`);
  }

  if (payment.payment_status === "failed") {
    console.warn(
      `Payment ${paymentId} was paid after being failed/cancelled; refund needed`
    );
  }

  await client.query(
    `UPDATE payments
        SET payment_status = 'paid', stripe_payment_intent_id = $2,
            paid_at = NOW(), updated_at = NOW()
      WHERE id = $1`,
    [paymentId, session.payment_intent]
  );
}

async function markCardAttemptFailed(client, session, eventType) {
  const paymentId = session.metadata?.payment_id;
  if (!paymentId) return;

  const found = await client.query(
    `SELECT p.id, p.order_id, p.payment_status,
       o.status AS order_status, o.customer_id
      FROM orders o
      JOIN payments p ON p.order_id = o.id
    WHERE p.id = $1
      AND p.stripe_checkout_session_id = $2
    FOR UPDATE OF o, p`,
    [paymentId, session.id]
  );
  if (found.rows.length === 0) return;

  const payment = found.rows[0];
  if (payment.payment_status !== "pending") return; // paid or already handled

  await client.query(
    `UPDATE payments
        SET payment_status = 'failed', failure_reason = $2, updated_at = NOW()
      WHERE id = $1`,
    [paymentId, eventType]
  );

  if (payment.order_status === "pending") {
    await restoreStock(client, payment.order_id);
    await client.query(
      `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [payment.order_id]
    );

    // Give the customer their cart back (unless they already have an active one)
    await client.query(
      `UPDATE carts SET status = 'active', updated_at = NOW()
        WHERE id = (SELECT cart_id FROM orders WHERE id = $1)
          AND status = 'converted'
          AND NOT EXISTS (
            SELECT 1 FROM carts WHERE customer_id = $2 AND status = 'active'
          )`,
      [payment.order_id, payment.customer_id]
    );
  }
}

// Syncs refunds made from the Stripe dashboard
async function syncRefund(client, charge) {
  const found = await client.query(
    `SELECT id, amount FROM payments
      WHERE stripe_payment_intent_id = $1 FOR UPDATE`,
    [charge.payment_intent]
  );
  if (found.rows.length === 0) return;

  const { id, amount } = found.rows[0];
  const refunded = Number(charge.amount_refunded);
  const status = refunded >= Number(amount) ? "refunded" : "partially_refunded";

  await client.query(
    `UPDATE payments
        SET refunded_amount = $2, payment_status = $3, updated_at = NOW()
      WHERE id = $1 AND refunded_amount < $2`,
    [id, refunded, status]
  );
}
