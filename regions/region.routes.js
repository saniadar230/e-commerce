import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { regionController as controller } from "./region.controller.js";
import { createRegionSchema, updateRegionSchema, regionIdParamSchema, listRegionQuerySchema } from "./region.validator.js";

const router = Router();

router.post("/", validate(createRegionSchema), controller.create);
router.get("/", validate(listRegionQuerySchema, "query"), controller.getAll);
router.get("/:id", validate(regionIdParamSchema, "params"), controller.getById);
router.patch("/:id", validate(regionIdParamSchema, "params"), validate(updateRegionSchema), controller.update);
router.delete("/:id", validate(regionIdParamSchema, "params"), controller.remove);

export default router;