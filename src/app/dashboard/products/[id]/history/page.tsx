import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/products/queries";
import { getProductSales } from "@/lib/products/transactions";
import { getStockPurchasesForProduct } from "@/lib/products/stockPurchases";
import { HistoryChart } from "@/components/products/HistoryChart";
import { HistoryTabs } from "@/components/products/HistoryTabs";
import { Card } from "@/components/tools/controls";
import { fmt } from "@/lib/format";

export const metadata: Metadata = {
  title: "History Produk",
  robots: { index: false, follow: false },
};

const PLATFORM_LABEL: Record<string, string> = {
  shopee: "🟠 Shopee",
  tokopedia: "🟢 Tokopedia",
  tiktok: "🎵 TikTok",
  instagram: "📸 Instagram",
  lainnya: "🏷️ Lainnya",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  selesai: { label: "Selesai", cls: "text-green" },
  batal: { label: "Batal", cls: "text-red" },
  refund: { label: "Refund", cls: "text-yellow" },
  pending: { label: "Pending", cls: "text-muted" },
};

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function fmtTanggal(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

function fmtMonth(m: string) {
  const [y, mo] = m.split("-");
  return `${BULAN[Number(mo) - 1] ?? mo} '${y.slice(2)}`;
}

export default async function ProductHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const [sales, purchases] = await Promise.all([
    getProductSales(id),
    getStockPurchasesForProduct(id),
  ]);

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

  const profitPoints = sales.monthly.map((m) => ({ label: fmtMonth(m.month), value: m.profit }));
  const marginPoints = sales.monthly.map((m) => ({ label: fmtMonth(m.month), value: m.margin }));

  const salesPanel =
    sales.transactions.length === 0 ? (
      <div className="rounded-card border border-border bg-surface p-10 text-center">
        <div className="text-3xl">📊</div>
        <p className="mt-3 text-[14px] text-muted">
          Belum ada transaksi jualan untuk produk ini.
          <br />
          Transaksi dari{" "}
          <Link href="/dashboard/analyzer" className="text-accent2 hover:underline">
            Sales Analyzer
          </Link>{" "}
          (nama cocok) atau input manual di{" "}
          <Link href="/dashboard/laporan" className="text-accent2 hover:underline">
            Laporan Detail
          </Link>{" "}
          yang ter-link ke produk ini akan muncul di sini.
        </p>
      </div>
    ) : (
      <>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Total Omzet" value={fmt(sales.totals.omzet)} />
          <Metric
            label="Total Profit"
            value={fmt(sales.totals.profit)}
            color={sales.totals.profit >= 0 ? "text-green" : "text-red"}
          />
          <Metric label="Margin" value={`${sales.totals.margin.toFixed(1)}%`} />
          <Metric label="Unit Terjual" value={String(sales.totals.unit)} />
        </div>

        {sales.monthly.length >= 2 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Tren Profit (per bulan)" icon="💰">
              <HistoryChart points={profitPoints} color="#10d98e" formatValue={fmt} />
            </Card>
            <Card title="Tren Margin (per bulan)" icon="📈">
              <HistoryChart
                points={marginPoints}
                color="#a78bfa"
                formatValue={(v) => `${v.toFixed(1)}%`}
              />
            </Card>
          </div>
        )}

        <Card title="Semua Transaksi Produk Ini" icon="🧾">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-[12.5px]">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="py-2 pr-3 text-left font-semibold">Tanggal</th>
                  <th className="py-2 px-2 text-left font-semibold">Platform</th>
                  <th className="py-2 px-2 text-right font-semibold">Qty</th>
                  <th className="py-2 px-2 text-right font-semibold">Omzet</th>
                  <th className="py-2 px-2 text-right font-semibold">Profit</th>
                  <th className="py-2 pl-2 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.transactions.map((t) => {
                  const canceled = t.status === "batal" || t.status === "refund";
                  const sm = STATUS_META[t.status ?? "selesai"] ?? STATUS_META.selesai;
                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-border/60 last:border-b-0 ${canceled ? "opacity-60" : ""}`}
                    >
                      <td className="whitespace-nowrap py-2 pr-3">{fmtTanggal(t.tanggal)}</td>
                      <td className="whitespace-nowrap py-2 px-2">
                        {PLATFORM_LABEL[t.platform] ?? t.platform}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">{t.qty}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{fmt(t.omzet)}</td>
                      <td
                        className={`py-2 px-2 text-right font-semibold tabular-nums ${t.profit >= 0 ? "text-text" : "text-red"}`}
                      >
                        {fmt(t.profit)}
                      </td>
                      <td className={`py-2 pl-2 font-semibold ${sm.cls}`}>{sm.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed text-muted">
            Omzet, profit &amp; unit di atas mengecualikan transaksi batal &amp; refund.
          </p>
        </Card>
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
          Riwayat jualan (semua transaksi) & pembelian stok produk ini.
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
