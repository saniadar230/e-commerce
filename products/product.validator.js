import Joi from "joi";


export const createProductSchema = Joi.object({
  category_id: Joi.string().uuid().required(),
  name: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().trim().allow(null, "").default(null),
});


export const updateProductSchema = Joi.object({
  category_id: Joi.string().uuid(),
  name: Joi.string().trim().min(1).max(255),
  description: Joi.string().trim().allow(null, ""),
}).min(1);


export const productIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});


export const listProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  category_id: Joi.string().uuid(),
  search: Joi.string().trim().max(100),
});