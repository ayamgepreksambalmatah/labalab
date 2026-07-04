import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Plan } from "@/types/database";
import { PLAN_LIMITS } from "@/lib/plans";

type DB = SupabaseClient<Database>;

export type AiFeature = "salesAnalyzer" | "productDoctor";

const FEATURE_TABLE: Record<AiFeature, "sales_reports" | "product_audits"> = {
  salesAnalyzer: "sales_reports",
  productDoctor: "product_audits",
};

const FEATURE_LIMIT_KEY: Record<
  AiFeature,
  "salesAnalyzerPerMonth" | "productDoctorPerMonth"
> = {
  salesAnalyzer: "salesAnalyzerPerMonth",
  productDoctor: "productDoctorPerMonth",
};

export type LimitCheck = {
  allowed: boolean;
  used: number;
  limit: number;
};

/** ISO timestamp untuk awal bulan berjalan (UTC). */
function startOfMonthISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * Cek batas pemakaian fitur AI bulan ini (spec §9). Free: 1x/bulan tiap fitur;
 * Pro: unlimited. Menghitung baris di tabel histori fitur sejak awal bulan.
 */
export async function checkMonthlyLimit(
  supabase: DB,
  userId: string,
  plan: Plan,
  feature: AiFeature,
): Promise<LimitCheck> {
  const limit = PLAN_LIMITS[plan][FEATURE_LIMIT_KEY[feature]];
  if (!Number.isFinite(limit)) {
    return { allowed: true, used: 0, limit };
  }

  const { count } = await supabase
    .from(FEATURE_TABLE[feature])
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonthISO());

  const used = count ?? 0;
  return { allowed: used < limit, used, limit };
}
