import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { resolvePlan } from "@/lib/plans";
import { getCompilation, getSalesSummary } from "@/lib/products/dashboard";
import { fmt } from "@/lib/format";

const PLATFORM_META: Record<string, { emoji: string; label: string }> = {
  shopee: { emoji: "🟠", label: "Shopee" },
  tokopedia: { emoji: "🟢", label: "Tokopedia" },
  tiktok: { emoji: "🎵", label: "TikTok" },
  instagram: { emoji: "📸", label: "Instagram" },
  lainnya: { emoji: "🏷️", label: "Lainnya" },
};

export const metadata: Metadata = {
  title: "Ringkasan",
  robots: { index: false, follow: false },
};

const TOOLS = [
  {
    href: "/dashboard/profit",
    icon: "🧮",
    title: "Cek Untung Asli",
    desc: "Hitung margin bersih setelah semua potongan marketplace.",
    ready: true,
  },
  {
    href: "/dashboard/promo",
    icon: "🔥",
    title: "Promo Simulator",
    desc: "Cek kelayakan ikut flash sale sebelum rugi.",
    ready: true,
  },
  {
    href: "/dashboard/products",
    icon: "📦",
    title: "Produk Saya",
    desc: "Simpan produk & pakai ulang di semua tools.",
    ready: true,
  },
  {
    href: "/dashboard/analyzer",
    icon: "📊",
    title: "Sales Analyzer",
    desc: "Upload laporan penjualan, temukan profit hilang.",
    ready: true,
  },
  {
    href: "/dashboard/doctor",
    icon: "🩺",
    title: "Product Doctor",
    desc: "Audit listing produk pakai AI.",
    ready: true,
  },
  {
    href: "/dashboard/listing",
    icon: "✍️",
    title: "Listing Generator",
    desc: "Buat judul, deskripsi & kata kunci produk otomatis.",
    ready: true,
  },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>;
}) {
  const supabase = await createServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, plan, plan_expires_at")
    .eq("id", userId)
    .single();

  const displayName = profile?.full_name || profile?.email || "Seller";
  const isPro = resolvePlan(profile?.plan, profile?.plan_expires_at) === "pro";
  const { upgrade } = await searchParams;
  const [comp, summary] = await Promise.all([getCompilation(), getSalesSummary()]);

  return (
    <div>
      {upgrade === "success" && (
        <div className="mb-6 rounded-card border border-green/40 bg-green/10 px-4 py-3 text-[13px] text-green">
          {isPro
            ? "🎉 Pembayaran berhasil — kamu sekarang LabaLab Pro!"
            : "🎉 Pembayaran diterima! Status Pro sedang diproses, refresh sebentar lagi."}
        </div>
      )}
      {upgrade === "pending" && (
        <div className="mb-6 rounded-card border border-yellow/40 bg-yellow/10 px-4 py-3 text-[13px] text-yellow">
          ⏳ Pembayaran kamu sedang menunggu penyelesaian. Status Pro aktif
          otomatis setelah pembayaran dikonfirmasi.
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Halo, {displayName} 👋
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Pilih tools di bawah untuk mulai meracik profit toko kamu.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
            isPro
              ? "border border-green/40 bg-green/10 text-green"
              : "border border-border bg-surface2 text-muted"
          }`}
        >
          {isPro ? "Pro" : "Free"}
        </span>
      </div>

      {summary.hasTransactions ? (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-[15px] font-bold">
              📊 Ringkasan Penjualan (semua channel)
            </h2>
            <Link
              href="/dashboard/laporan"
              className="shrink-0 text-[12px] font-semibold text-accent2 hover:underline"
            >
              Lihat Laporan Detail →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Total Omzet" value={fmt(summary.totalOmzet)} />
            <StatBox
              label="Total Profit"
              value={fmt(summary.totalProfit)}
              color={summary.totalProfit >= 0 ? "text-green" : "text-red"}
            />
            <StatBox label="Margin" value={`${summary.margin.toFixed(1)}%`} />
            <StatBox label="Unit Terjual" value={String(summary.totalUnit)} />
          </div>

          <div className="mt-3 rounded-card border border-border bg-surface p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted">
              Breakdown per Platform
            </p>
            <ul className="space-y-2.5">
              {summary.byPlatform.map((p) => {
                const m = PLATFORM_META[p.platform] ?? { emoji: "🏷️", label: p.platform };
                return (
                  <li key={p.platform}>
                    <div className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="font-medium">
                        {m.emoji} {m.label}
                      </span>
                      <span className="shrink-0 text-muted">
                        <b className="text-text">{fmt(p.omzet)}</b>{" "}
                        <span className="tabular-nums">({p.pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-accent2"
                        style={{ width: `${Math.max(2, p.pct)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-card border border-dashed border-border bg-surface p-6 text-center">
          <p className="font-display text-[15px] font-bold">Belum ada data penjualan</p>
          <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-muted">
            Upload laporan di{" "}
            <Link href="/dashboard/analyzer" className="font-semibold text-accent2 hover:underline">
              Sales Analyzer
            </Link>{" "}
            atau catat penjualan Instagram/PO manual di{" "}
            <Link href="/dashboard/laporan" className="font-semibold text-accent2 hover:underline">
              Laporan Detail
            </Link>{" "}
            untuk melihat ringkasan profit semua channel di sini.
          </p>
        </div>
      )}

      {comp.hasHistory && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-[15px] font-bold">
            Performa per Produk (dari history)
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-card border border-border bg-surface p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-green">
                Produk Terbaik
              </p>
              {comp.produkTerbaik.length === 0 ? (
                <p className="text-[12.5px] text-muted">Belum ada data.</p>
              ) : (
                <ul className="space-y-1.5">
                  {comp.produkTerbaik.map((p) => (
                    <li key={p.id}>
                      <SnapshotRow id={p.id} nama={p.nama} right={fmt(p.profit)} rightColor="text-green" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-card border border-border bg-surface p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-red">
                Perlu Perhatian (margin &lt; 10%)
              </p>
              {comp.produkBermasalah.length === 0 ? (
                <p className="text-[12.5px] text-muted">Tidak ada 🎉</p>
              ) : (
                <ul className="space-y-1.5">
                  {comp.produkBermasalah.map((p) => (
                    <li key={p.id}>
                      <SnapshotRow
                        id={p.id}
                        nama={p.nama}
                        right={`${p.margin.toFixed(1)}%`}
                        rightColor="text-red"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <h2 className="mt-8 mb-3 font-display text-[15px] font-bold">Tools</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {TOOLS.map((tool) =>
          tool.ready ? (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-card border border-border bg-surface p-5 transition-colors hover:border-accent/50 hover:bg-surface2"
            >
              <div className="text-2xl">{tool.icon}</div>
              <h2 className="mt-3 font-display text-[15px] font-bold group-hover:text-accent2">
                {tool.title}
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                {tool.desc}
              </p>
            </Link>
          ) : (
            <div
              key={tool.href}
              className="rounded-card border border-border bg-surface/50 p-5 opacity-60"
            >
              <div className="flex items-start justify-between">
                <div className="text-2xl">{tool.icon}</div>
                <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted">
                  Segera
                </span>
              </div>
              <h2 className="mt-3 font-display text-[15px] font-bold">
                {tool.title}
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                {tool.desc}
              </p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 text-center">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className={`mt-1.5 font-display text-[18px] font-extrabold ${color ?? ""}`}>
        {value}
      </p>
    </div>
  );
}

function SnapshotRow({
  id,
  nama,
  right,
  rightColor,
}: {
  id: string;
  nama: string;
  right: string;
  rightColor: string;
}) {
  return (
    <Link
      href={`/dashboard/products/${id}/history`}
      className="flex items-center justify-between gap-2 text-[13px] hover:text-accent2"
    >
      <span className="min-w-0 truncate">{nama}</span>
      <span className={`shrink-0 font-display font-bold ${rightColor}`}>{right}</span>
    </Link>
  );
}
