import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/products/queries";
import { getProductHistory, historyInsight } from "@/lib/products/history";
import { getStockPurchasesForProduct } from "@/lib/products/stockPurchases";
import { HistoryChart } from "@/components/products/HistoryChart";
import { HistoryTabs } from "@/components/products/HistoryTabs";
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

function fmtTanggal(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export default async function ProductHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const [history, purchases] = await Promise.all([
    getProductHistory(id),
    getStockPurchasesForProduct(id),
  ]);
  const insight = historyInsight(product.nama, history);

  const totalBeli = purchases.reduce((s, p) => s + Number(p.total_bayar), 0);
  const totalQtyBeli = purchases.reduce((s, p) => s + Number(p.qty_dibeli), 0);

  // Break-even per batch: berapa unit harus terjual agar modal batch kembali.
  // Pakai harga jual terkini − harga beli batch (belum termasuk biaya platform).
  const breakEven = (hargaPerUnit: number, totalBayar: number, qtyDibeli: number) => {
    const profitPerUnit = product.harga - hargaPerUnit;
    if (profitPerUnit <= 0) return { warn: true as const };
    const units = Math.ceil(totalBayar / profitPerUnit);
    return { warn: false as const, units, achievable: units <= qtyDibeli };
  };

  const label = (i: number) =>
    history[i].periode_label ||
    new Date(history[i].created_at).toLocaleDateString("id-ID");

  const profitPoints = history.map((h, i) => ({ label: label(i), value: h.profit }));
  const marginPoints = history.map((h, i) => ({ label: label(i), value: h.margin }));

  const salesPanel = (
    <>
      <div className={`mb-5 rounded-card border px-4 py-3 text-[13px] ${TONE[insight.tone]}`}>
        {insight.text}
      </div>

      {history.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-10 text-center">
          <div className="text-3xl">📊</div>
          <p className="mt-3 text-[14px] text-muted">
            Belum ada data history jualan.
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
    </>
  );

  const stockPanel =
    purchases.length === 0 ? (
      <div className="rounded-card border border-border bg-surface p-10 text-center">
        <div className="text-3xl">📦</div>
        <p className="mt-3 text-[14px] text-muted">
          Belum ada pembelian stok tercatat.
          <br />
          Catat pembelian lewat tombol{" "}
          <span className="font-semibold text-text">📦 Beli Stok</span> di kartu
          produk (Produk Saya).
        </p>
      </div>
    ) : (
      <>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Metric label="Total Modal" value={fmt(totalBeli)} color="text-yellow" />
          <Metric label="Total Unit Dibeli" value={String(totalQtyBeli)} />
          <Metric label="Jumlah Pembelian" value={String(purchases.length)} />
        </div>
        <Card title="Riwayat Pembelian Stok" icon="📦">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[12.5px]">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="py-2 pr-3 text-left font-semibold">Tanggal</th>
                  <th className="py-2 px-2 text-right font-semibold">Qty</th>
                  <th className="py-2 px-2 text-right font-semibold">Total Bayar</th>
                  <th className="py-2 px-2 text-right font-semibold">Harga/Unit</th>
                  <th className="py-2 px-2 text-right font-semibold">Balik Modal</th>
                  <th className="py-2 pl-2 text-left font-semibold">Efek & Catatan</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-b-0 align-top">
                    <td className="whitespace-nowrap py-2 pr-3">{fmtTanggal(p.tanggal)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{p.qty_dibeli}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{fmt(p.total_bayar)}</td>
                    <td className="py-2 px-2 text-right font-semibold tabular-nums text-accent2">
                      {fmt(p.harga_per_unit)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {(() => {
                        const be = breakEven(p.harga_per_unit, p.total_bayar, p.qty_dibeli);
                        if (be.warn)
                          return (
                            <span
                              className="text-[11.5px] text-red"
                              title="Harga jual saat ini ≤ harga beli batch ini"
                            >
                              ⚠️ cek harga jual
                            </span>
                          );
                        return (
                          <span
                            className={`text-[12px] font-semibold ${be.achievable ? "text-green" : "text-yellow"}`}
                            title={`Perlu jual ${be.units} dari ${p.qty_dibeli} pcs`}
                          >
                            {be.units} pcs
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-2 pl-2">
                      <div className="flex flex-wrap gap-1.5">
                        {p.added_to_stock && (
                          <span className="rounded border border-green/40 bg-green/10 px-1.5 py-0.5 text-[10px] font-semibold text-green">
                            +stok
                          </span>
                        )}
                        {p.updated_supplier_price && (
                          <span className="rounded border border-accent2/40 bg-accent2/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent2">
                            harga rata²
                          </span>
                        )}
                      </div>
                      {p.catatan && (
                        <p className="mt-0.5 text-[11.5px] text-muted">{p.catatan}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed text-muted">
            <b>Balik Modal</b> = perkiraan unit yang perlu terjual agar modal batch
            kembali (harga jual saat ini − harga beli batch). Estimasi kasar,{" "}
            <b>belum termasuk</b> biaya platform &amp; iklan.
          </p>
        </Card>
      </>
    );

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
          Riwayat jualan (dari laporan) & pembelian stok produk ini.
        </p>
      </header>

      <HistoryTabs
        tabs={[
          { label: "📈 Riwayat Jualan", content: salesPanel },
          { label: "📦 Riwayat Beli Stok", content: stockPanel },
        ]}
      />
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
    <div className="rounded-card border border-border bg-surface p-3.5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 font-display text-[16px] font-extrabold ${color ?? ""}`}>{value}</p>
    </div>
  );
}
