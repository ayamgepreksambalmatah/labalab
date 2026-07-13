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

## Spec lanjutan (labalab-spec-lanjutan.md) — prioritas 1-5 selesai
1. ✅ Field lengkap Produk Saya (stok, ukuran, faq, garansi, bahan, deskripsi) —
   `0004_product_knowledge.sql`; form 2 tab (Info Dasar / Detail Lengkap)
2. ✅ Tabel detail Sales Analyzer — `SalesDetailTable.tsx` (sortable + search +
   simpan per baris, semua kolom a.enriched)
3. ✅ Product Doctor + paste review — field review + `analisisReview` di prompt/schema
4. ✅ History per produk — `0005_product_history.sql` (+ placeholder product_chat_stats).
   Auto-link EXACT match nama saat Sales Analyzer (fuzzy sengaja tidak auto-link).
   View: `/dashboard/products/[id]/history` (chart tren + tabel + insight)
5. ✅ Dashboard kompilasi — `src/lib/products/dashboard.ts`, section di `/dashboard`
   (total profit all-time, margin rata2, produk terbaik/bermasalah)
- ⬜ Ditunda: extension Connector (§6, butuh inspeksi DOM Shopee — codebase terpisah),
  insight chat-vs-checkout (§4.3, sumber data belum pasti; tabel placeholder sudah ada)
- Migration baru WAJIB dijalankan: `0004_product_knowledge.sql`, `0005_product_history.sql`

## Sesi tunggal (1 akun = 1 sesi aktif) — selesai
- Migration WAJIB: `0007_active_sessions.sql` (tabel + RLS + daftar publication Realtime),
  `0008_session_geo.sql` (kolom `ip_address`, `location`).
- Token acak di-UPSERT ke `active_sessions` tiap login (`establishSingleSession` di
  `src/lib/auth/session.ts`), dipanggil dari `auth/actions.ts` (email/pw) & `auth/callback`
  (Google/konfirmasi email). Token disimpan di cookie httpOnly `ll_session_token`.
  Saat login, IP (x-forwarded-for) + lokasi kasar (Vercel geo headers) ikut disimpan.
- Otoritas: `src/lib/supabase/middleware.ts` bandingkan cookie vs DB tiap request
  terproteksi → mismatch = clear cookie + redirect `/login?message=session-terminated`
  (API balas 401). `last_active` di-update di sini, throttle maks 1×/60 dtk.
  Kick instan (UX): `SessionGuard.tsx` via Realtime → `/api/session/verify`.
- Halaman `/dashboard/settings`: kartu perangkat aktif (device/lokasi/IP/last_active) +
  tombol "Keluarkan semua perangkat lain" (`signOutOtherDevices` → rotasi token).
- Email notifikasi login perangkat baru: `src/lib/email/send.ts` (Resend via fetch).
  Butuh env `RESEND_API_KEY` + `EMAIL_FROM` (domain terverifikasi); degrade aman kalau kosong.

## Menu Pengaturan lengkap (spec settings) — selesai
- Migration WAJIB: `0009_settings.sql` (subscriptions.auto_renew; profiles.nomor_wa,
  tone_preference, notif_kuota_habis, notif_laporan_mingguan).
- Halaman `/dashboard/settings` (urutan spec): Langganan & Billing (kuota bar +
  riwayat + upgrade/cancel), Profil & Info Toko, Keamanan (ganti password + perangkat
  aktif), Notifikasi, Koneksi Akun (set password utk user Google), Data Saya (ekspor +
  hapus akun), Bantuan.
- Data billing: `src/lib/settings/billing.ts`. Server actions: `src/lib/settings/actions.ts`
  (updateProfile/changePassword/setPassword/updateNotifications/cancelSubscription/deleteAccount).
  Ekspor JSON: `GET /api/settings/export-data`. Hapus akun: `admin.deleteUser` → cascade.
- Deteksi metode login via `getUser().identities` (email vs google) → tampilkan
  ganti/set password sesuai. Komponen di `src/components/settings/*`.
- Halaman publik placeholder `/privacy` & `/terms` (ditambah ke publicPaths proxy).

