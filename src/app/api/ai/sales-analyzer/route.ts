import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkMonthlyLimit } from "@/lib/ai/limits";
import { generateJson } from "@/lib/ai/client";
import { AI_MAX_TOKENS } from "@/lib/ai/config";
import { computeSalesAnalysis, type SalesProduct } from "@/lib/calc/sales";
import {
  buildSalesPrompt,
  SALES_AI_SCHEMA,
  type SalesAiResult,
} from "@/lib/ai/prompts";
import type { Plan } from "@/types/database";

export const maxDuration = 60;

function sanitizeProducts(raw: unknown): SalesProduct[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => ({
      name: String((p as SalesProduct)?.name ?? "").slice(0, 200),
      omzet: Number((p as SalesProduct)?.omzet) || 0,
      unit: Number((p as SalesProduct)?.unit) || 0,
      modal: Number((p as SalesProduct)?.modal) || 0,
      biaya: Number((p as SalesProduct)?.biaya) || 0,
      refund: Number((p as SalesProduct)?.refund) || 0,
    }))
    .filter((p) => p.name && p.omzet > 0)
    .slice(0, 200); // batasi agar prompt tidak membengkak
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();
  const plan = (profile?.plan ?? "free") as Plan;

  const limit = await checkMonthlyLimit(supabase, user.id, plan, "salesAnalyzer");
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Batas Sales Analyzer plan gratis (${limit.limit}x/bulan) sudah terpakai. Upgrade ke Pro untuk analisis tanpa batas.`,
        limitReached: true,
      },
      { status: 402 },
    );
  }

  let body: { products?: unknown; sourceLabel?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const products = sanitizeProducts(body.products);
  const sourceLabel = String(body.sourceLabel ?? "Laporan").slice(0, 120);
  if (products.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada data produk valid untuk dianalisis." },
      { status: 400 },
    );
  }

  const analysis = computeSalesAnalysis(products);

  let ai: SalesAiResult;
  try {
    ai = await generateJson<SalesAiResult>({
      content: buildSalesPrompt(analysis, sourceLabel),
      schema: SALES_AI_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: AI_MAX_TOKENS,
    });
  } catch (err) {
    console.error("sales-analyzer AI error:", err);
    return NextResponse.json(
      { error: "AI gagal menyusun insight. Coba lagi sebentar." },
      { status: 502 },
    );
  }

  // Simpan histori (juga jadi basis penghitung limit bulanan).
  await supabase.from("sales_reports").insert({
    user_id: user.id,
    source_label: sourceLabel,
    total_omzet: analysis.totalOmzet,
    total_profit: analysis.totalProfit,
    total_margin: analysis.totalMargin,
    total_lost_profit: analysis.totalLostProfit,
    ai_summary: ai,
    raw_products: products,
  });

  return NextResponse.json({ analysis, ai });
}
