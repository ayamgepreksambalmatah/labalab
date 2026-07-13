"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { fmt } from "@/lib/format";
import type { Transaction, TxFilters, TxTotals } from "@/lib/products/transactions";
import { deleteTransaction } from "@/lib/products/transactionActions";
import { ManualEntryForm, type PickProduct } from "@/components/laporan/ManualEntryForm";

const PLATFORM_META: Record<string, { emoji: string; label: string }> = {
  shopee: { emoji: "🟠", label: "Shopee" },
  tokopedia: { emoji: "🟢", label: "Tokopedia" },
  tiktok: { emoji: "🎵", label: "TikTok" },
  instagram: { emoji: "📸", label: "Instagram" },
  lainnya: { emoji: "🏷️", label: "Lainnya" },
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  selesai: { label: "Selesai", cls: "text-green border-green/40 bg-green/10" },
  batal: { label: "Batal", cls: "text-red border-red/40 bg-red/10" },
  refund: { label: "Refund", cls: "text-amber-500 border-amber-500/40 bg-amber-500/10" },
  pending: { label: "Pending", cls: "text-muted border-border bg-surface2" },
};

const PAGE_SIZE = 50;

type SortKey = "tanggal" | "nama_produk" | "platform" | "qty" | "omzet" | "profit";
type SortDir = "asc" | "desc";

function platformLabel(p: string) {
  const m = PLATFORM_META[p];
  return m ? `${m.emoji} ${m.label}` : p;
}

