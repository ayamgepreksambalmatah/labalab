import * as XLSX from "xlsx";
import type { SalesProduct } from "@/lib/calc/sales";

export type ParsedTransaction = {
  tanggal: string; // ISO YYYY-MM-DD
  nama_produk: string;
  qty: number;
  harga_satuan: number;
  omzet: number;
  biaya_platform: number;
  modal: number;
  profit: number;
  status: string; // selesai | batal | refund | pending
};

export type ParsedSales = {
  products: SalesProduct[];
  transactions: ParsedTransaction[];
  estimatedModal: boolean;
  hasDate: boolean;
};

const MAX_TRANSACTIONS = 3000;

function isoDate(v: unknown, fallback: string): string {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === "number" && v > 0) {
    // Excel serial date → ms (25569 = hari antara 1899-12-30 dan epoch).
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v.trim());
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return fallback;
}

function mapStatus(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("batal") || s.includes("cancel")) return "batal";
  if (s.includes("refund") || s.includes("return") || s.includes("kembali"))
    return "refund";
  if (s.includes("pending") || s.includes("proses") || s.includes("belum"))
    return "pending";
  return "selesai";
}

/**
 * Parse laporan penjualan Excel/CSV. Kembalikan:
 * - products: agregat per nama (untuk analisis AI, seperti sebelumnya)
 * - transactions: baris transaksi individual (untuk Laporan Detail + export)
 * Jalan di client (browser).
 */
export async function parseSalesFile(file: File): Promise<ParsedSales> {
  const data = await file.arrayBuffer();
  // cellDates: true → sel tanggal jadi objek Date (bukan serial number).
  const workbook = XLSX.read(data, { cellDates: true });
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
  const colDate = findCol([
    "tanggal",
    "date",
    "waktu",
    "created",
    "order time",
    "waktu pesanan",
    "tgl",
  ]);

  if (!colName || !colOmzet) {
    throw new Error(
      "Kolom nama produk atau harga tidak ditemukan. Pastikan file adalah laporan penjualan asli dari Seller Center.",
    );
  }

  const num = (v: unknown) =>
    parseFloat(String(v).replace(/[^0-9.-]/g, "")) || 0;
  const today = new Date().toISOString().slice(0, 10);

  const grouped: Record<string, SalesProduct> = {};
  const transactions: ParsedTransaction[] = [];

  for (const row of rows) {
    const name = String(row[colName] || "Produk Tanpa Nama").trim();
    if (!name) continue;
    const omzet = num(row[colOmzet]);
    if (omzet <= 0) continue;
    const qty = colQty ? num(row[colQty]) || 1 : 1;
    const fee = colFee ? num(row[colFee]) : omzet * 0.08;
    const modal = omzet * 0.4; // estimasi modal 40% omzet
    const rawStatus = colStatus ? String(row[colStatus]) : "";
    const status = mapStatus(rawStatus);

    // Agregat (untuk analisis AI).
    if (!grouped[name]) {
      grouped[name] = { name, omzet: 0, unit: 0, modal: 0, biaya: 0, refund: 0 };
    }
    grouped[name].omzet += omzet;
    grouped[name].unit += qty;
    grouped[name].biaya += fee;
    grouped[name].modal += modal;
    if (status === "refund" || status === "batal") grouped[name].refund += 1;

    // Transaksi per-baris (untuk Laporan Detail).
    if (transactions.length < MAX_TRANSACTIONS) {
      transactions.push({
        tanggal: colDate ? isoDate(row[colDate], today) : today,
        nama_produk: name,
        qty,
        harga_satuan: qty > 0 ? Math.round(omzet / qty) : omzet,
        omzet,
        biaya_platform: fee,
        modal,
        profit: omzet - fee - modal,
        status,
      });
    }
  }

  const products = Object.values(grouped).filter((p) => p.omzet > 0);
  if (!products.length) {
    throw new Error("Tidak ada data produk valid yang bisa dibaca dari file ini.");
  }

  return {
    products,
    transactions,
    estimatedModal: !colFee,
    hasDate: !!colDate,
  };
}
