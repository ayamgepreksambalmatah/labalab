import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { signOut } from "@/lib/auth/actions";
import { createServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware sudah menjaga, tapi defensif di server juga.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, store_name, plan, email")
    .eq("id", user.id)
    .single();

  const isPro = profile?.plan === "pro";
  const displayName = profile?.full_name || profile?.email || "Seller";

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between">
          <Logo size={26} />
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-[10px] border border-border px-4 py-2 text-[13px] font-semibold text-muted hover:bg-surface2 hover:text-text transition-colors"
            >
              Keluar
            </button>
          </form>
        </header>

        <div className="mt-10">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Halo, {displayName} 👋
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Selamat datang di dashboard LabaLab.
          </p>
        </div>

        <div className="mt-6 rounded-card border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
                Plan aktif
              </p>
              <p className="mt-1 font-display text-lg font-bold">
                {isPro ? "Jualan Pro" : "Gratis"}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                isPro
                  ? "border border-green/40 bg-green/10 text-green"
                  : "border border-border bg-surface2 text-muted"
              }`}
            >
              {isPro ? "Pro" : "Free"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[10px] border border-border bg-surface2 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-muted">Email</p>
              <p className="mt-0.5 truncate text-text">{profile?.email}</p>
            </div>
            <div className="rounded-[10px] border border-border bg-surface2 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-muted">Toko</p>
              <p className="mt-0.5 truncate text-text">
                {profile?.store_name || "—"}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[12px] text-muted">
          Tahap 2 (auth) selesai. Berikutnya: tools Profit Checker & Promo
          Simulator.
        </p>
      </div>
    </main>
  );
}
