import { sql } from "../db.js";
import { removeResponseFields } from "../helperFunctions.js";
import { ValidationError, NotFoundError, ConflictError } from "../apiError.js";

export async function getAllCustomers(pageNo, pageSize, sortBy, search) {
  const totalCount = await sql`SELECT COUNT(*) FROM customers c 
      WHERE c.customer_name ILIKE ${search + "%"} OR c.email ILIKE ${
    search + "%"
  } AND is_deleted = false`;

  const totalPages = Math.ceil(totalCount[0].count / pageSize);
  if (pageNo > totalPages)
    throw new ValidationError(
      `Page number cannot be greater than total number of pages: ${totalPages}`
    );

  const customers = await sql`SELECT * FROM customers c 
      WHERE (c.customer_name ILIKE ${search + "%"} OR c.email ILIKE ${
    search + "%"
  }) AND is_deleted = false
      ORDER BY c.customer_name ${sql.unsafe(sortBy)} LIMIT ${pageSize} OFFSET ${
    (pageNo - 1) * pageSize
  }`;

  const totalRecords = totalCount[0].count;
  const hasNextPage = pageNo < totalPages;
  const hasPreviousPage = pageNo !== 1;

  const finalResponse = removeResponseFields(customers);

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
  const response =
    await sql`SELECT * FROM customers c WHERE c.customer_id = ${id} AND is_deleted = false`;

  if (response.length === 0)
    throw new NotFoundError(`Customer with Id:${id} does not exist`);

  console.log(response);

  const finalResponse = removeResponseFields(response);

  console.log(finalResponse);

  return finalResponse;
}

export async function getCustomerOrders(id, pageNo, pageSize, sortBy) {
  const customer =
    await sql`SELECT customer_id FROM customers WHERE customer_id = ${id} AND is_deleted = false`;

  if (customer.length === 0)
    throw new NotFoundError(`Customer with Id:${id} does not exist`);

  const totalCount =
    await sql`SELECT COUNT(*)  FROM orders o WHERE o.customer_id = ${id} AND is_deleted = false`;

  const totalPages = Math.ceil(totalCount[0].count / pageSize);
  if (pageNo > totalPages)
    throw new ValidationError(
      `Page number cannot be greater than total number of pages: ${totalPages}`
    );

  const orders =
    await sql`SELECT * FROM orders o WHERE o.customer_id = ${id} ORDER BY order_date 
    WHERE is_deleted = false
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

export async function createCustomer(customer_name, email, city) {
  const customer =
    await sql`SELECT * FROM customers WHERE email=${email} AND is_deleted = false`;

  if (customer.length > 0)
    throw new ConflictError(`Customer with this email already exists`);

  const response =
    await sql`INSERT into customers (customer_name,email,city) values (${customer_name.trim()}, ${email.trim()}, ${city.trim()}) RETURNING *`;

  const finalResponse = removeResponseFields(response);

  return finalResponse;
}

export async function updateCustomer(id, updateData) {
  const response = await sql`Update customers SET ${sql(
    updateData
  )} WHERE customer_id = ${id} AND is_deleted = false RETURNING *`;

  if (response.length === 0)
    throw new NotFoundError(`Customer with Id:${id} does not exist`);

  const finalResponse = removeResponseFields(response);

  return finalResponse;
}

export async function deleteCustomer(id) {
  const updateDeletedFields = {
    is_deleted: true,
    deleted_at: new Date(),
  };

  const response = await sql`Update customers SET ${sql(
    updateDeletedFields
  )} WHERE customer_id = ${id} AND is_deleted = false RETURNING *`;

  if (response.length === 0)
    throw new NotFoundError(`Customer with Id:${id} does not exist`);
}
