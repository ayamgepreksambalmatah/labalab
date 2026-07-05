import type { Plan } from "@/types/database";

/**
 * Free vs Pro limits (spec §9). Enforce these in every AI/mutation
 * route BEFORE work runs; return HTTP 402 when a free-tier limit is
 * exceeded so the frontend can redirect to the upgrade page.
 */
/**
 * Batas per plan. `savedProducts` dipakai untuk limit jumlah produk.
 * Kuota AI (sales/doctor per bulan) sedang dimigrasi ke tabel DB
 * `plan_limits` + `checkAndIncrementQuota`; key AI di sini akan dihapus
 * setelah semua route beralih.
 */
export const PLAN_LIMITS = {
  free: { salesAnalyzerPerMonth: 1, productDoctorPerMonth: 1, savedProducts: 3 },
  pro: {
    salesAnalyzerPerMonth: Infinity,
    productDoctorPerMonth: Infinity,
    savedProducts: Infinity,
  },
  max: {
    salesAnalyzerPerMonth: Infinity,
    productDoctorPerMonth: Infinity,
    savedProducts: Infinity,
  },
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
