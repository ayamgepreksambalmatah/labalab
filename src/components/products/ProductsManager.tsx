"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Plan, Platform } from "@/types/database";
import type { Product } from "@/lib/products/queries";
import {
  KATEGORI_OPTIONS,
  PLATFORM_OPTIONS,
  type Kategori,
} from "@/lib/calc/profit";
import { fmt } from "@/lib/format";
import { PLAN_LIMITS } from "@/lib/plans";
import {
  saveProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/products/actions";
import {
  Card,
  Field,
  MoneyInput,
  SelectInput,
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

const emptyForm = {
  nama: "",
  platform: "shopee" as Platform,
  kategori: "fashion" as Kategori,
  harga: 0,
  modal: 0,
};

export function ProductsManager({
  products,
  plan,
}: {
  products: Product[];
  plan: Plan;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);

  const limit = PLAN_LIMITS[plan].savedProducts;
  const atLimit = Number.isFinite(limit) && products.length >= limit;

  // metrics
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
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      nama: p.nama,
      platform: p.platform,
      kategori: p.kategori,
      harga: p.harga,
      modal: p.modal,
    });
    setStatus(null);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit() {
    setStatus(null);
    startTransition(async () => {
      const res = editingId
        ? await updateProduct(editingId, form)
        : await saveProduct(form);
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

  return (
    <div>
      {/* METRICS */}
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
          <Field label="Nama Produk">
            <TextInput
              value={form.nama}
              onChange={(v) => setForm({ ...form, nama: v })}
              placeholder="Contoh: Kaos Oversize Hitam"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Platform">
              <SelectInput
                value={form.platform}
                onChange={(v) => setForm({ ...form, platform: v })}
                options={PLATFORM_OPTIONS}
              />
            </Field>
            <Field label="Kategori">
              <SelectInput
                value={form.kategori}
                onChange={(v) => setForm({ ...form, kategori: v })}
                options={KATEGORI_OPTIONS}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Harga Jual">
              <MoneyInput
                value={form.harga || ""}
                onChange={(v) => setForm({ ...form, harga: v })}
                placeholder="150000"
              />
            </Field>
            <Field label="Modal / HPP">
              <MoneyInput
                value={form.modal || ""}
                onChange={(v) => setForm({ ...form, modal: v })}
                placeholder="70000"
              />
            </Field>
          </div>

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
            {pending
              ? "Menyimpan…"
              : editingId
                ? "💾 Update Produk"
                : "💾 Simpan Produk"}
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
            <p
              className={`mt-2.5 text-center text-[12px] ${status.ok ? "text-green" : "text-red"}`}
            >
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
                    margin >= 20
                      ? "text-green"
                      : margin >= 5
                        ? "text-yellow"
                        : "text-red";
                  return (
                    <div
                      key={p.id}
                      className="border-b border-border py-3.5 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold">
                            {PLATFORM_ICON[p.platform]} {p.nama}
                          </p>
                          <p className="mt-0.5 text-[12px] text-muted">
                            {fmt(p.harga)} · modal {fmt(p.modal)} · {p.kategori}
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
