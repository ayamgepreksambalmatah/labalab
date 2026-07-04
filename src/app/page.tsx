import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (claims?.claims) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <Logo size={48} />
        <p className="mt-3 font-display text-base font-semibold text-accent2">
          Racik Profit Toko Kamu
        </p>
        <p className="mt-1 text-muted text-sm">
          AI Profit Assistant untuk Seller E-commerce Indonesia
        </p>
        <p className="mt-5 text-[15px] text-text/90 leading-relaxed">
          Hitung margin bersih setelah semua potongan platform, temukan profit
          yang hilang, simulasi promo, dan optimasi listing Shopee / Tokopedia /
          TikTok Shop.
        </p>

        <div className="mt-8 flex gap-3 justify-center">
          <Link
            href="/register"
            className="rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-6 py-3 font-display text-sm font-bold text-white hover:opacity-90 transition-opacity"
          >
            Mulai gratis
          </Link>
          <Link
            href="/login"
            className="rounded-[10px] border border-border px-6 py-3 text-sm font-semibold text-text hover:bg-surface2 transition-colors"
          >
            Masuk
          </Link>
        </div>
      </div>
    </main>
  );
}
