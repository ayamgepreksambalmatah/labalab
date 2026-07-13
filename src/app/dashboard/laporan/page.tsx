import type { Metadata } from "next";
import { getTransactions, type TxFilters } from "@/lib/products/transactions";
import { getProducts } from "@/lib/products/queries";
import { LaporanDetail } from "@/components/laporan/LaporanDetail";
import type { PickProduct } from "@/components/laporan/ManualEntryForm";

export const metadata: Metadata = {
  title: "Laporan Detail",
  robots: { index: false, follow: false },
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v) ?? "";

  const filters: TxFilters = {
    from: ISO_DATE.test(one(sp.from)) ? one(sp.from) : undefined,
    to: ISO_DATE.test(one(sp.to)) ? one(sp.to) : undefined,
    platform: one(sp.platform) || undefined,
    status: one(sp.status) || undefined,
    search: one(sp.q).slice(0, 100) || undefined,
  };

  const [{ rows, totals, truncated }, products] = await Promise.all([
    getTransactions(filters),
    getProducts(),
  ]);

  const pickProducts: PickProduct[] = products.map((p) => ({
    id: p.id,
    nama: p.nama,
    harga: p.harga,
    modal: p.modal,
  }));

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          📋 Laporan Detail
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Semua transaksi dari marketplace (upload) dan penjualan manual
          (Instagram/PO) di satu tempat. Filter, urutkan, dan export ke Excel.
        </p>
      </header>
      <LaporanDetail
        rows={rows}
        totals={totals}
        truncated={truncated}
        products={pickProducts}
        filters={filters}
      />
    </div>
  );
}
