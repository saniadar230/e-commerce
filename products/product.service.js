import { sql } from "../db.js";
import { removeResponseFields } from "../helperFunctions.js";
import { ValidationError, NotFoundError, ConflictError } from "../apiError.js";

export async function getAllProducts(pageNo, pageSize, sortBy) {
  const totalCount =
    await sql`SELECT COUNT(*) FROM products WHERE is_deleted = false`;

  const totalPages = Math.ceil(totalCount[0].count / pageSize);
  if (pageNo > totalPages)
    throw new ValidationError(
      `Page number cannot be greater than total number of pages: ${totalPages}`
    );

  const products =
    await sql`SELECT * FROM products p WHERE is_deleted = false ORDER BY p.product_name 
    ${sql.unsafe(sortBy)} LIMIT ${pageSize} OFFSET ${(pageNo - 1) * pageSize}`;

  const totalRecords = totalCount[0].count;
  const hasNextPage = pageNo < totalPages;
  const hasPreviousPage = pageNo !== 1;

  const finalResponse = removeResponseFields(products);

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

export async function getProductById(id) {
  const response =
    await sql`SELECT * FROM products p WHERE p.product_id = ${id} AND is_deleted = false`;

  if (response.length === 0)
    throw new ValidationError(`Product with Id:${id} does not exist`);

  const finalResponse = removeResponseFields(response);

  return finalResponse;
}

export async function createProduct(product_name, category, price) {
  const response =
    await sql`INSERT into products (product_name,category,price) values (${product_name}, ${category}, ${price}) RETURNING *`;

  const finalResponse = removeResponseFields(response);

  return finalResponse;
}

export async function updateProduct(id, updateData) {
  const response = await sql`Update products SET ${sql(
    updateData
  )} WHERE product_id = ${id} AND is_deleted = false RETURNING *`;

  if (response.length === 0)
    throw new NotFoundError(`Product with Id:${id} does not exist`);

  const finalResponse = removeResponseFields(response);

  return finalResponse;
}

export async function deleteProduct(id) {
  const updateDeletedFields = {
    is_deleted: true,
    deleted_at: new Date(),
  };

  const response = await sql`Update products SET ${sql(
    updateDeletedFields
  )} WHERE product_id = ${id} AND is_deleted = false RETURNING *`;

  if (response.length === 0)
    throw new NotFoundError(`Product with Id:${id} does not exist`);
}
