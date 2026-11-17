import Joi from "joi";

export const createAttributeSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
});

export const updateAttributeSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100),
}).min(1); // at least one field

export const attributeIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
});

export const listAttributeQuerySchema = Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
});