CREATE TYPE payment_type AS ENUM (
    'cod',
    'card'
);

ALTER TABLE orders
ADD COLUMN customer_name VARCHAR(150) NOT NULL,
ADD COLUMN email VARCHAR(255) NOT NULL,
ADD COLUMN phone_number VARCHAR(30) NOT NULL,
ADD COLUMN delivery_address TEXT NOT NULL,
ADD COLUMN payment_type payment_type NOT NULL;