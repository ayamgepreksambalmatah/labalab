import type { Plan } from "@/types/database";

/**
 * Free vs Pro limits (spec §9). Enforce these in every AI/mutation
 * route BEFORE work runs; return HTTP 402 when a free-tier limit is
 * exceeded so the frontend can redirect to the upgrade page.
 */
export const PLAN_LIMITS = {
  free: {
    salesAnalyzerPerMonth: 1, // coba gratis 1x
    productDoctorPerMonth: 1,
    savedProducts: 3,
  },
  pro: {
    salesAnalyzerPerMonth: Infinity,
    productDoctorPerMonth: Infinity,
    savedProducts: Infinity,
  },
} as const satisfies Record<Plan, Record<string, number>>;

export const PRO_PRICE_IDR = 99_000;
export const PRO_PERIOD_DAYS = 30;

export function limitsFor(plan: Plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

/**
 * Plan efektif: 'pro' hanya berlaku kalau belum kedaluwarsa. Kalau
 * plan_expires_at sudah lewat, otomatis dianggap 'free' — jadi tidak perlu
 * job downgrade terpisah untuk enforcement limit.
 */
export function resolvePlan(
  plan: Plan | null | undefined,
  planExpiresAt: string | null | undefined,
): Plan {
  if (plan !== "pro") return "free";
  if (!planExpiresAt) return "pro";
  return new Date(planExpiresAt).getTime() > Date.now() ? "pro" : "free";
}
