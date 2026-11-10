import express from "express";
import { createTables, insertTables } from "./migrations.js";
import { sql } from "./db.js";
import customerRouter from "./customers/customer.routes.js";
import productRouter from "./products/product.routes.js";
import orderRouter from "./orders/order.routes.js";

const app = express();

app.use(express.json());

function runDB() {
  //   createTables();
  //   insertTables();
}
runDB();

// 1. Find customers whose total spending on Delivered orders exceeds 150,000 PKR and who have placed at least two Delivered orders.
// app.get("/customers/", async (req, res, next) => {
//   const { totalSpending, status, minOrders } = req.query;
//   const response = await sql`SELECT c.customer_name FROM customers c
//     INNER JOIN orders o  ON o.customer_id = c.customer_id
//     INNER JOIN order_items oi ON oi.order_id = o.order_id
//     WHERE o.status = ${status}
//     GROUP BY c.customer_id
//     HAVING SUM(oi.quantity * oi.unit_price) > ${totalSpending} AND COUNT(o.order_id) > ${minOrders};`;
//   return res.status(200).json(response);
// });

// app.get("/products/top-selling", async (req, res, next) => {
//   const response =
//     await sql` 	SELECT  p.product_name, p.category as realCategory, SUM(oi2.quantity) as totalQuantity FROM products p
//         JOIN order_items oi2 ON oi2.product_id = p.product_id
//         JOIN orders o ON o.order_id = oi2.order_id
//         WHERE o.status = 'Delivered'
//         GROUP BY p.category, p.product_id
//         HAVING SUM(oi2.quantity) =  (SELECT MAX(totalQuantity)
//      FROM (
//          SELECT  p2.product_id, p2.category, SUM(oi2.quantity) as totalQuantity, p2.product_name FROM products p2
//         JOIN order_items oi2 ON oi2.product_id = p2.product_id
//         JOIN orders o ON o.order_id = oi2.order_id
//         WHERE p2.category = p.category AND  o.status = 'Delivered'
//         GROUP BY p2.category, p2.product_id
//     ) as tmp);
//     `;
//   return res.status(200).json(response);
// });

// //-- 3. Find customers whose total spending on Delivered orders is greater than the average total
// // spending of all customers who have at least one Delivered order, showing their name and total spending.
// app.get("/customers/top-selling", async (req, res, next) => {
//   const response =
//     await sql`SELECT c.customer_id, c.customer_name, SUM(oi.unit_price * oi.quantity) FROM customers c
// JOIN orders o on o.customer_id = c.customer_id
// JOIN order_items oi on oi.order_id = o.order_id
// WHERE o.status = 'Delivered'
// GROUP BY c.customer_id
// HAVING SUM(oi.unit_price * oi.quantity) >  (SELECT AVG(totalSpending)
// FROM(
// 	SELECT SUM(oi.unit_price * oi.quantity) as totalSpending
// 	FROM customers c
// 	JOIN orders o on o.customer_id = c.customer_id
// 	JOIN order_items oi on oi.order_id = o.order_id
// 	WHERE c.customer_id IN (SELECT customer_id FROM orders o
// WHERE o.status = 'Delivered'
// group by o.customer_id)
// GROUP BY c.customer_id
// ));
//   `;
//   return res.status(200).json(response);
// });

// // 4.Find all products whose total sales amount is greater than the average total sales amount of all products.
// app.get("/products/", async (req, res, next) => {
//   const response =
//     await sql` 	SELECT p.product_name, p.product_id, SUM(oi.quantity * oi.unit_price) as TotalSalesAmount FROM products p
// INNER JOIN order_items oi ON oi.product_id = p.product_id
// GROUP BY p.product_id
// HAVING SUM(oi.quantity * oi.unit_price) > (
// SELECT AVG(TotalSalesAmount)
// FROM (
// 	SELECT p.product_name, p.product_id, SUM(oi.quantity * oi.unit_price) as TotalSalesAmount FROM products p
// 	INNER JOIN order_items oi ON oi.product_id = p.product_id
// 	GROUP BY p.product_id
// ) as tmp)
//     `;
//   return res.status(200).json(response);
// });

// // -- 5. Customers who haven't purchased
// // -- Return each qualifying customer's name, email, city, and signup date.
// app.get("/customers/non-purchasers", async (req, res, next) => {
//   const response =
//     await sql`SELECT c.customer_name, c.email, c.city FROM customers c
// LEFT JOIN orders o ON o.customer_id = c.customer_id
// WHERE o.customer_id is null;
//       `;
//   return res.status(200).json(response);
// });

// // -- Write a query to return each customer's name, number of delivered orders, and total amount spent on those orders.
// // -- Show only customers whose total spending exceeds 30,000, ordered from highest spending to lowest.
// app.get("/customers", async (req, res, next) => {
//   const response =
//     await sql`SELECT c.customer_name, SUM(oi.quantity * oi.unit_price), COUNT(DISTINCT o.order_id) FROM customers c
// INNER JOIN orders o  ON o.customer_id = c.customer_id
// INNER JOIN order_items oi ON oi.order_id = o.order_id
// WHERE o.status = 'Delivered'
// GROUP BY c.customer_id
// HAVING SUM(oi.quantity * oi.unit_price) > 30000
// ORDER BY SUM(oi.quantity * oi.unit_price) DESC;
//  `;
//   return res.status(200).json(response);
// });

// Customer Routes
app.use("/customers", customerRouter);
app.use("/products", productRouter);
app.use("/orders", orderRouter);
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

// {
//   "type": "https://api.example.com/problems/validation-error",
//   "title": "Request validation failed",
//   "status": 422,
//   "detail": "One or more request fields are invalid.",
//   "instance": "/problems/occurrences/01HQ9XK7V4",
//   "errors": [
//     {
//       "detail": "Price must be a positive number.",
//       "pointer": "#/price",
//       "code": "number.positive"
//     },
//     {
//       "detail": "Category must be one of the supported categories.",
//       "pointer": "#/category",
//       "code": "any.only"
//     }
//   ]
// }

app.listen(3000, () => {
  console.log(`Server is listening on PORT: 3000`);
});

// Error Response Structuring
// Soft Delete
