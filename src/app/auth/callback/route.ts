import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Gagal / tanpa code → kembali ke login dengan pesan error.
  return NextResponse.redirect(`${origin}/login?message=auth-gagal`);
}
