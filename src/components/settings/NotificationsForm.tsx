"use client";

import { useActionState } from "react";
import { updateNotifications } from "@/lib/settings/actions";
import { Feedback } from "@/components/settings/Section";

export function NotificationsForm({ kuotaHabis }: { kuotaHabis: boolean }) {
  const [state, formAction, pending] = useActionState(updateNotifications, null);

  return (
    <form action={formAction} className="space-y-3">
      <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-border bg-surface2 p-3.5">
        <input
          type="checkbox"
          name="notif_kuota_habis"
          defaultChecked={kuotaHabis}
          className="mt-0.5 accent-accent"
        />
        <span>
          <span className="block text-[13.5px] font-semibold">
            Ingatkan saya kalau kuota hampir habis
          </span>
          <span className="block text-[12px] text-muted">
            Email peringatan saat pemakaian fitur mendekati limit bulanan.
          </span>
        </span>
      </label>

      <label className="flex cursor-not-allowed items-start gap-3 rounded-[10px] border border-border bg-surface2/50 p-3.5 opacity-60">
        <input type="checkbox" disabled className="mt-0.5 accent-accent" />
        <span>
          <span className="flex items-center gap-2 text-[13.5px] font-semibold">
            Kirim ringkasan performa toko tiap minggu
            <span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-wide">
              Segera
            </span>
          </span>
          <span className="block text-[12px] text-muted">
            Ringkasan mingguan otomatis — sedang disiapkan.
          </span>
        </span>
      </label>

      <Feedback result={state} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-[10px] border border-border px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface2 disabled:opacity-50"
      >
        {pending ? "Menyimpan…" : "Simpan Preferensi"}
      </button>
    </form>
  );
}
