import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Daftar",
  alternates: { canonical: "/register" },
};
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { createServerClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      title="Daftar"
      subtitle="Gratis — mulai hitung profit toko kamu."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-accent2 hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <GoogleButton />

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] uppercase tracking-wider text-muted">atau</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <RegisterForm />
    </AuthShell>
  );
}
