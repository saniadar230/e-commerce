import * as orderService from "./order.service.js";
import { successReponse } from "../helperFunctions/apiResponse.js";

// Admin
export async function getAllOrders(req, res) {
  const { pageNo, pageSize, sortBy } = req.query;
  const result = await orderService.getAllOrders(pageNo, pageSize, sortBy);
  return successReponse(
    res,
    result.data,
    200,
    "Orders were retrieved successfully",
    result.pagination
  );
}

export async function getOrderById(req, res) {
  const result = await orderService.getOrderById(req.params.orderId);
  return successReponse(res, result, 200, "Order was retrieved successfully");
}

// Customer
export async function createOrder(req, res) {
  const { customer_id, region_id, cart_id, payment_method } = req.body;
  const result = await orderService.createOrder(
    customer_id,
    region_id,
    cart_id,
    payment_method
  );
  return successReponse(res, result, 201, "Order was created successfully");
}

export async function getCustomerOrders(req, res) {
  const { customer_id, pageNo, pageSize, sortBy } = req.query;
  const result = await orderService.getCustomerOrders(
    customer_id,
    pageNo,
    pageSize,
    sortBy
  );
  return successReponse(
    res,
    result.data,
    200,
    "Orders were retrieved successfully",
    result.pagination
  );
}

export async function getCustomerOrderById(req, res) {
  const result = await orderService.getOrderById(
    req.params.orderId,
    req.query.customer_id
  );
  return successReponse(res, result, 200, "Order was retrieved successfully");
}

export async function cancelOrder(req, res) {
  const result = await orderService.cancelOrder(
    req.params.orderId,
    req.body.customer_id
  );
  return successReponse(res, result, 200, "Order was cancelled");
}
