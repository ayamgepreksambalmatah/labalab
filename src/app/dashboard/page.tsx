import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

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
    ready: false,
  },
  {
    href: "/dashboard/analyzer",
    icon: "📊",
    title: "Sales Analyzer",
    desc: "Upload laporan penjualan, temukan profit hilang.",
    ready: false,
  },
  {
    href: "/dashboard/doctor",
    icon: "🩺",
    title: "Product Doctor",
    desc: "Audit listing produk pakai AI.",
    ready: false,
  },
];

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, plan")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || profile?.email || "Seller";
  const isPro = profile?.plan === "pro";

  return (
    <div>
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

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
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
