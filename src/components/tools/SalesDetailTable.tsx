"use client";

import { useMemo, useState, useTransition } from "react";
import { fmt } from "@/lib/format";
import type { EnrichedProduct } from "@/lib/calc/sales";
import { saveProduct } from "@/lib/products/actions";

type SortKey = "unit" | "omzet" | "modal" | "biaya" | "profit" | "margin";

const COLS: { key: SortKey; label: string }[] = [
  { key: "unit", label: "Unit" },
  { key: "omzet", label: "Omzet" },
  { key: "modal", label: "Modal" },
  { key: "biaya", label: "Biaya" },
  { key: "profit", label: "Profit" },
  { key: "margin", label: "Margin" },
];

export function SalesDetailTable({ products }: { products: EnrichedProduct[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("profit");
  const [asc, setAsc] = useState(false);
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<Record<string, "ok" | "err">>({});

  const rows = useMemo(() => {
    const filtered = q.trim()
      ? products.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()))
      : products;
    return [...filtered].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return asc ? diff : -diff;
    });
  }, [products, q, sortKey, asc]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setAsc((v) => !v);
    else {
      setSortKey(k);
      setAsc(false);
    }
  }

  function saveRow(p: EnrichedProduct) {
    startTransition(async () => {
      const res = await saveProduct({
        nama: p.name,
        platform: "shopee",
        kategori: "lainnya",
        harga: Math.round(p.omzet / Math.max(p.unit, 1)),
        modal: Math.round(p.modal / Math.max(p.unit, 1)),
      });
      setSaved((s) => ({ ...s, [p.name]: res.ok ? "ok" : "err" }));
    });
  }

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari produk…"
        className="mb-3 w-full max-w-xs rounded-[9px] border border-border bg-surface2 px-3.5 py-2 text-[13px] outline-none focus:border-accent"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[12.5px]">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-2 pr-3 text-left font-semibold">Produk</th>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className="cursor-pointer select-none py-2 px-2 text-right font-semibold hover:text-text"
                >
                  {c.label}
                  {sortKey === c.key && (asc ? " ▲" : " ▼")}
                </th>
              ))}
              <th className="py-2 pl-2 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={i} className="border-b border-border/60 last:border-b-0">
                <td className="max-w-[200px] truncate py-2 pr-3">{p.name}</td>
                <td className="py-2 px-2 text-right">{p.unit}</td>
                <td className="py-2 px-2 text-right">{fmt(p.omzet)}</td>
                <td className="py-2 px-2 text-right">{fmt(p.modal)}</td>
                <td className="py-2 px-2 text-right">{fmt(p.biaya)}</td>
                <td
                  className={`py-2 px-2 text-right font-semibold ${p.profit >= 0 ? "text-text" : "text-red"}`}
                >
                  {fmt(p.profit)}
                </td>
                <td
                  className={`py-2 px-2 text-right font-semibold ${
                    p.margin >= 20 ? "text-green" : p.margin >= 5 ? "text-yellow" : "text-red"
                  }`}
                >
                  {p.margin.toFixed(1)}%
                </td>
                <td className="py-2 pl-2 text-right">
                  {saved[p.name] === "ok" ? (
                    <span className="text-[11.5px] text-green">✓ Tersimpan</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => saveRow(p)}
                      disabled={pending}
                      className="rounded-md border border-border bg-surface2 px-2 py-1 text-[11px] font-semibold text-muted hover:text-accent2 disabled:opacity-50"
                    >
                      💾 Simpan
                    </button>
                  )}
                  {saved[p.name] === "err" && (
                    <span className="ml-1 text-[11px] text-red">gagal</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-center text-muted">
                  Tidak ada produk cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
