-- ============================================================
-- LabaLab — Data transaksi mentah (transaction-level) untuk
-- Laporan Detail multi-channel (upload marketplace + input manual IG/PO).
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

create table if not exists public.sales_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,        -- nullable: kalau tak match produk
  sales_report_id uuid references public.sales_reports(id) on delete set null, -- nullable: input manual
  tanggal date not null,
  nama_produk text not null,
  platform text not null,                 -- shopee | tokopedia | tiktok | instagram | lainnya
  qty integer not null default 1,
  harga_satuan numeric not null default 0,
  omzet numeric not null default 0,       -- qty * harga_satuan
  biaya_platform numeric not null default 0,
  modal numeric not null default 0,
  profit numeric not null default 0,      -- omzet - biaya_platform - modal
  status text,                            -- selesai | batal | refund | pending
  sumber text not null default 'upload',  -- upload | manual
  catatan text,
  created_at timestamptz default now()
);
create index if not exists idx_transactions_user_date
  on public.sales_transactions(user_id, tanggal desc);
create index if not exists idx_transactions_product
  on public.sales_transactions(product_id);

alter table public.sales_transactions enable row level security;
drop policy if exists "Users can CRUD own transactions" on public.sales_transactions;
create policy "Users can CRUD own transactions" on public.sales_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
