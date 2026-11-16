import express from "express";
import customerRouter from "./customers/customer.routes.js";
import cartRouter from "./cart/cart.routes.js";
import {
  customerPaymentRouter,
  adminPaymentRouter,
  stripeWebhookRouter,
} from "./payments/payment.routes.js";
import { customerOrderRouter } from "./orders/order.routes.js";
import { adminOrderRouter } from "./orders/order.routes.js";

import dotenv from "dotenv";

dotenv.config();
// import productRouter from "./products/product.routes.js";

const app = express();

app.use(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookRouter
);

app.use(express.json());

// Customer Routes
app.use("/customers", customerRouter);
app.use("/cart", cartRouter);
app.use("/customer", customerPaymentRouter);
app.use("/admin", adminPaymentRouter);
app.use("/orders", customerOrderRouter);
app.use("/admin/orders", adminOrderRouter);

// app.use("/products", productRouter);

app.use((req, res) => {
  return res.status(404).send("Page Not Found");
});

app.use((err, req, res, next) => {
  return res.status(err.statusCode || 500).json({
    type: "about:blank",
    status: err.statusCode || 500,
    //A short, human-readable summary of the problem type. It should not change from occurrence to occurrence of the problem, except for purposes of localization.
    title: err.title || "Internal Server Error",
    //  A human-readable explanation specific to this occurrence of the problem.
    detail: err.message,
    // A URI reference that identifies the specific occurrence of the problem. It may or may not yield further information if dereferenced.
    instance: req.originalUrl,
    // An array of error details to accompany a problem details response.
    errors: err.errors || [],
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is listening on PORT: ${process.env.PORT}`);
});
