CREATE TYPE payment_method AS ENUM (
    'cod',
    'card',
    'bank_transfer'
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
    'partially_refunded'
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL REFERENCES orders(id),
    payment_method payment_method NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    amount BIGINT NOT NULL CHECK(amount > 0),
    currency CHAR(3) NOT NULL DEFAULT 'usd',
    refunded_amount BIGINT NOT NULL DEFAULT 0,

    -- Stripe linkage (only used when payment_method = 'card')
    stripe_checkout_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT UNIQUE,

    failure_reason TEXT,
    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP


     CONSTRAINT chk_refund_within_amount
        CHECK (refunded_amount >= 0 AND refunded_amount <= amount),
    CONSTRAINT chk_stripe_only_for_card
        CHECK (payment_method = 'card'
               OR (stripe_checkout_session_id IS NULL AND stripe_payment_intent_id IS NULL))
);


CREATE UNIQUE INDEX idx_one_pending_payment_per_order
    ON payments(order_id) WHERE payment_status = 'pending';

CREATE INDEX idx_payments_order_id ON payments(order_id);

CREATE TABLE stripe_events (
    id TEXT PRIMARY KEY,                 -- evt_...
    type TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);