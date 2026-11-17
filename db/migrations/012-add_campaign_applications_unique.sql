-- Up Migration

-- ===== same campaign + promotion + region + target can't repeat =====
-- COALESCE is needed because NULLs count as different in a unique index
CREATE UNIQUE INDEX uq_campaign_applications_target
ON campaign_applications (
    campaign_id,
    promotion_id,
    scope,
    COALESCE(region_id, '00000000-0000-0000-0000-000000000000'::UUID),
    COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::UUID),
    COALESCE(product_id, '00000000-0000-0000-0000-000000000000'::UUID),
    COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::UUID)
);

-- Down Migration

-- DROP INDEX uq_campaign_applications_target;