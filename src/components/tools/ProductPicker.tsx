"use client";

import type { Platform } from "@/types/database";
import type { Product } from "@/lib/products/queries";
import { Field } from "@/components/tools/controls";

const PLATFORM_ICON: Record<Platform, string> = {
  shopee: "🟠",
  tokopedia: "🟢",
  tiktok: "🎵",
};

/**
 * Selektor "Pilih dari Produk Saya". Muncul hanya kalau user punya produk
 * tersimpan. Memanggil onPick dengan produk terpilih untuk prefill form.
 */
export function ProductPicker({
  products,
  value,
  onPick,
}: {
  products: Product[];
  value: string;
  onPick: (p: Product | null) => void;
}) {
  if (products.length === 0) return null;

  return (
    <Field label="Pilih dari Produk Saya">
      <select
        value={value}
        onChange={(e) => {
          const p = products.find((x) => x.id === e.target.value) ?? null;
          onPick(p);
        }}
        className="w-full rounded-[9px] border border-border bg-surface2 px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
      >
        <option value="">— Isi manual —</option>
        {products.map((p) => (
          <option key={p.id} value={p.id} className="bg-surface2">
            {PLATFORM_ICON[p.platform]} {p.nama}
          </option>
        ))}
      </select>
    </Field>
  );
}
