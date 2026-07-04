import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Logo } from "@/components/Logo";
import { UpgradeButton } from "@/components/pricing/UpgradeButton";
import { createServerClient } from "@/lib/supabase/server";
import { PRO_PRICE_IDR, resolvePlan } from "@/lib/plans";
import { fmt } from "@/lib/format";

export const metadata: Metadata = {
  title: "Harga",
  alternates: { canonical: "/pricing" },
};

const FREE_FEATURES = [
  "Cek Untung Asli & Promo Simulator (unlimited)",
  "Simpan sampai 3 produk",
  "Sales Analyzer 1×/bulan",
  "Product Doctor 1×/bulan",
];

const PRO_FEATURES = [
  "Semua fitur gratis, tanpa batas",
  "Simpan produk unlimited",
  "Sales Analyzer unlimited",
  "Product Doctor unlimited",
  "Prioritas fitur baru",
];

export default async function PricingPage() {
  const supabase = await createServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  const isLoggedIn = !!userId;

  let isPro = false;
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", userId)
      .single();
    isPro = resolvePlan(profile?.plan, profile?.plan_expires_at) === "pro";
  }

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const snapUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";

  return (
    <main className="min-h-screen px-6 py-14">
      {clientKey && (
        <Script src={snapUrl} data-client-key={clientKey} strategy="afterInteractive" />
      )}

      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <Link href="/">
            <Logo size={30} />
          </Link>
          <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight">
            Harga sederhana, hemat jelas
          </h1>
          <p className="mt-2 text-sm text-muted">
            Mulai gratis. Upgrade kapan saja saat butuh lebih.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {/* FREE */}
          <div className="rounded-card border border-border bg-surface p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">
              Gratis
            </p>
            <p className="mt-3 font-display text-3xl font-extrabold">Rp 0</p>
            <p className="text-[13px] text-muted">selamanya</p>
            <ul className="mt-5 space-y-2.5 text-[13px]">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex gap-2 text-text/90">
                  <span className="text-muted">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="block rounded-[10px] border border-border px-4 py-3 text-center text-sm font-semibold text-text hover:bg-surface2"
                >
                  Ke Dashboard
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="block rounded-[10px] border border-border px-4 py-3 text-center text-sm font-semibold text-text hover:bg-surface2"
                >
                  Mulai gratis
                </Link>
              )}
            </div>
          </div>

          {/* PRO */}
          <div className="relative rounded-card border border-accent/50 bg-surface p-6">
            <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-accent to-accent2 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Populer
            </span>
            <p className="text-xs font-bold uppercase tracking-widest text-accent2">
              Jualan Pro
            </p>
            <p className="mt-3 font-display text-3xl font-extrabold">
              {fmt(PRO_PRICE_IDR)}
            </p>
            <p className="text-[13px] text-muted">per bulan</p>
            <ul className="mt-5 space-y-2.5 text-[13px]">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex gap-2 text-text/90">
                  <span className="text-accent2">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <UpgradeButton isLoggedIn={isLoggedIn} isPro={isPro} />
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[12px] text-muted">
          Pembayaran aman via Midtrans — QRIS, Virtual Account, e-wallet.
        </p>
      </div>
    </main>
  );
}
