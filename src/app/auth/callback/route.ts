import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { establishSingleSession } from "@/lib/auth/session";

/**
 * OAuth & email-confirmation callback. Supabase mengarahkan ke sini
 * dengan ?code=... setelah user login Google / klik link konfirmasi.
 * Kita tukar code jadi session, lalu redirect ke `next` (default /dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 1 akun = 1 sesi aktif (cover Google OAuth + konfirmasi email).
      if (data.user) await establishSingleSession(supabase, data.user.id);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Gagal / tanpa code → kembali ke login dengan pesan error.
  return NextResponse.redirect(`${origin}/login?message=auth-gagal`);
}