function fmtTanggal(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export function LaporanDetail({
  rows,
  totals,
  truncated,
  products,
  filters,
}: {
  rows: Transaction[];
  totals: TxTotals;
  truncated: boolean;
  products: PickProduct[];
  filters: TxFilters;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Filter form (di-submit → ubah URL → server query ulang)
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");
  const [platform, setPlatform] = useState(filters.platform ?? "");
  const [status, setStatus] = useState(filters.status ?? "");
  const [search, setSearch] = useState(filters.search ?? "");

  const [sortKey, setSortKey] = useState<SortKey>("tanggal");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function applyFilters() {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (platform) p.set("platform", platform);
    if (status) p.set("status", status);
    if (search.trim()) p.set("q", search.trim());
    const qs = p.toString();
    startTransition(() => router.push(qs ? `/dashboard/laporan?${qs}` : "/dashboard/laporan"));
    setPage(0);
  }

  function resetFilters() {
    setFrom("");
    setTo("");
    setPlatform("");
    setStatus("");
    setSearch("");
    startTransition(() => router.push("/dashboard/laporan"));
    setPage(0);
  }

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "nama_produk" || sortKey === "platform") {
        cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      } else {
        cmp = Number(a[sortKey]) - Number(b[sortKey]);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const paged = sorted.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "nama_produk" || key === "platform" ? "asc" : "desc");
    }
  }

  function exportExcel() {
    const data = sorted.map((t) => ({
      Tanggal: t.tanggal,
      Produk: t.nama_produk,
      Platform: PLATFORM_META[t.platform]?.label ?? t.platform,
      Qty: t.qty,
      "Harga Satuan": t.harga_satuan,
      Omzet: t.omzet,
      "Biaya Platform": t.biaya_platform,
      Modal: t.modal,
      Profit: t.profit,
      Status: STATUS_META[t.status ?? ""]?.label ?? t.status ?? "",
      Sumber: t.sumber === "manual" ? "Manual" : "Upload",
      Catatan: t.catatan ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, "laporan-penjualan-labalab.xlsx");
  }

  async function onDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    setDeletingId(id);
    const res = await deleteTransaction(id);
    setDeletingId(null);
    if (!res.ok) {
      alert(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  const hasFilter = !!(from || to || platform || status || search);

  return (
    <div className="space-y-4">
      {/* Aksi */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowManual((s) => !s)}
          className="rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-4 py-2 font-display text-[13px] font-bold text-white hover:opacity-90"
        >
          + Catat Penjualan Manual
        </button>
        <button
          type="button"
          onClick={exportExcel}
          disabled={sorted.length === 0}
          className="rounded-[10px] border border-border px-4 py-2 text-[13px] font-semibold text-muted hover:bg-surface2 hover:text-text disabled:opacity-50"
        >
          ⬇ Export Excel
        </button>
        <span className="ml-auto text-[12px] text-muted">
          {sorted.length} transaksi{hasFilter ? " (terfilter)" : ""}
          {truncated && " — dibatasi 2000 terbaru"}
        </span>
      </div>

      {showManual && (
        <ManualEntryForm
          products={products}
          onDone={() => {
            setShowManual(false);
            startTransition(() => router.refresh());
          }}
          onCancel={() => setShowManual(false)}
        />
      )}

      {/* Filter */}
      <div className="rounded-card border border-border bg-surface p-3.5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <Field label="Dari tanggal">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Sampai tanggal">
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Platform">
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={inputCls}>
              <option value="">Semua</option>
              {Object.entries(PLATFORM_META).map(([v, m]) => (
                <option key={v} value={v}>{m.emoji} {m.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="">Semua</option>
              {Object.entries(STATUS_META).map(([v, m]) => (
                <option key={v} value={v}>{m.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Cari produk">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="nama produk…"
              className={inputCls}
            />
          </Field>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={applyFilters}
              disabled={pending}
              className="flex-1 rounded-[9px] bg-accent/15 px-3 py-2 text-[13px] font-bold text-accent2 hover:bg-accent/25 disabled:opacity-50"
            >
              Terapkan
            </button>
            {hasFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-[9px] border border-border px-3 py-2 text-[13px] font-semibold text-muted hover:bg-surface2"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total Unit" value={String(totals.qty)} />
        <Metric label="Total Omzet" value={fmt(totals.omzet)} />
        <Metric label="Total Biaya" value={fmt(totals.biaya)} />
        <Metric
          label="Total Profit"
          value={fmt(totals.profit)}
          color={totals.profit >= 0 ? "text-green" : "text-red"}
        />
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
              <Th onClick={() => toggleSort("tanggal")} active={sortKey === "tanggal"} dir={sortDir}>Tanggal</Th>
              <Th onClick={() => toggleSort("nama_produk")} active={sortKey === "nama_produk"} dir={sortDir}>Produk</Th>
              <Th onClick={() => toggleSort("platform")} active={sortKey === "platform"} dir={sortDir}>Platform</Th>
              <Th onClick={() => toggleSort("qty")} active={sortKey === "qty"} dir={sortDir} right>Qty</Th>
              <Th onClick={() => toggleSort("omzet")} active={sortKey === "omzet"} dir={sortDir} right>Omzet</Th>
              <Th onClick={() => toggleSort("profit")} active={sortKey === "profit"} dir={sortDir} right>Profit</Th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-muted">
                  {hasFilter
                    ? "Tidak ada transaksi yang cocok dengan filter."
                    : "Belum ada transaksi. Upload laporan di Sales Analyzer atau catat manual."}
                </td>
              </tr>
            ) : (
              paged.map((t) => {
                const sm = STATUS_META[t.status ?? ""] ?? STATUS_META.selesai;
                return (
                  <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-surface2/40">
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted">{fmtTanggal(t.tanggal)}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-medium">{t.nama_produk}</span>
                      {t.sumber === "manual" && (
                        <span className="ml-1.5 rounded border border-accent2/40 bg-accent2/10 px-1 py-0.5 text-[9px] font-bold uppercase text-accent2">
                          manual
                        </span>
                      )}
                      {t.catatan && <p className="text-[11px] text-muted">{t.catatan}</p>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">{platformLabel(t.platform)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{t.qty}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(t.omzet)}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${t.profit >= 0 ? "text-green" : "text-red"}`}>
                      {fmt(t.profit)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${sm.cls}`}>
                        {sm.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {t.sumber === "manual" && (
                        <button
                          type="button"
                          onClick={() => onDelete(t.id)}
                          disabled={deletingId === t.id}
                          className="text-[12px] text-muted hover:text-red disabled:opacity-40"
                          title="Hapus transaksi manual"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 text-[13px]">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={clampedPage === 0}
            className="rounded-[9px] border border-border px-3 py-1.5 font-semibold text-muted hover:bg-surface2 disabled:opacity-40"
          >
            ← Sebelumnya
          </button>
          <span className="text-muted">
            Halaman {clampedPage + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={clampedPage >= pageCount - 1}
            className="rounded-[9px] border border-border px-3 py-1.5 font-semibold text-muted hover:bg-surface2 disabled:opacity-40"
          >
            Berikutnya →
          </button>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-[9px] border border-border bg-surface2 px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-bold uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

function Th({
  children,
  onClick,
  active,
  dir,
  right,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: SortDir;
  right?: boolean;
}) {
  return (
    <th className={`px-3 py-2.5 ${right ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 uppercase hover:text-text ${active ? "text-text" : ""}`}
      >
        {children}
        {active && <span>{dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-card border border-border bg-surface p-3.5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 font-display text-[16px] font-extrabold ${color ?? ""}`}>{value}</p>
    </div>
  );
}
