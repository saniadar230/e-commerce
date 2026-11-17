import { ValidationError } from "../helperFunctions/apiError.js";
import { successReponse } from "../helperFunctions/apiResponse.js";
import * as paymentService from "./payment.service.js";
import stripe from "../config/stripe.js";

// ---------------------------------------------------------------------
// Stripe webhook (body is a raw Buffer due to express.raw())
// ---------------------------------------------------------------------
export async function stripeWebhook(req, res) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_SECRET_KEY
    );
  } catch (err) {
    throw new ValidationError(
      `Webhook signature verification failed: ${err.message}`
    );
  }

  await paymentService.handleStripeEvent(event);
  return res.status(200).json({ received: true });
}

// ---------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------
export async function startPayment(req, res) {
  const { orderId } = req.params;
  const { customer_id } = req.body;

  const result = await paymentService.startPayment(orderId, customer_id);

  return successReponse(
    res,
    result,
    200,
    "Payment details were retrieved successfully"
  );
}

export async function retryPayment(req, res) {
  const { orderId } = req.params;
  const { customer_id } = req.body;

  const result = await paymentService.retryPayment(orderId, customer_id);

  return successReponse(res, result, 200, "Payment is ready to retry");
}

export async function getOrderPayments(req, res) {
  const { orderId } = req.params;
  const { customer_id } = req.query;

  const result = await paymentService.getOrderPayments(orderId, customer_id);

  return successReponse(
    res,
    result,
    200,
    "Order payments were retrieved successfully"
  );
}

// ---------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------
export async function getAllPayments(req, res) {
  const result = await paymentService.getAllPayments(req.query);

  return successReponse(
    res,
    result.data,
    200,
    "Payments were retrieved successfully",
    result.pagination
  );
}

export async function getPaymentById(req, res) {
  const { paymentId } = req.params;

  const result = await paymentService.getPaymentById(paymentId);

  return successReponse(res, result, 200, "Payment was retrieved successfully");
}

export async function markPaymentPaid(req, res) {
  const { paymentId } = req.params;

  const result = await paymentService.markPaymentPaid(paymentId);

  return successReponse(res, result, 200, "Payment was marked as paid");
}

export async function failPayment(req, res) {
  const { paymentId } = req.params;

  const result = await paymentService.failPayment(paymentId);

  return successReponse(
    res,
    result,
    200,
    "Payment was marked as failed and the order was cancelled"
  );
}

export async function refundPayment(req, res) {
  const { paymentId } = req.params;
  const { amount } = req.body;

  const result = await paymentService.refundPayment(paymentId, amount);

  return successReponse(res, result, 200, "Payment was refunded");
}
