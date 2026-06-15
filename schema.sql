-- HAJIA SLAY EMPIRE DATABASE SCHEMA
-- Run this entire script in your Supabase Project → SQL Editor → New query → Run

-- ── STEP 1: Create tables (safe to re-run — IF NOT EXISTS) ──────────────────

create table if not exists products (
  id text primary key,
  name text not null,
  brand text default '',
  category text not null,
  subcategory text default 'other',
  price numeric not null,
  original_price numeric not null,
  notes text default '',
  extra text default '',
  image text default '',
  secondary_image text default '',
  bestseller boolean default false,
  is_trending boolean default false,
  gender text default 'women',
  stock integer default 0,
  low_stock_threshold integer default 3,
  promo_active boolean default false,
  promo_price numeric,
  created_at timestamptz default now()
);

create table if not exists orders (
  id text primary key,
  purchase_code text,
  timestamp_ms bigint not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_country text default 'Ghana',
  street_address text not null,
  apartment text,
  city text not null,
  postal_code text,
  customer_notes text,
  items jsonb not null,
  total numeric not null,
  staff_order boolean default false,
  payment_method text default 'momo',
  momo_ref text,
  paystack_ref text,
  status_payment boolean default false,
  status_packaged boolean default false,
  status_dispatched boolean default false,
  status_delivered boolean default false,
  status_payment_at bigint,
  status_packaged_at bigint,
  status_dispatched_at bigint,
  status_delivered_at bigint,
  admin_note text,
  estimated_delivery text,
  created_at timestamptz default now()
);

create table if not exists customers (
  id bigint generated always as identity primary key,
  phone text unique not null,
  name text,
  email text,
  total_orders integer default 0,
  total_spent numeric default 0,
  last_order_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists slay_testimonials (
  id bigint generated always as identity primary key,
  name text not null,
  handle text default 'verified_customer',
  review text not null,
  rating integer default 5,
  created_at timestamptz default now()
);

-- ── STEP 2: Disable Row Level Security ──────────────────────────────────────
-- The app uses its own admin password, not Supabase Auth.
-- Disabling RLS lets the anon key read and write freely.
-- You can re-enable with proper policies when Supabase Auth is added later.

alter table products         disable row level security;
alter table orders           disable row level security;
alter table customers        disable row level security;
alter table slay_testimonials disable row level security;

-- ── STEP 3: Drop any old blocking policies (run even if tables are new) ─────

drop policy if exists "Allow public read access to products"              on products;
drop policy if exists "Allow authenticated admins to write products"      on products;
drop policy if exists "Allow public read access to testimonials"          on slay_testimonials;
drop policy if exists "Allow authenticated admins to manage testimonials" on slay_testimonials;
drop policy if exists "Allow public order placement"                      on orders;
drop policy if exists "Allow public order lookup"                         on orders;
drop policy if exists "Allow authenticated admins full control of orders" on orders;
drop policy if exists "Allow public upsert of customer entries"           on customers;
drop policy if exists "Allow authenticated admins to view/manage customer directories" on customers;

