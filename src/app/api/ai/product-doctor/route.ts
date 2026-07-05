import { NextResponse, type NextRequest } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import { checkAndIncrementQuota, rollbackQuota } from "@/lib/ai/quota";
import { generateJson } from "@/lib/ai/client";
import { AI_MAX_TOKENS, AI_MODELS } from "@/lib/ai/config";
import {
  buildDoctorPrompt,
  DOCTOR_AI_SCHEMA,
  type DoctorAiResult,
} from "@/lib/ai/prompts";

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

  let body: {
    judul?: unknown;
    deskripsi?: unknown;
    harga?: unknown;
    kategori?: unknown;
    review?: unknown;
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
  const review = String(body.review ?? "").trim().slice(0, 5000);

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

  // Cek + increment kuota SEBELUM panggil AI.
  const quota = await checkAndIncrementQuota(user.id, "product_doctor");
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
    text: buildDoctorPrompt({
      judul,
      deskripsi,
      harga,
      kategori,
      hasPhoto,
      review: review || undefined,
    }),
  });

  let ai: DoctorAiResult;
  try {
    ai = await generateJson<DoctorAiResult>({
      model: AI_MODELS.productDoctor,
      content,
      schema: DOCTOR_AI_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: AI_MAX_TOKENS,
    });
  } catch (err) {
    console.error("product-doctor AI error:", err);
    await rollbackQuota(user.id, "product_doctor");
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
