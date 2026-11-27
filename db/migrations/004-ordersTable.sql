CREATE TYPE payment_status AS ENUM (
    'paid',
    'unpaid'
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL
        REFERENCES customers(id),
    cart_id UUID NOT NULL REFERENCES carts(id),
    status payment_status NOT NULL DEFAULT 'unpaid',
    total_amount BIGINT NOT NULL CHECK(total_amount > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL REFERENCES orders(id),
    variant_id UUID NOT NULL REFERENCES variants(id),
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK(unit_price > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE UNIQUE INDEX idx_one_variant_per_order
ON order_items(order_id, variant_id)