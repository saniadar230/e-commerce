CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    delivery_address TEXT,

    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    -- Validates email format using case-insensitive POSIX regex matching (~*).
    --   ^               --> Match start of line
    --   [a-z0-9._%+-]+  --> Match 1 or more local username characters
    --   @               --> Match literal @ symbol
    --   [a-z0-9.-]+     --> Match 1 or more domain name characters
    --   \.              --> Match literal dot character
    --   [a-z]{2,}       --> Match a top-level domain at least 2 letters long
    --   $               --> Match end of line
    CONSTRAINT chk_valid_email
        CHECK (TRIM(email) ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),

    CONSTRAINT customers_name_not_blank
        CHECK (TRIM(name) <> ''),

    CONSTRAINT customers_delivery_address_length
        CHECK (
            delivery_address IS NULL
            OR LENGTH(TRIM(delivery_address)) <= 500
        ),

    CONSTRAINT customers_name_length
        CHECK (LENGTH(TRIM(name)) BETWEEN 3 AND 100)
);

CREATE UNIQUE INDEX idx_customers_email_ci
    ON customers(lower(email))
    WHERE is_deleted = false;