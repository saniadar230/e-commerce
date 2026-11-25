import Joi from "joi";
import { getListSchema } from "../schemas/common.js";

const uuid = Joi.string()
  .guid({ version: ["uuidv4"] })
  .messages({
    "string.base": "ID must be a string",
    "string.guid": "ID must be a valid UUIDv4",
    "any.required": "ID is required",
  });

const customerId = uuid.required().messages({
  "any.required": "Customer ID is required",
});

// params: /orders/:orderId
export const orderIdParamsSchema = Joi.object({
  orderId: uuid.required(),
});

// POST /orders
export const createOrderSchema = Joi.object({
  customer_id: customerId,
  region_id: Joi.string().guid().required().messages({
    "string.base": "Region ID must be a UUID",
    "string.guid": "Region ID must be a valid UUID",
    "any.required": "Region ID is required",
  }),
  cart_id: uuid.required().messages({ "any.required": "Cart ID is required" }),
  payment_method: Joi.string()
    .valid("cod", "card", "bank_transfer")
    .required()
    .messages({
      "any.only": "Payment method must be cod, card or bank_transfer",
      "any.required": "Payment method is required",
    }),
});

// POST /orders/:orderId/cancel
export const cancelOrderSchema = Joi.object({
  customer_id: customerId,
});

// GET /orders/:orderId (customer)
export const customerOrderQuerySchema = Joi.object({
  customer_id: customerId,
});

// GET /orders (customer): shared pagination, no search, plus customer_id
export const customerOrdersQuerySchema = getListSchema
  .fork(["search"], (s) => s.forbidden())
  .keys({ customer_id: customerId });

// GET /admin/orders: shared pagination, no search
export const orderListQuerySchema = getListSchema.fork(["search"], (s) =>
  s.forbidden()
);
