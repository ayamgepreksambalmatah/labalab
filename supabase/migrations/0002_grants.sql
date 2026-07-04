-- ============================================================
-- LabaLab — Table privileges for Supabase API roles
--
-- Kadang GRANT bawaan ke role anon/authenticated/service_role tidak
-- ikut terpasang saat tabel dibuat, sehingga query lewat PostgREST
-- gagal dengan "42501: permission denied for table ...".
--
-- Grant di sini AMAN: akses baris tetap dibatasi oleh Row Level
-- Security (lihat 0001). anon/authenticated cuma bisa lihat baris
-- miliknya; service_role bypass RLS (khusus kode server tepercaya).
--
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;

-- Tabel yang sudah ada
grant all privileges on all tables in schema public
  to anon, authenticated, service_role;
grant all privileges on all sequences in schema public
  to anon, authenticated, service_role;
grant all privileges on all functions in schema public
  to anon, authenticated, service_role;

-- Tabel/sequence/function yang dibuat ke depan (default privileges)
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
