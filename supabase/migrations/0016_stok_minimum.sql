-- ============================================================
-- LabaLab — Stok minimum untuk alert restock.
-- Dipakai section "Perlu Restock Segera" di Dashboard (stok <= stok_minimum).
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

alter table public.products
  add column if not exists stok_minimum integer default 10;
