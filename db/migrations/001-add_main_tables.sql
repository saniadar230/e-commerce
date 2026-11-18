-- Up Migration

-- ===== extension: before any table that uses ltree =====
CREATE EXTENSION IF NOT EXISTS ltree;

-- ################ LEVEL 0: no foreign keys ################

-- ===== categories =====
CREATE TABLE categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id),
  name      VARCHAR(255) NOT NULL,
  path      ltree
);

-- same name can't repeat under one parent (coalesce makes root names count too)
CREATE UNIQUE INDEX uq_categories_parent_name
  ON categories (COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), LOWER(name));

-- fast ancestor / descendant queries (@>, <@)
CREATE INDEX idx_categories_path ON categories USING GIST (path);

-- ===== attributes =====
CREATE TABLE attributes (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- colour and Colour are the same attribute
CREATE UNIQUE INDEX uq_attribute_name ON attributes (LOWER(name));

-- ################ LEVEL 1 ################

-- ===== products =====
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products (category_id);

-- ===== category_attributes =====
CREATE TABLE category_attributes (
  category_id  UUID NOT NULL REFERENCES categories(id),
  attribute_id INT  NOT NULL REFERENCES attributes(id),
  required     BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (category_id, attribute_id)
);

-- ===== attribute_values =====
CREATE TABLE attribute_values (
  id           SERIAL PRIMARY KEY,
  attribute_id INT NOT NULL REFERENCES attributes(id),
  value        VARCHAR(255) NOT NULL,
  -- needed so variant_attribute_values can use a composite foreign key
  CONSTRAINT uq_attribute_values_id_attr UNIQUE (attribute_id, id)
);

-- same value can't repeat inside one attribute
CREATE UNIQUE INDEX uq_attribute_values_attr_value
  ON attribute_values (attribute_id, LOWER(value));

-- ################ LEVEL 2 ################

-- ===== variants =====
CREATE TABLE variants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  sku        VARCHAR(100) NOT NULL UNIQUE,
  price      DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock      INT NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

CREATE INDEX idx_variants_product ON variants (product_id);

-- ################ LEVEL 3 ################

-- ===== variant_attribute_values =====
CREATE TABLE variant_attribute_values (
  variant_id         UUID NOT NULL REFERENCES variants(id),
  attribute_id       INT  NOT NULL REFERENCES attributes(id),
  attribute_value_id INT  NOT NULL REFERENCES attribute_values(id),
  PRIMARY KEY (variant_id, attribute_id),
  -- the chosen value must belong to the same attribute
  CONSTRAINT fk_vav_value_matches_attribute
    FOREIGN KEY (attribute_id, attribute_value_id)
    REFERENCES attribute_values (attribute_id, id)
);

-- -- Down Migration

-- DROP TABLE variant_attribute_values;
-- DROP TABLE variants;
-- DROP TABLE attribute_values;
-- DROP TABLE category_attributes;
-- DROP TABLE products;
-- DROP TABLE attributes;
-- DROP TABLE categories;