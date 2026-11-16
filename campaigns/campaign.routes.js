import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { campaignController as controller } from "./campaign.controller.js";
import { createCampaignSchema, updateCampaignSchema, campaignIdParamSchema, listCampaignQuerySchema } from "./campaign.validator.js";

const router = Router();

router.post("/", validate(createCampaignSchema), controller.create);
router.get("/", validate(listCampaignQuerySchema, "query"), controller.getAll);
router.get("/:id", validate(campaignIdParamSchema, "params"), controller.getById);
router.patch("/:id", validate(campaignIdParamSchema, "params"), validate(updateCampaignSchema), controller.update);
router.delete("/:id", validate(campaignIdParamSchema, "params"), controller.remove);

export default router;