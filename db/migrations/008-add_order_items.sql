CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL REFERENCES orders(id),
    variant_id UUID NOT NULL REFERENCES variants(id),
    quantity INTEGER NOT NULL CHECK(quantity > 0)
    unit_price BIGINT NOT NULL CHECK(unit_price > 0)
    discount_amount BIGINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE UNIQUE INDEX idx_one_variant_per_order
ON order_items(order_id, variant_id)
