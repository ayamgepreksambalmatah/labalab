# Spesifikasi Teknis — LabaLab
**AI Profit Assistant untuk Seller E-commerce Indonesia**

Dokumen ini adalah blueprint teknis untuk membangun LabaLab dari prototype (HTML statis) menjadi web app production yang self-serve. Dibuat untuk di-hand-off ke Claude Code atau developer.

---

## 1. Overview Produk

LabaLab adalah SaaS yang membantu seller Shopee/Tokopedia/TikTok Shop:
- Menghitung margin bersih sebenarnya setelah semua potongan platform
- Menganalisis laporan penjualan untuk menemukan "profit hilang"
- Simulasi kelayakan ikut promo/flash sale
- Audit & optimasi listing produk pakai AI
- Menyimpan data produk sebagai memory yang terhubung ke semua fitur

**Model bisnis:** Subscription bulanan (freemium → Rp99rb/bulan Jualan Pro)

---

## 2. Tech Stack yang Direkomendasikan

| Layer | Pilihan | Alasan |
|---|---|---|
| Frontend | Next.js 14+ (App Router) | SSR untuk SEO, ekosistem React matang |
| Styling | Tailwind CSS | Cepat, konsisten dengan design system prototype |
| Backend | Next.js API Routes / Route Handlers | Satu codebase dengan frontend, simple untuk MVP |
| Database | Supabase (Postgres) | Auth + DB + Storage dalam satu paket, tier gratis cukup untuk awal |
| Auth | Supabase Auth | Email/password + Google OAuth, built-in |
| AI | Anthropic API (Claude Sonnet) | Sama seperti prototype, tapi dipanggil dari server |
| Payment | Midtrans (Snap) | Dominan di Indonesia, support QRIS/VA/e-wallet |
| Hosting | Vercel | Native support Next.js, gratis untuk tier awal |
| File parsing | SheetJS (xlsx) | Sama seperti prototype, jalan di server-side sekarang |

---

## 3. Database Schema (Postgres / Supabase)

```sql
-- ============================================
-- USERS (dikelola otomatis oleh Supabase Auth,
-- tabel ini untuk data tambahan)
-- ============================================
create table public.profiles (
  id uuid references auth.users(id) primary key,
  email text not null,
  full_name text,
  store_name text,
  plan text not null default 'free', -- 'free' | 'pro'
  plan_expires_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- PRODUCTS (setara "Produk Saya" di prototype)
-- ============================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  nama text not null,
  platform text not null, -- 'shopee' | 'tokopedia' | 'tiktok'
  kategori text not null,
  harga numeric not null default 0,
  modal numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_products_user on public.products(user_id);

-- ============================================
-- SALES_REPORTS (histori upload Sales Analyzer)
-- ============================================
create table public.sales_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  source_label text, -- nama file / 'demo'
  total_omzet numeric,
  total_profit numeric,
  total_margin numeric,
  total_lost_profit numeric,
  ai_summary jsonb, -- simpan hasil AI (ringkasan, temuan, rekomendasi)
  raw_products jsonb, -- array produk hasil parsing
  created_at timestamptz default now()
);
create index idx_reports_user on public.sales_reports(user_id);

-- ============================================
-- SUBSCRIPTIONS (histori pembayaran)
-- ============================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  midtrans_order_id text unique not null,
  plan text not null, -- 'pro'
  amount numeric not null,
  status text not null default 'pending', -- 'pending' | 'paid' | 'failed' | 'expired'
  paid_at timestamptz,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz default now()
);
create index idx_subs_user on public.subscriptions(user_id);

-- ============================================
-- ROW LEVEL SECURITY (wajib di Supabase!)
-- ============================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.sales_reports enable row level security;
alter table public.subscriptions enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can CRUD own products" on public.products
  for all using (auth.uid() = user_id);

create policy "Users can view own reports" on public.sales_reports
  for all using (auth.uid() = user_id);

create policy "Users can view own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);
```

---

## 4. Struktur API Routes (Next.js)

```
/app
  /api
    /ai
      /sales-analyzer/route.ts      POST - proxy ke Anthropic, hitung profit hilang
      /product-doctor/route.ts      POST - proxy ke Anthropic + vision untuk foto
    /products
      route.ts                     GET (list), POST (create)
      /[id]/route.ts                PATCH (update), DELETE
    /reports
      route.ts                     GET (list histori), POST (simpan hasil baru)
    /payment
      /create-transaction/route.ts  POST - buat transaksi Midtrans Snap
      /webhook/route.ts             POST - terima notifikasi status pembayaran
    /calculators
      /profit-checker/route.ts      POST - hitung margin (bisa full client-side juga, tidak wajib API)
      /promo-simulator/route.ts     POST - simulasi promo (bisa full client-side juga)
```

**Catatan penting:** Profit Checker dan Promo Simulator murni kalkulasi matematika (tidak panggil AI), jadi **boleh tetap dihitung di client-side** seperti prototype — tidak perlu API route khusus. Yang WAJIB lewat server hanya yang panggil Anthropic API (Sales Analyzer, Product Doctor) karena API key harus tersimpan aman di server.

### Contoh implementasi API route yang panggil AI (aman, key di server)

