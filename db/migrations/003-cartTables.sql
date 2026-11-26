CREATE TYPE cart_status AS ENUM (
    'active',
    'converted'
);

CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL
        REFERENCES customers(id),

    status cart_status NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE cart_products (
    cart_id UUID NOT NULL REFERENCES carts(id),
    variant_id UUID NOT NULL REFERENCES variants(id),
    quantity SMALLINT NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_cart_products
        PRIMARY KEY (cart_id, variant_id),

    CONSTRAINT chk_valid_quantity
        CHECK (quantity BETWEEN 1 AND 10)
);

CREATE UNIQUE INDEX idx_one_active_cart_per_customer
ON carts(customer_id)
WHERE status = 'active';