"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Plan, Platform } from "@/types/database";
import type { FaqItem, Product } from "@/lib/products/queries";
import {
  KATEGORI_OPTIONS,
  PLATFORM_OPTIONS,
  type Kategori,
} from "@/lib/calc/profit";
import { suggestionsFor } from "@/lib/products/category-attribute-suggestions";
import type { AtributKhusus } from "@/lib/products/knowledge";
import {
  STOCK_STATUS_DEFAULT,
  STOCK_STATUS_META,
  STOCK_STATUS_OPTIONS,
  normalizeStockStatus,
  type StockStatus,
} from "@/lib/products/stock-status";
import { fmt } from "@/lib/format";
import { PLAN_LIMITS } from "@/lib/plans";
import {
  saveProduct,
  updateProduct,
  deleteProduct,
  type ProductInput,
} from "@/lib/products/actions";
import {
  Card,
  Field,
  MoneyInput,
  NumberInput,
  SelectInput,
  Textarea,
  TextInput,
} from "@/components/tools/controls";

const PLATFORM_ICON: Record<Platform, string> = {
  shopee: "🟠",
  tokopedia: "🟢",
  tiktok: "🎵",
};

function marginOf(p: Product) {
  const profit = p.harga - p.modal;
  const margin = p.harga > 0 ? (profit / p.harga) * 100 : 0;
  return { profit, margin };
}

type AtributRow = { key: string; value: string; placeholder?: string };

type FormState = {
  nama: string;
  platform: Platform;
  kategori: Kategori;
  harga: number;
  modal: number;
  stok: number | "";
  masaBerlaku: string;
  sertifikasi: string;
  kondisiPengiriman: string;
  deskripsi: string;
  catatanTambahan: string;
  atribut: AtributRow[];
  faq: FaqItem[];
  // Info supplier (pencatatan pribadi)
  hargaSupplier: number | "";
  linkSupplier: string;
  kontakSupplier: string;
  statusStokSupplier: StockStatus;
};

/** Baris atribut awal (saran per kategori, nilai kosong + contoh placeholder). */
function seedAtribut(kategori: Kategori): AtributRow[] {
  return suggestionsFor(kategori).map((s) => ({
    key: s.label,
    value: "",
    placeholder: s.example,
  }));
}

const emptyForm: FormState = {
  nama: "",
  platform: "shopee",
  kategori: "fashion",
  harga: 0,
  modal: 0,
  stok: "",
  masaBerlaku: "",
  sertifikasi: "",
  kondisiPengiriman: "",
  deskripsi: "",
  catatanTambahan: "",
  atribut: seedAtribut("fashion"),
  faq: [],
  hargaSupplier: "",
  linkSupplier: "",
  kontakSupplier: "",
  statusStokSupplier: STOCK_STATUS_DEFAULT,
};

function productToForm(p: Product): FormState {
  const atribut: AtributRow[] = p.atribut_khusus
    ? Object.entries(p.atribut_khusus).map(([key, value]) => ({
        key,
        value: Array.isArray(value) ? value.join(", ") : String(value),
      }))
    : seedAtribut(p.kategori);

  return {
    nama: p.nama,
    platform: p.platform,
    kategori: p.kategori,
    harga: p.harga,
    modal: p.modal,
    stok: p.stok ?? "",
    // Fallback ke field legacy supaya data lama tetap muncul di field universal.
    masaBerlaku: p.masa_berlaku ?? p.garansi ?? "",
    sertifikasi: p.sertifikasi ?? "",
    kondisiPengiriman: p.kondisi_pengiriman ?? "",
    deskripsi: p.deskripsi ?? "",
    catatanTambahan: p.catatan_tambahan ?? p.cara_perawatan ?? "",
    atribut: atribut.length ? atribut : seedAtribut(p.kategori),
    faq: p.faq ?? [],
    hargaSupplier: p.harga_supplier ?? "",
    linkSupplier: p.link_supplier ?? "",
    kontakSupplier: p.kontak_supplier ?? "",
    statusStokSupplier: normalizeStockStatus(p.status_stok_supplier),
  };
}

