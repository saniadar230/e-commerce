import express from "express";
import { createProductSchema, updateProductSchema } from "./product.schema.js";
import { getListSchema, idSchema } from "../schemas/common.js";
import { validate } from "../middleware/validate.js";
import * as productController from "./product.controller.js";

const productRouter = express.Router();

productRouter
  .route("/")
  .get(validate(getListSchema, "query"), productController.getAllProducts)
  .post(validate(createProductSchema, "body"), productController.createProduct);

productRouter
  .route("/:id")
  .get(validate(idSchema, "params"), productController.getProductById)
  .patch(
    validate(idSchema, "params"),
    validate(updateProductSchema, "body"),
    productController.updateProduct
  )
  .delete(validate(idSchema, "params"), productController.deleteProduct);

export default productRouter;
