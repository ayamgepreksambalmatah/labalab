"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createServerClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import type { FormResult } from "@/lib/settings/types";
import type { TonePreference } from "@/types/database";

const SETTINGS_PATH = "/dashboard/settings";
const TONES: TonePreference[] = ["santai", "profesional", "genz"];

/** Simpan profil & info toko. */
export async function updateProfile(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { error: "Sesi tidak valid. Login ulang." };

  const toneRaw = String(formData.get("tone_preference") ?? "santai");
  const tone_preference = (
    TONES.includes(toneRaw as TonePreference) ? toneRaw : "santai"
  ) as TonePreference;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("full_name") ?? "").trim() || null,
      store_name: String(formData.get("store_name") ?? "").trim() || null,
      nomor_wa: String(formData.get("nomor_wa") ?? "").trim() || null,
      tone_preference,
    })
    .eq("id", userId);

  if (error) return { error: "Gagal menyimpan profil. Coba lagi." };
  revalidatePath(SETTINGS_PATH);
  return { success: "Profil tersimpan." };
}

/** Ganti password untuk user email/password — verifikasi password lama dulu. */
export async function changePassword(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!current || !next) return { error: "Semua kolom wajib diisi." };
  if (next.length < 6) return { error: "Password baru minimal 6 karakter." };
  if (next !== confirm) return { error: "Konfirmasi password tidak cocok." };

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Sesi tidak valid. Login ulang." };

  // Verifikasi password lama sebelum mengganti.
  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (verifyErr) return { error: "Password saat ini salah." };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: "Gagal mengganti password. Coba lagi." };
  return { success: "Password berhasil diganti." };
}

/** Set password untuk user yang daftar via Google (belum punya password). */
export async function setPassword(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (next.length < 6) return { error: "Password minimal 6 karakter." };
  if (next !== confirm) return { error: "Konfirmasi password tidak cocok." };

  const supabase = await createServerClient();
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: "Gagal menyetel password. Coba lagi." };

  revalidatePath(SETTINGS_PATH);
  return { success: "Password disetel. Sekarang kamu juga bisa login manual." };
}

/** Simpan preferensi notifikasi email. */
export async function updateNotifications(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { error: "Sesi tidak valid. Login ulang." };

  const { error } = await supabase
    .from("profiles")
    .update({ notif_kuota_habis: formData.get("notif_kuota_habis") === "on" })
    .eq("id", userId);

  if (error) return { error: "Gagal menyimpan preferensi." };
  revalidatePath(SETTINGS_PATH);
  return { success: "Preferensi notifikasi tersimpan." };
}

/**
 * Batalkan langganan: matikan auto-renew, TIDAK menghapus akses. User tetap
 * Pro/Max sampai plan_expires_at (tanpa refund sisa periode — kebijakan resmi).
 */
export async function cancelSubscription(): Promise<FormResult> {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { error: "Sesi tidak valid. Login ulang." };

  const { error } = await supabase
    .from("subscriptions")
    .update({ auto_renew: false })
    .eq("user_id", userId)
    .eq("status", "paid");

  if (error) return { error: "Gagal membatalkan langganan. Coba lagi." };
  revalidatePath(SETTINGS_PATH);
  return {
    success:
      "Perpanjangan otomatis dimatikan. Akses kamu tetap aktif sampai masa berlaku berakhir, tanpa pengembalian dana untuk sisa periode.",
  };
}

/**
 * Hapus akun permanen. Menghapus user dari Supabase Auth → cascade delete
 * ke profiles & semua data terkait (FK on delete cascade di 0001+). Tidak ada
 * refund untuk pembatalan atas keinginan sendiri.
 */
export async function deleteAccount(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  if (String(formData.get("confirm") ?? "").trim() !== "HAPUS AKUN") {
    return { error: 'Ketik "HAPUS AKUN" persis untuk konfirmasi.' };
  }

  const supabase = await createServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { error: "Sesi tidak valid. Login ulang." };

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: "Gagal menghapus akun. Hubungi support ya." };

  await supabase.auth.signOut();
  redirect("/login?message=account-deleted");
}
