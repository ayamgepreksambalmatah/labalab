-- ============================================================
-- LabaLab — History penjualan per produk (spec §3) + placeholder
-- chat stats (spec §4.3, dibuat sekarang tapi belum dipakai).
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

-- History per produk per periode laporan
create table if not exists public.product_sales_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  sales_report_id uuid references public.sales_reports(id) on delete cascade not null,
  periode_label text,
  unit_terjual integer not null default 0,
  omzet numeric not null default 0,
  biaya numeric not null default 0,
  modal numeric not null default 0,
  profit numeric not null default 0,
  margin numeric not null default 0,
  refund_count integer default 0,
  created_at timestamptz default now()
);
create index if not exists idx_history_product on public.product_sales_history(product_id);

alter table public.product_sales_history enable row level security;
drop policy if exists "Users can view own product history" on public.product_sales_history;
create policy "Users can view own product history" on public.product_sales_history
  for all using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.user_id = auth.uid()
    )
  );

-- ============================================================
-- Placeholder: statistik chat vs checkout (spec §4.3)
-- Dibuat supaya struktur siap; TIDAK diisi sampai CS Assistant jalan.
-- ============================================================
create table if not exists public.product_chat_stats (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  periode date not null,
  jumlah_chat integer default 0,
  jumlah_checkout_setelah_chat integer default 0,
  created_at timestamptz default now()
);
create index if not exists idx_chat_stats_product on public.product_chat_stats(product_id);

alter table public.product_chat_stats enable row level security;
drop policy if exists "Users can view own chat stats" on public.product_chat_stats;
create policy "Users can view own chat stats" on public.product_chat_stats
  for all using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.user_id = auth.uid()
    )
  );
