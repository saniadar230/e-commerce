import withTransaction from "../withTransaction.js";
import { ConflictError, NotFoundError } from "../apiError.js";
import pool from "../db/db.js";

export async function getCart(customer_id) {
  // get all products from the cart
  const cart = await pool.query(
    `SELECT id FROM carts where customer_id = $1 AND status = 'active'`,
    [customer_id]
  );

  const cart_id = cart.rows[0].id;

  const cart_products = await pool.query(
    `SELECT p.name, v.price, quantity FROM cart_products cp
    INNER JOIN variants v
    ON v.id = cp.variant_id
    INNER JOIN products p
    ON v.product_id = p.id
    where customer_id = $1 AND status = 'active'`,
    [customer_id]
  );

  return {
    data: cart ? cart : [],
  };
}

export async function addCartItem(variant_id, customer_id) {
  return withTransaction(async (client) => {
    // 1. Check whether customer exists and is not deleted
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

    // 2. Check whether variant exists and is not deleted
    const variant = await client.query(
      `SELECT id, stock_quantity
       FROM variants
       WHERE id = $1 AND is_deleted = false
       FOR SHARE`,
      [variant_id]
    );
    if (variant.rows.length === 0) {
      throw new NotFoundError("Variant not found");
    }

    if (variant.rows[0].stock_quantity < 1) {
      throw new ConflictError("Variant is out of stock");
    }

    // 3. Find an existing active cart for this customer
    const cart = await client.query(
      `INSERT INTO carts (customer_id)
       VALUES ($1)
       ON CONFLICT (customer_id)
       WHERE status = 'active'
       DO UPDATE SET customer_id = $1
       RETURNING id`,
      [customer_id]
    );

    cart_id = cart.rows[0].id;

    // 5. Insert the item or increment quantity atomically
    const result = await client.query(
      `INSERT INTO cart_products (cart_id, variant_id, quantity)
           VALUES ($1, $2, 1)
           ON CONFLICT (cart_id, variant_id)
           DO UPDATE SET
             quantity = cart_products.quantity + 1,
             updated_at = CURRENT_TIMESTAMP
           WHERE cart_products.quantity < 10
             AND cart_products.quantity < $3
           RETURNING *`,
      [cart_id, variant_id, variant.rows[0].stock_quantity]
    );

    if (result.rows.length === 0) {
      throw new ConflictError(
        "Cart quantity cannot exceed 10 or available inventory"
      );
    }

    await client.query(
      `UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [cart_id]
    );

    return {
      cart_id,
      item: result.rows[0],
    };
  });
}

export async function updateCartItem(variant_id, customer_id, quantity) {
  return withTransaction(async (client) => {
    // 1. Check whether customer exists and is not deleted
    const customer = await client.query(
      `SELECT id
       FROM customers
       WHERE id = $1 AND is_deleted = false`,
      [customer_id]
    );
    if (customer.rows.length === 0) {
      throw new NotFoundError("Customer not found");
    }

    // 2. Check whether variant exists and is not deleted
    const variant = await client.query(
      `SELECT id, stock_quantity
       FROM variants
       WHERE id = $1 AND is_deleted = false
       FOR SHARE
       `,
      [variant_id]
    );
    if (variant.rows.length === 0) {
      throw new NotFoundError("Variant not found");
    }

    if (quantity > variant.rows[0].stock_quantity) {
      throw new ConflictError("Requested quantity exceeds available inventory");
    }

    const cart = await client.query(
      `SELECT id FROM carts where customer_id = $1 AND status = 'active' FOR UPDATE`,
      [customer_id]
    );

    if (cart.rows.length === 0) {
      throw new NotFoundError("Active cart not found");
    }

    const cart_id = cart.rows[0].id;

    let result = {};
    if (quantity === 0) {
      result = await client.query(
        `DELETE FROM cart_products WHERE cart_id = $1 AND variant_id = $2 RETURNING *`,
        [cart_id, variant_id]
      );
    } else {
      // Update the item
      result = await client.query(
        `UPDATE cart_products
         SET quantity = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE cart_id = $2
         AND variant_id = $3
         RETURNING *`,
        [quantity, cart_id, variant_id]
      );
    }

    if (result.rows.length === 0) {
      throw new NotFoundError("Cart item not found");
    }

    await client.query(
      `UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [cart_id]
    );

    return {
      cart_id,
      item: result.rows[0],
    };
  });
}

export async function removeCartItem(variant_id, customer_id) {
  // 1. Check whether customer exists and is not deleted
  const customer = await pool.query(
    `SELECT id
         FROM customers
         WHERE id = $1 AND is_deleted = false`,
    [customer_id]
  );
  if (customer.rows.length === 0) {
    throw new NotFoundError("Customer not found");
  }

  // 2. Check whether variant exists and is not deleted
  const variant = await pool.query(
    `SELECT id
     FROM variants
     WHERE id = $1 AND is_deleted = false
     FOR SHARE`,
    [variant_id]
  );
  if (variant.rows.length === 0) {
    throw new NotFoundError("Variant not found");
  }

  // 3. Find the active cart
  const cart = await pool.query(
    `SELECT id FROM carts where customer_id = $1 AND status = 'active' FOR UPDATE`,
    [customer_id]
  );

  if (cart.rows.length === 0) {
    throw new NotFoundError("Active cart not found");
  }

  const cart_id = cart.rows[0].id;

  //4. Delete the variant from the cart
  const result = await pool.query(
    `DELETE FROM cart_products WHERE cart_id = $1 AND variant_id = $2 RETURNING *`,
    [cart_id, variant_id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError("Cart item not found");
  }

  await pool.query(
    `UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [cart_id]
  );

  return {
    cart_id,
    item: result.rows[0],
  };
}
