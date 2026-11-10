import express from "express";
import {
  createOrderSchema,
  updateOrderSchema,
  orderItemParamsSchema,
  updateOrderItemSchema,
  addOrderItemSchema,
} from "./order.schema.js";
import { getListSchema, idSchema } from "../schemas/common.js";
import { validate } from "../middleware/validate.js";
import * as orderController from "./order.controller.js";

const orderRouter = express.Router();

orderRouter
  .route("/")
  .get(validate(getListSchema, "query"), orderController.getAllOrders)
  .post(validate(createOrderSchema, "body"), orderController.createOrder);

orderRouter
  .route("/:id")
  .get(validate(idSchema, "params"), orderController.getOrderById)
  .patch(
    validate(idSchema, "params"),
    validate(updateOrderSchema, "body"),
    orderController.updateOrder
  )
  .delete(validate(idSchema, "params"), orderController.deleteOrder);

orderRouter
  .route("/:id/order-items")
  .get(
    validate(idSchema, "params"),
    validate(getListSchema, "query"),
    orderController.getOrderItems
  )
  .post(
    validate(idSchema, "params"),
    validate(addOrderItemSchema, "body"),
    orderController.addOrderItem
  );

orderRouter
  .route("/:id/order-items/:itemId")
  .delete(
    validate(orderItemParamsSchema, "params"),
    orderController.deleteOrderItem
  )
  .patch(
    validate(orderItemParamsSchema, "params"),
    validate(updateOrderItemSchema, "body"),
    orderController.updateOrderItem
  );

export default orderRouter;
