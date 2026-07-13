import { createServerClient } from "@/lib/supabase/server";

export type Transaction = {
  id: string;
  tanggal: string;
  nama_produk: string;
  platform: string;
  qty: number;
  harga_satuan: number;
  omzet: number;
  biaya_platform: number;
  modal: number;
  profit: number;
  status: string | null;
  sumber: string;
  catatan: string | null;
};

export type TxFilters = {
  from?: string;
  to?: string;
  platform?: string;
  status?: string;
  search?: string;
};

export type TxTotals = { qty: number; omzet: number; biaya: number; profit: number };

const COLUMNS =
  "id, tanggal, nama_produk, platform, qty, harga_satuan, omzet, biaya_platform, modal, profit, status, sumber, catatan";

const MAX_ROWS = 2000;

/**
 * Ambil transaksi milik user (RLS) dengan filter opsional. Sort + pagination
 * dilakukan di client. Totals dihitung dari baris yang cocok filter.
 */
export async function getTransactions(
  filters: TxFilters,
): Promise<{ rows: Transaction[]; totals: TxTotals; truncated: boolean }> {
  const supabase = await createServerClient();
  let q = supabase
    .from("sales_transactions")
    .select(COLUMNS)
    .order("tanggal", { ascending: false })
    .limit(MAX_ROWS);

  if (filters.from) q = q.gte("tanggal", filters.from);
  if (filters.to) q = q.lte("tanggal", filters.to);
  if (filters.platform) q = q.eq("platform", filters.platform);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.search) q = q.ilike("nama_produk", `%${filters.search}%`);

  const { data } = await q;
  const rows = (data ?? []) as Transaction[];

  const totals = rows.reduce<TxTotals>(
    (acc, t) => ({
      qty: acc.qty + Number(t.qty),
      omzet: acc.omzet + Number(t.omzet),
      biaya: acc.biaya + Number(t.biaya_platform),
      profit: acc.profit + Number(t.profit),
    }),
    { qty: 0, omzet: 0, biaya: 0, profit: 0 },
  );

  return { rows, totals, truncated: rows.length >= MAX_ROWS };
}
