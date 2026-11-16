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

