import type { Metadata } from "next";
import { SalesAnalyzer } from "@/components/tools/SalesAnalyzer";

export const metadata: Metadata = {
  title: "Sales Analyzer",
  robots: { index: false, follow: false },
};

export default function AnalyzerPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          📊 Sales Analyzer
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Upload laporan penjualan, AI kasih insight produk mana yang untung dan
          mana yang boncos.
        </p>
      </header>
      <SalesAnalyzer />
    </div>
  );
}
