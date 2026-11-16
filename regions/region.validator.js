import Joi from "joi";

export const createRegionSchema = Joi.object({
    name: Joi.string().trim().min(1).max(255).required(),
    code: Joi.string().trim().min(1).max(50).required(),
});

export const updateRegionSchema = Joi.object({
    name: Joi.string().trim().min(1).max(255),
    code: Joi.string().trim().min(1).max(50),
}).min(1);

export const regionIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
});

export const listRegionQuerySchema = Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
});