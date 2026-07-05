"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fmt } from "@/lib/format";
import { DEMO_SALES_PRODUCTS, type SalesAnalysis, type SalesProduct } from "@/lib/calc/sales";
import { parseSalesFile } from "@/lib/parse/salesFile";
import type { SalesAiResult } from "@/lib/ai/prompts";
import { Card } from "@/components/tools/controls";
import { SalesDetailTable } from "@/components/tools/SalesDetailTable";

type View = "upload" | "loading" | "result" | "error";

export function SalesAnalyzer() {
  const [view, setView] = useState<View>("upload");
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const [analysis, setAnalysis] = useState<SalesAnalysis | null>(null);
  const [ai, setAi] = useState<SalesAiResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function run(products: SalesProduct[], sourceLabel: string) {
    setView("loading");
    setLoadingStep("AI sedang menyusun rekomendasi…");
    setLimitReached(false);
    try {
      const res = await fetch("/api/ai/sales-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products, sourceLabel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLimitReached(!!data.quotaExceeded);
        setError(data.error || "Gagal menganalisis.");
        setView("error");
        return;
      }
      setAnalysis(data.analysis);
      setAi(data.ai);
      setView("result");
      router.refresh(); // update QuotaBar (server) dengan pemakaian terbaru
    } catch {
      setError("Gagal menghubungi server. Coba lagi ya.");
      setView("error");
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setView("loading");
    setLoadingStep("Membaca file…");
    try {
      const { products } = await parseSalesFile(file);
      await run(products, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "File tidak bisa diproses.");
      setView("error");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (view === "loading") {
    return (
      <div className="rounded-card border border-border bg-surface p-14 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="text-sm text-muted">{loadingStep}</p>
      </div>
    );
  }

  if (view === "error") {
    return (
      <div className="rounded-card border border-border bg-surface p-10 text-center">
        <div className="text-3xl">⚠️</div>
        <p className="mt-3 font-display font-bold">Tidak bisa diproses</p>
        <p className="mt-1.5 text-[13px] text-muted">{error}</p>
        {limitReached ? (
          <a
            href="/pricing"
            className="mt-5 inline-block rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-5 py-2.5 font-display text-sm font-bold text-white hover:opacity-90"
          >
            Upgrade Sekarang
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setView("upload")}
            className="mt-5 rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-5 py-2.5 font-display text-sm font-bold text-white hover:opacity-90"
          >
            Coba Lagi
          </button>
        )}
      </div>
    );
  }

  if (view === "result" && analysis && ai) {
    return (
      <div>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Total Omzet" value={fmt(analysis.totalOmzet)} />
          <Metric
            label="Profit Bersih"
            value={fmt(analysis.totalProfit)}
            color={analysis.totalProfit >= 0 ? "text-green" : "text-red"}
          />
          <Metric label="Margin" value={`${analysis.totalMargin.toFixed(1)}%`} />
          <Metric
            label="Profit Hilang"
            value={fmt(analysis.totalLostProfit)}
            color="text-red"
          />
        </div>

        <Card title="Ringkasan" icon="🔎">
          <p className="text-[14px] leading-relaxed">{ai.ringkasan}</p>
        </Card>

        <Card title="Temuan Utama" icon="🔴">
          <ul className="space-y-2.5">
            {ai.temuan.map((t, i) => (
              <li key={i} className="text-[13.5px] leading-relaxed text-text/90">
                {t}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Rekomendasi Aksi" icon="✅">
          <ul className="space-y-2.5">
            {ai.rekomendasi.map((r, i) => (
              <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed text-text/90">
                <span className="text-accent2">{i + 1}.</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Detail Semua Produk" icon="📦">
          <SalesDetailTable products={analysis.enriched} />
        </Card>

        <button
          type="button"
          onClick={() => setView("upload")}
          className="mt-2 rounded-[10px] border border-border px-5 py-2.5 text-sm font-semibold text-muted hover:bg-surface2 hover:text-text"
        >
          ← Analisis laporan lain
        </button>
      </div>
    );
  }

  // upload
  return (
    <div
      className="rounded-card border border-dashed border-border bg-surface p-12 text-center transition-colors hover:border-accent/50"
      onClick={() => fileRef.current?.click()}
      role="button"
    >
      <div className="text-4xl">📊</div>
      <p className="mt-3 font-display text-base font-bold">Upload Laporan Penjualan</p>
      <p className="mt-1 text-[13px] text-muted">
        File Excel/CSV dari Shopee, Tokopedia, atau TikTok Shop Seller Center
      </p>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFile}
        className="hidden"
      />
      <div className="mt-5 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileRef.current?.click();
          }}
          className="rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-6 py-2.5 font-display text-sm font-bold text-white hover:opacity-90"
        >
          Pilih File
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            run(DEMO_SALES_PRODUCTS, "Data Contoh (Demo)");
          }}
          className="text-[12.5px] font-semibold text-accent2 hover:underline"
        >
          Belum punya file? Coba data contoh →
        </button>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 text-center">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className={`mt-1.5 font-display text-[17px] font-extrabold ${color ?? ""}`}>
        {value}
      </p>
    </div>
  );
}
