"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Platform } from "@/types/database";
import type { Product } from "@/lib/products/queries";
import { fmt } from "@/lib/format";
import { saveProduct } from "@/lib/products/actions";
import {
  computeProfit,
  COMMISSION_RATES,
  KATEGORI_OPTIONS,
  PLATFORM_OPTIONS,
  type Kategori,
  type VerdictClass,
} from "@/lib/calc/profit";
import {
  Card,
  Field,
  MoneyInput,
  SelectInput,
  SliderRow,
  TextInput,
} from "@/components/tools/controls";
import { ProductPicker } from "@/components/tools/ProductPicker";

const VERDICT_STYLE: Record<VerdictClass, string> = {
  bagus: "border-green/40 bg-green/10 text-green",
  lumayan: "border-yellow/40 bg-yellow/10 text-yellow",
  bahaya: "border-red/40 bg-red/10 text-red",
  minus: "border-red/40 bg-red/10 text-red",
};

const PLATFORM_HINT: Record<Platform, string> = {
  shopee: "(Estimasi fee platform Shopee)",
  tokopedia: "(Estimasi fee platform Tokopedia)",
  tiktok: "(Estimasi fee platform TikTok)",
};

export function ProfitChecker({
  products = [],
  initialProduct = null,
}: {
  products?: Product[];
  initialProduct?: Product | null;
}) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [picked, setPicked] = useState(initialProduct?.id ?? "");
  const [nama, setNama] = useState(initialProduct?.nama ?? "");
  const [platform, setPlatform] = useState<Platform>(initialProduct?.platform ?? "shopee");
  const [kategori, setKategori] = useState<Kategori>(initialProduct?.kategori ?? "fashion");
  const [harga, setHarga] = useState(initialProduct?.harga ?? 150000);
  const [modal, setModal] = useState(initialProduct?.modal ?? 70000);
  const [packaging, setPackaging] = useState(3000);
  const [commPct, setCommPct] = useState(
    initialProduct
      ? COMMISSION_RATES[initialProduct.platform][initialProduct.kategori]
      : COMMISSION_RATES.shopee.fashion,
  );
  const [adsPct, setAdsPct] = useState(5);
  const [ongkirPct, setOngkirPct] = useState(4);

  // Ganti platform/kategori → komisi mengikuti tabel estimasi (seperti prototype).
  function pickPlatform(p: Platform) {
    setPlatform(p);
    setCommPct(COMMISSION_RATES[p][kategori]);
  }
  function pickKategori(k: Kategori) {
    setKategori(k);
    setCommPct(COMMISSION_RATES[platform][k]);
  }

  function loadFromProduct(p: Product | null) {
    setPicked(p?.id ?? "");
    if (!p) return;
    setNama(p.nama);
    setPlatform(p.platform);
    setKategori(p.kategori);
    setHarga(p.harga);
    setModal(p.modal);
    setCommPct(COMMISSION_RATES[p.platform][p.kategori]);
  }

  function handleSave() {
    setSaveMsg(null);
    if (!nama.trim()) {
      setSaveMsg({ text: "Isi dulu Nama Produk untuk menyimpan.", ok: false });
      return;
    }
    startSaving(async () => {
      const res = await saveProduct({ nama, platform, kategori, harga, modal });
      setSaveMsg(
        res.ok
          ? { text: `✓ "${nama.trim()}" tersimpan ke Produk Saya`, ok: true }
          : { text: res.error, ok: false },
      );
      if (res.ok) router.refresh();
    });
  }

  const r = useMemo(
    () => computeProfit({ harga, modal, packaging, commPct, adsPct, ongkirPct }),
    [harga, modal, packaging, commPct, adsPct, ongkirPct],
  );

  const profitColor =
    r.profit >= 0
      ? r.margin >= 15
        ? "text-green"
        : "text-yellow"
      : "text-red";

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[400px_1fr]">
      {/* FORM */}
      <Card title="Info Produk" icon="🏪">
        <ProductPicker products={products} value={picked} onPick={loadFromProduct} />
        <Field label="Nama Produk">
          <TextInput value={nama} onChange={setNama} placeholder="Contoh: Kaos Oversize Hitam" />
        </Field>
        <Field label="Platform">
          <SelectInput value={platform} onChange={pickPlatform} options={PLATFORM_OPTIONS} />
        </Field>
        <Field label="Kategori">
          <SelectInput value={kategori} onChange={pickKategori} options={KATEGORI_OPTIONS} />
        </Field>
        <Field label="Harga Jual">
          <MoneyInput value={harga} onChange={setHarga} />
        </Field>
        <Field label="Modal / HPP">
          <MoneyInput value={modal} onChange={setModal} />
        </Field>
        <Field label="Packaging">
          <MoneyInput value={packaging} onChange={setPackaging} />
        </Field>
        <Field label="Komisi Platform" hint={PLATFORM_HINT[platform]}>
          <SliderRow min={1} max={20} step={0.5} value={commPct} onChange={setCommPct} />
        </Field>
        <Field label="Biaya Iklan (% harga jual)">
          <SliderRow min={0} max={20} step={0.5} value={adsPct} onChange={setAdsPct} />
        </Field>
        <Field label="Subsidi Gratis Ongkir">
          <SliderRow min={0} max={15} step={0.5} value={ongkirPct} onChange={setOngkirPct} />
        </Field>
      </Card>

      {/* HASIL */}
      <div>
        <div className="mb-4 rounded-card border border-border bg-surface p-7 text-center">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted">
            Profit Bersih per Unit
          </p>
          <p className={`my-2 font-display text-[44px] font-extrabold leading-none tracking-tight ${profitColor}`}>
            {fmt(r.profit)}
          </p>
          <p className={`mb-3.5 text-[15px] font-semibold ${profitColor}`}>
            Margin {r.margin.toFixed(1)}%
          </p>
          <span
            className={`inline-block rounded-full border px-5 py-1.5 text-[13px] font-bold ${VERDICT_STYLE[r.verdict.cls]}`}
          >
            {r.verdict.text}
          </span>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg border border-border bg-surface2 px-4 py-1.5 text-[12px] font-semibold text-text hover:bg-surface3 transition-colors disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : "💾 Simpan ke Produk Saya"}
            </button>
            {saveMsg && (
              <p className={`mt-2 text-[12px] ${saveMsg.ok ? "text-green" : "text-red"}`}>
                {saveMsg.text}
              </p>
            )}
          </div>
        </div>

        <Card title="Rincian Potongan" icon="🔍">
          <Row label="Harga Jual" value={fmt(harga)} dark />
          <Row label="— Modal / HPP" value={`-${fmt(modal)}`} negative />
          <Row label="— Packaging" value={`-${fmt(packaging)}`} negative />
          <Row label={`— Komisi (${commPct}%)`} value={`-${fmt(r.komisi)}`} negative />
          <Row label={`— Iklan (${adsPct}%)`} value={`-${fmt(r.iklan)}`} negative />
          <Row label={`— Ongkir (${ongkirPct}%)`} value={`-${fmt(r.ongkir)}`} negative />
          <Row label="Profit Bersih" value={fmt(r.profit)} total valueClass={profitColor} />

          {r.margin < 20 && (
            <div className="mt-3.5 rounded-[9px] border border-red/30 bg-red/10 p-3 text-[12px] text-red">
              💡 Untuk margin 20%, harga jual minimum:{" "}
              <strong>
                {Number.isFinite(r.minHarga)
                  ? fmt(r.minHarga)
                  : "tidak tercapai (potongan terlalu besar)"}
              </strong>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  negative,
  dark,
  total,
  valueClass,
}: {
  label: string;
  value: string;
  negative?: boolean;
  dark?: boolean;
  total?: boolean;
  valueClass?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between border-b border-border py-2.5 text-[13px] last:border-b-0 ${
        total ? "border-b-0 pt-3.5 text-[14px] font-bold" : ""
      }`}
    >
      <span className={dark || total ? "text-text" : "text-muted"}>{label}</span>
      <span
        className={`font-display font-semibold ${
          valueClass ?? (negative ? "text-red" : "text-text")
        }`}
      >
        {value}
      </span>
    </div>
  );
}
