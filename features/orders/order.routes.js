import express from "express";
import { validate } from "../../middleware/validate.js";
import { orderController } from "./order.controller.js";
import {
  orderIdParamsSchema,
  createOrderSchema,
  customerOrderQuerySchema,
  customerOrdersQuerySchema,
  orderListQuerySchema,
} from "./order.schema.js";

export const customerOrderRouter = express.Router();

// ---------------------------------------------------------------------
// Customer routes (mounted at /orders)
// ---------------------------------------------------------------------

// Checkout: turns the active cart into an order + pending payment
customerOrderRouter.post(
  "/",
  validate(createOrderSchema, "body"),
  orderController.createOrder
);

// All orders (paginated)
customerOrderRouter.get(
  "/",
  validate(orderListQuerySchema, "query"),
  orderController.getAllOrders
);

// Any order by id (items + payments)
customerOrderRouter.get(
  "/:orderId",
  validate(orderIdParamsSchema, "params"),
  orderController.getOrderById
);
