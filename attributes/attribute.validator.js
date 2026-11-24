import Joi from "joi";

export const createAttributeSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
});

export const updateAttributeSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100),
    is_active: Joi.boolean(),
}).min(1); // at least one field

export const attributeIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required().max(2147483647),
});

export const listAttributeQuerySchema = Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    is_active: Joi.boolean(),   // in updateAttributeSchema and listAttributeQuerySchema
});