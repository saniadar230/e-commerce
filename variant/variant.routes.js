import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { variantController as controller } from "./variant.controller.js";
import { createVariantSchema, updateVariantSchema, variantIdParamSchema, listVariantQuerySchema } from "./variant.validator.js";

const router = Router();

router.post("/", validate(createVariantSchema, "body",), controller.create);
router.get("/", validate(listVariantQuerySchema, "query",), controller.getAll);
router.get("/:id", validate(variantIdParamSchema, "params"), controller.getById);
router.patch("/:id", validate(variantIdParamSchema, "params"), validate(updateVariantSchema), controller.update);
router.delete("/:id", validate(variantIdParamSchema, "params"), controller.remove);

export default router;