"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export type StockPurchaseInput = {
  product_id: string;
  tanggal: string;
  qty_dibeli: number;
  total_bayar: number;
  addToStock: boolean;
  updateSupplierPrice: boolean;
  catatan: string;
};

export type SPActionResult = { ok: true } | { ok: false; error: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function addStockPurchase(
  input: StockPurchaseInput,
): Promise<SPActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };

  if (!ISO_DATE.test(input.tanggal))
    return { ok: false, error: "Tanggal tidak valid." };
  const qty = Math.round(Number(input.qty_dibeli) || 0);
  if (qty < 1) return { ok: false, error: "Qty dibeli minimal 1." };
  const total = Number(input.total_bayar) || 0;
  if (total < 0) return { ok: false, error: "Total bayar tidak boleh negatif." };

  // Produk milik user (RLS membatasi ke user sendiri).
  const { data: product } = await supabase
    .from("products")
    .select("id, nama, stok, harga_supplier")
    .eq("id", input.product_id)
    .maybeSingle();
  if (!product) return { ok: false, error: "Produk tidak ditemukan." };

  const hargaPerUnit = Math.round(total / qty);

  // Efek samping opsional pada produk.
  const oldStok = Number(product.stok) || 0;
  const oldPrice =
    product.harga_supplier == null ? null : Number(product.harga_supplier);

  const productPatch: { stok?: number; harga_supplier?: number } = {};
  if (input.addToStock) {
    productPatch.stok = oldStok + qty;
  }
  if (input.updateSupplierPrice) {
    // Weighted average: bobot stok lama (harga lama) vs qty baru (harga baru).
    // Kalau belum ada harga lama / stok 0 → pakai harga beli baru langsung.
    const newAvg =
      oldPrice == null || oldStok <= 0
        ? hargaPerUnit
        : Math.round(
            (oldStok * oldPrice + qty * hargaPerUnit) / (oldStok + qty),
          );
    productPatch.harga_supplier = newAvg;
  }

  // Simpan catatan pembelian.
  const { error: insertErr } = await supabase.from("stock_purchases").insert({
    user_id: user.id,
    product_id: product.id,
    nama_produk: product.nama,
    tanggal: input.tanggal,
    qty_dibeli: qty,
    total_bayar: total,
    harga_per_unit: hargaPerUnit,
    added_to_stock: input.addToStock,
    updated_supplier_price: input.updateSupplierPrice,
    catatan: input.catatan.trim() || null,
  });
  if (insertErr) return { ok: false, error: "Gagal menyimpan pembelian." };

  // Terapkan perubahan produk (kalau ada checkbox dicentang).
  if (Object.keys(productPatch).length) {
    const { error: updErr } = await supabase
      .from("products")
      .update(productPatch)
      .eq("id", product.id);
    if (updErr)
      return {
        ok: false,
        error: "Pembelian tersimpan, tapi gagal memperbarui stok/harga produk.",
      };
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/products/${product.id}/history`);
  return { ok: true };
}
