import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAndIncrementQuota, rollbackQuota } from "@/lib/ai/quota";
import { generateText } from "@/lib/ai/client";
import { AI_MODELS } from "@/lib/ai/config";
import type { FaqItem } from "@/lib/products/queries";
import { productKnowledgeLines, type AtributKhusus } from "@/lib/products/knowledge";

export const maxDuration = 30;

/**
 * CS Reply Assistant (extension) — draft balasan chat pembeli pakai Haiku.
 *
 * Auth via Bearer token (access_token Supabase user) — cocok untuk extension
 * lintas-origin, dan gampang dites via curl. BELUM disambungkan ke extension.
 *
 * Body: { message: string (wajib), productId?: string, productContext?: string }
 * - productId: ambil "product knowledge" (harga/stok/faq/garansi/dll) milik user.
 * - productContext: konteks mentah (mis. hasil scrape extension) sebagai fallback.
 */
export async function POST(req: NextRequest) {
  // 1) Auth: Bearer token.
  const token = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  if (!token) {
    return NextResponse.json(
      { error: "Butuh Authorization: Bearer <access_token>." },
      { status: 401 },
    );
  }
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const {
    data: { user },
  } = await authClient.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: "Token tidak valid." }, { status: 401 });
  }

  // 2) Body.
  let body: { message?: unknown; productId?: unknown; productContext?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }
  const message = String(body.message ?? "").trim().slice(0, 3000);
  if (!message) {
    return NextResponse.json(
      { error: "Field 'message' (pesan pembeli) wajib diisi." },
      { status: 400 },
    );
  }

  // 3) Konteks produk (dari DB kalau productId, atau raw context).
  let context = String(body.productContext ?? "").trim().slice(0, 3000);
  const productId = body.productId ? String(body.productId) : null;
  if (productId) {
    const admin = createServiceRoleClient();
    const { data: p } = await admin
      .from("products")
      .select(
        "nama, harga, stok, deskripsi, faq, masa_berlaku, sertifikasi, kondisi_pengiriman, catatan_tambahan, atribut_khusus, garansi, cara_perawatan, bahan, ukuran_tersedia",
      )
      .eq("id", productId)
      .eq("user_id", user.id) // hanya produk milik user ini
      .maybeSingle();
    if (p) {
      const faq = ((p.faq as FaqItem[] | null) ?? [])
        .map((f) => `Q: ${f.question} A: ${f.answer}`)
        .join(" | ");
      context = [
        `Produk: ${p.nama}`,
        p.harga != null && `Harga: Rp ${p.harga}`,
        p.stok != null && `Stok: ${p.stok}`,
        // Knowledge universal + atribut_khusus dinamis (+ fallback field legacy).
        ...productKnowledgeLines({
          ...p,
          atribut_khusus: p.atribut_khusus as AtributKhusus | null,
        }),
        p.deskripsi && `Deskripsi: ${p.deskripsi}`,
        faq && `FAQ: ${faq}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  // 4) Kuota (cs_reply → Haiku).
  const quota = await checkAndIncrementQuota(user.id, "cs_reply");
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

  // 5) Panggil Haiku.
  const prompt = `Kamu adalah customer service toko online Indonesia yang ramah, cepat, dan membantu closing penjualan.

${context ? `Konteks produk:\n${context}\n` : "Tidak ada konteks produk spesifik.\n"}
Pesan pembeli:
"${message}"

Tulis SATU draft balasan singkat (2-4 kalimat), Bahasa Indonesia, nada ramah & profesional. Jawab pertanyaannya berdasarkan konteks di atas — jangan mengarang info (harga/stok/garansi) yang tidak ada. Kalau relevan, arahkan halus ke pembelian. Balas HANYA teks balasannya, tanpa awalan seperti "Berikut balasannya:".`;

  let balasan: string;
  try {
    balasan = await generateText({
      model: AI_MODELS.csReply,
      content: prompt,
      maxTokens: 512,
    });
  } catch (err) {
    console.error("reply-suggestion AI error:", err);
    await rollbackQuota(user.id, "cs_reply");
    return NextResponse.json(
      { error: "AI gagal membuat balasan. Coba lagi sebentar." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    balasan,
    model: AI_MODELS.csReply,
    usage: { used: quota.currentUsage, max: quota.maxAllowed, plan: quota.plan },
  });
}
