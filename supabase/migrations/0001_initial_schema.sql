-- ============================================================
-- LabaLab — Initial schema (spec §3 + §5)
-- Run in Supabase SQL editor, or via `supabase db push`.
-- ============================================================

-- ============================================
-- PROFILES (data tambahan di atas auth.users)
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  store_name text,
  plan text not null default 'free', -- 'free' | 'pro'
  plan_expires_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- PRODUCTS ("Produk Saya")
-- ============================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  nama text not null,
  platform text not null, -- 'shopee' | 'tokopedia' | 'tiktok'
  kategori text not null,
  harga numeric not null default 0,
  modal numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_products_user on public.products(user_id);

-- ============================================
-- SALES_REPORTS (histori Sales Analyzer)
-- ============================================
create table if not exists public.sales_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  source_label text, -- nama file / 'demo'
  total_omzet numeric,
  total_profit numeric,
  total_margin numeric,
  total_lost_profit numeric,
  ai_summary jsonb,   -- ringkasan, temuan, rekomendasi dari AI
  raw_products jsonb, -- array produk hasil parsing
  created_at timestamptz default now()
);
create index if not exists idx_reports_user on public.sales_reports(user_id);

-- ============================================
-- SUBSCRIPTIONS (histori pembayaran Midtrans)
-- ============================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  midtrans_order_id text unique not null,
  plan text not null, -- 'pro'
  amount numeric not null,
  status text not null default 'pending', -- 'pending' | 'paid' | 'failed' | 'expired'
  paid_at timestamptz,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_subs_user on public.subscriptions(user_id);

-- ============================================
-- ROW LEVEL SECURITY (wajib di Supabase!)
-- ============================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.sales_reports enable row level security;
alter table public.subscriptions enable row level security;

-- profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- products
drop policy if exists "Users can CRUD own products" on public.products;
create policy "Users can CRUD own products" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- sales_reports
drop policy if exists "Users can CRUD own reports" on public.sales_reports;
create policy "Users can CRUD own reports" on public.sales_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- subscriptions (read-only for users; writes happen via service role in webhook)
drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Users can view own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ============================================
-- TRIGGER: buat profile otomatis saat user daftar (spec §5)
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- TRIGGER: auto-update products.updated_at
-- ============================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();
