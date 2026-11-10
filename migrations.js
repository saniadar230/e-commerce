import { sql } from "./db.js";

export async function createTables() {
  // create customers
  await sql`CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    city VARCHAR(50)
);`;
  // create orders
  await sql`CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id),
    order_date DATE NOT NULL,
    status VARCHAR(20)
);`;
  // create products
  await sql`
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL
);
`;
  // create order_items
  await sql`
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id),
    product_id INT REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL
);
  `;
}

export async function insertTables() {
  // create customers
  await sql`INSERT INTO customers (customer_name, email, city) VALUES
('Ali Khan', 'ali@gmail.com', 'Lahore'),
('Sara Ahmed', 'sara@gmail.com', 'Karachi'),
('Ahmed Raza', 'ahmed@gmail.com', 'Islamabad'),
('Ayesha Malik', 'ayesha@gmail.com', 'Lahore'),
('Usman Tariq', 'usman@gmail.com', 'Karachi'),
('Fatima Noor', 'fatima@gmail.com', 'Lahore'),
('Hassan Shah', 'hassan@gmail.com', 'Multan'),
('Zainab Ali', 'zainab@gmail.com', 'Islamabad');`;
  // create products
  await sql`INSERT INTO products (product_name, category, price) VALUES
('Laptop', 'Electronics', 150000),
('Mouse', 'Electronics', 2500),
('Keyboard', 'Electronics', 5000),
('Monitor', 'Electronics', 45000),
('Office Chair', 'Furniture', 25000),
('Study Desk', 'Furniture', 35000),
('Sofa', 'Furniture', 80000),
('Notebook', 'Stationery', 300),
('Pen Pack', 'Stationery', 500),
('Printer', 'Electronics', 30000);`;
  // create orders
  await sql`INSERT INTO orders (customer_id, order_date, status) VALUES
(1, '2026-01-01', 'Delivered'),
(1, '2026-01-05', 'Pending'),
(1, '2026-01-10', 'Delivered'),
(2, '2026-01-02', 'Delivered'),
(2, '2026-01-08', 'Cancelled'),
(3, '2026-01-03', 'Pending'),
(3, '2026-01-12', 'Delivered'),
(4, '2026-01-04', 'Delivered'),
(4, '2026-01-15', 'Delivered'),
(5, '2026-01-06', 'Cancelled'),
(5, '2026-01-18', 'Pending'),
(6, '2026-01-07', 'Delivered'),
(7, '2026-01-09', 'Pending'),
(8, '2026-01-11', 'Delivered'),
(8, '2026-01-20', 'Delivered');
`;

  // create order_items
  await sql`INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (1, 1, 1, 150000),
    (1, 2, 2, 2500),
    (2, 3, 2, 5000),
    (3, 4, 1, 45000),
    (3, 2, 3, 2500),
    (4, 5, 2, 25000),
    (4, 8, 10, 300),
    (5, 6, 1, 35000),
    (6, 7, 1, 80000),
    (7, 3, 3, 5000),
    (7, 9, 5, 500),
    (8, 6, 2, 35000),
    (8, 8, 20, 300),
    (9, 5, 1, 25000),
    (9, 7, 1, 80000),
    (10, 2, 1, 2500),
    (11, 10, 1, 30000),
    (12, 1, 1, 150000),
    (12, 9, 10, 500),
    (13, 8, 15, 300),
    (14, 4, 2, 45000),
    (14, 2, 2, 2500),
    (15, 6, 1, 35000),
    (15, 5, 1, 25000);
  `;
}
