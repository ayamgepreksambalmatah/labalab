-- ============================================================
-- LabaLab — Info supplier (pencatatan pribadi seller).
-- 3 kolom baru di products: harga beli & kontak supplier.
-- Murni catatan pribadi, tidak dipakai otomatisasi apa pun.
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

alter table public.products
  add column if not exists harga_supplier numeric,
  add column if not exists link_supplier text,
  add column if not exists kontak_supplier text;
