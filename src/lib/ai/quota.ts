import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resolvePlan } from "@/lib/plans";
import type { Plan } from "@/types/database";

export type Feature =
  | "sales_analyzer"
  | "product_doctor"
  | "cs_reply"
  | "listing_generator";

const LIMIT_COLUMN: Record<Feature, string> = {
  sales_analyzer: "sales_analyzer_per_month",
  product_doctor: "product_doctor_per_month",
  cs_reply: "cs_reply_per_month",
  listing_generator: "listing_generator_per_month",
};

const FEATURE_LABEL: Record<Feature, string> = {
  sales_analyzer: "Sales Analyzer",
  product_doctor: "Product Doctor",
  cs_reply: "CS Reply",
  listing_generator: "Listing Generator",
};

export type QuotaResult = {
  allowed: boolean;
  currentUsage: number;
  maxAllowed: number;
  plan: Plan;
  message?: string;
};

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

/**
 * Cek kuota + increment atomik (spec §3). Panggil SEBELUM memanggil Anthropic
 * supaya request yang melebihi limit tidak keluar biaya AI.
 *
 * Increment dilakukan lewat RPC security-definer `increment_usage_if_allowed`
 * (satu statement, anti race/double-count). Kalau panggilan AI-nya gagal
 * setelah ini, panggil `rollbackQuota` untuk mengembalikan 1 pemakaian.
 */
export async function checkAndIncrementQuota(
  userId: string,
  feature: Feature,
): Promise<QuotaResult> {
  const admin = createServiceRoleClient();
  const period = currentPeriod();

  // 1) Plan efektif (hormati expiry).
  const { data: profile } = await admin
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("id", userId)
    .single();
  const plan = resolvePlan(profile?.plan as Plan, profile?.plan_expires_at);

  // 2) Limit untuk plan itu dari tabel plan_limits.
  const { data: limits } = await admin
    .from("plan_limits")
    .select("*")
    .eq("plan", plan)
    .single();
  const maxAllowed = Number(
    (limits as Record<string, number> | null)?.[LIMIT_COLUMN[feature]] ?? 0,
  );

  // 3) Increment atomik kalau masih di bawah limit.
  const { data: newCount, error } = await admin.rpc(
    "increment_usage_if_allowed",
    { p_user_id: userId, p_feature: feature, p_period: period, p_max: maxAllowed },
  );
  if (error) {
    throw new Error(`Gagal cek kuota: ${error.message}`);
  }

  const count = Number(newCount);
  if (count < 0) {
    // Ditolak — ambil pemakaian saat ini untuk pesan.
    const { data: usage } = await admin
      .from("usage_logs")
      .select("jumlah_pemakaian")
      .eq("user_id", userId)
      .eq("feature", feature)
      .eq("periode_bulan", period)
      .maybeSingle();
    const used = usage?.jumlah_pemakaian ?? maxAllowed;
    return {
      allowed: false,
      currentUsage: used,
      maxAllowed,
      plan,
      message: `Kuota ${FEATURE_LABEL[feature]} bulan ini sudah habis (${used}/${maxAllowed}). Upgrade plan untuk lanjut.`,
    };
  }

  return { allowed: true, currentUsage: count, maxAllowed, plan };
}

/** Kembalikan 1 pemakaian (dipanggil kalau panggilan AI gagal setelah increment). */
export async function rollbackQuota(
  userId: string,
  feature: Feature,
): Promise<void> {
  const admin = createServiceRoleClient();
  await admin.rpc("decrement_usage", {
    p_user_id: userId,
    p_feature: feature,
    p_period: currentPeriod(),
  });
}

/** Baca pemakaian saat ini + limit (untuk indikator kuota di UI). Read-only. */
export async function getUsage(
  userId: string,
  feature: Feature,
): Promise<{ used: number; max: number; plan: Plan }> {
  const admin = createServiceRoleClient();
  const period = currentPeriod();

  const { data: profile } = await admin
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("id", userId)
    .single();
  const plan = resolvePlan(profile?.plan as Plan, profile?.plan_expires_at);

  const [{ data: limits }, { data: usage }] = await Promise.all([
    admin.from("plan_limits").select("*").eq("plan", plan).single(),
    admin
      .from("usage_logs")
      .select("jumlah_pemakaian")
      .eq("user_id", userId)
      .eq("feature", feature)
      .eq("periode_bulan", period)
      .maybeSingle(),
  ]);

  const max = Number(
    (limits as Record<string, number> | null)?.[LIMIT_COLUMN[feature]] ?? 0,
  );
  return { used: usage?.jumlah_pemakaian ?? 0, max, plan };
}
