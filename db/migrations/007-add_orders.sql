CREATE TYPE order_status AS ENUM (
    -- Order placed, awaiting fulfilment/delivery.
    'pending',
    -- Order successfully delivered
    'completed',
    -- Order cancelled before completion
    'cancelled',
    -- Order was delivered but customer returned it
    'returned'
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL
        REFERENCES customers(id),
    status order_status NOT NULL DEFAULT 'pending',
    total_amount BIGINT NOT NULL CHECK(total_amount > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

