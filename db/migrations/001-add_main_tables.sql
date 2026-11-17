-- Up Migration

-- ################ LEVEL 0: no foreign keys ################

-- ===== extension: must come BEFORE any table that uses ltree =====
CREATE EXTENSION IF NOT EXISTS ltree;

-- -- ===== customers =====
-- CREATE TABLE customers (
--   id               SERIAL PRIMARY KEY,
--   name             VARCHAR(255) NOT NULL,
--   email            VARCHAR(255) NOT NULL UNIQUE,
--   delivery_address TEXT
-- );

-- ===== categories (self-reference via parent_id) =====
CREATE TABLE categories (
  id        SERIAL PRIMARY KEY,
  parent_id INT REFERENCES categories(id),
  name      VARCHAR(255) NOT NULL,
  path      ltree
);

-- ===== attributes =====
CREATE TABLE attributes (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- ################ LEVEL 1: depend on level 0 ################

-- ===== products (needs categories) =====
CREATE TABLE products (
  id          SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(id),
  name        VARCHAR(255) NOT NULL,
  description TEXT
);

-- ===== category_attributes (needs categories, attributes) =====
CREATE TABLE category_attributes (
  category_id  INT NOT NULL REFERENCES categories(id),
  attribute_id INT NOT NULL REFERENCES attributes(id),
  required     BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (category_id, attribute_id)
);

-- ===== attribute_values (needs attributes) =====
CREATE TABLE attribute_values (
  id           SERIAL PRIMARY KEY,
  attribute_id INT NOT NULL REFERENCES attributes(id),
  value        VARCHAR(255) NOT NULL
);

-- -- ===== orders (needs customers) =====
-- CREATE TABLE orders (
--   id           SERIAL PRIMARY KEY,
--   customer_id  INT NOT NULL REFERENCES customers(id),
--   order_date   TIMESTAMP NOT NULL DEFAULT NOW(),
--   status       VARCHAR(50),
--   total_amount DECIMAL(10,2)
-- );

-- -- ===== carts (needs customers) =====
-- CREATE TABLE carts (
--   id          SERIAL PRIMARY KEY,
--   customer_id INT NOT NULL REFERENCES customers(id),
--   created_at  TIMESTAMP NOT NULL DEFAULT NOW()
-- );

-- ################ LEVEL 2: depend on level 1 ################

-- ===== variants (needs products) =====
CREATE TABLE variants (
  id         SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id),
  sku        VARCHAR(100) NOT NULL UNIQUE,
  price      DECIMAL(10,2) NOT NULL,
  stock      INT NOT NULL DEFAULT 0
);

-- ################ LEVEL 3: depend on level 2 ################

-- -- ===== order_items (needs orders, variants) =====
-- CREATE TABLE order_items (
--   id         SERIAL PRIMARY KEY,
--   order_id   INT NOT NULL REFERENCES orders(id),
--   variant_id INT NOT NULL REFERENCES variants(id),
--   quantity   INT NOT NULL,
--   unit_price DECIMAL(10,2) NOT NULL
-- );

-- -- -- ===== cart_products (needs carts, variants) =====
-- CREATE TABLE cart_products (
--   cart_id    INT NOT NULL REFERENCES carts(id),
--   variant_id INT NOT NULL REFERENCES variants(id),
--   quantity   INT NOT NULL,
--   PRIMARY KEY (cart_id, variant_id)
-- );

-- ===== variant_attribute_values (needs variants, attributes, attribute_values) =====
CREATE TABLE variant_attribute_values (
  variant_id         INT NOT NULL REFERENCES variants(id),
  attribute_id       INT NOT NULL REFERENCES attributes(id),
  attribute_value_id INT NOT NULL REFERENCES attribute_values(id),
  PRIMARY KEY (variant_id, attribute_id)
);

-- Down Migration

-- -- drop in exact reverse order of creation
-- DROP TABLE variant_attribute_values;
-- DROP TABLE cart_products;
-- DROP TABLE order_items;
-- DROP TABLE variants;
-- DROP TABLE carts;
-- DROP TABLE orders;
-- DROP TABLE attribute_values;
-- DROP TABLE category_attributes;
-- DROP TABLE products;
-- DROP TABLE attributes;
-- DROP TABLE categories;
-- DROP TABLE customers;