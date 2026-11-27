import express from "express";
import customerRouter from "./features/customers/customer.routes.js";
import cartRouter from "./features/cart/cart.routes.js";
import {
  customerPaymentRouter,
  adminPaymentRouter,
  stripeWebhookRouter,
} from "./payments/payment.routes.js";
import { customerOrderRouter } from "./features/orders/order.routes.js";
import cors from 'cors'
import dotenv from "dotenv";

dotenv.config();
// import productRouter from "./products/product.routes.js";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "./helperFunctions/apiError.js";
import categoryRouter from "./categories/category.routes.js";
import productRouter from "./features/products/product.routes.js";
import attributeRoutes from "./attributes/attribute.routes.js";
import attributeValueRoutes from "./attributes/attributeValue.routes.js";

import variantRoutes from "./features/variant/variant.routes.js"

import regionRoutes from "./regions/region.routes.js";
import promotionRoutes from "./promotions/promotion.routes.js";
import campaignRoutes from "./campaigns/campaign.routes.js";


const app = express();

app.use(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookRouter
);

app.use(cors({ origin: 'http://localhost:5173' }))

app.use(express.json({
  limit: '100kb'
}));

// Customer Routes
app.use("/customers", customerRouter);
app.use("/cart", cartRouter);
app.use("/customer", customerPaymentRouter);
app.use("/admin", adminPaymentRouter);
app.use("/orders", customerOrderRouter);

// Category Routes
app.use("/categories", categoryRouter);
app.use("/products", productRouter);

app.use("/attributes", attributeRoutes);
app.use("/attribute-values", attributeValueRoutes);



app.use("/variants", variantRoutes)

app.use("/regions", regionRoutes);
app.use("/promotions", promotionRoutes);
app.use("/campaigns", campaignRoutes);

app.use((req, res) => {
  return res.status(404).send("Page Not Found");
});

// ===== postgres errors -> our own errors =====
const mapDbError = (err) => {
  console.log("Original error:", err);
  console.log("Error code:", err.code);
  console.log("Error detail:", err.detail);
  switch (err.code) {
    // unique violation (duplicate value)
    case "23505":
      return new ConflictError("A record with this value already exists");

    // foreign key violation: two different cases
    case "23503":
      // DELETE case: other rows still point to this one
      if (err.detail?.includes("still referenced")) {
        return new ConflictError("Cannot delete: this record is used by other records");
      }
      // INSERT / UPDATE case: the parent row doesn't exist
      return new NotFoundError("A related record does not exist");

    // CHECK constraint (negative price or stock)
    case "23514":
      return new ValidationError("Value breaks a database rule", []);

    // invalid input syntax (text where a number or uuid is expected)
    case "22P02":
      return new ValidationError("Invalid value in request", []);
    // number too big for the column
    case "22003":
      return new ValidationError("Number is out of range", []);

    default:
      return err;
  }
};



app.use((err, req, res, next) => {
  // if the response already started, express must handle it
  if (res.headersSent) return next(err);

  // express.json() sends this when the body is not valid JSON
  if (err.type === "entity.parse.failed") {
    err = new ValidationError("Request body is not valid JSON", []);
  }

  err = mapDbError(err);

  // anything that is not our AppError is a real bug -> log it, don't show details to the client
  const isKnown = err.statusCode !== undefined;
  if (!isKnown) console.error(err);

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
