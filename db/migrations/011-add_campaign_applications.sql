CREATE TABLE campaign_applications (
  id            SERIAL PRIMARY KEY,
  campaign_id   INT NOT NULL REFERENCES campaigns(id),
  promotion_id  INT NOT NULL REFERENCES promotions(id),
  region_id     UUID REFERENCES regions(id),

  scope         campaign_scope NOT NULL,
  category_id   UUID REFERENCES categories(id),
  product_id    UUID REFERENCES products(id),
  variant_id    UUID REFERENCES variants(id),

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_campaign_scope_target CHECK (
    (scope = 'global'
      AND category_id IS NULL
      AND product_id IS NULL
      AND variant_id IS NULL)
    OR
    (scope = 'category'
      AND category_id IS NOT NULL
      AND product_id IS NULL
      AND variant_id IS NULL)
    OR
    (scope = 'product'
      AND category_id IS NULL
      AND product_id IS NOT NULL
      AND variant_id IS NULL)
    OR
    (scope = 'variant'
      AND category_id IS NULL
      AND product_id IS NULL
      AND variant_id IS NOT NULL)
  )
);