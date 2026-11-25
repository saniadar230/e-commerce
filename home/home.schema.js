// home.schema.js
import Joi from "joi";

export const homeQuerySchema = Joi.object({
  region_id: Joi.string().guid().required().messages({
    "string.base": "Region ID must be a UUID",
    "string.guid": "Region ID must be a valid UUID",
    "any.required": "Region ID is required",
  }),
});
