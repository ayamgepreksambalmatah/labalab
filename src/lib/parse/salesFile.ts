import * as XLSX from "xlsx";
import type { SalesProduct } from "@/lib/calc/sales";

export type ParsedSales = {
  products: SalesProduct[];
  estimatedModal: boolean;
};

/**
 * Parse laporan penjualan Excel/CSV → array produk teragregasi per nama.
 * Port dari saHandleFile: deteksi kolom fleksibel + grouping + estimasi
 * modal/biaya kalau kolomnya tidak ada. Jalan di client (browser).
 */
export async function parseSalesFile(file: File): Promise<ParsedSales> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  if (!rows.length) throw new Error("File kosong atau format tidak terbaca.");

  const headers = Object.keys(rows[0]).map((h) => h.toString());
  const findCol = (kw: string[]) =>
    headers.find((h) => kw.some((k) => h.toLowerCase().includes(k)));

  const colName = findCol(["nama produk", "product name", "nama barang", "produk"]);
  const colOmzet = findCol([
    "harga",
    "total penjualan",
    "subtotal",
    "amount",
    "penghasilan",
  ]);
  const colQty = findCol(["jumlah", "qty", "quantity", "kuantiti"]);
  const colFee = findCol(["biaya", "fee", "komisi", "admin"]);
  const colStatus = findCol(["status"]);

  if (!colName || !colOmzet) {
    throw new Error(
      "Kolom nama produk atau harga tidak ditemukan. Pastikan file adalah laporan penjualan asli dari Seller Center.",
    );
  }

  const num = (v: unknown) =>
    parseFloat(String(v).replace(/[^0-9.-]/g, "")) || 0;

  const grouped: Record<string, SalesProduct> = {};
  for (const row of rows) {
    const name = String(row[colName] || "Produk Tanpa Nama").trim();
    if (!name) continue;
    const omzet = num(row[colOmzet]);
    const qty = colQty ? num(row[colQty]) || 1 : 1;
    const fee = colFee ? num(row[colFee]) : omzet * 0.08;
    const status = colStatus ? String(row[colStatus]).toLowerCase() : "";
    const isRefund =
      status.includes("batal") ||
      status.includes("refund") ||
      status.includes("return");

    if (!grouped[name]) {
      grouped[name] = { name, omzet: 0, unit: 0, modal: 0, biaya: 0, refund: 0 };
    }
    grouped[name].omzet += omzet;
    grouped[name].unit += qty;
    grouped[name].biaya += fee;
    grouped[name].modal += omzet * 0.4; // estimasi modal 40% omzet
    if (isRefund) grouped[name].refund += 1;
  }

  const products = Object.values(grouped).filter((p) => p.omzet > 0);
  if (!products.length) {
    throw new Error("Tidak ada data produk valid yang bisa dibaca dari file ini.");
  }

  return { products, estimatedModal: !colFee };
}
