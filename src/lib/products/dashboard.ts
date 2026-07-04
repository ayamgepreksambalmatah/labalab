import { createServerClient } from "@/lib/supabase/server";

export type ProductSnapshot = { id: string; nama: string; profit: number; margin: number };

export type Compilation = {
  totalProduk: number;
  totalProfitAllTime: number;
  marginRataRata: number;
  hasHistory: boolean;
  produkBermasalah: ProductSnapshot[];
  produkTerbaik: ProductSnapshot[];
};

/**
 * Agregasi kompilasi dashboard (spec §4.1): dari semua product_sales_history
 * milik user (RLS membatasi otomatis). Insight tren butuh ≥2 data point per
 * produk — di sini kita pakai kondisi terbaru (latest) per produk.
 */
export async function getCompilation(): Promise<Compilation> {
  const supabase = await createServerClient();

  const [{ count: totalProduk }, { data: hist }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase
      .from("product_sales_history")
      .select("product_id, profit, margin, created_at")
      .order("created_at", { ascending: true }),
  ]);

  const rows = hist ?? [];
  const totalProfitAllTime = rows.reduce((s, r) => s + Number(r.profit), 0);
  const marginRataRata = rows.length
    ? rows.reduce((s, r) => s + Number(r.margin), 0) / rows.length
    : 0;

  // Ambil kondisi terbaru per produk (rows sudah urut ascending → last menang).
  const latest = new Map<string, { profit: number; margin: number }>();
  for (const r of rows) {
    latest.set(r.product_id, { profit: Number(r.profit), margin: Number(r.margin) });
  }

  // Nama produk untuk yang punya history.
  const ids = [...latest.keys()];
  const nameById = new Map<string, string>();
  if (ids.length) {
    const { data: prods } = await supabase
      .from("products")
      .select("id, nama")
      .in("id", ids);
    for (const p of prods ?? []) nameById.set(p.id, p.nama);
  }

  const snapshots: ProductSnapshot[] = ids.map((id) => ({
    id,
    nama: nameById.get(id) ?? "(produk terhapus)",
    profit: latest.get(id)!.profit,
    margin: latest.get(id)!.margin,
  }));

  const produkBermasalah = snapshots
    .filter((s) => s.margin < 10)
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 5);
  const produkTerbaik = [...snapshots]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 3);

  return {
    totalProduk: totalProduk ?? 0,
    totalProfitAllTime,
    marginRataRata,
    hasHistory: rows.length > 0,
    produkBermasalah,
    produkTerbaik,
  };
}
