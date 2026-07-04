"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/plans";
import type { Plan, Platform } from "@/types/database";
import type { Kategori } from "@/lib/calc/profit";

export type ProductInput = {
  nama: string;
  platform: Platform;
  kategori: Kategori;
  harga: number;
  modal: number;
};

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; limitReached?: boolean };

async function getAuthedContext() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  return { supabase, userId: user.id, plan: (profile?.plan ?? "free") as Plan };
}

function validate(input: ProductInput): string | null {
  if (!input.nama.trim()) return "Nama produk wajib diisi.";
  if (!input.harga || input.harga <= 0) return "Harga jual harus lebih dari 0.";
  if (input.modal < 0) return "Modal tidak boleh negatif.";
  return null;
}

/**
 * Simpan produk. "Quick save": kalau sudah ada produk dengan nama sama
 * (case-insensitive), produk itu diperbarui — tidak menambah baris baru
 * (meniru perilaku psQuickSave di prototype). Batas plan free (3 produk)
 * hanya berlaku saat menambah produk BARU.
 */
export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  const ctx = await getAuthedContext();
  if (!ctx) return { ok: false, error: "Sesi habis. Silakan login ulang." };

  const err = validate(input);
  if (err) return { ok: false, error: err };

  const { supabase, userId, plan } = ctx;
  const nama = input.nama.trim();

  // Cari produk existing dengan nama sama (RLS membatasi ke milik user).
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .ilike("nama", nama)
    .maybeSingle();

  const payload = {
    nama,
    platform: input.platform,
    kategori: input.kategori,
    harga: input.harga,
    modal: input.modal,
  };

  if (existing) {
    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", existing.id);
    if (error) return { ok: false, error: "Gagal memperbarui produk." };
  } else {
    // Cek batas plan hanya untuk produk baru.
    const limit = PLAN_LIMITS[plan].savedProducts;
    if (Number.isFinite(limit)) {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });
      if ((count ?? 0) >= limit) {
        return {
          ok: false,
          limitReached: true,
          error: `Plan gratis maksimal ${limit} produk. Upgrade ke Pro untuk simpan tanpa batas.`,
        };
      }
    }
    const { error } = await supabase
      .from("products")
      .insert({ ...payload, user_id: userId });
    if (error) return { ok: false, error: "Gagal menyimpan produk." };
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/profit");
  revalidatePath("/dashboard/promo");
  return { ok: true };
}

/** Update produk berdasarkan id (dipakai form edit di Produk Saya). */
export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ActionResult> {
  const ctx = await getAuthedContext();
  if (!ctx) return { ok: false, error: "Sesi habis. Silakan login ulang." };

  const err = validate(input);
  if (err) return { ok: false, error: err };

  const { error } = await ctx.supabase
    .from("products")
    .update({
      nama: input.nama.trim(),
      platform: input.platform,
      kategori: input.kategori,
      harga: input.harga,
      modal: input.modal,
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Gagal memperbarui produk." };

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/profit");
  revalidatePath("/dashboard/promo");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const ctx = await getAuthedContext();
  if (!ctx) return { ok: false, error: "Sesi habis. Silakan login ulang." };

  const { error } = await ctx.supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: "Gagal menghapus produk." };

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/profit");
  revalidatePath("/dashboard/promo");
  return { ok: true };
}
