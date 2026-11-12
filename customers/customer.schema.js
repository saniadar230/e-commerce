import Joi from "joi";

export const createCustomerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional().messages({
    "string.base": "Customer name must be a string",
    "string.empty": "Customer name cannot be empty",
    "string.min": "Customer name must be at least 1 character",
    "string.max": "Customer name cannot be more than 200 characters",
  }),
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.base": "Email must be a string",
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  delivery_address: Joi.string().min(1).max(200).trim().optional().messages({
    "string.base": "City must be a string",
    "string.empty": "City cannot be empty",
    "string.min": "City must be at least 1 character",
    "string.max": "City cannot be more than 200 characters",
  }),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional().messages({
    "string.base": "Customer name must be a string",
    "string.empty": "Customer name cannot be empty",
    "string.min": "Customer name must be at least 1 character",
    "string.max": "Customer name cannot be more than 200 characters",
  }),
  delivery_address: Joi.string().min(1).max(200).trim().optional().messages({
    "string.base": "City must be a string",
    "string.empty": "City cannot be empty",
    "string.min": "City must be at least 1 character",
    "string.max": "City cannot be more than 200 characters",
  }),
});
