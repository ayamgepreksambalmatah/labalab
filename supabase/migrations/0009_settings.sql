-- ============================================================
-- LabaLab — Kolom pendukung menu Pengaturan (spec settings).
--
-- - subscriptions.auto_renew : dimatikan saat user "Batalkan Langganan"
--   (akses tetap sampai plan_expires_at, hanya perpanjangan otomatis mati).
-- - profiles.nomor_wa        : kontak WhatsApp seller.
-- - profiles.tone_preference : nada balasan default (dipakai CS Assistant nanti).
-- - profiles.notif_*         : preferensi notifikasi email.
--
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

alter table public.subscriptions
  add column if not exists auto_renew boolean default true;

alter table public.profiles
  add column if not exists nomor_wa text,
  add column if not exists tone_preference text default 'santai',
  add column if not exists notif_kuota_habis boolean default true,
  add column if not exists notif_laporan_mingguan boolean default false;
