import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { getSnapClient } from "@/lib/midtrans";
import { PLAN_PRICE_IDR, resolvePlan } from "@/lib/plans";
import type { Plan } from "@/types/database";

const PLAN_LABEL: Record<"pro" | "max", string> = {
  pro: "LabaLab Pro",
  max: "LabaLab Max",
};

// Rank untuk cegah "downgrade" via pembelian (max > pro > free).
const RANK: Record<Plan, number> = { free: 0, pro: 1, max: 2 };

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { plan?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const plan = body.plan === "max" ? "max" : "pro"; // default pro
  const price = PLAN_PRICE_IDR[plan];

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at, full_name, email")
    .eq("id", user.id)
    .single();

  const current = resolvePlan(profile?.plan, profile?.plan_expires_at);
  if (RANK[current] >= RANK[plan]) {
    return NextResponse.json(
      { error: `Kamu sudah di plan ${current === "max" ? "Max" : "Pro"}.` },
      { status: 409 },
    );
  }

  const orderId = `LBL-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  const { error: insertErr } = await supabase.from("subscriptions").insert({
    user_id: user.id,
    midtrans_order_id: orderId,
    plan,
    amount: price,
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
      transaction_details: { order_id: orderId, gross_amount: price },
      item_details: [
        {
          id: `labalab-${plan}-1m`,
          price,
          quantity: 1,
          name: `${PLAN_LABEL[plan]} (1 bulan)`,
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
