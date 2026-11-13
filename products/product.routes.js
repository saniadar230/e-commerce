import { Router } from "express";

import { validate } from "../middleware/validate.js"
import { productController as controller } from "./product.controller.js";
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  listProductsQuerySchema,
} from "./product.validator.js";

const router = Router();

// GET    /products
router.get("/", validate(listProductsQuerySchema, "query"), controller.getAll);

router.post("/", validate(createProductSchema), controller.create);
router.get("/:id", validate(productIdParamSchema, "params"), controller.getById);

// PATCH needs TWO validators: one for the :id in the URL, one for the body
router.patch(
  "/:id",
  validate(productIdParamSchema, "params"), // checks the :id in the URL
  validate(updateProductSchema),            // checks the body (default)
  controller.update
);

router.delete("/:id", validate(productIdParamSchema, "params"), controller.delete);

export default router;