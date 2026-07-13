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

