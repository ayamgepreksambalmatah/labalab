import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

/**
 * Refreshes the Supabase auth session on every request and keeps the
 * auth cookies in sync. Also gates protected routes: unauthenticated
 * users hitting an app route are redirected to /login (spec §5).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: jangan jalankan kode di antara createServerClient dan panggilan
  // auth. getClaims() memverifikasi tanda tangan JWT SECARA LOKAL (project ini
  // pakai asymmetric signing key ES256) — tidak ada network call per navigasi,
  // beda dengan getUser() yang selalu call server (~300ms). Refresh token tetap
  // otomatis: getClaims membaca sesi dari cookie dan me-refresh (via setAll)
  // hanya kalau access token sudah kedaluwarsa.
  const { data } = await supabase.auth.getClaims();
  const isAuthed = !!data?.claims;

  // Routes that do not require authentication.
  const publicPaths = ["/login", "/register", "/auth", "/pricing", "/"];
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // API route self-authenticate (kembalikan 401/JSON sendiri) — jangan
  // di-redirect ke /login. Penting untuk webhook Midtrans yang dipanggil
  // tanpa sesi user.
  const isApi = pathname.startsWith("/api");

  if (!isAuthed && !isPublic && !isApi) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
