-- ============================================================
-- LabaLab — Sistem kuota per plan + model routing (spec model-routing)
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

-- 1) Limit per plan (bisa diedit dari admin tanpa deploy ulang).
--    Kolom listing_generator ditambah untuk kelengkapan Feature enum
--    (Listing Generator belum dibangun — nilai placeholder).
create table if not exists public.plan_limits (
  plan text primary key,                       -- 'free' | 'pro' | 'max'
  sales_analyzer_per_month integer not null,
  product_doctor_per_month integer not null,
  cs_reply_per_month integer not null,
  listing_generator_per_month integer not null default 0,
  updated_at timestamptz default now()
);

insert into public.plan_limits
  (plan, sales_analyzer_per_month, product_doctor_per_month, cs_reply_per_month, listing_generator_per_month)
values
  ('free', 1, 3, 20, 3),
  ('pro', 10, 30, 500, 100),
  ('max', 999999, 999999, 3000, 999999)      -- angka besar = "unlimited" praktis
on conflict (plan) do update set
  sales_analyzer_per_month = excluded.sales_analyzer_per_month,
  product_doctor_per_month = excluded.product_doctor_per_month,
  cs_reply_per_month = excluded.cs_reply_per_month,
  listing_generator_per_month = excluded.listing_generator_per_month,
  updated_at = now();

alter table public.plan_limits enable row level security;
drop policy if exists "Anyone can read plan limits" on public.plan_limits;
create policy "Anyone can read plan limits" on public.plan_limits
  for select using (true);   -- info harga/limit tidak rahasia

-- 2) Log pemakaian aktual per user / fitur / bulan.
create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  feature text not null,                       -- sales_analyzer | product_doctor | cs_reply | listing_generator
  periode_bulan text not null,                 -- 'YYYY-MM'
  jumlah_pemakaian integer not null default 0,
  updated_at timestamptz default now(),
  unique (user_id, feature, periode_bulan)
);
create index if not exists idx_usage_user on public.usage_logs(user_id);

alter table public.usage_logs enable row level security;
-- User cuma boleh LIHAT pemakaiannya sendiri (buat indikator kuota di UI).
drop policy if exists "Users can view own usage" on public.usage_logs;
create policy "Users can view own usage" on public.usage_logs
  for select using (auth.uid() = user_id);
-- Insert/update HANYA lewat fungsi security-definer di bawah (service role).

-- 3) Increment atomik + cek limit dalam SATU statement (anti race/double-count).
--    Return: jumlah pemakaian baru, atau -1 kalau sudah mencapai limit
--    (tidak di-increment). Guard p_max<=0 = tidak diizinkan.
create or replace function public.increment_usage_if_allowed(
  p_user_id uuid,
  p_feature text,
  p_period text,
  p_max integer
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_max is null or p_max <= 0 then
    return -1;
  end if;

  insert into public.usage_logs (user_id, feature, periode_bulan, jumlah_pemakaian, updated_at)
  values (p_user_id, p_feature, p_period, 1, now())
  on conflict (user_id, feature, periode_bulan)
  do update set
    jumlah_pemakaian = usage_logs.jumlah_pemakaian + 1,
    updated_at = now()
  where usage_logs.jumlah_pemakaian < p_max
  returning jumlah_pemakaian into v_count;

  if v_count is null then
    return -1;   -- konflik tapi WHERE gagal → sudah di limit, tidak naik
  end if;
  return v_count;
end;
$$;

-- Rollback 1 pemakaian (dipanggil kalau panggilan AI gagal setelah increment).
create or replace function public.decrement_usage(
  p_user_id uuid,
  p_feature text,
  p_period text
) returns void
language sql
security definer
set search_path = public
as $$
  update public.usage_logs
  set jumlah_pemakaian = greatest(jumlah_pemakaian - 1, 0), updated_at = now()
  where user_id = p_user_id and feature = p_feature and periode_bulan = p_period;
$$;

-- Fungsi hanya boleh dipanggil backend (service role), bukan langsung dari client.
revoke execute on function public.increment_usage_if_allowed(uuid, text, text, integer) from anon, authenticated, public;
grant execute on function public.increment_usage_if_allowed(uuid, text, text, integer) to service_role;
revoke execute on function public.decrement_usage(uuid, text, text) from anon, authenticated, public;
grant execute on function public.decrement_usage(uuid, text, text) to service_role;
