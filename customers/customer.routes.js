import express from "express";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "./customer.schema.js";
import { getListSchema, idSchema } from "../schemas/common.js";
import { validate } from "../middleware/validate.js";
import * as customerController from "./customer.controller.js";

const customerRouter = express.Router();

customerRouter
  .route("/")
  .get(validate(getListSchema, "query"), customerController.getAllCustomers)
  .post(
    validate(createCustomerSchema, "body"),
    customerController.createCustomer
  );

customerRouter
  .route("/:id")
  .get(validate(idSchema, "params"), customerController.getCustomerById)
  .patch(
    validate(idSchema, "params"),
    validate(updateCustomerSchema, "body"),
    customerController.updateCustomer
  )
  .delete(validate(idSchema, "params"), customerController.deleteCustomer);

customerRouter.get(
  "/:id/orders",
  validate(idSchema, "params"),
  validate(getListSchema, "query"),
  customerController.getCustomerOrders
);

export default customerRouter;
