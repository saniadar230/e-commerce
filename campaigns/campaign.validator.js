import Joi from "joi";

// ---- allowed statuses (change here if your team decides differently) ----
const STATUSES = ["draft", "active", "ended"];

// ---- create ----
export const createCampaignSchema = Joi.object({
    name: Joi.string().trim().min(1).max(255).required(),
    description: Joi.string().trim().allow("", null),
    start_date: Joi.date().iso().required(),
    // end can't be before start (same rule as the DB CHECK)
    end_date: Joi.date().iso().min(Joi.ref("start_date")).required(),
    status: Joi.string().valid(...STATUSES).default("draft"),
});

// ---- update: dates must be sent together so the order can be checked ----
export const updateCampaignSchema = Joi.object({
    name: Joi.string().trim().min(1).max(255),
    description: Joi.string().trim().allow("", null),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso().min(Joi.ref("start_date")),
    status: Joi.string().valid(...STATUSES),
}).min(1).and("start_date", "end_date");

export const campaignIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
});

export const listCampaignQuerySchema = Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
});