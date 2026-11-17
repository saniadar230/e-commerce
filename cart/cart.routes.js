import express from "express";
import * as cartController from "./cart.controller.js";
import {
  addCartItemSchema,
  getCartSchema,
  removeCartItemSchema,
  updateCartItemSchema,
  variantIdParamSchema,
} from "./cart.schema.js";
import { validate } from "../middleware/validate.js";

const cartRouter = express.Router();

cartRouter.get(
  "/",
  validate(getCartSchema, "body"),
  cartController.getCart
);

cartRouter.post(
  "/items",
  validate(addCartItemSchema, "body"),
  cartController.addCartItem
);

cartRouter.patch(
  "/items/:variantId",
  validate(variantIdParamSchema, "params"),
  validate(updateCartItemSchema, "body"),
  cartController.updateCartItem
);

cartRouter.delete(
  "/items/:variantId",
  validate(variantIdParamSchema, "params"),
  validate(removeCartItemSchema, "body"),
  cartController.removeCartItem
);

export default cartRouter;
