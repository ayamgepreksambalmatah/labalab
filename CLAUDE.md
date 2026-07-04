# LabaLab — AI Profit Assistant untuk Seller

Tagline: **"LabaLab — Racik Profit Toko Kamu"**.

SaaS bantu seller Shopee/Tokopedia/TikTok Shop: hitung margin bersih, temukan
profit hilang (Sales Analyzer), simulasi promo, audit listing (Product Doctor).
Model bisnis: freemium → Pro Rp99rb/bulan.

Blueprint lengkap: `reference/labalab-technical-spec.md`.
Prototype HTML (sumber design & logika): `reference/labalab-app.html`.

## Tech stack
- Next.js 16 (App Router) + React 19 + TypeScript, Turbopack
- Tailwind CSS v4 (config via `@theme` di `src/app/globals.css`, bukan tailwind.config.js)
- Supabase (Postgres + Auth) via `@supabase/ssr`
- Anthropic SDK (server-side saja), Midtrans (payment), SheetJS/xlsx (parsing Excel)

## Konvensi penting
- Auth cookie refresh & route-gating: `src/proxy.ts` (Next 16 memakai nama
  "proxy", bukan "middleware") → memanggil `updateSession` di
  `src/lib/supabase/middleware.ts`.
- Supabase client: `createClient()` (browser) di `src/lib/supabase/client.ts`;
  `createServerClient()` (server, awaited) & `createServiceRoleClient()` di
  `src/lib/supabase/server.ts`. Service role hanya untuk kode server tepercaya
  (webhook) — bypass RLS.
- Tipe DB: `src/types/database.ts`. Plan limits: `src/lib/plans.ts`.
- Design tokens jadi utility Tailwind: `bg-surface`, `text-accent`,
  `border-border`, `rounded-card`, `font-display`, dst.
- Kunci API (Anthropic/Midtrans server key) TIDAK PERNAH ke client.

## Database
Schema + RLS + trigger: `supabase/migrations/0001_initial_schema.sql`.
Jalankan di Supabase SQL editor atau `supabase db push`.

## Progres build (urutan spec §8)
1. ✅ Setup Next.js + Supabase + schema
2. ✅ Auth (login/register)  ← Tahap 2 selesai
   - Server actions: `src/lib/auth/actions.ts` (login/signup/signInWithGoogle/signOut)
   - Halaman: `/login`, `/register`, `/dashboard` (terproteksi), `/auth/callback`
   - Grants role Supabase: `supabase/migrations/0002_grants.sql` (WAJIB dijalankan)
3. ✅ Profit Checker & Promo Simulator (client-side, tanpa AI)  ← Tahap 3 selesai
   - Logika murni: `src/lib/calc/profit.ts`, `src/lib/calc/promo.ts`, `src/lib/format.ts`
   - UI: `src/components/tools/*`, kontrol bersama `controls.tsx`
   - Shell dashboard: `src/app/dashboard/layout.tsx` + `src/components/dashboard/Sidebar.tsx`
   - Rute: `/dashboard/profit`, `/dashboard/promo`; SEO: OG image, robots, sitemap
4. ✅ Produk Saya (Supabase CRUD)  ← Tahap 4 selesai
   - Query: `src/lib/products/queries.ts`; actions: `src/lib/products/actions.ts`
     (saveProduct/updateProduct/deleteProduct + enforce limit plan free=3)
   - UI: `src/components/products/ProductsManager.tsx`, rute `/dashboard/products`
   - Selektor "Pilih dari Produk Saya" (`ProductPicker`) + prefill `?product=<id>`
     di Profit & Promo; tombol "Simpan ke Produk Saya" di Profit Checker aktif
5. ✅ Sales Analyzer & Product Doctor (API route + Anthropic)  ← Tahap 5 selesai
   - AI infra: `src/lib/ai/*` (client server-only, config model, limits bulanan,
     prompts+JSON schema). Model: `claude-opus-4-8` + structured outputs.
   - Routes: `/api/ai/sales-analyzer`, `/api/ai/product-doctor` (auth + limit 402)
   - Logika: `src/lib/calc/sales.ts`, parser `src/lib/parse/salesFile.ts` (client)
   - UI: `SalesAnalyzer.tsx`, `ProductDoctor.tsx` (vision foto), rute analyzer/doctor
   - Tabel baru: `supabase/migrations/0003_product_audits.sql` (WAJIB dijalankan)
6. ✅ Midtrans payment  ← Tahap 6 selesai
   - Client Midtrans server-only: `src/lib/midtrans.ts` (Snap + verifikasi signature sha512)
   - Routes: `/api/payment/create-transaction` (Snap token), `/api/payment/webhook`
     (verifikasi signature → set plan='pro' + plan_expires_at +30hr via service role)
   - Halaman `/pricing` + `UpgradeButton` (Snap popup), banner hasil di dashboard
   - `resolvePlan(plan, expires)` di `plans.ts` — Pro kedaluwarsa auto jadi free;
     dipakai di semua enforcement (AI routes, product actions) + display
   - Proxy: `/api/*` self-auth (tidak di-redirect) — WAJIB agar webhook Midtrans jalan
7. ✅ Deploy Vercel + domain labalab.id (live, SSL OK)  ← Tahap 7 selesai
   - Catatan: www.labalab.id jadi primary (apex redirect ke www), tapi
     canonical/OG pakai apex labalab.id — set apex sebagai primary di Vercel
     supaya konsisten. Supabase redirect URLs & Midtrans notif URL produksi
     perlu diarahkan ke domain produksi.

## Commands
- `npm run dev` — dev server
- `npm run build` — production build (jalankan sebelum anggap selesai)
- `npx tsc --noEmit` — typecheck
