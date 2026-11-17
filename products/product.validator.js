import Joi from "joi";

// ===== create product: POST /products (body) =====
export const createProductSchema = Joi.object({
  category_id: Joi.number().integer().positive().required(),
  name: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().trim().allow(null, "").default(null),
});

// ===== update product: PATCH /products/:id (body) =====
// same fields, all optional, but at least one must be sent
export const updateProductSchema = Joi.object({
  category_id: Joi.number().integer().positive(),
  name: Joi.string().trim().min(1).max(255),
  description: Joi.string().trim().allow(null, ""),
}).min(1);

// ===== product id in the URL: /products/:id (params) =====
export const productIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

// ===== list: GET /products?page=1&limit=10&category_id=3 (query) =====
// category_id is optional: with it -> that category + all its descendants
export const listProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  category_id: Joi.number().integer().positive(),
});