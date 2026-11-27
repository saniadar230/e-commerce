import Joi from "joi";
import { getListSchema } from "../../schemas/common.js";

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
  customerId: customerId,
  // cartId: uuid.required().messages({
  //   "any.required": "Cart ID is required",
  // }),
  customerName: Joi.string().trim().min(1).max(150).required(),
  customerEmail: Joi.string().trim().email().max(255).required(),
  customerPhoneNum: Joi.string().trim().min(1).max(30).required(),
  delivery_address: Joi.string().trim().min(1).required(),
  paymentType: Joi.string()
    .valid("cod", "card")
    .required()
    .messages({
      "any.only": "Payment type must be cod or card",
      "any.required": "Payment type is required",
    }),
});

// GET /orders/:orderId (customer)
export const customerOrderQuerySchema = Joi.object({
  customer_id: customerId,
});

// GET /orders (customer)
export const customerOrdersQuerySchema = getListSchema
  .fork(["search"], (s) => s.forbidden())
  .keys({ customer_id: customerId });

// GET /admin/orders
export const orderListQuerySchema = getListSchema.keys({
  customer_id: uuid.optional()
})