import Joi from "joi";

const id = () => Joi.number().integer().positive();

// each target id is required for its own scope and forbidden for the others
const targetFor = (scope) => id().when("scope", { is: scope, then: Joi.required(), otherwise: Joi.forbidden() });

export const createApplicationSchema = Joi.object({
    promotion_id: id().required(),
    region_id: id().allow(null),
    scope: Joi.string().valid("global", "category", "product", "variant").required(),
    category_id: targetFor("category"),
    product_id: targetFor("product"),
    variant_id: targetFor("variant"),
});

export const removeApplicationParamSchema = Joi.object({
    id: id().required(),
    applicationId: id().required(),
});