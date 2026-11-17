import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { promotionController as controller } from "./promotion.controller.js";
import { createPromotionSchema, updatePromotionSchema, promotionIdParamSchema, listPromotionQuerySchema } from "./promotion.validator.js";

const router = Router();

router.post("/", validate(createPromotionSchema), controller.create);
router.get("/", validate(listPromotionQuerySchema, "query"), controller.getAll);
router.get("/:id", validate(promotionIdParamSchema, "params"), controller.getById);
router.patch("/:id", validate(promotionIdParamSchema, "params"), validate(updatePromotionSchema), controller.update);
router.delete("/:id", validate(promotionIdParamSchema, "params"), controller.remove);

export default router;