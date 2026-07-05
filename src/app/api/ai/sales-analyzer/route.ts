import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkAndIncrementQuota, rollbackQuota } from "@/lib/ai/quota";
import { generateJson } from "@/lib/ai/client";
import { AI_MAX_TOKENS, AI_MODELS } from "@/lib/ai/config";
import { computeSalesAnalysis, type SalesProduct } from "@/lib/calc/sales";
import {
  buildSalesPrompt,
  SALES_AI_SCHEMA,
  type SalesAiResult,
} from "@/lib/ai/prompts";
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

  // Parse & validasi body dulu (murah) supaya request invalid tak makan kuota.
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

  // Cek + increment kuota SEBELUM panggil AI (biar request over-limit tak keluar biaya).
  const quota = await checkAndIncrementQuota(user.id, "sales_analyzer");
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: quota.message,
        quotaExceeded: true,
        usage: { used: quota.currentUsage, max: quota.maxAllowed, plan: quota.plan },
      },
      { status: 402 },
    );
  }

  const analysis = computeSalesAnalysis(products);

  let ai: SalesAiResult;
  try {
    ai = await generateJson<SalesAiResult>({
      model: AI_MODELS.salesAnalyzer,
      content: buildSalesPrompt(analysis, sourceLabel),
      schema: SALES_AI_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: AI_MAX_TOKENS,
    });
  } catch (err) {
    console.error("sales-analyzer AI error:", err);
    // AI gagal → kembalikan kuota yang tadi di-increment.
    await rollbackQuota(user.id, "sales_analyzer");
    return NextResponse.json(
      { error: "AI gagal menyusun insight. Coba lagi sebentar." },
      { status: 502 },
    );
  }

  // Simpan histori laporan (juga jadi basis penghitung limit bulanan).
  const { data: report } = await supabase
    .from("sales_reports")
    .insert({
      user_id: user.id,
      source_label: sourceLabel,
      total_omzet: analysis.totalOmzet,
      total_profit: analysis.totalProfit,
      total_margin: analysis.totalMargin,
      total_lost_profit: analysis.totalLostProfit,
      ai_summary: ai,
      raw_products: products,
    })
    .select("id")
    .single();

  // Auto-link history per produk untuk yang COCOK PERSIS (case-insensitive)
  // dengan Produk Saya. Fuzzy match sengaja tidak auto-link agar tidak salah
  // attribusi — user cukup "Simpan ke Produk Saya", upload berikutnya nyambung.
  let linkedHistory = 0;
  if (report) {
    const { data: myProducts } = await supabase
      .from("products")
      .select("id, nama");
    const byName = new Map(
      (myProducts ?? []).map((p) => [p.nama.trim().toLowerCase(), p.id]),
    );
    const rows = analysis.enriched
      .map((p) => {
        const pid = byName.get(p.name.trim().toLowerCase());
        if (!pid) return null;
        return {
          product_id: pid,
          sales_report_id: report.id,
          periode_label: sourceLabel,
          unit_terjual: Math.round(p.unit),
          omzet: p.omzet,
          biaya: p.biaya,
          modal: p.modal,
          profit: p.profit,
          margin: p.margin,
          refund_count: Math.round(p.refund),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length) {
      await supabase.from("product_sales_history").insert(rows);
      linkedHistory = rows.length;
    }
  }

  return NextResponse.json({ analysis, ai, linkedHistory });
}
