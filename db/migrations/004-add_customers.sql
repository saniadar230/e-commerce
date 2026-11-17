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

INSERT INTO customers (name, email, delivery_address)
VALUES
    ('John Smith', 'john.smith@example.com', '123 Main Street, New York'),
    ('Sarah Johnson', 'sarah.johnson@example.com', '45 Park Avenue, Chicago'),
    ('Ahmed Khan', 'ahmed.khan@example.com', 'House 12, Gulberg III, Lahore'),
    ('Fatima Ali', 'fatima.ali@example.com', 'Block B, DHA Phase 5, Lahore'),
    ('Michael Brown', 'michael.brown@example.com', '78 Oak Street, Boston'),
    ('Emily Davis', 'emily.davis@example.com', '22 Sunset Boulevard, Los Angeles'),
    ('Usman Malik', 'usman.malik@example.com', 'Street 5, Model Town, Lahore'),
    ('Ayesha Ahmed', 'ayesha.ahmed@example.com', NULL),
    ('David Wilson', 'david.wilson@example.com', '15 King Street, London'),
    ('Olivia Martin', 'olivia.martin@example.com', '90 Queen Street, Toronto');