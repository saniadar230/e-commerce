import express from "express";
// import customerRouter from "./customers/customer.routes.js";
// import productRouter from "./products/product.routes.js";
// import orderRouter from "./orders/order.routes.js";

const app = express();

app.use(express.json());

// Customer Routes
// app.use("/customers", customerRouter);
// app.use("/products", productRouter);
// app.use("/orders", orderRouter);

app.use((req, res) => {
  return res.status(404).send("Page Not Found");
});

app.use((err, req, res, next) => {
  return res.status(err.statusCode || 500).son({
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
