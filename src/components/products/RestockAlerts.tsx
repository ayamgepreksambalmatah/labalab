"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BuyStockForm } from "@/components/products/BuyStockForm";
import type { RestockItem } from "@/lib/products/dashboard";

export function RestockAlerts({ items }: { items: RestockItem[] }) {
  const router = useRouter();
  const [buyFor, setBuyFor] = useState<RestockItem | null>(null);

  return (
    <div className="mt-6 rounded-card border border-yellow/30 bg-yellow/5 p-5">
      <p className="mb-3 text-[13px] font-bold text-yellow">
        ⚠️ Perlu Restock Segera
      </p>
      <ul className="space-y-2">
        {items.map((it) => {
          // 🔴 kritis kalau stok <= setengah minimum (atau habis), 🟡 kalau mendekati.
          const critical = it.stok <= it.stok_minimum / 2;
          return (
            <li
              key={it.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[10px] border border-border bg-surface px-3.5 py-2.5"
            >
              <span className="text-[15px]">{critical ? "🔴" : "🟡"}</span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
                {it.nama}
              </span>
              <span className="text-[12.5px] text-muted">
                Sisa: <b className={critical ? "text-red" : "text-yellow"}>{it.stok}</b>{" "}
                <span className="text-muted/70">(min: {it.stok_minimum})</span>
              </span>
              <button
                type="button"
                onClick={() => setBuyFor(it)}
                className="rounded-md border border-accent2/40 bg-accent2/10 px-2.5 py-1 text-[11.5px] font-semibold text-accent2 hover:bg-accent2/20"
              >
                📦 Beli Stok
              </button>
            </li>
          );
        })}
      </ul>

      {buyFor && (
        <BuyStockForm
          productId={buyFor.id}
          nama={buyFor.nama}
          currentStok={buyFor.stok}
          currentHargaSupplier={buyFor.harga_supplier}
          onDone={() => {
            setBuyFor(null);
            router.refresh();
          }}
          onCancel={() => setBuyFor(null)}
        />
      )}
    </div>
  );
}
