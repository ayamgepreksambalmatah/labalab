/**
 * Satu sumber kebenaran untuk URL & identitas situs.
 * Dipakai metadata, Open Graph, canonical, sitemap, dan robots.
 *
 * SITE_URL diambil dari NEXT_PUBLIC_APP_URL (di-set per environment):
 *   - dev     : http://localhost:3000
 *   - produksi: https://labalab.id  ← WAJIB di-set di Vercel saat deploy
 * Fallback ke domain produksi supaya OG/canonical tetap benar walau
 * env belum ter-set di server.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://labalab.id"
).replace(/\/+$/, "");

export const SITE_NAME = "LabaLab";
export const SITE_TAGLINE = "LabaLab — Racik Profit Toko Kamu";
export const SITE_DESCRIPTION =
  "Hitung margin bersih, temukan profit hilang, simulasi promo, dan optimasi listing produk Shopee/Tokopedia/TikTok Shop dengan bantuan AI.";
