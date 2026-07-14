"use client";

import { useState } from "react";
import { fmt } from "@/lib/format";
import { editTransaction } from "@/lib/products/transactionActions";
import type { Transaction } from "@/lib/products/transactions";

const STATUS_OPTS = [
  { value: "selesai", label: "Selesai" },
  { value: "pending", label: "Pending" },
  { value: "batal", label: "Batal" },
  { value: "refund", label: "Refund" },
];

export function EditTransactionForm({
  tx,
  onDone,
  onCancel,
}: {
  tx: Transaction;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState(tx.status ?? "selesai");
  const [qty, setQty] = useState(String(tx.qty));
  const [harga, setHarga] = useState(String(tx.harga_satuan));
  const [catatan, setCatatan] = useState(tx.catatan ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const qtyN = Math.max(1, Math.round(Number(qty) || 1));
  const hargaN = Math.max(0, Number(harga) || 0);
  const omzet = qtyN * hargaN;

  async function submit() {
    setError("");
    setSaving(true);
    const res = await editTransaction({
      id: tx.id,
      status,
      qty: qtyN,
      harga_satuan: hargaN,
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
          <h3 className="font-display text-[16px] font-bold">✏️ Edit Transaksi</h3>
          <button type="button" onClick={onCancel} className="text-[13px] text-muted hover:text-text">
            ✕ Tutup
          </button>
        </div>
        <p className="mb-4 truncate text-[12.5px] text-muted">
          {tx.nama_produk} · {fmtTanggal(tx.tanggal)}
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              {STATUS_OPTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Qty">
            <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Harga Satuan (Rp)">
            <input type="number" min="0" value={harga} onChange={(e) => setHarga(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Omzet">
            <div className="rounded-[9px] border border-border bg-surface2 px-2.5 py-2 text-[13px] font-semibold">
              {fmt(omzet)}
            </div>
          </Field>
        </div>
        <div className="mt-2.5">
          <Field label="Catatan (opsional)">
            <input value={catatan} onChange={(e) => setCatatan(e.target.value)} className={inputCls} placeholder="catatan koreksi…" />
          </Field>
        </div>

        <p className="mt-3 rounded-[9px] border border-border bg-surface2/60 px-3 py-2 text-[11.5px] leading-relaxed text-muted">
          💡 Mengubah status atau qty otomatis menyesuaikan stok produk (mis.
          Pending→Selesai mengurangi stok, Selesai→Batal mengembalikannya).
        </p>

        {error && <p className="mt-2 text-[12.5px] text-red">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="flex-1 rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-5 py-2.5 font-display text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Menyimpan…" : "Simpan Perubahan"}
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

function fmtTanggal(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
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
