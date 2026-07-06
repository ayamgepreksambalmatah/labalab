import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Ekspor semua data user sebagai JSON (kepatuhan UU PDP). RLS membatasi tiap
 * query ke data milik user yang login, jadi cukup pakai client authenticated.
 */
export async function GET() {
  const supabase = await createServerClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [profile, products, salesReports, subscriptions] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("products").select("*").eq("user_id", userId),
    supabase.from("sales_reports").select("*").eq("user_id", userId),
    supabase.from("subscriptions").select("*").eq("user_id", userId),
  ]);

  // Riwayat per produk: ambil lewat relasi (RLS product_sales_history via join products).
  const productIds = (products.data ?? []).map((p) => p.id);
  const { data: history } =
    productIds.length > 0
      ? await supabase
          .from("product_sales_history")
          .select("*")
          .in("product_id", productIds)
      : { data: [] };

  const payload = {
    exportedAt: new Date().toISOString(),
    profile: profile.data ?? null,
    products: products.data ?? [],
    salesReports: salesReports.data ?? [],
    productSalesHistory: history ?? [],
    subscriptions: subscriptions.data ?? [],
  };

  const filename = `labalab-data-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