function formToInput(form: FormState): ProductInput {
  const faq = form.faq.filter((q) => q.question.trim() || q.answer.trim());

  const atributObj: AtributKhusus = {};
  for (const row of form.atribut) {
    const key = row.key.trim();
    const value = row.value.trim();
    if (!key || !value) continue;
    const parts = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    atributObj[key] = parts.length > 1 ? parts : value;
  }

  return {
    nama: form.nama,
    platform: form.platform,
    kategori: form.kategori,
    harga: form.harga,
    modal: form.modal,
    detail: {
      stok: form.stok === "" ? null : Number(form.stok),
      faq: faq.length ? faq : null,
      deskripsi: form.deskripsi.trim() || null,
      masa_berlaku: form.masaBerlaku.trim() || null,
      sertifikasi: form.sertifikasi.trim() || null,
      kondisi_pengiriman: form.kondisiPengiriman.trim() || null,
      catatan_tambahan: form.catatanTambahan.trim() || null,
      atribut_khusus: Object.keys(atributObj).length ? atributObj : null,
      harga_supplier: form.hargaSupplier === "" ? null : Number(form.hargaSupplier),
      link_supplier: form.linkSupplier.trim() || null,
      kontak_supplier: form.kontakSupplier.trim() || null,
      status_stok_supplier: form.statusStokSupplier,
    },
  };
}

