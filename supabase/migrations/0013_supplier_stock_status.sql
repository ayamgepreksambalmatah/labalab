-- ============================================================
-- LabaLab — Status stok supplier (pencatatan manual seller).
-- 1 kolom baru di products. Seller update sendiri saat cek ke
-- supplier — tidak dipakai otomatisasi apa pun.
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

alter table public.products
  add column if not exists status_stok_supplier text default 'tersedia';
