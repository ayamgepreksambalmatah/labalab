import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/products/queries";
import { getProductHistory, historyInsight } from "@/lib/products/history";
import { HistoryChart } from "@/components/products/HistoryChart";
import { Card } from "@/components/tools/controls";
import { fmt } from "@/lib/format";

export const metadata: Metadata = {
  title: "History Produk",
  robots: { index: false, follow: false },
};

const TONE: Record<string, string> = {
  info: "border-border bg-surface2 text-muted",
  up: "border-green/40 bg-green/10 text-green",
  down: "border-red/40 bg-red/10 text-red",
  flat: "border-border bg-surface2 text-text/90",
};

export default async function ProductHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const history = await getProductHistory(id);
  const insight = historyInsight(product.nama, history);

  const label = (i: number) =>
    history[i].periode_label ||
    new Date(history[i].created_at).toLocaleDateString("id-ID");

  const profitPoints = history.map((h, i) => ({ label: label(i), value: h.profit }));
  const marginPoints = history.map((h, i) => ({ label: label(i), value: h.margin }));

  return (
    <div>
      <header className="mb-6">
        <Link
          href="/dashboard/products"
          className="text-[12.5px] font-semibold text-muted hover:text-text"
        >
          ← Produk Saya
        </Link>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight">
          📜 History: {product.nama}
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Riwayat penjualan produk ini dari laporan yang kamu upload.
        </p>
      </header>

      <div className={`mb-5 rounded-card border px-4 py-3 text-[13px] ${TONE[insight.tone]}`}>
        {insight.text}
      </div>

      {history.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-10 text-center">
          <div className="text-3xl">📊</div>
          <p className="mt-3 text-[14px] text-muted">
            Belum ada data history.
            <br />
            Upload laporan di{" "}
            <Link href="/dashboard/analyzer" className="text-accent2 hover:underline">
              Sales Analyzer
            </Link>{" "}
            dengan nama produk yang sama persis.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Tren Profit" icon="💰">
              <HistoryChart points={profitPoints} color="#10d98e" formatValue={fmt} />
            </Card>
            <Card title="Tren Margin" icon="📈">
              <HistoryChart
                points={marginPoints}
                color="#a78bfa"
                formatValue={(v) => `${v.toFixed(1)}%`}
              />
            </Card>
          </div>

          <Card title="Rincian per Periode" icon="🗓️">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="py-2 pr-3 text-left font-semibold">Periode</th>
                    <th className="py-2 px-2 text-right font-semibold">Unit</th>
                    <th className="py-2 px-2 text-right font-semibold">Omzet</th>
                    <th className="py-2 px-2 text-right font-semibold">Profit</th>
                    <th className="py-2 px-2 text-right font-semibold">Margin</th>
                    <th className="py-2 pl-2 text-right font-semibold">Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-b border-border/60 last:border-b-0">
                      <td className="max-w-[200px] truncate py-2 pr-3">{label(i)}</td>
                      <td className="py-2 px-2 text-right">{h.unit_terjual}</td>
                      <td className="py-2 px-2 text-right">{fmt(h.omzet)}</td>
                      <td
                        className={`py-2 px-2 text-right font-semibold ${h.profit >= 0 ? "text-text" : "text-red"}`}
                      >
                        {fmt(h.profit)}
                      </td>
                      <td
                        className={`py-2 px-2 text-right font-semibold ${
                          h.margin >= 20 ? "text-green" : h.margin >= 5 ? "text-yellow" : "text-red"
                        }`}
                      >
                        {h.margin.toFixed(1)}%
                      </td>
                      <td className="py-2 pl-2 text-right text-muted">
                        {h.refund_count ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
