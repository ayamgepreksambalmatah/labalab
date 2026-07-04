import { NextResponse, type NextRequest } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import { checkMonthlyLimit } from "@/lib/ai/limits";
import { generateJson } from "@/lib/ai/client";
import { AI_MAX_TOKENS } from "@/lib/ai/config";
import {
  buildDoctorPrompt,
  DOCTOR_AI_SCHEMA,
  type DoctorAiResult,
} from "@/lib/ai/prompts";
import type { Plan } from "@/types/database";

export const maxDuration = 60;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type ImageMediaType = (typeof IMAGE_TYPES)[number];

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

  const limit = await checkMonthlyLimit(supabase, user.id, plan, "productDoctor");
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Batas Product Doctor plan gratis (${limit.limit}x/bulan) sudah terpakai. Upgrade ke Pro untuk audit tanpa batas.`,
        limitReached: true,
      },
      { status: 402 },
    );
  }

  let body: {
    judul?: unknown;
    deskripsi?: unknown;
    harga?: unknown;
    kategori?: unknown;
    image?: { media_type?: unknown; data?: unknown } | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const judul = String(body.judul ?? "").trim().slice(0, 300);
  const deskripsi = String(body.deskripsi ?? "").trim().slice(0, 3000);
  const harga = String(body.harga ?? "").trim().slice(0, 30);
  const kategori = String(body.kategori ?? "lainnya").trim().slice(0, 50);

  const mediaType = body.image?.media_type as string | undefined;
  const imageData = body.image?.data as string | undefined;
  const hasPhoto =
    !!imageData &&
    IMAGE_TYPES.includes(mediaType as ImageMediaType) &&
    imageData.length < 7_000_000; // ~5MB base64

  if (!judul && !deskripsi && !hasPhoto) {
    return NextResponse.json(
      { error: "Isi minimal judul atau deskripsi produk untuk diaudit." },
      { status: 400 },
    );
  }

  const content: Anthropic.ContentBlockParam[] = [];
  if (hasPhoto) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType as ImageMediaType,
        data: imageData!,
      },
    });
  }
  content.push({
    type: "text",
    text: buildDoctorPrompt({ judul, deskripsi, harga, kategori, hasPhoto }),
  });

  let ai: DoctorAiResult;
  try {
    ai = await generateJson<DoctorAiResult>({
      content,
      schema: DOCTOR_AI_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: AI_MAX_TOKENS,
    });
  } catch (err) {
    console.error("product-doctor AI error:", err);
    return NextResponse.json(
      { error: "AI gagal mengaudit listing. Coba lagi sebentar." },
      { status: 502 },
    );
  }

  await supabase.from("product_audits").insert({
    user_id: user.id,
    judul: judul || null,
    kategori,
    score: Math.round(Number(ai.skor) || 0),
    ai_result: ai,
  });

  return NextResponse.json({ ai });
}
