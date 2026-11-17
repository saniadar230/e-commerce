import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { attributeController } from "./attribute.controller.js";
import {
    createAttributeSchema, updateAttributeSchema,
    attributeIdParamSchema, listAttributeQuerySchema,
} from "./attribute.validator.js";

const router = Router();

router.post("/", validate(createAttributeSchema), attributeController.create);
router.get("/", validate(listAttributeQuerySchema, "query"), attributeController.getAll);
router.get("/:id", validate(attributeIdParamSchema, "params"), attributeController.getById);
router.patch("/:id", validate(attributeIdParamSchema, "params"), validate(updateAttributeSchema), attributeController.update);
router.delete("/:id", validate(attributeIdParamSchema, "params"), attributeController.delete);

export default router;