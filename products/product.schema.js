import Joi from "joi";

const productCategories = [
  "Electronics",
  "Computers & Laptops",
  "Mobile Phones & Accessories",
  "Home Appliances",
  "Furniture",
  "Home & Kitchen",
  "Clothing",
];

export const createProductSchema = Joi.object({
  product_name: Joi.string().trim().min(1).max(200).required().messages({
    "any.required": "Product name is required",
    "string.base": "Product name must be a string",
    "string.empty": "Product name is required",
    "string.min": "Product name must be at least 1 character",
    "string.max": "Product name cannot be more than 200 characters",
  }),
  category: Joi.string()
    .trim()
    .valid(...productCategories)
    .required()
    .messages({
      "any.required": "Category is required",
      "string.base": "Category must be a string",
      "string.empty": "Category is required",
      "any.only": `Category must be one of ${productCategories.join(",")}`,
    }),
  price: Joi.number()
    .positive()
    .max(99999999.99)
    .precision(2)
    .required()
    .messages({
      "any.required": "Price is required",
      "number.base": "Price must be a number",
      "number.positive": "Price must be a positive number",
      "number.max": "Price cannot be more than 99999999.99",
      "number.precision": "Price cannot have more than 2 decimal places",
    }),
});

export const updateProductSchema = Joi.object({
  product_name: Joi.string().trim().optional().messages({
    "string.base": "Product name must be a string",
    "string.empty": "Product name cannot be empty",
  }),
  category: Joi.string().trim().optional().messages({
    "string.base": "Category must be a string",
    "string.empty": "Category cannot be empty",
  }),
  price: Joi.number()
    .positive()
    .max(99999999.99)
    .precision(2)
    .optional()
    .messages({
      "number.base": "Price must be a number",
      "number.positive": "Price must be a positive number",
      "number.max": "Price cannot be more than 99999999.99",
      "number.precision": "Price cannot have more than 2 decimal places",
    }),
});
