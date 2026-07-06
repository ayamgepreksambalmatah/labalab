import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import { resolvePlan } from "@/lib/plans";
import type { Plan, SubscriptionStatus } from "@/types/database";

export type QuotaUsage = { terpakai: number; limit: number };

export type BillingInfo = {
  planAktif: Plan;
  planExpiresAt: string | null;
  autoRenewActive: boolean;
  kuota: {
    salesAnalyzer: QuotaUsage;
    productDoctor: QuotaUsage;
    csReply: QuotaUsage;
  };
  riwayatPembayaran: Array<{
    tanggal: string;
    plan: Plan;
    jumlah: number;
    status: SubscriptionStatus;
  }>;
};

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

/**
 * Rangkuman langganan + kuota + riwayat untuk halaman Pengaturan.
 * Semua query lewat client authenticated (RLS membatasi ke user sendiri).
 */
export async function getBillingInfo(userId: string): Promise<BillingInfo> {
  const supabase = await createServerClient();
  const period = currentPeriod();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("id", userId)
    .single();

  const planAktif = resolvePlan(profile?.plan, profile?.plan_expires_at);

  const [{ data: limits }, { data: usage }, { data: subs }] = await Promise.all([
    supabase.from("plan_limits").select("*").eq("plan", planAktif).single(),
    supabase
      .from("usage_logs")
      .select("feature, jumlah_pemakaian")
      .eq("user_id", userId)
      .eq("periode_bulan", period),
    supabase
      .from("subscriptions")
      .select("plan, amount, status, paid_at, created_at, auto_renew")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const limitRow = (limits as Record<string, number> | null) ?? {};
  const usedFor = (feature: string) =>
    usage?.find((u) => u.feature === feature)?.jumlah_pemakaian ?? 0;

  const riwayat = (subs ?? []).filter((s) => s.status !== "pending");
  const autoRenewActive =
    planAktif !== "free" &&
    (subs ?? []).some((s) => s.status === "paid" && s.auto_renew);

  return {
    planAktif,
    planExpiresAt: profile?.plan_expires_at ?? null,
    autoRenewActive,
    kuota: {
      salesAnalyzer: {
        terpakai: usedFor("sales_analyzer"),
        limit: Number(limitRow.sales_analyzer_per_month ?? 0),
      },
      productDoctor: {
        terpakai: usedFor("product_doctor"),
        limit: Number(limitRow.product_doctor_per_month ?? 0),
      },
      csReply: {
        terpakai: usedFor("cs_reply"),
        limit: Number(limitRow.cs_reply_per_month ?? 0),
      },
    },
    riwayatPembayaran: riwayat.map((s) => ({
      tanggal: s.paid_at ?? s.created_at,
      plan: s.plan,
      jumlah: Number(s.amount),
      status: s.status,
    })),
  };
}
