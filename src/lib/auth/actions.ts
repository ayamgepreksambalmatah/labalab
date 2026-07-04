"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";

export type AuthState = { error: string } | null;

/** Login dengan email + password. */
export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  redirect("/dashboard");
}

/** Register dengan email + password + nama. */
export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }
  if (password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }

  const supabase = await createServerClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // Kalau konfirmasi email aktif, session belum ada → arahkan ke halaman info.
  if (!data.session) {
    redirect("/login?message=cek-email");
  }

  redirect("/dashboard");
}

/** Mulai OAuth Google — redirect ke halaman consent Google. Dipakai sebagai form action. */
export async function signInWithGoogle(): Promise<void> {
  const supabase = await createServerClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error || !data.url) {
    redirect("/login?message=auth-gagal");
  }
  redirect(data.url);
}

/** Logout. */
export async function signOut(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Pesan error Supabase → bahasa Indonesia yang ramah user. */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email atau password salah.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Email ini sudah terdaftar. Silakan login.";
  if (m.includes("email not confirmed"))
    return "Email belum dikonfirmasi. Cek inbox kamu.";
  if (m.includes("rate limit"))
    return "Terlalu banyak percobaan. Coba lagi beberapa saat.";
  return message;
}
