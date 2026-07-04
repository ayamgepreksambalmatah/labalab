import { createServerClient } from "@/lib/supabase/server";

export type HistoryEntry = {
  periode_label: string | null;
  unit_terjual: number;
  omzet: number;
  biaya: number;
  modal: number;
  profit: number;
  margin: number;
  refund_count: number | null;
  created_at: string;
};

/**
 * Ambil history penjualan sebuah produk (urut lama → baru). RLS membatasi
 * ke produk milik user sendiri (policy EXISTS di 0005).
 */
export async function getProductHistory(
  productId: string,
): Promise<HistoryEntry[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("product_sales_history")
    .select(
      "periode_label, unit_terjual, omzet, biaya, modal, profit, margin, refund_count, created_at",
    )
    .eq("product_id", productId)
    .order("created_at", { ascending: true });
  return (data ?? []) as HistoryEntry[];
}

/** Insight otomatis (spec §4.2): snapshot kalau <2 data, tren kalau ≥2. */
export function historyInsight(
  nama: string,
  entries: HistoryEntry[],
): { text: string; tone: "info" | "up" | "down" | "flat" } {
  if (entries.length === 0) {
    return {
      text: `Belum ada history untuk ${nama}. Upload laporan penjualan di Sales Analyzer dan pastikan nama produknya cocok agar riwayatnya tercatat.`,
      tone: "info",
    };
  }
  const latest = entries[entries.length - 1];
  if (entries.length < 2) {
    return {
      text: `${nama}: margin saat ini ${latest.margin.toFixed(1)}%. Upload laporan periode berikutnya untuk lihat tren.`,
      tone: "info",
    };
  }
  const trend = latest.margin - entries[0].margin;
  const n = entries.length;
  if (trend < -5)
    return {
      text: `⚠️ ${nama}: margin turun ${Math.abs(trend).toFixed(1)}% dalam ${n} periode terakhir. Cek biaya/refund produk ini.`,
      tone: "down",
    };
  if (trend > 5)
    return {
      text: `📈 ${nama}: margin naik ${trend.toFixed(1)}% dalam ${n} periode terakhir. Pertahankan!`,
      tone: "up",
    };
  return {
    text: `${nama}: margin relatif stabil (${latest.margin.toFixed(1)}%) selama ${n} periode.`,
    tone: "flat",
  };
}
