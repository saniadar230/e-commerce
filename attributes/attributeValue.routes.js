import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { attributeValueController } from "./attributeValue.controller.js";
import {
    createAttributeValueSchema, updateAttributeValueSchema,
    attributeValueIdParamSchema, listAttributeValueQuerySchema,
} from "./attributeValue.validator.js";

const router = Router();

router.post("/", validate(createAttributeValueSchema), attributeValueController.create);
router.get("/", validate(listAttributeValueQuerySchema, "query"), attributeValueController.getAll);
router.get("/:id", validate(attributeValueIdParamSchema, "params"), attributeValueController.getById);
router.patch("/:id", validate(attributeValueIdParamSchema, "params"), validate(updateAttributeValueSchema), attributeValueController.update);
router.delete("/:id", validate(attributeValueIdParamSchema, "params"), attributeValueController.delete);

export default router;