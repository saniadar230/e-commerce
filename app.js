import express from "express";
// import customerRouter from "./customers/customer.routes.js";
// import productRouter from "./products/product.routes.js";
// import orderRouter from "./orders/order.routes.js";
import { NotFoundError, ConflictError, ValidationError } from "./apiError.js";
import categoryRouter from "./categories/category.routes.js"
import productRouter from "./products/product.routes.js";

const app = express();

app.use(express.json());

// Customer Routes
// app.use("/customers", customerRouter);
// app.use("/products", productRouter);
// app.use("/orders", orderRouter);



// Category Routes
app.use("/categories", categoryRouter);
app.use("/products", productRouter);

app.use((req, res) => {
  return res.status(404).send("Page Not Found");
});



// ===== postgres errors -> our own errors =====
// pg errors have a `code`. Without this, they would all show up as 500.
const mapDbError = (err) => {
  // 23505 = unique violation (duplicate value)
  if (err.code === "23505") return new ConflictError("A record with this value already exists");
  // 23503 = foreign key violation (parent doesn't exist OR row is still used by another table)
  if (err.code === "23503") return new ConflictError("This record is linked to other records");
  // 22P02 = invalid input syntax (e.g. text where a number is expected)
  if (err.code === "22P02") return new ValidationError("Invalid value in request", []);
  return err;
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

app.listen(3000, () => {
  console.log(`Server is listening on PORT: 3000`);
});
