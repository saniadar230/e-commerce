-- ===== products =====
create table products (
    id          uuid primary key default gen_random_uuid(),
    name        varchar(255) not null,
    description text,
    price       decimal(10, 2) not null,
    image_url   text,
    is_deleted  boolean not null default false,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- ===== variants =====
create table variants (
    id          uuid primary key default gen_random_uuid(),
    product_id  uuid not null references products(id),
    quantity    int not null check (quantity >= 0),
    price       decimal(10, 2) not null,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    is_deleted  boolean not null default false
);

-- ===== attributes =====
create table attributes (
    id          uuid primary key default gen_random_uuid(),
    variant_id  uuid not null references variants(id),
    name        varchar(255) not null,
    value       text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    is_deleted  boolean not null default false
);