import express from "express";
import { validate } from "../middleware/validate.js";
import * as orderController from "./order.controller.js";
import {
  orderIdParamsSchema,
  createOrderSchema,
  cancelOrderSchema,
  customerOrderQuerySchema,
  customerOrdersQuerySchema,
  orderListQuerySchema,
} from "./order.schema.js";

export const customerOrderRouter = express.Router();
export const adminOrderRouter = express.Router();

// ---------------------------------------------------------------------
// Customer routes (mounted at /orders)
// ---------------------------------------------------------------------

// Checkout: turns the active cart into an order + pending payment
customerOrderRouter.post(
  "/",
  validate(createOrderSchema, "body"),
  orderController.createOrder
);

// My orders (paginated)
customerOrderRouter.get(
  "/",
  validate(customerOrdersQuerySchema, "query"),
  orderController.getCustomerOrders
);

// One of my orders (items + payments)
customerOrderRouter.get(
  "/:orderId",
  validate(orderIdParamsSchema, "params"),
  validate(customerOrderQuerySchema, "query"),
  orderController.getCustomerOrderById
);

// Cancel one of my pending orders
customerOrderRouter.post(
  "/:orderId/cancel",
  validate(orderIdParamsSchema, "params"),
  validate(cancelOrderSchema, "body"),
  orderController.cancelOrder
);

// ---------------------------------------------------------------------
// Admin routes (mounted at /admin/orders)
// ---------------------------------------------------------------------

// All orders (paginated)
adminOrderRouter.get(
  "/",
  validate(orderListQuerySchema, "query"),
  orderController.getAllOrders
);

// Any order by id (items + payments)
adminOrderRouter.get(
  "/:orderId",
  validate(orderIdParamsSchema, "params"),
  orderController.getOrderById
);
