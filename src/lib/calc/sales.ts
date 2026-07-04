/**
 * Sales Analyzer — port 1:1 dari `saComputeAnalysis` di prototype.
 * Menghitung profit hilang per produk relatif ke benchmark margin terbaik
 * yang sudah terbukti dicapai toko itu sendiri.
 */

export type SalesProduct = {
  name: string;
  omzet: number;
  unit: number;
  modal: number;
  biaya: number;
  refund: number;
};

/** Data contoh untuk tombol "Coba data contoh" (port getDemoProducts). */
export const DEMO_SALES_PRODUCTS: SalesProduct[] = [
  { name: "Kaos Oversize Hitam Cotton Premium", omzet: 18500000, unit: 185, modal: 6500000, biaya: 3200000, refund: 2 },
  { name: "Kemeja Flannel Pria Lengan Panjang", omzet: 14200000, unit: 71, modal: 5680000, biaya: 2650000, refund: 5 },
  { name: "Celana Cargo Unisex Streetwear", omzet: 22100000, unit: 221, modal: 11050000, biaya: 9800000, refund: 14 },
  { name: "Jaket Bomber Varsity", omzet: 9800000, unit: 28, modal: 4200000, biaya: 1100000, refund: 1 },
  { name: "Tas Selempang Kanvas", omzet: 6300000, unit: 63, modal: 2520000, biaya: 3400000, refund: 8 },
  { name: "Topi Baseball Basic", omzet: 4100000, unit: 205, modal: 1230000, biaya: 480000, refund: 3 },
  { name: "Sweater Rajut Wanita", omzet: 11400000, unit: 57, modal: 4560000, biaya: 3900000, refund: 11 },
];

export type ScoredProduct = SalesProduct & {
  profit: number;
  margin: number;
  biayaRatio: number;
  refundRatio: number;
};

export type EnrichedProduct = ScoredProduct & {
  lostProfit: number;
  cause: string;
};

export type SalesAnalysis = {
  enriched: EnrichedProduct[];
  totalOmzet: number;
  totalModal: number;
  totalBiaya: number;
  totalProfit: number;
  totalMargin: number;
  totalRefund: number;
  totalUnit: number;
  best: ScoredProduct[];
  worst: ScoredProduct[];
  totalLostProfit: number;
  topLoss: EnrichedProduct[];
  benchmarkMargin: number;
};

export function computeSalesAnalysis(products: SalesProduct[]): SalesAnalysis {
  let totalOmzet = 0,
    totalModal = 0,
    totalBiaya = 0,
    totalRefund = 0,
    totalUnit = 0;

  const base = products.map((p) => {
    const profit = p.omzet - p.modal - p.biaya;
    const margin = p.omzet > 0 ? (profit / p.omzet) * 100 : 0;
    const biayaRatio = p.omzet > 0 ? (p.biaya / p.omzet) * 100 : 0;
    const refundRatio = p.unit > 0 ? (p.refund / p.unit) * 100 : 0;
    totalOmzet += p.omzet;
    totalModal += p.modal;
    totalBiaya += p.biaya;
    totalRefund += p.refund;
    totalUnit += p.unit;
    return { ...p, profit, margin, biayaRatio, refundRatio };
  });

  const totalProfit = totalOmzet - totalModal - totalBiaya;
  const totalMargin = totalOmzet > 0 ? (totalProfit / totalOmzet) * 100 : 0;
  const sorted = [...base].sort((a, b) => b.margin - a.margin);

  // Benchmark: margin terbaik yang SUDAH TERBUKTI dicapai toko ini sendiri.
  const benchmarkMargin = sorted.length ? Math.max(sorted[0].margin, 20) : 20;
  const avgBiayaRatio = base.length
    ? base.reduce((s, p) => s + p.biayaRatio, 0) / base.length
    : 0;

  const withLoss: EnrichedProduct[] = base.map((p) => {
    const idealProfit = (benchmarkMargin / 100) * p.omzet;
    const lostProfit = Math.max(0, idealProfit - p.profit);
    let cause: string;
    if (p.refundRatio > 5)
      cause = `refund/pembatalan tinggi (${p.refundRatio.toFixed(1)}% dari unit terjual)`;
    else if (p.biayaRatio > avgBiayaRatio * 1.3 && avgBiayaRatio > 0)
      cause = `biaya platform/iklan lebih boros dari rata-rata toko (${p.biayaRatio.toFixed(1)}% dari omzet)`;
    else if (p.margin < 10)
      cause = `margin sangat tipis, kemungkinan harga jual terlalu rendah untuk biaya yang ada`;
    else cause = `margin di bawah performa terbaik toko kamu`;
    return { ...p, lostProfit, cause };
  });

  const totalLostProfit = withLoss.reduce((s, p) => s + p.lostProfit, 0);
  const topLoss = [...withLoss]
    .sort((a, b) => b.lostProfit - a.lostProfit)
    .filter((p) => p.lostProfit > 0)
    .slice(0, 3);

  return {
    enriched: withLoss,
    totalOmzet,
    totalModal,
    totalBiaya,
    totalProfit,
    totalMargin,
    totalRefund,
    totalUnit,
    best: sorted.slice(0, 3),
    worst: sorted.slice(-3).reverse(),
    totalLostProfit,
    topLoss,
    benchmarkMargin,
  };
}