```typescript
// /app/api/ai/sales-analyzer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // TIDAK PERNAH dikirim ke client
});

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Cek plan user - Sales Analyzer mungkin dibatasi di free tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const { products, sourceLabel } = await req.json();

  // ... logic hitung profit hilang (sama seperti prototype) ...

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  // Simpan hasil ke sales_reports table
  await supabase.from('sales_reports').insert({
    user_id: user.id,
    source_label: sourceLabel,
    total_omzet: analysis.totalOmzet,
    // ...
  });

  return NextResponse.json({ analysis, aiText: message.content });
}
```

---

## 5. Alur Autentikasi

```
1. User buka labalab.id → belum login → redirect ke /login
2. Login/register via Supabase Auth (email+password atau Google)
3. Supabase otomatis buat row di auth.users
4. Trigger database otomatis buat row di public.profiles (plan='free')
5. Session token disimpan di cookie (Supabase SSR helper)
6. Setiap request ke API route, cek session dari cookie
```

**Trigger otomatis bikin profile saat user baru daftar:**
```sql
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 6. Alur Pembayaran (Midtrans Snap)

```
1. User klik "Upgrade ke Pro" di halaman /pricing
   ↓
2. Frontend POST ke /api/payment/create-transaction
   ↓
3. Backend generate order_id unik, panggil Midtrans Snap API,
   dapat snap_token, simpan row di subscriptions (status='pending')
   ↓
4. Frontend buka Midtrans Snap popup pakai snap_token
   ↓
5. User bayar (QRIS/VA/e-wallet)
   ↓
6. Midtrans kirim webhook ke /api/payment/webhook
   ↓
7. Backend verifikasi signature, update subscriptions.status='paid',
   update profiles.plan='pro', profiles.plan_expires_at = +30 hari
   ↓
8. Frontend polling atau redirect ke /dashboard, tampilkan status Pro aktif
```

### Contoh webhook handler

```typescript
// /app/api/payment/webhook/route.ts
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { order_id, status_code, gross_amount, signature_key } = body;

  // WAJIB verifikasi signature supaya tidak ada yang bisa fake webhook
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const expectedSignature = crypto
    .createHash('sha512')
    .update(order_id + status_code + gross_amount + serverKey)
    .digest('hex');

  if (signature_key !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  if (body.transaction_status === 'settlement' || body.transaction_status === 'capture') {
    // Update subscription jadi paid, aktifkan plan Pro
    // ...
  }

  return NextResponse.json({ received: true });
}
```

---

## 7. Environment Variables yang Dibutuhkan

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Midtrans
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false

# App
NEXT_PUBLIC_APP_URL=https://labalab.id
```

---

## 8. Rencana Migrasi dari Prototype

| Komponen Prototype | Tujuan Migrasi |
|---|---|
| `window.storage` untuk Produk Saya | → tabel `products` di Supabase |
| Fetch langsung ke Anthropic dari browser | → API route server-side |
| Perhitungan margin/promo (JS client) | Bisa tetap di client, tidak berubah |
| Parsing Excel (SheetJS) | Tetap dipakai, bisa client-side atau server-side |
| CSS/design system (dark purple theme) | Convert ke Tailwind config, port 1:1 |
| Fungsi `saComputeAnalysis`, `psQuickSave`, dll | Logic-nya reusable, tinggal pindah ke TypeScript + hubungkan ke Supabase client |

**Rekomendasi urutan build di Claude Code:**
1. Setup Next.js + Supabase project + skema database di atas
2. Bangun auth (login/register) dulu
3. Migrasi Profit Checker & Promo Simulator (paling simpel, tidak butuh AI)
4. Migrasi Produk Saya dengan Supabase (ganti window.storage)
5. Migrasi Sales Analyzer & Product Doctor (butuh API route + Anthropic key)
6. Integrasi Midtrans untuk payment
7. Deploy ke Vercel, hubungkan domain

---

## 9. Batasan Plan (Free vs Pro) — Logic yang Perlu Diimplementasi

```typescript
const PLAN_LIMITS = {
  free: {
    salesAnalyzerPerMonth: 1,   // coba gratis 1x
    productDoctorPerMonth: 1,
    savedProducts: 3,
  },
  pro: {
    salesAnalyzerPerMonth: Infinity,
    productDoctorPerMonth: Infinity,
    savedProducts: Infinity,
  }
};
```

Cek limit ini di setiap API route sebelum proses berjalan, kembalikan error 402 (Payment Required) kalau limit free tier terlampaui, redirect frontend ke halaman upgrade.

---

## 10. Checklist Sebelum Launch Publik

- [ ] Row Level Security aktif di semua tabel Supabase
- [ ] API key Anthropic & Midtrans tidak pernah ter-expose ke client (cek network tab browser)
- [ ] Webhook Midtrans sudah verifikasi signature
- [ ] Rate limiting di API routes (supaya tidak ada abuse ke Anthropic API yang bikin billing membengkak)
- [ ] Error handling yang jelas untuk user (bukan raw error teknis)
- [ ] Testing alur pembayaran end-to-end di Midtrans Sandbox dulu sebelum production
- [ ] Backup strategy untuk database
- [ ] Privacy policy & terms of service (wajib karena menyimpan data finansial toko)

---

*Dokumen ini siap di-hand-off ke Claude Code. Buka project baru, paste dokumen ini sebagai konteks awal, lalu minta Claude Code mulai dari Tahap 1 (setup Next.js + Supabase + schema).*
