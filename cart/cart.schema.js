import Joi from "joi";

const customerId = Joi.string()
  .guid({ version: ["uuidv4"] })
  .required()
  .messages({
    "string.base": "Customer ID must be a string",
    "string.empty": "Customer ID is required",
    "string.guid": "Customer ID must be a valid UUIDv4",
    "any.required": "Customer ID is required",
  });

const variantId = Joi.string()
  .guid({ version: ["uuidv4"] })
  .required()
  .messages({
    "string.base": "Variant ID must be a string",
    "string.empty": "Variant ID is required",
    "string.guid": "Variant ID must be a valid UUIDv4",
    "any.required": "Variant ID is required",
  });

export const getCartSchema = Joi.object({
  customer_id: customerId,
});

export const addCartItemSchema = Joi.object({
  customer_id: customerId,
  variant_id: variantId,
});

export const updateCartItemSchema = Joi.object({
  customer_id: customerId,
  quantity: Joi.number().integer().min(0).max(10).required().messages({
    "number.base": "Quantity must be a number",
    "number.integer": "Quantity must be an integer",
    "number.min": "Quantity cannot be less than 0",
    "number.max": "Quantity cannot be greater than 10",
    "any.required": "Quantity is required",
  }),
});

export const removeCartItemSchema = Joi.object({
  customer_id: customerId,
});

export const variantIdParamSchema = Joi.object({
  variantId,
});
