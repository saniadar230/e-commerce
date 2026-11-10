import { sql } from "../db.js";
import { removeResponseFields } from "../helperFunctions.js";
import { ValidationError, NotFoundError, ConflictError } from "../apiError.js";

export async function getAllOrders(pageNo, pageSize, sortBy) {
  const totalCount = await sql`SELECT COUNT(*) FROM orders`;

  const totalPages = Math.ceil(totalCount[0].count / pageSize);
  if (pageNo > totalPages)
    throw new ValidationError(
      `Page number cannot be greater than total number of pages: ${totalPages}`
    );

  const orders = await sql`SELECT * FROM orders o 
      WHERE is_deleted = false
      ORDER BY o.customer_id 
    ${sql.unsafe(sortBy)} LIMIT ${pageSize} OFFSET ${(pageNo - 1) * pageSize}`;

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

export async function getOrderItems(id, pageNo, pageSize, sortBy) {
  const orderFound = sql`SELECT * FROM orders WHERE order_id = ${id} AND is_deleted = false`;
  if (!orderFound)
    throw new NotFoundError(`Order with ID: ${id} does not exist`);

  const response =
    await sql`SELECT * FROM order_items oi WHERE oi.order_id = ${id} 
    AND is_deleted = false
    ORDER BY oi.unit_price ${sql.unsafe(sortBy)} LIMIT ${pageSize} OFFSET ${
      (pageNo - 1) * pageSize
    }`;

  const finalResponse = removeResponseFields(response);

  return finalResponse;
}

export async function getOrderById(id) {
  const response =
    await sql`SELECT * FROM orders o WHERE o.order_id = ${id} AND is_deleted = false
`;
  if (response.length === 0)
    throw new NotFoundError(`Order with Id:${id} does not exist`);

  const finalResponse = removeResponseFields(response);

  return finalResponse;
}

export async function createOrder(customer_id, status, items) {
  const date = new Date();
  const formattedDate = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}`;

  const productIds = items.map((item) => {
    return item.product_id;
  });

  const response = await sql.begin(async (sql) => {
    const customerFound =
      await sql`SELECT * FROM customers WHERE customer_id = ${customer_id} AND is_deleted = false`;

    if (customerFound.length === 0)
      throw new NotFoundError(
        `The customer with ID: ${customer_id} you are trying to create an order for does not exist`
      );

    const [order] =
      await sql`INSERT into orders (customer_id, status, order_date) values (${customer_id}, ${status}, ${formattedDate}) RETURNING *`;

    const productsFound =
      await sql`SELECT * FROM products WHERE product_id = ANY(${productIds}) AND is_deleted = false`;

    if (productsFound.length !== productIds.length)
      throw new NotFoundError("One or more products does not exist");

    const order_id = order.order_id;

    const updatedItems = items.map((item) => {
      const product = productsFound.filter(
        (product) => product.product_id === item.product_id
      );
      const unit_price = product[0].price;

      return { order_id, unit_price, ...item };
    });

    const [order_items] = await sql`INSERT into order_items ${sql(
      updatedItems,
      "order_id",
      "product_id",
      "quantity",
      "unit_price"
    )} RETURNING *`;

    return [order, order_items];
  });

  const finalResponse = removeResponseFields(response);

  return finalResponse;
}

export async function updateOrder(id, updateData) {
  const response = await sql`Update orders SET ${sql(
    updateData
  )} WHERE order_id = ${id} AND is_deleted = false RETURNING *`;

  if (response.length === 0)
    throw new NotFoundError(`Order with Id:${id} does not exist`);

  const finalResponse = removeResponseFields(response);

  return finalResponse;
}

export async function deleteOrder(id) {
  const updateDeletedFields = {
    is_deleted: true,
    deleted_at: new Date(),
  };

  await sql.begin(async (sql) => {
    const response = await sql`Update orders SET ${sql(
      updateDeletedFields
    )} WHERE order_id = ${id} AND is_deleted = false RETURNING *`;

    if (!response.length)
      throw new NotFoundError(`Order with Id:${id} does not exist`);

    await sql`Update order_items SET ${sql(
      updateDeletedFields
    )}  WHERE order_id = ${id} AND is_deleted = false`;
  });
}

export async function addOrderItem(id, product_id, quantity) {
  const product =
    await sql`SELECT price from products WHERE product_id = ${product_id} AND is_deleted = false`;

  if (product.length === 0) {
    throw new NotFoundError(`Product with Id:${id} does not exist`);
  }
  const productPrice = product[0]?.price;

  const response =
    await sql`INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (${id}, ${product_id}, ${quantity}, ${productPrice})
    ON CONFLICT (order_id, product_id)
    DO UPDATE
	    SET quantity = order_items.quantity + EXCLUDED.quantity
    RETURNING *`;

  const finalResponse = removeResponseFields(response);

  return finalResponse;
}

export async function deleteOrderItem(id, itemId) {
  const updateDeletedFields = {
    is_deleted: true,
    deleted_at: new Date(),
  };

  const response = await sql`Update order_items SET ${sql(
    updateDeletedFields
  )} WHERE order_id = ${id} AND order_item_id = ${itemId} AND is_deleted = false RETURNING *`;

  if (response.length === 0)
    throw new NotFoundError(
      `Order item with Id:${itemId} does not exist for Order with Id:${id}`
    );
}

export async function updateOrderItem(id, itemId, updateData) {
  const response = await sql`Update order_items SET ${sql(
    updateData
  )} WHERE order_id = ${id} AND order_item_id = ${itemId} AND is_deleted = false RETURNING *`;

  if (response.length === 0)
    throw new NotFoundError(
      `Order item with Id:${itemId} does not exist for Order with Id:${id}`
    );

  const finalResponse = removeResponseFields(response);

  return finalResponse;
}
