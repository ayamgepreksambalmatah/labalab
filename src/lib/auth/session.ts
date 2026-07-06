import "server-only";

import { cookies, headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { parseDeviceInfo } from "@/lib/session/device";
import { sendNewLoginEmail } from "@/lib/email/send";

/**
 * Single active session per user (fitur keamanan).
 *
 * Cookie httpOnly berisi session_token yang sama dengan baris di
 * public.active_sessions. Otoritas cek ada di proxy (middleware):
 * cookie != DB → sesi lama di-kick. Cookie httpOnly = tak bisa diutak-atik
 * dari client JS, dan bisa dibaca server tiap request.
 */
export const SESSION_TOKEN_COOKIE = "ll_session_token";

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

/**
 * Dipanggil tepat setelah login BERHASIL (email/password, Google OAuth,
 * atau konfirmasi email). Generate token acak, timpa baris lama untuk user
 * ini (UPSERT), lalu simpan token yang sama di cookie httpOnly.
 *
 * `supabase` harus client yang SUDAH authenticated sebagai user tsb
 * (session baru sudah terpasang), supaya RLS insert/update own row lolos.
 *
 * Gagal upsert TIDAK memblokir login — kita degrade dengan aman (tanpa
 * cookie token, proxy melewati enforcement untuk user ini).
 */
export async function establishSingleSession(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const token = crypto.randomUUID();
  const h = await headers();
  const deviceInfo = h.get("user-agent")?.slice(0, 500) ?? null;
  const ip = clientIp(h);
  const location = geoLocation(h);

  // Sesi lama (kalau ada) untuk deteksi "login dari perangkat lain".
  const { data: prev } = await supabase
    .from("active_sessions")
    .select("device_info")
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await supabase.from("active_sessions").upsert(
    {
      user_id: userId,
      session_token: token,
      device_info: deviceInfo,
      ip_address: ip,
      location,
      last_active: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[single-session] gagal upsert active_sessions:", error.message);
    return;
  }

  const store = await cookies();
  store.set(SESSION_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  // Notifikasi keamanan: kirim email HANYA kalau sebelumnya sudah ada sesi
  // di perangkat BERBEDA (bukan first login, bukan re-login di device sama).
  // Key ke device_info (user-agent) — IP sengaja diabaikan karena bisa
  // berubah di jaringan seluler tanpa ganti perangkat (hindari false alarm).
  if (prev && prev.device_info !== deviceInfo) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (profile?.email) {
      await sendNewLoginEmail({
        to: profile.email,
        device: parseDeviceInfo(deviceInfo).full,
        location,
        ip,
        when: new Date(),
      });
    }
  }
}

/** IP klien dari header proxy (Vercel/CDN). Ambil entri pertama x-forwarded-for. */
function clientIp(h: Headers): string | null {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  return h.get("x-real-ip");
}

/** Lokasi kasar dari Vercel geo headers (kota/negara URL-encoded). */
function geoLocation(h: Headers): string | null {
  const rawCity = h.get("x-vercel-ip-city");
  const country = h.get("x-vercel-ip-country");
  const city = rawCity ? safeDecode(rawCity) : null;
  if (city && country) return `${city}, ${country}`;
  return city ?? country ?? null;
}

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}
