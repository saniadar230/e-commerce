import { removeResponseFields } from "../helperFunctions.js";
import { ValidationError, NotFoundError, ConflictError } from "../apiError.js";
import pool from "../db/db.js";
import formatForUpdate from "../formatForUpdate.js";

export async function getAllCustomers(pageNo, pageSize, sortBy, search) {
  const totalCount = await pool.query(
    `SELECT COUNT(*) FROM customers
      WHERE (name ILIKE $1 OR email ILIKE $1) AND is_deleted = false`,
    [`${search}%`]
  );

  const totalPages = Math.ceil(Number(totalCount.rows[0].count) / pageSize);
  if (pageNo > totalPages)
    throw new ValidationError(
      `Page number cannot be greater than total number of pages: ${totalPages}`
    );

  const customers = await pool.query(
    `SELECT * FROM customers c 
      WHERE (c.name ILIKE $1 OR c.email ILIKE $1) AND is_deleted = false
      ORDER BY c.name ${sortBy.toUpperCase()} LIMIT $2 OFFSET $3`,
    [`${search}%`, pageSize, (pageNo - 1) * pageSize]
  );

  const totalRecords = totalCount.rows[0].count;
  const hasNextPage = pageNo < totalPages;
  const hasPreviousPage = pageNo !== 1;

  const finalResponse = removeResponseFields(customers.rows);

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

export async function getCustomerById(id) {
  const response = await pool.query(
    `SELECT * FROM customers c WHERE c.id = $1 AND is_deleted = false`,
    [id]
  );

  if (response.rows.length === 0)
    throw new NotFoundError(`Customer with Id:${id} does not exist`);

  const finalResponse = removeResponseFields(response.rows);

  return finalResponse;
}

// export async function getCustomerOrders(id, pageNo, pageSize, sortBy) {
//   const customer = await client.query(
//     `SELECT id FROM customers WHERE id = $1 AND is_deleted = false`,
//     [id]
//   );

//   if (customer.length === 0)
//     throw new NotFoundError(`Customer with Id:${id} does not exist`);

//   const totalCount = await client.query(
//     `SELECT COUNT(*)  FROM orders o WHERE o.customer_id = $1 AND is_deleted = false`,
//     id
//   );

//   const totalPages = Math.ceil(totalCount[0].count / pageSize);
//   if (pageNo > totalPages)
//     throw new ValidationError(
//       `Page number cannot be greater than total number of pages: ${totalPages}`
//     );

//   const orders = await client.query(
//     `SELECT * FROM orders o WHERE o.customer_id = $1 ORDER BY order_date
//     WHERE is_deleted = false
//     ${sortBy.toUppercase()} LIMIT $2 OFFSET $3`,
//     [id, pageSize, (pageNo - 1) * pageSize]
//   );

//   const totalRecords = totalCount[0].count;
//   const hasNextPage = pageNo < totalPages;
//   const hasPreviousPage = pageNo !== 1;

//   const finalResponse = removeResponseFields(orders);

//   return {
//     pagination: {
//       pageNo,
//       pageSize,
//       totalRecords,
//       totalPages,
//       hasNextPage,
//       hasPreviousPage,
//     },
//     data: finalResponse,
//   };
// }

export async function createCustomer(name, email, delivery_address) {
  const customer = await pool.query(
    `SELECT * FROM customers WHERE email= $1 AND is_deleted = false`,
    [email]
  );

  if (customer.rows.length > 0)
    throw new ConflictError(`Customer with this email already exists`);

  const response = await pool.query(
    `INSERT INTO customers (name, email, delivery_address)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, email, delivery_address]
  );

  const finalResponse = removeResponseFields(response.rows);

  return finalResponse;
}

export async function updateCustomer(id, updateData) {
  const setClause = formatForUpdate(updateData);

  const response = await pool.query(
    `Update customers SET ${setClause} WHERE id = $1 AND is_deleted = false RETURNING *`,
    [id]
  );

  if (response.rows.length === 0)
    throw new NotFoundError(`Customer with Id:${id} does not exist`);

  const finalResponse = removeResponseFields(response.rows);

  return finalResponse;
}

export async function deleteCustomer(id) {
  const updateDeletedFields = {
    is_deleted: true,
    deleted_at: new Date(),
  };

  const columns = Object.keys(updateDeletedFields);

  const setClause = columns
    .map((key) => format("%I = %L", key, updateDeletedFields[key]))
    .join(", ");

  const response = await pool.query(
    `Update customers SET ${setClause} WHERE id = $1 AND is_deleted = false RETURNING *`,
    [id]
  );

  if (response.rows.length === 0)
    throw new NotFoundError(`Customer with ID:${id} does not exist`);
}
