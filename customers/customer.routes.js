// customer.routes.js
import express from "express";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "./customer.schema.js";
import { getListSchema, idSchema } from "../schemas/common.js";
import { validate } from "../middleware/validate.js";
import customerController from "./customer.controller.js"; // default export now

const customerRouter = express.Router();

// /customers
customerRouter
  .route("/")
  .get(validate(getListSchema, "query"), customerController.getAllCustomers)
  .post(
    validate(createCustomerSchema, "body"),
    customerController.createCustomer
  );

// /customers/:id
customerRouter
  .route("/:id")
  .get(validate(idSchema, "params"), customerController.getCustomerById)
  .patch(
    validate(idSchema, "params"),
    validate(updateCustomerSchema, "body"),
    customerController.updateCustomer
  )
  .delete(validate(idSchema, "params"), customerController.deleteCustomer);

export default customerRouter;