import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkAndIncrementQuota, rollbackQuota } from "@/lib/ai/quota";
import { generateJson } from "@/lib/ai/client";
import { AI_MAX_TOKENS, AI_MODELS } from "@/lib/ai/config";
import {
  buildListingPrompt,
  LISTING_AI_SCHEMA,
  type ListingAiResult,
} from "@/lib/ai/prompts";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    nama?: unknown;
    kategori?: unknown;
    harga?: unknown;
    keunggulan?: unknown;
    bahan?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const nama = String(body.nama ?? "").trim().slice(0, 300);
  const kategori = String(body.kategori ?? "lainnya").trim().slice(0, 50);
  const harga = String(body.harga ?? "").trim().slice(0, 30);
  const keunggulan = String(body.keunggulan ?? "").trim().slice(0, 2000);
  const bahan = String(body.bahan ?? "").trim().slice(0, 300);

  if (!nama) {
    return NextResponse.json(
      { error: "Isi minimal nama produk untuk membuat listing." },
      { status: 400 },
    );
  }

  // Cek + increment kuota SEBELUM panggil AI.
  const quota = await checkAndIncrementQuota(user.id, "listing_generator");
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

  let ai: ListingAiResult;
  try {
    ai = await generateJson<ListingAiResult>({
      model: AI_MODELS.listingGenerator,
      content: buildListingPrompt({ nama, kategori, harga, keunggulan, bahan }),
      schema: LISTING_AI_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: AI_MAX_TOKENS,
    });
  } catch (err) {
    console.error("listing-generator AI error:", err);
    await rollbackQuota(user.id, "listing_generator");
    return NextResponse.json(
      { error: "AI gagal membuat listing. Coba lagi sebentar." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ai });
}
