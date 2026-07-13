import { createServerClient } from "@/lib/supabase/server";

export type PlatformBreakdown = {
  platform: string;
  omzet: number;
  profit: number;
  unit: number;
  pct: number; // share of omzet
};

export type SalesSummary = {
  hasTransactions: boolean;
  totalOmzet: number;
  totalProfit: number;
  totalUnit: number;
  margin: number;
  byPlatform: PlatformBreakdown[];
};

/**
 * Agregasi penjualan dari sales_transactions (SEMUA channel: upload marketplace
 * + manual Instagram/PO). Transaksi batal & refund dikeluarkan dari angka omzet
 * /profit karena bukan pendapatan riil. Di-paginate agar tetap akurat kalau
 * transaksi > 1000 (batas default PostgREST).
 */
export async function getSalesSummary(): Promise<SalesSummary> {
  const supabase = await createServerClient();
  const PAGE = 1000;
  type Row = { platform: string; omzet: number; profit: number; qty: number; status: string | null };
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data } = await supabase
      .from("sales_transactions")
      .select("platform, omzet, profit, qty, status")
      .range(from, from + PAGE - 1);
    const batch = (data ?? []) as Row[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }

  const realized = rows.filter((r) => r.status !== "batal" && r.status !== "refund");
  const totalOmzet = realized.reduce((s, r) => s + Number(r.omzet), 0);
  const totalProfit = realized.reduce((s, r) => s + Number(r.profit), 0);
  const totalUnit = realized.reduce((s, r) => s + Number(r.qty), 0);
  const margin = totalOmzet > 0 ? (totalProfit / totalOmzet) * 100 : 0;

  const map = new Map<string, { omzet: number; profit: number; unit: number }>();
  for (const r of realized) {
    const cur = map.get(r.platform) ?? { omzet: 0, profit: 0, unit: 0 };
    cur.omzet += Number(r.omzet);
    cur.profit += Number(r.profit);
    cur.unit += Number(r.qty);
    map.set(r.platform, cur);
  }
  const byPlatform: PlatformBreakdown[] = [...map.entries()]
    .map(([platform, v]) => ({
      platform,
      omzet: v.omzet,
      profit: v.profit,
      unit: v.unit,
      pct: totalOmzet > 0 ? (v.omzet / totalOmzet) * 100 : 0,
    }))
    .sort((a, b) => b.omzet - a.omzet);

  return {
    hasTransactions: realized.length > 0,
    totalOmzet,
    totalProfit,
    totalUnit,
    margin,
    byPlatform,
  };
}

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

export type RestockItem = {
  id: string;
  nama: string;
  stok: number;
  stok_minimum: number;
  harga_supplier: number | null;
};

/**
 * Produk yang stoknya <= stok_minimum (perlu restock). Hanya yang stoknya
 * di-track (bukan null). Diurutkan dari stok paling sedikit (paling kritis).
 */
export async function getRestockAlerts(): Promise<RestockItem[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("products")
    .select("id, nama, stok, stok_minimum, harga_supplier")
    .not("stok", "is", null);
  return (data ?? [])
    .map((p) => ({
      id: p.id as string,
      nama: p.nama as string,
      stok: Number(p.stok),
      stok_minimum: p.stok_minimum == null ? 10 : Number(p.stok_minimum),
      harga_supplier: p.harga_supplier == null ? null : Number(p.harga_supplier),
    }))
    .filter((p) => p.stok <= p.stok_minimum)
    .sort((a, b) => a.stok - b.stok);
}

export type CashFlow = {
  modalKeluar: number;
  profitMasuk: number;
  net: number;
  monthLabel: string;
  hasData: boolean;
};

/**
 * Posisi kas bulan berjalan: modal keluar (beli stok) vs profit masuk
 * (penjualan 'selesai'). Net bisa minus (wajar saat investasi stok).
 */
export async function getMonthlyCashFlow(): Promise<CashFlow> {
  const supabase = await createServerClient();
  const now = new Date();
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthLabel = now.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const [purchases, sales] = await Promise.all([
    supabase.from("stock_purchases").select("total_bayar").gte("tanggal", from).limit(3000),
    supabase
      .from("sales_transactions")
      .select("profit")
      .eq("status", "selesai")
      .gte("tanggal", from)
      .limit(5000),
  ]);
  const pr = purchases.data ?? [];
  const sl = sales.data ?? [];
  const modalKeluar = pr.reduce((s, r) => s + Number(r.total_bayar), 0);
  const profitMasuk = sl.reduce((s, r) => s + Number(r.profit), 0);

  return {
    modalKeluar,
    profitMasuk,
    net: profitMasuk - modalKeluar,
    monthLabel,
    hasData: pr.length > 0 || sl.length > 0,
  };
}
