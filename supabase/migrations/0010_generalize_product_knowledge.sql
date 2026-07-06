-- ============================================================
-- LabaLab — Product Knowledge universal (semua kategori).
--
-- Field lama (ukuran_tersedia, bahan, cara_perawatan) terlalu fashion-centric.
-- Tambah field universal + `atribut_khusus` (JSONB fleksibel per kategori).
-- Kolom lama TETAP ADA untuk backward compatibility — UI baru tidak lagi
-- menampilkannya sebagai field terpisah.
--
-- Catatan: spec menyebut "0009", tapi 0009 sudah dipakai (0009_settings.sql),
-- jadi migration ini bernomor 0010.
--
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

alter table public.products
  add column if not exists masa_berlaku text,        -- "3 hari di kulkas" / "2 tahun garansi resmi"
  add column if not exists sertifikasi text,          -- "Halal MUI, BPOM" / "SNI" (opsional)
  add column if not exists kondisi_pengiriman text,   -- "Perlu ice pack" / "Mudah pecah, extra bubble wrap"
  add column if not exists catatan_tambahan text,     -- pengganti cara_perawatan (general purpose)
  add column if not exists atribut_khusus jsonb;      -- {"Ukuran": ["S","M"]} / {"Varian Rasa": "Original, Pedas"}

-- ============================================================
-- Migrasi data lama (opsional, sekali jalan). Pindahkan field
-- fashion-specific ke struktur baru supaya tidak hilang di UI baru.
-- Dijaga null-check supaya aman kalau dijalankan ulang.
-- ============================================================
update public.products
set atribut_khusus = jsonb_strip_nulls(
  jsonb_build_object('Ukuran', to_jsonb(ukuran_tersedia), 'Bahan', to_jsonb(bahan))
)
where atribut_khusus is null
  and (ukuran_tersedia is not null or bahan is not null);

update public.products
set catatan_tambahan = cara_perawatan
where catatan_tambahan is null and cara_perawatan is not null;
