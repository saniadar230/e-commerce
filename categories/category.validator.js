import Joi from "joi";

// ===== create category: POST /categories (body) =====
// path is NOT allowed here: Joi rejects unknown keys, so a client can't send it
export const createCategorySchema = Joi.object({
    parent_id: Joi.number().integer().positive().allow(null).default(null),
    name: Joi.string().trim().min(1).max(255).required(),
});

// ===== category id in the URL: GET /categories/:id (params) =====
export const categoryIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
});

// ===== pagination: GET /categories?page=1&limit=10 (query) =====
// page  = which page (starts at 1)
// limit = rows per page (max 100 so nobody can ask for the whole table)
export const listQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
});


export const updateCategorySchema = Joi.object({
    name: Joi.string().trim().min(1).max(255),
}).min(1);