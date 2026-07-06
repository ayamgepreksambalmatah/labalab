"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Lapisan UX "kick instan" untuk fitur 1-akun-1-sesi.
 *
 * Berlangganan Supabase Realtime ke baris active_sessions milik user.
 * Begitu ada login baru dari device lain (baris ter-UPDATE), verifikasi
 * ke server; kalau token sesi ini sudah tidak cocok → sign out & redirect.
 *
 * Ini HANYA pemanis kecepatan. Otoritas sebenarnya ada di proxy
 * (middleware) yang mengecek tiap request — jadi kalau tab ini kebetulan
 * tertutup/offline saat login baru terjadi, user tetap ter-kick di request
 * berikutnya.
 */
export function SessionGuard({ userId }: { userId: string }) {
  useEffect(() => {
    const supabase = createClient();

    async function verifyAndMaybeKick() {
      try {
        const res = await fetch("/api/session/verify", { cache: "no-store" });
        if (res.status === 401) return kick();
        if (!res.ok) return; // error lain → jangan kick
        const json: { valid?: boolean } = await res.json();
        if (json.valid === false) kick();
      } catch {
        // Gangguan jaringan → jangan kick (hindari false positive).
      }
    }

    async function kick() {
      await supabase.auth.signOut();
      window.location.assign("/login?message=session-terminated");
    }

    const channel = supabase
      .channel(`active-session:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "active_sessions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void verifyAndMaybeKick();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
