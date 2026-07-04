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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("id", user.id)
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
