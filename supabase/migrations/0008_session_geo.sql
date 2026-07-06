-- ============================================================
-- LabaLab — IP & lokasi kasar untuk sesi aktif (fitur keamanan).
--
-- Melengkapi 0007_active_sessions.sql. Dipakai di kartu "Perangkat aktif"
-- (/dashboard/settings) dan notifikasi email login baru. Lokasi/IP diisi
-- dari header saat login (Vercel geo headers + x-forwarded-for).
--
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

alter table public.active_sessions
  add column if not exists ip_address text,
  add column if not exists location text;
