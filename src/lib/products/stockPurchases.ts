import { createServerClient } from "@/lib/supabase/server";

export type StockPurchase = {
  id: string;
  product_id: string | null;
  nama_produk: string;
  tanggal: string;
  qty_dibeli: number;
  total_bayar: number;
  harga_per_unit: number;
  added_to_stock: boolean;
  updated_supplier_price: boolean;
  catatan: string | null;
};

const COLUMNS =
  "id, product_id, nama_produk, tanggal, qty_dibeli, total_bayar, harga_per_unit, added_to_stock, updated_supplier_price, catatan";

/** Riwayat pembelian stok satu produk (untuk tab History). */
export async function getStockPurchasesForProduct(
  productId: string,
): Promise<StockPurchase[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("stock_purchases")
    .select(COLUMNS)
    .eq("product_id", productId)
    .order("tanggal", { ascending: false })
    .limit(500);
  return (data ?? []) as StockPurchase[];
}

/**
 * Total modal (total_bayar) yang dikeluarkan pada bulan kalender berjalan.
 * Dipakai kartu "Modal Dikeluarkan Bulan Ini" di Dashboard.
 */
export async function getMonthlyStockSpend(): Promise<{
  total: number;
  count: number;
  monthLabel: string;
}> {
  const supabase = await createServerClient();
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // ISO tanggal lokal (YYYY-MM-01) tanpa geser timezone.
  const from = `${firstOfMonth.getFullYear()}-${String(
    firstOfMonth.getMonth() + 1,
  ).padStart(2, "0")}-01`;
  const monthLabel = now.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const { data } = await supabase
    .from("stock_purchases")
    .select("total_bayar")
    .gte("tanggal", from)
    .limit(2000);
  const rows = data ?? [];
  const total = rows.reduce((s, r) => s + Number(r.total_bayar), 0);
  return { total, count: rows.length, monthLabel };
}
