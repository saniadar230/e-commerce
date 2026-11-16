import express from "express";
import * as paymentController from "./payment.controller.js";
import { validate } from "../middleware/validate.js";
import {
  orderIdParamsSchema,
  customerPaymentBodySchema,
  customerOrderPaymentsQuerySchema,
  paymentIdParamsSchema,
  paymentListQuerySchema,
  refundPaymentSchema,
} from "./payment.schema.js";

export const customerPaymentRouter = express.Router();
export const adminPaymentRouter = express.Router();
export const stripeWebhookRouter = express.Router();

// Start paying for one of my pending card / bank_transfer orders
// Returns what the client needs to continue (gateway checkout URL, or bank details)
customerPaymentRouter.post(
  "/orders/:orderId/payments",
  validate(orderIdParamsSchema, "params"),
  validate(customerPaymentBodySchema, "body"),
  paymentController.startPayment
);
// Previous attempt failed and the order has not expired: create a new attempt
customerPaymentRouter.post(
  "/orders/:orderId/payments/retry",
  validate(orderIdParamsSchema, "params"),
  validate(customerPaymentBodySchema, "body"),
  paymentController.retryPayment
);
// Payments of one of my orders (status only, no gateway internals)
customerPaymentRouter.get(
  "/orders/:orderId/payments",
  validate(orderIdParamsSchema, "params"),
  validate(customerOrderPaymentsQuerySchema, "query"),
  paymentController.getOrderPayments
);

// ---------------------------------------------------------------------
// Admin routes
// ---------------------------------------------------------------------
// List with filters: ?status=pending&method=bank_transfer&orderId=...&page=1&pageSize=20
adminPaymentRouter.get(
  "/payments",
  validate(paymentListQuerySchema, "query"),
  paymentController.getAllPayments
);
adminPaymentRouter.get(
  "/payments/:paymentId",
  validate(paymentIdParamsSchema, "params"),
  paymentController.getPaymentById
);
// Manual confirmation: COD cash collected, or bank transfer verified.
// Card payments are NOT confirmed here, only through the webhook.
adminPaymentRouter.post(
  "/payments/:paymentId/mark-paid",
  validate(paymentIdParamsSchema, "params"),
  paymentController.markPaymentPaid
);
// Mark a payment failed (also cancels the order and restores stock)
adminPaymentRouter.post(
  "/payments/:paymentId/fail",
  validate(paymentIdParamsSchema, "params"),
  paymentController.failPayment
);
// Refund a paid payment (amount defaults to the full amount, in cents)
adminPaymentRouter.post(
  "/payments/:paymentId/refund",
  validate(paymentIdParamsSchema, "params"),
  validate(refundPaymentSchema, "body"),
  paymentController.refundPayment
);

// payment.routes.js
stripeWebhookRouter.post("/", paymentController.stripeWebhook);
