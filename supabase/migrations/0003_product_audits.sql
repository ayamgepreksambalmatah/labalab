-- ============================================================
-- LabaLab — Tabel histori Product Doctor (Tahap 5)
-- Dipakai untuk menyimpan hasil audit + menghitung limit plan
-- (free: 1x/bulan). GRANT ke role API sudah otomatis lewat default
-- privileges di 0002; di sini cukup RLS + policy.
--
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

create table if not exists public.product_audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  judul text,
  kategori text,
  score int,
  ai_result jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_product_audits_user on public.product_audits(user_id);

alter table public.product_audits enable row level security;

drop policy if exists "Users can CRUD own audits" on public.product_audits;
create policy "Users can CRUD own audits" on public.product_audits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
