-- Up Migration

-- ===== same campaign + promotion + region + target can't repeat =====
-- COALESCE is needed because NULLs count as different in a unique index
CREATE UNIQUE INDEX uq_campaign_applications_target
  ON campaign_applications (
    campaign_id, promotion_id, scope,
    COALESCE(region_id, 0), COALESCE(category_id, 0),
    COALESCE(product_id, 0), COALESCE(variant_id, 0)
  );

-- Down Migration

DROP INDEX uq_campaign_applications_target;