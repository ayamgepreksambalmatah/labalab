import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { SESSION_TOKEN_COOKIE } from "@/lib/auth/session";

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
  const claims = data?.claims;
  const isAuthed = !!claims;
  const userId = claims?.sub as string | undefined;

  // Routes that do not require authentication.
  const publicPaths = [
    "/login",
    "/register",
    "/auth",
    "/pricing",
    "/privacy",
    "/terms",
    "/about",
    "/",
  ];
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

  // ── 1 akun = 1 sesi aktif (otoritas server) ──────────────────────────
  // Bandingkan token cookie dengan baris active_sessions milik user. Kalau
  // beda = ada login baru dari device lain → kick sesi ini. Cek hanya untuk
  // rute terproteksi/API milik user login (bukan /login, /auth, webhook).
  // Satu lookup PK ber-index; skip kalau cookie/baris belum ada (sesi lama
  // sebelum fitur ini, atau race saat login) supaya tidak salah-kick.
  if (isAuthed && userId && !isPublic) {
    const cookieToken = request.cookies.get(SESSION_TOKEN_COOKIE)?.value;
    if (cookieToken) {
      const { data: row } = await supabase
        .from("active_sessions")
        .select("session_token, last_active")
        .eq("user_id", userId)
        .maybeSingle();

      if (row && row.session_token !== cookieToken) {
        if (isApi) {
          return NextResponse.json(
            { error: "session-terminated" },
            { status: 401 },
          );
        }
        return kickToLogin(request);
      }

      // Token cocok → catat aktivitas. Throttle maks 1×/60 dtk supaya tidak
      // ada write DB di tiap navigasi (jaga hot-path tetap ringan).
      if (row) {
        const last = row.last_active ? new Date(row.last_active).getTime() : 0;
        if (Date.now() - last > 60_000) {
          await supabase
            .from("active_sessions")
            .update({ last_active: new Date().toISOString() })
            .eq("user_id", userId);
        }
      }
    }
  }

  return supabaseResponse;
}

/**
 * Kick sesi ini: hapus cookie auth Supabase (sb-*) + cookie token sesi
 * tunggal, lalu redirect ke /login dengan pesan. Menghapus cookie WAJIB —
 * kalau tidak, /login (yang mem-forward user ber-sesi ke /dashboard) akan
 * memantul balik ke proxy dan bikin loop redirect. Tanpa cookie = JWT
 * lenyap dari browser = benar-benar logout.
 */
function kickToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("message", "session-terminated");

  const response = NextResponse.redirect(url);
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-") || cookie.name === SESSION_TOKEN_COOKIE) {
      response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" });
    }
  }
  return response;
}
