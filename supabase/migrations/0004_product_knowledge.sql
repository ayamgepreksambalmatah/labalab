-- ============================================================
-- LabaLab — Field lengkap Produk Saya (Product Knowledge, spec §1)
-- Menambah kolom detail ke products. Dipakai form Produk Saya,
-- dan nanti oleh CS AI / Listing Generator.
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

alter table public.products
  add column if not exists stok integer,
  add column if not exists ukuran_tersedia text[],
  add column if not exists faq jsonb,            -- [{question, answer}]
  add column if not exists garansi text,
  add column if not exists cara_perawatan text,
  add column if not exists bahan text,
  add column if not exists deskripsi text;        -- hasil Listing Generator, dipakai CS AI
