"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KATEGORI_OPTIONS } from "@/lib/calc/profit";
import type { Product } from "@/lib/products/queries";
import type { ListingAiResult } from "@/lib/ai/prompts";
import {
  Card,
  Field,
  MoneyInput,
  SelectInput,
  Textarea,
  TextInput,
} from "@/components/tools/controls";
import { ProductPicker } from "@/components/tools/ProductPicker";

export function ListingGenerator({ products = [] }: { products?: Product[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState("");
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState<string>("fashion");
  const [harga, setHarga] = useState(0);
  const [keunggulan, setKeunggulan] = useState("");
  const [bahan, setBahan] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const [result, setResult] = useState<ListingAiResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function loadFromProduct(p: Product | null) {
    setPicked(p?.id ?? "");
    if (!p) return;
    setNama(p.nama);
    setKategori(p.kategori);
    setHarga(p.harga);
    setBahan(p.bahan ?? "");
    if (p.deskripsi) setKeunggulan(p.deskripsi);
  }

  async function generate() {
    setError("");
    setLimitReached(false);
    if (!nama.trim()) {
      setError("Isi minimal nama produk.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/listing-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          kategori,
          harga: harga ? String(harga) : "",
          keunggulan,
          bahan,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLimitReached(!!data.quotaExceeded);
        setError(data.error || "Gagal membuat listing.");
        return;
      }
      setResult(data.ai);
      router.refresh(); // update QuotaBar
    } catch {
      setError("Gagal menghubungi server. Coba lagi ya.");
    } finally {
      setLoading(false);
    }
  }

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[400px_1fr]">
      {/* FORM */}
      <Card title="Info Produk" icon="✍️">
        <ProductPicker products={products} value={picked} onPick={loadFromProduct} />
        <Field label="Nama Produk">
          <TextInput value={nama} onChange={setNama} placeholder="Contoh: Kaos Oversize Hitam" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kategori">
            <SelectInput value={kategori} onChange={setKategori} options={KATEGORI_OPTIONS} />
          </Field>
          <Field label="Harga Jual">
            <MoneyInput value={harga || ""} onChange={setHarga} placeholder="150000" />
          </Field>
        </div>
        <Field label="Bahan / Material">
          <TextInput value={bahan} onChange={setBahan} placeholder="Cotton Combed 30s" />
        </Field>
        <Field label="Keunggulan / Detail" hint="poin jualan">
          <Textarea
            value={keunggulan}
            onChange={setKeunggulan}
            placeholder="Adem, tidak menerawang, jahitan rapi, cocok daily wear…"
            rows={3}
          />
        </Field>

        {error && (
          <div className="mb-3 rounded-[9px] border border-red/40 bg-red/10 px-3 py-2 text-[13px] text-red">
            {error}
            {limitReached && (
              <a
                href="/pricing"
                className="mt-1.5 block font-semibold text-accent2 hover:underline"
              >
                Upgrade Sekarang →
              </a>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="w-full rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-4 py-3 font-display text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "AI sedang meracik listing…" : "✍️ Buatkan Listing"}
        </button>
      </Card>

      {/* HASIL */}
      <div>
        {!result && !loading && (
          <div className="rounded-card border border-border bg-surface p-12 text-center">
            <div className="text-3xl">✍️</div>
            <p className="mt-3 text-[14px] text-muted">
              Isi info produk di kiri, AI akan buatkan judul, deskripsi, dan kata
              kunci yang siap tempel.
            </p>
          </div>
        )}

        {loading && (
          <div className="rounded-card border border-border bg-surface p-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
            <p className="text-sm text-muted">AI sedang meracik listing kamu…</p>
          </div>
        )}

        {result && (
          <>
            <Block
              title="Judul"
              icon="🏷️"
              text={result.judul}
              copyKey="judul"
              copied={copied}
              onCopy={copy}
            />
            <Block
              title="Deskripsi"
              icon="📝"
              text={result.deskripsi}
              copyKey="deskripsi"
              copied={copied}
              onCopy={copy}
              multiline
            />
            <Card title="Poin Keunggulan" icon="✅">
              <ul className="space-y-2">
                {result.poinKeunggulan.map((p, i) => (
                  <li key={i} className="text-[13.5px] leading-relaxed text-text/90">
                    ✓ {p}
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Kata Kunci" icon="🔎">
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((k, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-border bg-surface2 px-2.5 py-1 text-[12px] text-accent2"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function Block({
  title,
  icon,
  text,
  copyKey,
  copied,
  onCopy,
  multiline,
}: {
  title: string;
  icon: string;
  text: string;
  copyKey: string;
  copied: string | null;
  onCopy: (k: string, t: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="mb-4 overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-surface2 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[14px]">{icon}</span>
          <h3 className="font-display text-[13px] font-bold">{title}</h3>
        </div>
        <button
          type="button"
          onClick={() => onCopy(copyKey, text)}
          className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-semibold text-muted hover:text-text"
        >
          {copied === copyKey ? "✓ Tersalin" : "Salin"}
        </button>
      </div>
      <p className={`p-5 text-[13.5px] leading-relaxed ${multiline ? "whitespace-pre-wrap" : ""}`}>
        {text}
      </p>
    </div>
  );
}
