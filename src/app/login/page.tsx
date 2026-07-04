import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { createServerClient } from "@/lib/supabase/server";

const MESSAGES: Record<string, string> = {
  "cek-email": "Cek inbox kamu untuk link konfirmasi, lalu login di sini.",
  "auth-gagal": "Login gagal. Silakan coba lagi.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const { message } = await searchParams;
  const note = message ? MESSAGES[message] : null;

  return (
    <AuthShell
      title="Masuk"
      subtitle="Lanjut ke dashboard LabaLab kamu."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-accent2 hover:underline">
            Daftar gratis
          </Link>
        </>
      }
    >
      {note && (
        <p className="mb-4 rounded-[9px] border border-accent/30 bg-accent/10 px-3 py-2 text-[13px] text-accent2">
          {note}
        </p>
      )}

      <GoogleButton />

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] uppercase tracking-wider text-muted">atau</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <LoginForm />
    </AuthShell>
  );
}
