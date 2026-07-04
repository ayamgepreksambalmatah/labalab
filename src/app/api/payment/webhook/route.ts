import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyMidtransSignature } from "@/lib/midtrans";
import { PRO_PERIOD_DAYS } from "@/lib/plans";
import type { SubscriptionStatus } from "@/types/database";

/**
 * Webhook notifikasi Midtrans (spec §6). WAJIB verifikasi signature.
 * Saat pembayaran settle → subscriptions.status='paid' + profiles.plan='pro'
 * + plan_expires_at = +30 hari. Pakai service role (bypass RLS) karena ini
 * kode server tepercaya yang mengubah data user lain.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { order_id, status_code, gross_amount, signature_key } = body;
  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!verifyMidtransSignature({ order_id, status_code, gross_amount, signature_key })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, user_id, amount, status")
    .eq("midtrans_order_id", order_id)
    .single();

  if (!sub) {
    // Order tidak dikenal — balas 200 supaya Midtrans tidak retry selamanya.
    return NextResponse.json({ received: true, note: "order tidak ditemukan" });
  }

  // Cross-check nominal untuk cegah manipulasi.
  if (Math.round(Number(gross_amount)) !== Math.round(Number(sub.amount))) {
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  const txStatus = body.transaction_status;
  const fraud = body.fraud_status;

  let newStatus: SubscriptionStatus | null = null;
  if (txStatus === "settlement" || (txStatus === "capture" && fraud === "accept")) {
    newStatus = "paid";
  } else if (txStatus === "capture" && fraud === "challenge") {
    newStatus = "pending";
  } else if (txStatus === "pending") {
    newStatus = "pending";
  } else if (["deny", "cancel", "failure"].includes(txStatus)) {
    newStatus = "failed";
  } else if (txStatus === "expire") {
    newStatus = "expired";
  }

  if (!newStatus) {
    return NextResponse.json({ received: true });
  }

  // Idempotent: kalau sudah paid, jangan proses ulang.
  if (sub.status === "paid" && newStatus === "paid") {
    return NextResponse.json({ received: true, note: "sudah paid" });
  }

  if (newStatus === "paid") {
    const now = new Date();
    const periodEnd = new Date(
      now.getTime() + PRO_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );
    await supabase
      .from("subscriptions")
      .update({
        status: "paid",
        paid_at: now.toISOString(),
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
      })
      .eq("id", sub.id);

    await supabase
      .from("profiles")
      .update({ plan: "pro", plan_expires_at: periodEnd.toISOString() })
      .eq("id", sub.user_id);
  } else {
    await supabase
      .from("subscriptions")
      .update({ status: newStatus })
      .eq("id", sub.id);
  }

  return NextResponse.json({ received: true });
}
