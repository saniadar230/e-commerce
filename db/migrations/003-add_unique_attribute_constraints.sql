-- up migration

-- === step 1: attribute name must be unique (colour, color = same ) ======
create unique index uq_attribute_name 
 ON attributes (LOWER (name));

-- === step 2: same value can't repeat inside one attribute ==== 
create unique index uq_attribute_values_attr_value
 ON attribute_values (attribute_id, LOWER (value));