import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Logo } from "@/components/Logo";
import { UpgradeButton } from "@/components/pricing/UpgradeButton";
import { createServerClient } from "@/lib/supabase/server";
import { PRO_PRICE_IDR, MAX_PRICE_IDR, resolvePlan } from "@/lib/plans";
import { fmt } from "@/lib/format";
import type { Plan } from "@/types/database";

export const metadata: Metadata = {
  title: "Harga",
  alternates: { canonical: "/pricing" },
};

type Tier = {
  key: Plan;
  name: string;
  price: string;
  period: string;
  popular?: boolean;
  features: string[];
};

const TIERS: Tier[] = [
  {
    key: "free",
    name: "Gratis",
    price: "Rp 0",
    period: "selamanya",
    features: [
      "Cek Untung Asli & Promo Simulator: unlimited",
      "Sales Analyzer: 1×/bulan",
      "Product Doctor + Review: 3×/bulan",
      "CS AI Assistant: 20 balasan/bulan",
      "Produk Saya: 3 produk",
    ],
  },
  {
    key: "pro",
    name: "Jualan Pro",
    price: fmt(PRO_PRICE_IDR),
    period: "per bulan",
    popular: true,
    features: [
      "Cek Untung Asli & Promo Simulator: unlimited",
      "Sales Analyzer: 10×/bulan",
      "Product Doctor + Review: 30×/bulan",
      "CS AI Assistant: 500 balasan/bulan",
      "Produk Saya: unlimited",
    ],
  },
  {
    key: "max",
    name: "LabaLab Max",
    price: fmt(MAX_PRICE_IDR),
    period: "per bulan",
    features: [
      "Cek Untung Asli & Promo Simulator: unlimited",
      "Sales Analyzer: unlimited",
      "Product Doctor + Review: unlimited",
      "CS AI Assistant: 3.000 balasan/bulan",
      "Produk Saya: unlimited + multi-toko",
    ],
  },
];

export default async function PricingPage() {
  const supabase = await createServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  const isLoggedIn = !!userId;

  let currentPlan: Plan = "free";
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", userId)
      .single();
    currentPlan = resolvePlan(profile?.plan, profile?.plan_expires_at);
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

      <div className="mx-auto max-w-5xl">
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

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TIERS.map((tier) => {
            const isPaid = tier.key !== "free";
            return (
              <div
                key={tier.key}
                className={`relative rounded-card border bg-surface p-6 ${
                  tier.popular ? "border-accent/50" : "border-border"
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-accent to-accent2 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    Populer
                  </span>
                )}
                <p
                  className={`text-xs font-bold uppercase tracking-widest ${
                    isPaid ? "text-accent2" : "text-muted"
                  }`}
                >
                  {tier.name}
                </p>
                <p className="mt-3 font-display text-3xl font-extrabold">
                  {tier.price}
                </p>
                <p className="text-[13px] text-muted">{tier.period}</p>

                <ul className="mt-5 space-y-2.5 text-[13px]">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2 text-text/90">
                      <span className={isPaid ? "text-accent2" : "text-muted"}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {tier.key === "free" ? (
                    isLoggedIn ? (
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
                    )
                  ) : (
                    <UpgradeButton
                      plan={tier.key as "pro" | "max"}
                      currentPlan={currentPlan}
                      isLoggedIn={isLoggedIn}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-[12px] text-muted">
          Pembayaran aman via Midtrans — QRIS, Virtual Account, e-wallet.
        </p>
        <p className="mx-auto mt-2 max-w-xl text-center text-[11.5px] leading-relaxed text-muted">
          Pembayaran langganan bersifat final dan tidak dapat dikembalikan
          (non-refundable), kecuali dalam kasus kesalahan teknis dari pihak kami
          yang mengakibatkan Layanan tidak dapat digunakan sama sekali. Selengkapnya di{" "}
          <Link href="/terms" className="text-accent2 hover:underline">
            Syarat &amp; Ketentuan
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
