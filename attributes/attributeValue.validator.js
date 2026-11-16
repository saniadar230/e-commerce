// ========================== attribute value validator =======================

import Joi from "joi";

export const createAttributeValueSchema = Joi.object({
    attribute_id: Joi.number().integer().positive().required(),
    value: Joi.string().trim().min(1).max(100).required(),
});

export const updateAttributeValueSchema = Joi.object({
    value: Joi.string().trim().min(1).max(100).required(),
});

export const attributeValueIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
});

export const listAttributeValueQuerySchema = Joi.object({
    attribute_id: Joi.number().integer().positive(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
});