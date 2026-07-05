import type { Plan } from "@/types/database";

/**
 * Free vs Pro limits (spec §9). Enforce these in every AI/mutation
 * route BEFORE work runs; return HTTP 402 when a free-tier limit is
 * exceeded so the frontend can redirect to the upgrade page.
 */
/**
 * Batas jumlah produk tersimpan per plan. Kuota AI (Sales Analyzer, Product
 * Doctor, dst) ada di tabel DB `plan_limits` + `checkAndIncrementQuota`
 * (lib/ai/quota.ts) — bukan di sini.
 */
export const PLAN_LIMITS = {
  free: { savedProducts: 3 },
  pro: { savedProducts: Infinity },
  max: { savedProducts: Infinity },
} as const satisfies Record<Plan, Record<string, number>>;

export const PRO_PRICE_IDR = 129_000;
export const MAX_PRICE_IDR = 249_000;
export const PRO_PERIOD_DAYS = 30;

/** Harga per plan berbayar (untuk Midtrans). */
export const PLAN_PRICE_IDR: Record<Exclude<Plan, "free">, number> = {
  pro: PRO_PRICE_IDR,
  max: MAX_PRICE_IDR,
};

export function limitsFor(plan: Plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

/**
 * Plan efektif: 'pro'/'max' hanya berlaku kalau belum kedaluwarsa. Kalau
 * plan_expires_at sudah lewat, otomatis dianggap 'free' — jadi tidak perlu
 * job downgrade terpisah untuk enforcement.
 */
export function resolvePlan(
  plan: Plan | null | undefined,
  planExpiresAt: string | null | undefined,
): Plan {
  if (plan !== "pro" && plan !== "max") return "free";
  if (!planExpiresAt) return plan;
  return new Date(planExpiresAt).getTime() > Date.now() ? plan : "free";
}
