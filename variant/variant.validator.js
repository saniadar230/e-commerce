import Joi from "joi";

export const createVariantSchema = Joi.object({
    product_id: Joi.string().uuid().required(),
    sku: Joi.string().trim().min(1).max(100).required(),
    price: Joi.number().precision(2).min(0).required(),
    stock: Joi.number().integer().min(0).default(0),
    // one value per attribute, so attribute_id can't repeat
    attributes: Joi.array().items(Joi.object({
        attribute_id: Joi.number().integer().positive().required(),
        attribute_value_id: Joi.number().integer().positive().required(),
    })).min(1).unique("attribute_id").required(),
});

export const updateVariantSchema = Joi.object({
    sku: Joi.string().trim().min(1).max(100),
    price: Joi.number().precision(2).min(0),
    stock: Joi.number().integer().min(0),
}).min(1);

export const variantIdParamSchema = Joi.object({
    id: Joi.string().uuid().required(),
});

export const listVariantQuerySchema = Joi.object({
    product_id: Joi.string().uuid().required(),
});