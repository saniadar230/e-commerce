ALTER TABLE products
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_order_items_variant ON order_items(variant_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
