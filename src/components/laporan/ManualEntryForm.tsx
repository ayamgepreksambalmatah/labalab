"use client";

import { useState } from "react";
import { addManualTransaction } from "@/lib/products/transactionActions";

export type PickProduct = {
  id: string;
  nama: string;
  harga: number;
  modal: number;
};

const PLATFORMS = [
  { value: "instagram", label: "📸 Instagram" },
  { value: "shopee", label: "🟠 Shopee" },
  { value: "tokopedia", label: "🟢 Tokopedia" },
  { value: "tiktok", label: "🎵 TikTok" },
  { value: "lainnya", label: "🏷️ Lainnya (PO/WA/dll)" },
];

const STATUSES = [
  { value: "selesai", label: "Selesai" },
  { value: "pending", label: "Pending" },
  { value: "batal", label: "Batal" },
  { value: "refund", label: "Refund" },
];

function todayISO() {
  // Tanggal lokal (bukan UTC) agar tidak mundur sehari.
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function ManualEntryForm({
  products,
  onDone,
  onCancel,
}: {
  products: PickProduct[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [productId, setProductId] = useState("");
  const [nama, setNama] = useState("");
  const [tanggal, setTanggal] = useState(todayISO());
  const [platform, setPlatform] = useState("instagram");
  const [qty, setQty] = useState("1");
  const [harga, setHarga] = useState("");
  const [modal, setModal] = useState("");
  const [biaya, setBiaya] = useState("");
  const [status, setStatus] = useState("selesai");
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function pickProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) {
      setNama(p.nama);
      setHarga(String(p.harga ?? ""));
      setModal(String(p.modal ?? ""));
    }
  }

  const qtyN = Math.max(1, Math.round(Number(qty) || 1));
  const hargaN = Number(harga) || 0;
  const modalN = Number(modal) || 0;
  const biayaN = Number(biaya) || 0;
  const omzet = qtyN * hargaN;
  const profit = omzet - biayaN - modalN * qtyN;

  async function submit() {
    setError("");
    if (!nama.trim()) {
      setError("Nama produk wajib diisi.");
      return;
    }
    setSaving(true);
    const res = await addManualTransaction({
      tanggal,
      product_id: productId || null,
      nama_produk: nama,
      platform,
      qty: qtyN,
      harga_satuan: hargaN,
      biaya_platform: biayaN,
      modal: modalN,
      status,
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
    <div className="rounded-card border border-accent/30 bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-[15px] font-bold">Catat Penjualan Manual</h3>
        <button type="button" onClick={onCancel} className="text-[13px] text-muted hover:text-text">
          ✕ Tutup
        </button>
      </div>
      <p className="mb-3 text-[12px] text-muted">
        Untuk penjualan di luar marketplace (Instagram, PO, WhatsApp). Pilih dari
        Produk Saya untuk isi otomatis — semua angka tetap bisa diubah.
      </p>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Field label="Dari Produk Saya">
          <select value={productId} onChange={(e) => pickProduct(e.target.value)} className={inputCls}>
            <option value="">— manual —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
        </Field>
        <Field label="Nama produk *">
          <input value={nama} onChange={(e) => setNama(e.target.value)} className={inputCls} placeholder="Nama produk" />
        </Field>
        <Field label="Tanggal">
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Platform">
          <select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value);
              if (e.target.value === "instagram" || e.target.value === "lainnya") setBiaya("0");
            }}
            className={inputCls}
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Qty">
          <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Harga satuan (Rp)">
          <input type="number" min="0" value={harga} onChange={(e) => setHarga(e.target.value)} className={inputCls} placeholder="0" />
        </Field>
        <Field label="Modal / unit (Rp)">
          <input type="number" min="0" value={modal} onChange={(e) => setModal(e.target.value)} className={inputCls} placeholder="0" />
        </Field>
        <Field label="Biaya platform (Rp)">
          <input type="number" min="0" value={biaya} onChange={(e) => setBiaya(e.target.value)} className={inputCls} placeholder="0" />
        </Field>
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Catatan (opsional)">
          <input value={catatan} onChange={(e) => setCatatan(e.target.value)} className={inputCls} placeholder="mis. DP 50%, kirim besok" />
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 rounded-[10px] bg-surface2 px-3.5 py-2.5 text-[13px]">
        <span className="text-muted">Omzet: <b className="text-text">Rp{omzet.toLocaleString("id-ID")}</b></span>
        <span className="text-muted">Profit: <b className={profit >= 0 ? "text-green" : "text-red"}>Rp{profit.toLocaleString("id-ID")}</b></span>
      </div>

      {error && <p className="mt-2 text-[12.5px] text-red">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-5 py-2 font-display text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Simpan Transaksi"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[10px] border border-border px-4 py-2 text-[13px] font-semibold text-muted hover:bg-surface2"
        >
          Batal
        </button>
      </div>
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
