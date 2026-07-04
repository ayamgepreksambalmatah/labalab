# LabaLab

**Racik Profit Toko Kamu** — AI Profit Assistant untuk seller e-commerce
Indonesia (Shopee / Tokopedia / TikTok Shop). Dibangun dengan Next.js 16,
Supabase, dan Anthropic API.

## Setup lokal

1. **Install dependency**
   ```bash
   npm install
   ```

2. **Environment variables** — salin `.env.example` → `.env.local`, lalu isi:
   - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY` (dari Supabase Dashboard → Project Settings → API)
   - `ANTHROPIC_API_KEY`
   - Midtrans: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`,
     `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`

3. **Database** — di project Supabase, buka SQL Editor dan jalankan isi
   `supabase/migrations/0001_initial_schema.sql` (schema + Row Level Security +
   trigger auto-create profile).

4. **Jalankan**
   ```bash
   npm run dev
   ```
   Buka http://localhost:3000

## Struktur

```
src/
  app/                  # App Router (halaman + API routes nanti)
  lib/
    supabase/           # client.ts (browser), server.ts, middleware.ts
    plans.ts            # limit free vs pro
  types/database.ts     # tipe tabel Supabase
  proxy.ts              # auth refresh + route gating (konvensi Next 16)
supabase/migrations/    # SQL schema
reference/              # prototype HTML + spec teknis (hand-off asli)
```

Detail arsitektur & progres per tahap ada di `CLAUDE.md`.
