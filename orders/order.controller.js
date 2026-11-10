import * as orderService from "./order.service.js";
import { successReponse } from "../apiResponse.js";

export async function getAllOrders(req, res, next) {
  const { pageNo = 1, pageSize = 10, sortBy = "DESC" } = req.query;

  const response = await orderService.getAllOrders(pageNo, pageSize, sortBy);

  return successReponse(
    res,
    response.data,
    200,
    "Orders were retrieved successfully!",
    response.pagination
  );
}

export async function getOrderItems(req, res, next) {
  const { id } = req.params;
  const { pageNo = 1, pageSize = 10, sortBy = "DESC" } = req.query;

  const response = await orderService.getOrderItems(
    id,
    pageNo,
    pageSize,
    sortBy
  );

  return successReponse(
    res,
    response,
    200,
    "Order items were retrieved successfully!"
  );
}

export async function getOrderById(req, res, next) {
  const { id } = req.params;

  const response = await orderService.getOrderById(id);

  return successReponse(
    res,
    response,
    200,
    "Order was retrieved successfully!"
  );
}

export async function createOrder(req, res, next) {
  const { customer_id, status, items } = req.body;

  const [order, order_items] = await orderService.createOrder(
    customer_id,
    status,
    items
  );

  return successReponse(
    res,
    { order, order_items },
    201,
    "Order was created successfully!"
  );
}

export async function updateOrder(req, res, next) {
  const { status } = req.body;
  const { id } = req.params;

  let updateData = {};
  if (status) updateData.status = status;

  const response = await orderService.updateOrder(id, updateData);

  return successReponse(res, response, 200, "Order was updated successfully!");
}

export async function deleteOrder(req, res, next) {
  const { id } = req.params;

  await orderService.deleteOrder(id);

  return successReponse(res, {}, 204, "Order was deleted successfully!");
}

export async function addOrderItem(req, res, next) {
  const { id } = req.params;
  const { product_id, quantity } = req.body;

  const response = await orderService.addOrderItem(id, product_id, quantity);

  return successReponse(
    res,
    response,
    201,
    "Order item was created successfully!"
  );
}

export async function deleteOrderItem(req, res, next) {
  const { id, itemId } = req.params;

  await orderService.deleteOrderItem(id, itemId);

  return successReponse(res, {}, 204, "Order item was deleted successfully!");
}

export async function updateOrderItem(req, res, next) {
  const { id, itemId } = req.params;
  const { unit_price, quantity } = req.body;

  let updateData = {};
  if (unit_price) updateData.unit_price = unit_price;
  if (quantity) updateData.quantity = quantity;

  const response = await orderService.updateOrderItem(id, itemId, updateData);

  return successReponse(
    res,
    response,
    200,
    "Order item was updated successfully!"
  );
}
