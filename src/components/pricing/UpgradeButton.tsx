"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        opts: {
          onSuccess?: () => void;
          onPending?: () => void;
          onError?: () => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

export function UpgradeButton({
  isLoggedIn,
  isPro,
}: {
  isLoggedIn: boolean;
  isPro: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isPro) {
    return (
      <div className="rounded-[10px] border border-green/40 bg-green/10 px-4 py-3 text-center text-sm font-semibold text-green">
        ✓ Kamu sudah Pro
      </div>
    );
  }

  async function upgrade() {
    setError("");
    if (!isLoggedIn) {
      router.push("/login?message=upgrade");
      return;
    }
    if (!window.snap) {
      setError("Pembayaran belum siap dimuat. Refresh halaman lalu coba lagi.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payment/create-transaction", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setError(data.error || "Gagal memulai pembayaran.");
        setLoading(false);
        return;
      }
      window.snap.pay(data.token, {
        onSuccess: () => router.push("/dashboard?upgrade=success"),
        onPending: () => router.push("/dashboard?upgrade=pending"),
        onError: () => setError("Pembayaran gagal. Coba lagi ya."),
        onClose: () => setLoading(false),
      });
    } catch {
      setError("Gagal menghubungi server. Coba lagi ya.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={upgrade}
        disabled={loading}
        className="w-full rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-4 py-3 font-display text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Memproses…" : "Upgrade ke Pro"}
      </button>
      {error && <p className="mt-2 text-[12.5px] text-red">{error}</p>}
    </div>
  );
}
