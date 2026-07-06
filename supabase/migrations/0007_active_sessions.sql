-- ============================================================
-- LabaLab — Single active session per user (fitur keamanan)
--
-- 1 akun = 1 sesi aktif. Setiap login baru meng-UPSERT session_token
-- baru; device lama yang token cookie-nya tidak cocok akan di-kick
-- (otoritas cek di src/lib/supabase/middleware.ts, kick instan via
-- Supabase Realtime di src/components/auth/SessionGuard.tsx).
--
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

create table if not exists public.active_sessions (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  session_token text not null,
  device_info text,
  last_active timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- User hanya boleh baca/tulis baris miliknya. Cek server-side pakai
-- client authenticated (JWT user) → auth.uid() = user_id.
-- ============================================
alter table public.active_sessions enable row level security;

drop policy if exists "Users can view own active session" on public.active_sessions;
create policy "Users can view own active session" on public.active_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own active session" on public.active_sessions;
create policy "Users can insert own active session" on public.active_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own active session" on public.active_sessions;
create policy "Users can update own active session" on public.active_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Grants selaras dengan 0002_grants.sql (akses baris tetap dibatasi RLS).
grant all privileges on public.active_sessions to anon, authenticated, service_role;

-- ============================================
-- REALTIME — daftarkan tabel ke publication supaya SessionGuard
-- (client) menerima event UPDATE saat ada login baru dari device lain.
-- Dibungkus DO block supaya idempotent (add table gagal kalau sudah ada).
-- ============================================
do $$
begin
  alter publication supabase_realtime add table public.active_sessions;
exception
  when duplicate_object then null;
  when undefined_object then null;  -- publication belum ada (setup non-standar)
end $$;
