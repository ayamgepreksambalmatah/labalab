-- ============================================================
-- LabaLab — Catat Pembelian Stok (untuk reseller).
-- Setiap kali seller kulakan/restock dari supplier, dicatat di sini.
-- Dipakai: tombol "Beli Stok" di kartu produk, kartu "Modal Dikeluarkan
-- Bulan Ini" di Dashboard, dan tab "Riwayat Beli Stok" di History produk.
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
--
-- CATATAN: skema ini didesain dari requirement (tak ada dokumen skema
-- terlampir). product_id = set null + snapshot nama_produk supaya total
-- modal tetap akurat walau produk kelak dihapus.
-- ============================================================

create table if not exists public.stock_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  nama_produk text not null,                     -- snapshot nama saat beli
  tanggal date not null,
  qty_dibeli integer not null default 1,
  total_bayar numeric not null default 0,
  harga_per_unit numeric not null default 0,     -- total_bayar / qty_dibeli
  added_to_stock boolean not null default false, -- apakah stok produk ditambah
  updated_supplier_price boolean not null default false, -- apakah harga_supplier di-rata2 ulang
  catatan text,
  created_at timestamptz default now()
);
create index if not exists idx_stock_purchases_user_date
  on public.stock_purchases(user_id, tanggal desc);
create index if not exists idx_stock_purchases_product
  on public.stock_purchases(product_id);

alter table public.stock_purchases enable row level security;
drop policy if exists "Users can CRUD own stock purchases" on public.stock_purchases;
create policy "Users can CRUD own stock purchases" on public.stock_purchases
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
