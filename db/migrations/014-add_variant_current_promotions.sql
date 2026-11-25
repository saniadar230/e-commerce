-- Up Migration

-- Materialized pointer for the one promotion currently selected for a variant.
-- Keep this row synchronized when applications, campaigns, promotions, or the
-- variant's product/category change. Campaign start/end transitions also need
-- a scheduled refresh because time passing does not fire a database trigger.
CREATE TABLE variant_current_promotions (
  id                     BIGSERIAL PRIMARY KEY,
  variant_id             UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  region_id              UUID REFERENCES regions(id) ON DELETE CASCADE,
  campaign_application_id INT NOT NULL
    REFERENCES campaign_applications(id) ON DELETE CASCADE,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- NULL region_id is the default application for regions without an override.
-- The same variant may have a different current promotion in another region.
CREATE UNIQUE INDEX uq_variant_current_promotions_variant_region
  ON variant_current_promotions (
    variant_id,
    COALESCE(region_id, '00000000-0000-0000-0000-000000000000'::UUID)
  );

CREATE INDEX idx_variant_current_promotions_application
  ON variant_current_promotions (campaign_application_id);

-- Down Migration

-- DROP INDEX idx_variant_current_promotions_application;
-- DROP INDEX uq_variant_current_promotions_variant_region;
-- DROP TABLE variant_current_promotions;
