"use client";

import { useState, useTransition } from "react";
import { signOutOtherDevices } from "@/lib/auth/actions";

/**
 * Tombol "Keluarkan semua perangkat lain". Merotasi token sesi lewat server
 * action → perangkat lain yang masih aktif langsung ter-kick, perangkat ini
 * tetap login.
 */
export function SignOutOthersButton() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              "Keluarkan semua perangkat lain? Perangkat ini tetap login, tapi perangkat lain harus login ulang.",
            )
          ) {
            return;
          }
          setDone(false);
          startTransition(async () => {
            await signOutOtherDevices();
            setDone(true);
          });
        }}
        className="rounded-[10px] border border-border px-3.5 py-2 text-[12.5px] font-semibold text-muted transition-colors hover:bg-surface2 hover:text-text disabled:opacity-60"
      >
        {pending ? "Memproses…" : "Keluarkan semua perangkat lain"}
      </button>
      {done && !pending && (
        <span className="text-[12px] font-semibold text-green">
          Perangkat lain sudah dikeluarkan.
        </span>
      )}
    </div>
  );
}
