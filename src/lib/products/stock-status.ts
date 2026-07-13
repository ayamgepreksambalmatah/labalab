/**
 * Status stok supplier — pencatatan manual seller (bukan otomatisasi).
 * Dipakai bersama oleh form Produk Saya (dropdown) & kartu produk (dot/badge).
 */
export type StockStatus = "tersedia" | "terbatas" | "habis" | "perlu_dicek";

export const STOCK_STATUS_DEFAULT: StockStatus = "tersedia";

/** Opsi untuk dropdown form (label pakai titik warna biar jelas). */
export const STOCK_STATUS_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: "tersedia", label: "🟢 Tersedia" },
  { value: "terbatas", label: "🟡 Terbatas" },
  { value: "habis", label: "🔴 Habis" },
  { value: "perlu_dicek", label: "⚪ Perlu Dicek" },
];

/** Meta tampilan untuk kartu produk. */
export const STOCK_STATUS_META: Record<
  StockStatus,
  { label: string; dot: string; text: string }
> = {
  tersedia: { label: "Tersedia", dot: "bg-green", text: "text-green" },
  terbatas: { label: "Terbatas", dot: "bg-yellow", text: "text-yellow" },
  habis: { label: "Habis", dot: "bg-red", text: "text-red" },
  perlu_dicek: { label: "Perlu Dicek", dot: "bg-muted", text: "text-muted" },
};

/** Amankan nilai dari DB (string bebas) ke salah satu status valid. */
export function normalizeStockStatus(v: string | null | undefined): StockStatus {
  return v === "terbatas" || v === "habis" || v === "perlu_dicek"
    ? v
    : "tersedia";
}