export function ProductsManager({
  products,
  plan,
}: {
  products: Product[];
  plan: Plan;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [tab, setTab] = useState<"dasar" | "detail">("dasar");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);

  const limit = PLAN_LIMITS[plan].savedProducts;
  const atLimit = Number.isFinite(limit) && products.length >= limit;

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  let sehat = 0,
    tipis = 0,
    rugi = 0;
  for (const p of products) {
    const { margin } = marginOf(p);
    if (margin >= 20) sehat++;
    else if (margin >= 5) tipis++;
    else rugi++;
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setTab("dasar");
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm(productToForm(p));
    setTab("dasar");
    setStatus(null);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit() {
    setStatus(null);
    const input = formToInput(form);
    startTransition(async () => {
      const res = editingId
        ? await updateProduct(editingId, input)
        : await saveProduct(input);
      if (res.ok) {
        setStatus({ msg: editingId ? "✓ Produk diperbarui" : "✓ Produk tersimpan", ok: true });
        resetForm();
        router.refresh();
      } else {
        setStatus({ msg: res.error, ok: false });
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (res.ok) router.refresh();
      else setStatus({ msg: res.error, ok: false });
    });
  }

  // Ganti kategori: kalau atribut belum diisi user (semua kosong), seed ulang
  // saran sesuai kategori baru. Kalau sudah ada isian, jangan timpa.
  function changeKategori(kategori: Kategori) {
    setForm((f) => {
      const untouched = f.atribut.every((r) => !r.value.trim());
      return { ...f, kategori, atribut: untouched ? seedAtribut(kategori) : f.atribut };
    });
  }

  // Atribut khusus helpers
  const addAtribut = () =>
    set({ atribut: [...form.atribut, { key: "", value: "" }] });
  const setAtribut = (i: number, patch: Partial<AtributRow>) =>
    set({ atribut: form.atribut.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) });
  const removeAtribut = (i: number) =>
    set({ atribut: form.atribut.filter((_, idx) => idx !== i) });

  // FAQ helpers
  const addFaq = () => set({ faq: [...form.faq, { question: "", answer: "" }] });
  const setFaq = (i: number, patch: Partial<FaqItem>) =>
    set({ faq: form.faq.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) });
  const removeFaq = (i: number) =>
    set({ faq: form.faq.filter((_, idx) => idx !== i) });

  const kategoriLabel =
    KATEGORI_OPTIONS.find((o) => o.value === form.kategori)?.label ?? form.kategori;

  return (
    <div>
      {products.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Total Produk" value={products.length} />
          <Metric label="Margin Sehat" value={sehat} color="text-green" />
          <Metric label="Margin Tipis" value={tipis} color="text-yellow" />
          <Metric label="Rugi" value={rugi} color="text-red" />
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[400px_1fr]">
        {/* FORM */}
        <Card title={editingId ? "Edit Produk" : "Tambah Produk"} icon="➕">
          {/* Tabs */}
          <div className="mb-4 flex gap-1 rounded-[10px] border border-border bg-surface2 p-1">
            {(["dasar", "detail"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                  tab === t ? "bg-surface text-accent2" : "text-muted hover:text-text"
                }`}
              >
                {t === "dasar" ? "Info Dasar" : "Detail Lengkap"}
              </button>
            ))}
          </div>

          {tab === "dasar" ? (
            <>
              <Field label="Nama Produk">
                <TextInput
                  value={form.nama}
                  onChange={(v) => set({ nama: v })}
                  placeholder="Contoh: Kaos Oversize Hitam"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Platform">
                  <SelectInput
                    value={form.platform}
                    onChange={(v) => set({ platform: v })}
                    options={PLATFORM_OPTIONS}
                  />
                </Field>
                <Field label="Kategori">
                  <SelectInput
                    value={form.kategori}
                    onChange={(v) => changeKategori(v)}
                    options={KATEGORI_OPTIONS}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Harga Jual">
                  <MoneyInput
                    value={form.harga || ""}
                    onChange={(v) => set({ harga: v })}
                    placeholder="150000"
                  />
                </Field>
                <Field label="Modal / HPP">
                  <MoneyInput
                    value={form.modal || ""}
                    onChange={(v) => set({ modal: v })}
                    placeholder="70000"
                  />
                </Field>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stok">
                  <NumberInput
                    value={form.stok}
                    onChange={(v) => set({ stok: v })}
                    placeholder="100"
                  />
                </Field>
                <Field label="Masa Berlaku / Garansi">
                  <TextInput
                    value={form.masaBerlaku}
                    onChange={(v) => set({ masaBerlaku: v })}
                    placeholder="1 thn garansi / 3 hari di kulkas"
                  />
                </Field>
              </div>
              <Field label="Sertifikasi" hint="opsional">
                <TextInput
                  value={form.sertifikasi}
                  onChange={(v) => set({ sertifikasi: v })}
                  placeholder="Halal MUI, BPOM, SNI"
                />
              </Field>
              <Field label="Kondisi Pengiriman">
                <TextInput
                  value={form.kondisiPengiriman}
                  onChange={(v) => set({ kondisiPengiriman: v })}
                  placeholder="Perlu ice pack / mudah pecah"
                />
              </Field>

              {/* Atribut khusus dinamis (saran per kategori) */}
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Atribut Khusus
                    <span className="ml-1 normal-case text-muted/70">
                      · sesuai {kategoriLabel}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={addAtribut}
                    className="text-[11.5px] font-semibold text-accent2 hover:underline"
                  >
                    + Tambah
                  </button>
                </div>
                {form.atribut.length === 0 && (
                  <p className="text-[12px] text-muted">
                    Belum ada atribut. Tambahkan sesuai produk kamu.
                  </p>
                )}
                <div className="space-y-2">
                  {form.atribut.map((row, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <input
                        value={row.key}
                        onChange={(e) => setAtribut(i, { key: e.target.value })}
                        placeholder="Label"
                        className="w-[38%] rounded-md border border-border bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-accent"
                      />
                      <input
                        value={row.value}
                        onChange={(e) => setAtribut(i, { value: e.target.value })}
                        placeholder={row.placeholder ?? "Nilai (koma = banyak)"}
                        className="flex-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={() => removeAtribut(i)}
                        className="px-1 py-1.5 text-[12px] text-muted hover:text-red"
                        title="Hapus atribut"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted">
                  Saran otomatis sesuai kategori — bebas ubah, hapus, atau tambah.
                  Pisahkan beberapa nilai dengan koma.
                </p>
              </div>

              <Field label="Deskripsi" hint="dipakai CS AI & listing">
                <Textarea
                  value={form.deskripsi}
                  onChange={(v) => set({ deskripsi: v })}
                  placeholder="Deskripsi produk lengkap…"
                  rows={3}
                />
              </Field>
              <Field label="Catatan Tambahan" hint="info bebas lain">
                <Textarea
                  value={form.catatanTambahan}
                  onChange={(v) => set({ catatanTambahan: v })}
                  placeholder="Info lain yang perlu diketahui pembeli…"
                  rows={2}
                />
              </Field>

              {/* Info supplier — catatan pribadi seller */}
              <div className="mb-4 rounded-[9px] border border-border bg-surface2/40 p-3">
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Info Supplier (opsional)
                </p>
                <Field label="Status Stok Supplier" hint="update manual saat cek ke supplier">
                  <SelectInput
                    value={form.statusStokSupplier}
                    onChange={(v) => set({ statusStokSupplier: v })}
                    options={STOCK_STATUS_OPTIONS}
                  />
                </Field>
                <Field label="Harga Supplier">
                  <MoneyInput
                    value={form.hargaSupplier || ""}
                    onChange={(v) => set({ hargaSupplier: v })}
                    placeholder="50000"
                  />
                </Field>
                <Field label="Link Supplier">
                  <TextInput
                    value={form.linkSupplier}
                    onChange={(v) => set({ linkSupplier: v })}
                    placeholder="https://… atau nama toko supplier"
                  />
                </Field>
                <Field label="Kontak Supplier">
                  <TextInput
                    value={form.kontakSupplier}
                    onChange={(v) => set({ kontakSupplier: v })}
                    placeholder="WA / nama kontak"
                  />
                </Field>
                <p className="text-[11px] text-muted">
                  Catatan pribadi kamu — tidak ditampilkan ke pembeli.
                </p>
              </div>

              {/* FAQ editor */}
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    FAQ Produk
                  </label>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="text-[11.5px] font-semibold text-accent2 hover:underline"
                  >
                    + Tambah
                  </button>
                </div>
                {form.faq.length === 0 && (
                  <p className="text-[12px] text-muted">
                    Belum ada FAQ. Tambahkan pertanyaan yang sering ditanya pembeli.
                  </p>
                )}
                <div className="space-y-2.5">
                  {form.faq.map((q, i) => (
                    <div key={i} className="rounded-[9px] border border-border bg-surface2 p-2.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-muted">
                          #{i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFaq(i)}
                          className="text-[11px] text-muted hover:text-red"
                        >
                          Hapus
                        </button>
                      </div>
                      <input
                        value={q.question}
                        onChange={(e) => setFaq(i, { question: e.target.value })}
                        placeholder="Pertanyaan"
                        className="mb-1.5 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-accent"
                      />
                      <textarea
                        value={q.answer}
                        onChange={(e) => setFaq(i, { answer: e.target.value })}
                        placeholder="Jawaban"
                        rows={2}
                        className="w-full resize-none rounded-md border border-border bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-accent"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!editingId && atLimit && (
            <p className="mb-3 rounded-[9px] border border-yellow/30 bg-yellow/10 px-3 py-2 text-[12px] text-yellow">
              Plan gratis penuh ({limit} produk). Hapus salah satu atau upgrade ke
              Pro untuk simpan lebih banyak.
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={pending || (!editingId && atLimit)}
            className="w-full rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-4 py-3 font-display text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Menyimpan…" : editingId ? "💾 Update Produk" : "💾 Simpan Produk"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="mt-2 w-full text-[12.5px] font-semibold text-muted hover:text-text"
            >
              Batal edit
            </button>
          )}
          {status && (
            <p className={`mt-2.5 text-center text-[12px] ${status.ok ? "text-green" : "text-red"}`}>
              {status.msg}
            </p>
          )}
        </Card>

        {/* LIST */}
        <div>
          {products.length === 0 ? (
            <div className="rounded-card border border-border bg-surface p-10 text-center">
              <div className="text-3xl">📦</div>
              <p className="mt-3 text-[14px] text-muted">
                Belum ada produk tersimpan.
                <br />
                Tambahkan produk pertama kamu di kiri, atau simpan langsung dari
                hasil tools lain.
              </p>
            </div>
          ) : (
            <Card title={`${products.length} Produk Tersimpan`} icon="📦">
              <div className="-my-2">
                {products.map((p) => {
                  const { profit, margin } = marginOf(p);
                  const color =
                    margin >= 20 ? "text-green" : margin >= 5 ? "text-yellow" : "text-red";
                  const stok = STOCK_STATUS_META[normalizeStockStatus(p.status_stok_supplier)];
                  return (
                    <div key={p.id} className="border-b border-border py-3.5 last:border-b-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${stok.dot}`}
                              title={`Stok supplier: ${stok.label}`}
                            />
                            <p className="truncate text-[14px] font-semibold">
                              {PLATFORM_ICON[p.platform]} {p.nama}
                            </p>
                          </div>
                          <p className="mt-0.5 text-[12px] text-muted">
                            {fmt(p.harga)} · modal {fmt(p.modal)} · {p.kategori}
                            {p.stok != null && ` · stok ${p.stok}`}
                            {" · "}
                            <span className={stok.text}>{stok.label}</span>
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`font-display text-[15px] font-bold ${color}`}>
                            {margin.toFixed(1)}%
                          </p>
                          <p className="text-[12px] text-muted">{fmt(profit)}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <QuickLink href={`/dashboard/profit?product=${p.id}`} label="🧮 Cek Profit" />
                        <QuickLink href={`/dashboard/promo?product=${p.id}`} label="🔥 Simulasi Promo" />
                        <QuickLink href={`/dashboard/products/${p.id}/history`} label="📜 History" />
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="rounded-md border border-border bg-surface2 px-2.5 py-1 text-[11.5px] font-semibold text-muted hover:text-text"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(p.id)}
                          disabled={pending}
                          className="rounded-md border border-border bg-surface2 px-2.5 py-1 text-[11.5px] font-semibold text-muted hover:text-red disabled:opacity-50"
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
          <p className="mt-3 text-center text-[11.5px] text-muted">
            Data ini dipakai bareng di semua tools LabaLab.
          </p>
        </div>
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
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 text-center">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className={`mt-1.5 font-display text-[22px] font-extrabold ${color ?? ""}`}>
        {value}
      </p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-border bg-surface2 px-2.5 py-1 text-[11.5px] font-semibold text-muted hover:text-accent2"
    >
      {label}
    </Link>
  );
}
