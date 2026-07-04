import type { Platform } from "@/types/database";

/**
 * Profit Checker — port 1:1 dari `pfCalculate` di prototype.
 * Murni matematika, tanpa AI/DB. Semua persen relatif ke harga jual.
 */

export type Kategori =
  | "fashion"
  | "elektronik"
  | "kecantikan"
  | "makanan"
  | "rumah"
  | "olahraga"
  | "lainnya";

export const KATEGORI_OPTIONS: { value: Kategori; label: string }[] = [
  { value: "fashion", label: "Fashion & Pakaian" },
  { value: "elektronik", label: "Elektronik & Gadget" },
  { value: "kecantikan", label: "Kecantikan & Skincare" },
  { value: "makanan", label: "Makanan & Minuman" },
  { value: "rumah", label: "Perabot & Rumah Tangga" },
  { value: "olahraga", label: "Olahraga & Outdoor" },
  { value: "lainnya", label: "Lainnya" },
];

export const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: "shopee", label: "🟠 Shopee" },
  { value: "tokopedia", label: "🟢 Tokopedia" },
  { value: "tiktok", label: "🎵 TikTok Shop" },
];

/** Estimasi komisi platform (%) per kategori. */
export const COMMISSION_RATES: Record<Platform, Record<Kategori, number>> = {
  shopee: { fashion: 10, elektronik: 5.5, kecantikan: 10, makanan: 7, rumah: 8, olahraga: 8, lainnya: 8 },
  tokopedia: { fashion: 6.97, elektronik: 3.5, kecantikan: 6.97, makanan: 6.97, rumah: 6.97, olahraga: 6.97, lainnya: 6.97 },
  tiktok: { fashion: 8, elektronik: 5, kecantikan: 8, makanan: 7, rumah: 8, olahraga: 8, lainnya: 8 },
};

export type ProfitInput = {
  harga: number;
  modal: number;
  packaging: number;
  commPct: number;
  adsPct: number;
  ongkirPct: number;
};

export type VerdictClass = "bagus" | "lumayan" | "bahaya" | "minus";

export type ProfitResult = {
  komisi: number;
  iklan: number;
  ongkir: number;
  totalPotong: number;
  profit: number;
  margin: number;
  verdict: { cls: VerdictClass; text: string };
  /** Harga jual minimum untuk mencapai margin 20% (dibulatkan ke atas). */
  minHarga: number;
};

export function computeProfit(input: ProfitInput): ProfitResult {
  const { harga, modal, packaging, commPct, adsPct, ongkirPct } = input;

  const komisi = (harga * commPct) / 100;
  const iklan = (harga * adsPct) / 100;
  const ongkir = (harga * ongkirPct) / 100;
  const totalPotong = komisi + iklan + ongkir;
  const profit = harga - modal - packaging - totalPotong;
  const margin = harga > 0 ? (profit / harga) * 100 : 0;

  let verdict: ProfitResult["verdict"];
  if (margin >= 25) verdict = { cls: "bagus", text: "✅ Margin Sehat" };
  else if (margin >= 15) verdict = { cls: "lumayan", text: "⚠️ Margin Lumayan" };
  else if (margin >= 1) verdict = { cls: "bahaya", text: "🔴 Margin Tipis" };
  else verdict = { cls: "minus", text: "💀 RUGI!" };

  const totalPct = commPct + adsPct + ongkirPct;
  // Guard: kalau total potongan + 20% target ≥ 100%, harga minimum tak terhingga.
  const denom = 1 - totalPct / 100 - 0.2;
  const minHarga = denom > 0 ? Math.ceil((modal + packaging) / denom) : Infinity;

  return { komisi, iklan, ongkir, totalPotong, profit, margin, verdict, minHarga };
}
