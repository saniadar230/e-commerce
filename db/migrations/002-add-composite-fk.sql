-- Up Migration

-- ===== step 1: parent table needs a UNIQUE on (attribute_id, id) =====
ALTER TABLE attribute_values
  ADD CONSTRAINT uq_attribute_values_id_attr UNIQUE (attribute_id, id);

-- ===== step 2: composite FK in the child table =====
ALTER TABLE variant_attribute_values
  ADD CONSTRAINT fk_vav_value_matches_attribute
  FOREIGN KEY (attribute_id, attribute_value_id)
  REFERENCES attribute_values (attribute_id, id);