"use client";

import { useState, useTransition } from "react";
import { cancelSubscription } from "@/lib/settings/actions";
import type { FormResult } from "@/lib/settings/types";
import { Feedback } from "@/components/settings/Section";

export function CancelSubscriptionButton({ expiresLabel }: { expiresLabel: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<FormResult>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending || !!result?.success}
        onClick={() => {
          if (
            !window.confirm(
              `Batalkan perpanjangan otomatis? Akses kamu tetap aktif sampai ${expiresLabel}. Tidak ada pengembalian dana untuk sisa periode.`,
            )
          ) {
            return;
          }
          startTransition(async () => setResult(await cancelSubscription()));
        }}
        className="rounded-[10px] border border-border px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-surface2 hover:text-text disabled:opacity-50"
      >
        {pending ? "Memproses…" : "Batalkan Langganan"}
      </button>
      <Feedback result={result} />
    </div>
  );
}
