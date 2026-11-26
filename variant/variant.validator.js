import Joi from "joi";

export const createVariantSchema = Joi.object({
    product_id: Joi.string().uuid().required(),
    price: Joi.number().precision(2).min(0).required(),
    quantity: Joi.number().integer().min(0).default(0),
    // one value per attribute, so attribute_id can't repeat
    attributes: Joi.array().items(Joi.object({
        name: Joi.string().min(3).max(300).required(),
        value: Joi.string().min(1).max(300).required(),
    })).min(1).unique("attribute_id").required(),
});

export const updateVariantSchema = Joi.object({
    price: Joi.number().precision(2).min(0),
    quantity: Joi.number().integer().min(0),
}).min(1);

export const variantIdParamSchema = Joi.object({
    id: Joi.string().uuid().required(),
});

export const listVariantQuerySchema = Joi.object({
    product_id: Joi.string().uuid(),
});