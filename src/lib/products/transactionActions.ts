"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export type ManualTxInput = {
  tanggal: string;
  product_id: string | null;
  nama_produk: string;
  platform: string;
  qty: number;
  harga_satuan: number;
  biaya_platform: number;
  modal: number;
  status: string;
  catatan: string;
};

export type TxActionResult = { ok: true } | { ok: false; error: string };

const VALID_PLATFORMS = ["shopee", "tokopedia", "tiktok", "instagram", "lainnya"];
const VALID_STATUS = ["selesai", "batal", "refund", "pending"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function addManualTransaction(
  input: ManualTxInput,
): Promise<TxActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };

  const nama = input.nama_produk.trim();
  if (!nama) return { ok: false, error: "Nama produk wajib diisi." };
  if (!ISO_DATE.test(input.tanggal))
    return { ok: false, error: "Tanggal tidak valid." };

  const qty = Math.max(1, Math.round(Number(input.qty) || 1));
  const harga = Number(input.harga_satuan) || 0;
  const biaya = Number(input.biaya_platform) || 0;
  const modal = Number(input.modal) || 0;
  const omzet = qty * harga;
  const profit = omzet - biaya - modal;
  const platform = VALID_PLATFORMS.includes(input.platform)
    ? input.platform
    : "instagram";
  const status = VALID_STATUS.includes(input.status) ? input.status : "selesai";

  const { error } = await supabase.from("sales_transactions").insert({
    user_id: user.id,
    product_id: input.product_id || null,
    tanggal: input.tanggal,
    nama_produk: nama,
    platform,
    qty,
    harga_satuan: harga,
    omzet,
    biaya_platform: biaya,
    modal: modal * qty, // modal per unit × qty
    profit: omzet - biaya - modal * qty,
    status,
    sumber: "manual",
    catatan: input.catatan.trim() || null,
  });
  if (error) return { ok: false, error: "Gagal menyimpan transaksi." };

  revalidatePath("/dashboard/laporan");
  revalidatePath("/dashboard");
  return { ok: true };
}

export type EditTxInput = {
  id: string;
  status: string;
  qty: number;
  harga_satuan: number;
  catatan: string;
};

/**
 * Edit transaksi (koreksi). WAJIB via UPDATE satu baris — bukan hapus+insert —
 * supaya trigger sync_stock_on_transaction menyesuaikan stok otomatis
 * (mis. Pending→Selesai mengurangi stok, koreksi qty menyesuaikan selisih).
 * Modal diskalakan proporsional terhadap qty; biaya platform dibiarkan.
 */
export async function editTransaction(
  input: EditTxInput,
): Promise<TxActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };

  const status = VALID_STATUS.includes(input.status) ? input.status : "selesai";
  const qty = Math.max(1, Math.round(Number(input.qty) || 1));
  const harga = Math.max(0, Number(input.harga_satuan) || 0);

  // Ambil baris lama untuk skala modal & pertahankan biaya platform.
  const { data: old } = await supabase
    .from("sales_transactions")
    .select("qty, modal, biaya_platform")
    .eq("id", input.id)
    .maybeSingle();
  if (!old) return { ok: false, error: "Transaksi tidak ditemukan." };

  const oldQty = Number(old.qty) || 0;
  const modalPerUnit = oldQty > 0 ? Number(old.modal) / oldQty : Number(old.modal);
  const modal = Math.round(modalPerUnit * qty);
  const biaya = Number(old.biaya_platform) || 0;
  const omzet = qty * harga;
  const profit = omzet - biaya - modal;

  const { error } = await supabase
    .from("sales_transactions")
    .update({
      status,
      qty,
      harga_satuan: harga,
      omzet,
      modal,
      profit,
      catatan: input.catatan.trim() || null,
    })
    .eq("id", input.id); // RLS membatasi ke milik user
  if (error) return { ok: false, error: "Gagal memperbarui transaksi." };

  revalidatePath("/dashboard/laporan");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<TxActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis. Login ulang." };

  const { error } = await supabase
    .from("sales_transactions")
    .delete()
    .eq("id", id); // RLS membatasi ke milik user
  if (error) return { ok: false, error: "Gagal menghapus transaksi." };

  revalidatePath("/dashboard/laporan");
  revalidatePath("/dashboard");
  return { ok: true };
}
