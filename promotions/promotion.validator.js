import Joi from "joi";

// ---- allowed values (change here if your team decides differently) ----
const DISCOUNT_TYPES = ["percentage", "fixed"];
const STATUSES = ["active", "inactive"];

// ---- create ----
export const createPromotionSchema = Joi.object({
    name: Joi.string().trim().min(1).max(255).required(),
    description: Joi.string().trim().allow("", null),
    promotion_type: Joi.string().trim().min(1).max(50).required(),
    status: Joi.string().valid(...STATUSES).default("active"),
    discount_type: Joi.string().valid(...DISCOUNT_TYPES).required(),
    // a percentage can't be over 100
    discount_value: Joi.number().precision(2).min(0).required()
        .when("discount_type", { is: "percentage", then: Joi.number().max(100) }),
});

// ---- update: type and value must be sent together so the 100% rule can be checked ----
export const updatePromotionSchema = Joi.object({
    name: Joi.string().trim().min(1).max(255),
    description: Joi.string().trim().allow("", null),
    promotion_type: Joi.string().trim().min(1).max(50),
    status: Joi.string().valid(...STATUSES),
    discount_type: Joi.string().valid(...DISCOUNT_TYPES),
    discount_value: Joi.number().precision(2).min(0)
        .when("discount_type", { is: "percentage", then: Joi.number().max(100) }),
}).min(1).and("discount_type", "discount_value");

export const promotionIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
});

export const listPromotionQuerySchema = Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
});