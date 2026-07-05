"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KATEGORI_OPTIONS } from "@/lib/calc/profit";
import type { DoctorAiResult } from "@/lib/ai/prompts";
import { Card, Field, MoneyInput, SelectInput, TextInput } from "@/components/tools/controls";

type Photo = { dataUrl: string; mediaType: string; base64: string };

const inputCls =
  "w-full rounded-[9px] border border-border bg-surface2 px-3.5 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-muted focus:border-accent";

export function ProductDoctor() {
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [harga, setHarga] = useState(0);
  const [kategori, setKategori] = useState<string>("fashion");
  const [review, setReview] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [photo, setPhoto] = useState<Photo | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const [result, setResult] = useState<DoctorAiResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const router = useRouter();

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result ?? "");
      setPhoto({
        dataUrl,
        mediaType: file.type,
        base64: dataUrl.split(",")[1] ?? "",
      });
    };
    reader.readAsDataURL(file);
  }

  async function audit() {
    setError("");
    setLimitReached(false);
    if (!judul.trim() && !deskripsi.trim() && !photo) {
      setError("Isi minimal judul atau deskripsi produk untuk diaudit.");
      return;
    }
    setLoading(true);
    setResult(null);
    setReviewed(!!review.trim());
    try {
      const res = await fetch("/api/ai/product-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul,
          deskripsi,
          harga: harga ? String(harga) : "",
          kategori,
          review,
          image: photo ? { media_type: photo.mediaType, data: photo.base64 } : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLimitReached(!!data.quotaExceeded);
        setError(data.error || "Gagal mengaudit.");
        return;
      }
      setResult(data.ai);
      router.refresh(); // update QuotaBar (server) dengan pemakaian terbaru
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

  const score = result?.skor ?? 0;
  const scoreColor =
    score >= 75 ? "text-green" : score >= 50 ? "text-yellow" : "text-red";
  const scoreStroke =
    score >= 75 ? "#10d98e" : score >= 50 ? "#fbbf24" : "#ff5c5c";
  const circ = 2 * Math.PI * 38;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[400px_1fr]">
      {/* FORM */}
      <Card title="Data Listing Kamu" icon="📋">
        <Field label="Foto Produk (opsional)">
          <label className="block cursor-pointer rounded-[9px] border border-dashed border-border bg-surface2 p-4 text-center hover:border-accent/50">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo.dataUrl}
                alt="preview"
                className="mx-auto max-h-40 rounded-md"
              />
            ) : (
              <>
                <div className="text-2xl">📷</div>
                <p className="mt-1 text-[12.5px] text-muted">Upload Foto Produk</p>
              </>
            )}
            <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </label>
        </Field>
        <Field label="Judul Produk Sekarang">
          <TextInput value={judul} onChange={setJudul} placeholder="Contoh: Kaos Oversize" />
        </Field>
        <Field label="Deskripsi Produk Sekarang">
          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            rows={4}
            placeholder="Paste deskripsi produk kamu yang sekarang…"
            className={`${inputCls} resize-none`}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Harga Jual">
            <MoneyInput value={harga || ""} onChange={setHarga} placeholder="150000" />
          </Field>
          <Field label="Kategori">
            <SelectInput value={kategori} onChange={setKategori} options={KATEGORI_OPTIONS} />
          </Field>
        </div>
        <Field label="Paste Review Pembeli (opsional)">
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
            placeholder="Copy-paste review dari Shopee/Tokopedia — satu review per baris atau dipisah apa saja, AI akan otomatis pisahkan…"
            className={`${inputCls} resize-none`}
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
          onClick={audit}
          disabled={loading}
          className="w-full rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-4 py-3 font-display text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "AI sedang mengaudit…" : "🩺 Audit Listing Ini"}
        </button>
      </Card>

      {/* HASIL */}
      <div>
        {!result && !loading && (
          <div className="rounded-card border border-border bg-surface p-12 text-center">
            <div className="text-3xl">🩺</div>
            <p className="mt-3 text-[14px] text-muted">
              Isi data listing kamu di kiri,
              <br />
              AI akan kasih skor dan saran perbaikan.
            </p>
          </div>
        )}

        {loading && (
          <div className="rounded-card border border-border bg-surface p-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
            <p className="text-sm text-muted">AI sedang mengaudit listing kamu…</p>
          </div>
        )}

        {result && (
          <>
            <div className="mb-4 flex items-center gap-5 rounded-card border border-border bg-surface p-6">
              <div className="relative h-24 w-24 shrink-0">
                <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                  <circle cx="48" cy="48" r="38" fill="none" stroke="#2a2a3d" strokeWidth="8" />
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    fill="none"
                    stroke={scoreStroke}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - score / 100)}
                  />
                </svg>
                <span
                  className={`absolute inset-0 flex items-center justify-center font-display text-[22px] font-extrabold ${scoreColor}`}
                >
                  {score}
                </span>
              </div>
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted">
                  Skor Listing
                </p>
                <p className="mt-0.5 font-display text-lg font-bold">
                  {score >= 75 ? "Sudah bagus 🎉" : score >= 50 ? "Perlu perbaikan" : "Butuh banyak perbaikan"}
                </p>
              </div>
            </div>

            <Card title="Masalah Ditemukan" icon="🔍">
              <ul className="space-y-2">
                {result.masalah.map((m, i) => (
                  <li key={i} className="text-[13.5px] leading-relaxed text-text/90">
                    ❌ {m}
                  </li>
                ))}
              </ul>
            </Card>

            <ResultBlock
              title="Judul Baru"
              icon="✨"
              text={result.judulBaru}
              copyKey="judul"
              copied={copied}
              onCopy={copy}
            />
            <ResultBlock
              title="Deskripsi Baru"
              icon="📝"
              text={result.deskripsiBaru}
              copyKey="deskripsi"
              copied={copied}
              onCopy={copy}
              multiline
            />

            <Card title="Ide Foto" icon="📷">
              <ul className="space-y-2">
                {result.ideFoto.map((f, i) => (
                  <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed text-text/90">
                    <span className="text-accent2">{i + 1}.</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {reviewed && result.analisisReview && (
              <Card title="Analisis Review" icon="🗣️">
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-text/90">
                  {result.analisisReview}
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ResultBlock({
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
