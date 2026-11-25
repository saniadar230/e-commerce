import withTransaction from "../helperFunctions/withTransaction.js";
import { ConflictError, NotFoundError } from "../helperFunctions/apiError.js";
import pool from "../db/db.js";

export async function getCart(customer_id) {
  const cartResult = await pool.query(
    `SELECT id, status FROM carts
     WHERE customer_id = $1 AND status = 'active'`,
    [customer_id]
  );
  const cart = cartResult.rows[0];

  if (!cart) {
    return {
      data: { id: null, status: "active", items: [] },
      pagination: null,
    };
  }

  const itemResult = await pool.query(
    `SELECT cp.variant_id, cp.quantity,
            p.id AS product_id, p.name AS product_name,
            c.name AS category_name, v.sku,
            ROUND(v.price * 100)::bigint AS unit_price,
            v.stock,
            COALESCE(variant_attrs.size, '') AS size
       FROM cart_products cp
       JOIN variants v ON v.id = cp.variant_id
       JOIN products p ON p.id = v.product_id
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN LATERAL (
         SELECT MAX(av.value) FILTER (WHERE LOWER(a.name) = 'size') AS size
           FROM variant_attribute_values vav
           JOIN attributes a ON a.id = vav.attribute_id
           JOIN attribute_values av ON av.id = vav.attribute_value_id
          WHERE vav.variant_id = v.id
       ) variant_attrs ON TRUE
      WHERE cp.cart_id = $1
      ORDER BY cp.created_at, p.name`,
    [cart.id]
  );

  return {
    data: { ...cart, items: itemResult.rows },
    pagination: null,
  };
}

export async function addCartItem(variant_id, customer_id) {
  return withTransaction(async (client) => {
    // 1. Check whether customer exists and is not deleted
    const customer = await client.query(
      `SELECT id
       FROM customers
       WHERE id = $1
       FOR SHARE`,
      [customer_id]
    );
    if (customer.rows.length === 0) {
      throw new NotFoundError("Customer not found");
    }

    // 2. Check whether variant exists and is not deleted
    const variant = await client.query(
      `SELECT id, stock
       FROM variants
       WHERE id = $1
       FOR SHARE`,
      [variant_id]
    );
    if (variant.rows.length === 0) {
      throw new NotFoundError("Variant not found");
    }

    if (variant.rows[0].stock < 1) {
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

    const cart_id = cart.rows[0].id;

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
      [cart_id, variant_id, variant.rows[0].stock]
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
       WHERE id = $1 `,
      [customer_id]
    );
    if (customer.rows.length === 0) {
      throw new NotFoundError("Customer not found");
    }

    // 2. Check whether variant exists and is not deleted
    const variant = await client.query(
      `SELECT id, stock
       FROM variants
       WHERE id = $1
       FOR SHARE
       `,
      [variant_id]
    );
    if (variant.rows.length === 0) {
      throw new NotFoundError("Variant not found");
    }

    if (quantity > variant.rows[0].stock) {
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
         WHERE id = $1`,
    [customer_id]
  );
  if (customer.rows.length === 0) {
    throw new NotFoundError("Customer not found");
  }

  // 2. Check whether variant exists and is not deleted
  const variant = await pool.query(
    `SELECT id
     FROM variants
     WHERE id = $1
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
