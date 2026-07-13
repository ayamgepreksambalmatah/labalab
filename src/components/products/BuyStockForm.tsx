"use client";

import { useState } from "react";
import { fmt } from "@/lib/format";
import { addStockPurchase } from "@/lib/products/stockPurchaseActions";

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function BuyStockForm({
  productId,
  nama,
  currentStok,
  currentHargaSupplier,
  onDone,
  onCancel,
}: {
  productId: string;
  nama: string;
  currentStok: number | null;
  currentHargaSupplier: number | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [tanggal, setTanggal] = useState(todayISO());
  const [qty, setQty] = useState("");
  const [total, setTotal] = useState("");
  const [addToStock, setAddToStock] = useState(true);
  const [updatePrice, setUpdatePrice] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const qtyN = Math.max(0, Math.round(Number(qty) || 0));
  const totalN = Number(total) || 0;
  const perUnit = qtyN > 0 ? Math.round(totalN / qtyN) : 0;

  const oldStok = currentStok ?? 0;
  const oldPrice = currentHargaSupplier;
  const newAvg =
    oldPrice == null || oldStok <= 0
      ? perUnit
      : Math.round((oldStok * oldPrice + qtyN * perUnit) / (oldStok + qtyN));

  async function submit() {
    setError("");
    if (qtyN < 1) {
      setError("Qty dibeli minimal 1.");
      return;
    }
    setSaving(true);
    const res = await addStockPurchase({
      product_id: productId,
      tanggal,
      qty_dibeli: qtyN,
      total_bayar: totalN,
      addToStock,
      updateSupplierPrice: updatePrice,
      catatan,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card border border-border bg-surface p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-[16px] font-bold">📦 Catat Pembelian Stok</h3>
          <button type="button" onClick={onCancel} className="text-[13px] text-muted hover:text-text">
            ✕ Tutup
          </button>
        </div>
        <p className="mb-4 truncate text-[12.5px] text-muted">{nama}</p>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Tanggal">
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Qty Dibeli">
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </Field>
          <Field label="Total Bayar (Rp)">
            <input
              type="number"
              min="0"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </Field>
          <Field label="Harga / Unit">
            <div className="rounded-[9px] border border-border bg-surface2 px-2.5 py-2 text-[13px] font-semibold text-accent2">
              {qtyN > 0 ? fmt(perUnit) : "—"}
            </div>
          </Field>
        </div>

        <div className="mt-3 space-y-2">
          <label className="flex cursor-pointer items-start gap-2.5 rounded-[9px] border border-border bg-surface2/50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={addToStock}
              onChange={(e) => setAddToStock(e.target.checked)}
              className="mt-0.5 accent-accent2"
            />
            <span className="text-[12.5px]">
              <b>Tambahkan ke stok saat ini</b>
              <span className="block text-muted">
                Stok: {oldStok}
                {qtyN > 0 && addToStock && (
                  <span className="text-green"> → {oldStok + qtyN}</span>
                )}
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-[9px] border border-border bg-surface2/50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={updatePrice}
              onChange={(e) => setUpdatePrice(e.target.checked)}
              className="mt-0.5 accent-accent2"
            />
            <span className="text-[12.5px]">
              <b>Update Harga Supplier jadi rata-rata baru</b>
              <span className="block text-muted">
                {oldPrice == null ? "Belum ada" : fmt(oldPrice)}
                {qtyN > 0 && updatePrice && (
                  <span className="text-green"> → {fmt(newAvg)}</span>
                )}
                <span className="text-muted/70"> (weighted average)</span>
              </span>
            </span>
          </label>
        </div>

        <div className="mt-3">
          <Field label="Catatan (opsional)">
            <input
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="mis. beli di supplier A, ongkir sudah termasuk"
              className={inputCls}
            />
          </Field>
        </div>

        {error && <p className="mt-2 text-[12.5px] text-red">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="flex-1 rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-5 py-2.5 font-display text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Menyimpan…" : "Simpan Pembelian"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[10px] border border-border px-4 py-2.5 text-[13px] font-semibold text-muted hover:bg-surface2"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-[9px] border border-border bg-surface2 px-2.5 py-2 text-[13px] text-text outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-bold uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}
