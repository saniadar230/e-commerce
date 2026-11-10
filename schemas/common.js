import Joi from "joi";

export const idSchema = Joi.object({
  id: Joi.number().positive().required().messages({
    "number.base": "Id must be a number",
    "number.positive": "Id must be positive",
    "any.required": "Id is required",
  }),
});

export const getListSchema = Joi.object({
  pageNo: Joi.number().positive().min(1).messages({
    "number.base": "Page number must be a number",
    "number.positive": "Page number must be positive",
    "number.min": "Page number must be at least 1",
  }),
  pageSize: Joi.number().valid(5, 10, 15, 20, 25, 30).messages({
    "number.base": "Page size must be a number",
    "any.only": "Page size must be one of 5, 10, 15, 20, 25, or 30",
  }),
  sortBy: Joi.string().trim().valid("asc", "desc").messages({
    "string.base": "Sort By must be a string",
    "any.only": "Sort by must be one of asc or desc",
  }),
  search: Joi.string().trim().min(1).max(100).allow("").optional().messages({
    "string.base": "Search must be a string",
    "string.min": "Search must be atleast 1 character",
    "string.max": "Search cannot be more than 100 characters",
  }),
});
