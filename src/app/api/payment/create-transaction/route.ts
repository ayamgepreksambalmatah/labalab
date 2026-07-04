import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { getSnapClient } from "@/lib/midtrans";
import { PRO_PRICE_IDR, resolvePlan } from "@/lib/plans";

export async function POST() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at, full_name, email")
    .eq("id", user.id)
    .single();

  if (resolvePlan(profile?.plan, profile?.plan_expires_at) === "pro") {
    return NextResponse.json(
      { error: "Kamu sudah berlangganan Pro." },
      { status: 409 },
    );
  }

  const orderId = `LBL-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  // Catat transaksi pending dulu (sumber kebenaran; webhook update statusnya).
  const { error: insertErr } = await supabase.from("subscriptions").insert({
    user_id: user.id,
    midtrans_order_id: orderId,
    plan: "pro",
    amount: PRO_PRICE_IDR,
    status: "pending",
  });
  if (insertErr) {
    return NextResponse.json(
      { error: "Gagal membuat transaksi." },
      { status: 500 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const snap = getSnapClient();
    const tx = await snap.createTransaction({
      transaction_details: { order_id: orderId, gross_amount: PRO_PRICE_IDR },
      item_details: [
        {
          id: "labalab-pro-1m",
          price: PRO_PRICE_IDR,
          quantity: 1,
          name: "LabaLab Pro (1 bulan)",
        },
      ],
      customer_details: {
        first_name: profile?.full_name || "Seller",
        email: profile?.email || user.email,
      },
      callbacks: { finish: `${appUrl}/dashboard?upgrade=success` },
    });

    return NextResponse.json({ token: tx.token, orderId });
  } catch (err) {
    console.error("midtrans create-transaction error:", err);
    // Tandai transaksi gagal supaya tidak menggantung sebagai pending.
    await supabase
      .from("subscriptions")
      .update({ status: "failed" })
      .eq("midtrans_order_id", orderId);
    return NextResponse.json(
      { error: "Gagal menghubungi Midtrans. Cek konfigurasi server key." },
      { status: 502 },
    );
  }
}
