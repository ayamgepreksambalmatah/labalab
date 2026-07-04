import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { createServerClient } from "@/lib/supabase/server";
import { resolvePlan } from "@/lib/plans";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  // getClaims() = verifikasi JWT lokal (cepat), cukup untuk personalisasi & id.
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("id", userId)
    .single();

  const plan = resolvePlan(profile?.plan, profile?.plan_expires_at);

  return (
    <div className="md:grid md:grid-cols-[15rem_1fr] min-h-screen">
      <Sidebar plan={plan} />
      <main className="px-5 py-8 md:px-9 md:py-10 max-w-5xl w-full">
        {children}
      </main>
    </div>
  );
}
