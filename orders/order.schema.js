import Joi from "joi";

const idSchema = Joi.number().positive().messages({
  "number.base": "ID must be a number",
  "number.positive": "ID must be positive",
});

export const orderItemParamsSchema = Joi.object({
  id: idSchema,
  itemId: idSchema,
});

export const createOrderItemSchema = Joi.object({
  product_id: Joi.number().positive().required().messages({
    "number.base": "Product ID must be a number",
    "number.positive": "Product ID must be positive",
    "any.required": "Product ID is required",
  }),
  quantity: Joi.number().positive().required().messages({
    "number.base": "Quantity must be a number",
    "number.positive": "Quantity must be positive",
    "any.required": "Quantity is required",
  }),
});

export const addOrderItemSchema = Joi.object({
  product_id: Joi.number().positive().required().messages({
    "number.base": "Product ID must be a number",
    "number.positive": "Product ID must be positive",
    "any.required": "Product ID is required",
  }),
  quantity: Joi.number().positive().optional().messages({
    "number.base": "Quantity must be a number",
    "number.positive": "Quantity must be positive",
    "any.required": "Quantity is required",
  }),
});

export const updateOrderItemSchema = Joi.object({
  quantity: Joi.number().positive().optional().messages({
    "number.base": "Quantity must be a number",
    "number.positive": "Quantity must be positive",
  }),
  unit_price: Joi.number()
    .positive()
    .max(99999999.99)
    .precision(2)
    .optional()
    .messages({
      "number.base": "Unit price must be a number",
      "number.positive": "Unit price must be positive",
      "number.max": "Unit price cannot be more than 99999999.99",
      "number.precision": "Unit price cannot have more than 2 decimal places",
    }),
});

export const createOrderSchema = Joi.object({
  customer_id: Joi.number().positive().required().messages({
    "number.base": "Customer ID must be a number",
    "number.positive": "Customer ID must be positive",
    "any.required": "Customer ID is required",
  }),
  status: Joi.string()
    .trim()
    .valid("Delivered", "Cancelled", "Pending")
    .required()
    .messages({
      "string.base": "Status must be a string",
      "string.empty": "Status is required",
      "any.only": "Status must be one of Delivered, Cancelled, or Pending",
      "any.required": "Status is required",
    }),
  items: Joi.array().items(createOrderItemSchema).required().messages({
    "array.base": "Items must be an array",
    "any.required": "Items are required",
  }),
});

export const updateOrderSchema = Joi.object({
  status: Joi.string()
    .trim()
    .valid("Delivered", "Cancelled", "Pending")
    .optional()
    .messages({
      "string.base": "Status must be a string",
      "string.empty": "Status cannot be empty",
      "any.only": "Status must be one of Delivered, Cancelled, or Pending",
    }),
  items: Joi.array().items(updateOrderItemSchema).optional().messages({
    "array.base": "Items must be an array",
  }),
});
