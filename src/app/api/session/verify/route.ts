import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { SESSION_TOKEN_COOKIE } from "@/lib/auth/session";

/**
 * Cek ringan dipanggil SessionGuard (client) begitu Realtime memberitahu
 * ada perubahan baris active_sessions. Mengembalikan { valid } — apakah
 * token cookie sesi ini masih cocok dengan token di DB.
 *
 * Catatan: proxy (middleware) juga sudah men-enforce ini dan bisa balas
 * 401 duluan saat mismatch — guard memperlakukan 401 sama dengan invalid.
 */
export async function GET() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;

  // Tidak ada sesi → tidak ada yang perlu di-kick dari sini.
  if (!userId) return NextResponse.json({ valid: false });

  const token = (await cookies()).get(SESSION_TOKEN_COOKIE)?.value;
  // Belum ada token (sesi lama sebelum fitur) → jangan kick.
  if (!token) return NextResponse.json({ valid: true });

  const { data: row } = await supabase
    .from("active_sessions")
    .select("session_token")
    .eq("user_id", userId)
    .maybeSingle();

  const valid = !row || row.session_token === token;
  return NextResponse.json({ valid });
}
