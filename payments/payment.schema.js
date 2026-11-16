import Joi from "joi";

const uuidV4 = Joi.string()
  .guid({ version: ["uuidv4"] })
  .messages({
    "string.base": "ID must be a string",
    "string.guid": "ID must be a valid UUIDv4",
    "any.required": "ID is required",
  });

export const orderIdParamsSchema = Joi.object({
  orderId: uuidV4.required(),
});

export const customerPaymentBodySchema = Joi.object({
  customer_id: uuidV4.required().messages({
    "any.required": "Customer ID is required",
  }),
});

export const customerOrderPaymentsQuerySchema = Joi.object({
  customer_id: uuidV4.required().messages({
    "any.required": "Customer ID is required",
  }),
});

export const paymentIdParamsSchema = Joi.object({
  paymentId: uuidV4.required(),
});

export const paymentListQuerySchema = Joi.object({
  status: Joi.string().valid(
    "pending",
    "paid",
    "failed",
    "refunded",
    "partially_refunded"
  ),
  method: Joi.string().valid("cod", "card", "bank_transfer"),
  orderId: uuidV4,
  pageNo: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page number must be a number",
    "number.integer": "Page number must be an integer",
    "number.min": "Page number must be at least 1",
  }),
  pageSize: Joi.number()
    .integer()
    .valid(5, 10, 15, 20, 25, 30)
    .default(20)
    .messages({
      "number.base": "Page size must be a number",
      "number.integer": "Page size must be an integer",
      "any.only": "Page size must be one of 5, 10, 15, 20, 25, or 30",
    }),
  sortBy: Joi.string()
    .trim()
    .lowercase()
    .valid("asc", "desc")
    .default("desc")
    .messages({
      "string.base": "Sort by must be a string",
      "any.only": "Sort by must be asc or desc",
    }),
});

export const refundPaymentSchema = Joi.object({
  // Amount is optional; when omitted, the full payment is refunded.
  // Amounts are represented as integer cents, matching payments.amount.
  amount: Joi.number()
    .integer()
    .min(1)
    .max(Number.MAX_SAFE_INTEGER)
    .optional()
    .messages({
      "number.base": "Refund amount must be a number",
      "number.integer": "Refund amount must be a whole number of cents",
      "number.min": "Refund amount must be greater than zero",
      "number.max": "Refund amount is too large",
    }),
});
