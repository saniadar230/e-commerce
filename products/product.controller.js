import * as productService from "./product.service.js";
import { successReponse } from "../apiResponse.js";

export async function getAllProducts(req, res, next) {
  const { pageNo = 1, pageSize = 10, sortBy = "asc" } = req.query;

  const response = await productService.getAllProducts(
    pageNo,
    pageSize,
    sortBy
  );

  return successReponse(
    res,
    response.data,
    200,
    "Products were retrieved successfully!",
    response.pagination
  );
}

export async function getProductById(req, res, next) {
  const { id } = req.params;

  const response = await productService.getProductById(id);

  return successReponse(
    res,
    response,
    200,
    "Product was retrieved successfully!"
  );
}

export async function createProduct(req, res, next) {
  const { product_name, category, price } = req.body;

  const response = await productService.createProduct(
    product_name,
    category,
    price
  );

  return successReponse(
    res,
    response,
    201,
    "Product was created successfully!"
  );
}

export async function updateProduct(req, res, next) {
  const { product_name, category, price } = req.body;
  const { id } = req.params;

  let updateData = {};
  if (product_name) updateData.product_name = product_name;
  if (category) updateData.category = category;
  if (price) updateData.price = price;

  const response = await productService.updateProduct(id, updateData);

  return successReponse(
    res,
    response,
    200,
    "Product was updated successfully!"
  );
}

export async function deleteProduct(req, res, next) {
  const { id } = req.params;

  await productService.deleteProduct(id);

  return successReponse(res, {}, 204, "Product was deleted successfully!");
}
