-- Up Migration

-- ===== enum: used later by campaign_applications.scope =====
CREATE TYPE campaign_scope AS ENUM ('global', 'category', 'product', 'variant');

-- ===== regions =====
CREATE TABLE regions (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50)  NOT NULL UNIQUE
);

-- ===== promotions =====
CREATE TABLE promotions (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  promotion_type VARCHAR(50)  NOT NULL,
  status         VARCHAR(50)  NOT NULL DEFAULT 'active',
  discount_type  VARCHAR(50)  NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0)
);

-- ===== campaigns =====
CREATE TABLE campaigns (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  start_date  TIMESTAMPTZ NOT NULL,
  end_date    TIMESTAMPTZ NOT NULL,
  status      VARCHAR(50) NOT NULL DEFAULT 'draft',
  CONSTRAINT valid_campaign_dates CHECK (end_date >= start_date)
);

-- -- Down Migration

-- DROP TABLE campaigns;
-- DROP TABLE promotions;
-- DROP TABLE regions;
-- DROP TYPE campaign_scope;