## Product Knowledge universal (spec product-knowledge-universal) — selesai
- Migration WAJIB: `0010_generalize_product_knowledge.sql` (field universal
  `masa_berlaku`, `sertifikasi`, `kondisi_pengiriman`, `catatan_tambahan`, dan
  `atribut_khusus` JSONB; + migrasi data lama fashion → atribut_khusus). Kolom lama
  (`ukuran_tersedia`, `bahan`, `cara_perawatan`) TETAP ADA (backward compat), UI baru
  tidak mengeditnya lagi.
- Saran atribut per kategori: `src/lib/products/category-attribute-suggestions.ts`
  (placeholder di form, bukan validasi). Formatter knowledge untuk AI:
  `src/lib/products/knowledge.ts` (`productKnowledgeLines`, `formatAtribut`).
- Form "Detail Lengkap" (`ProductsManager.tsx`): field universal + editor atribut
  dinamis (seed saran saat ganti kategori kalau belum diisi). Prompt CS Reply
  (`/api/extension/reply-suggestion`) & prefill Listing Generator baca atribut_khusus
  dinamis + fallback field legacy. Product Doctor pakai input ad-hoc → tak terpengaruh.

## Reposisi copy (spec repositioning) — selesai
- Positioning: dari "AI bikinin listing" → "audit listing + kontrol penuh di seller".
- Product Doctor: judul/subtitle baru + section "🔒 Kenapa LabaLab Berbeda" di bawah
  hasil audit (`ProductDoctor.tsx`). Landing (`app/page.tsx`) diframe ulang ke kombinasi
  fitur (profit + audit + CS), bukan generate listing.
- Listing Generator multi-platform: checkbox Shopee/Tokopedia/TikTok → prompt & schema
  hasilkan versi TERPISAH per platform. `ListingAiResult` sekarang `{ versions: [...] }`
  (bukan lagi single {judul,deskripsi,...}) — gaya per platform di `LISTING_PLATFORM_STYLE`
  (prompts.ts). Route validasi `platforms[]`, UI tampilkan hasil per tab platform.

## Unified dashboard (spec labalab-unified-dashboard-spec) — selesai
- Migration WAJIB: `0012_sales_transactions.sql` (tabel transaksi per-baris multi-channel + RLS).
- Bagian 1 ✅ Auto-hitung margin di "Cek Untung Asli" — sudah reaktif via `useMemo`
  (`ProfitChecker.tsx`), tanpa tombol. Diverifikasi, tak perlu ubah.
- Bagian 2 ✅ Sales Analyzer upload juga simpan tiap baris ke `sales_transactions`
  (bukan cuma agregat). Parser `salesFile.ts` kembalikan `transactions[]` (deteksi kolom
  tanggal + `mapStatus`), route `sales-analyzer` insert per-chunk (sumber='upload',
  product_id via exact-match nama). Selektor platform di `SalesAnalyzer.tsx`.
- Bagian 3 ✅ Halaman `/dashboard/laporan` (Laporan Detail): tabel semua transaksi
  (upload + manual) — filter tanggal/platform/status/cari (via URL searchParams → query
  ulang server, totals akurat atas set terfilter), header sortable + pagination 50/hal
  (client), Export Excel (SheetJS). Query: `src/lib/products/transactions.ts`. Tombol
  "+ Catat Penjualan Manual" → `ManualEntryForm.tsx` (auto-fill dari Produk Saya, tetap
  editable; Instagram/Lainnya nol-kan biaya platform). Actions: `transactionActions.ts`
  (`addManualTransaction` sumber='manual', `deleteTransaction` khusus baris manual).
  Menu sidebar "📋 Laporan Detail".
- Bagian 4 ✅ Dashboard `/dashboard` agregasi dari `sales_transactions` (SEMUA channel,
  `getSalesSummary` di `dashboard.ts`, di-paginate 1000/batch, batal & refund dikeluarkan
  dari omzet/profit) — kartu Omzet/Profit/Margin/Unit + kartu "Breakdown per Platform"
  (bar % share omzet per platform). Section per-produk lama (history) tetap ada sebagai
  "Performa per Produk". Empty-state kalau belum ada transaksi.

## Commands
- `npm run dev` — dev server
- `npm run build` — production build (jalankan sebelum anggap selesai)
- `npx tsc --noEmit` — typecheck
