import * as customerService from "./customer.service.js";
import { successReponse } from "../apiResponse.js";

export async function getAllCustomers(req, res, next) {
  const { pageNo = 1, pageSize = 10, sortBy = "asc", search = "" } = req.query;

  const response = await customerService.getAllCustomers(
    pageNo,
    pageSize,
    sortBy,
    search
  );

  return successReponse(
    res,
    response.data,
    200,
    "Customers were retrieved successfully!",
    response.pagination
  );
}

export async function getCustomerById(req, res, next) {
  const { id } = req.params;

  const response = await customerService.getCustomerById(id);

  return successReponse(
    res,
    response,
    200,
    "Customer was retrieved successfully!"
  );
}

export async function getCustomerOrders(req, res, next) {
  const { id } = req.params;
  const { pageNo = 1, pageSize = 10, sortBy = "DESC" } = req.query;

  const response = await customerService.getCustomerOrders(
    id,
    pageNo,
    pageSize,
    sortBy
  );

  return successReponse(
    res,
    response.data,
    200,
    "Orders were retrieved successfully!",
    response.pagination
  );
}

export async function createCustomer(req, res, next) {
  const { customer_name, email, city } = req.body;

  const response = await customerService.createCustomer(
    customer_name,
    email,
    city
  );

  return successReponse(
    res,
    response,
    201,
    "Customer was created successfully!"
  );
}

export async function updateCustomer(req, res, next) {
  const { customer_name, city } = req.body;
  const { id } = req.params;

  let updateData = {};
  if (customer_name) updateData.customer_name = customer_name;
  if (city) updateData.city = city;

  const response = await customerService.updateCustomer(id, updateData);

  return successReponse(
    res,
    response,
    200,
    "Customer was updated successfully!"
  );
}

export async function deleteCustomer(req, res, next) {
  const { id } = req.params;

  await customerService.deleteCustomer(id);

  return successReponse(res, {}, 204, "Customer was deleted successfully!");
}
