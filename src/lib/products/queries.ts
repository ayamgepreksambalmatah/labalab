import { createServerClient } from "@/lib/supabase/server";
import type { Platform } from "@/types/database";
import type { Kategori } from "@/lib/calc/profit";
import type { AtributKhusus } from "@/lib/products/knowledge";

export type FaqItem = { question: string; answer: string };

/** Bentuk produk yang dipakai di UI (subset kolom tabel products). */
export type Product = {
  id: string;
  nama: string;
  platform: Platform;
  kategori: Kategori;
  harga: number;
  modal: number;
  // Detail lengkap (Product Knowledge universal)
  stok: number | null;
  faq: FaqItem[] | null;
  deskripsi: string | null;
  masa_berlaku: string | null;
  sertifikasi: string | null;
  kondisi_pengiriman: string | null;
  catatan_tambahan: string | null;
  atribut_khusus: AtributKhusus | null;
  // Info supplier (pencatatan pribadi seller)
  harga_supplier: number | null;
  link_supplier: string | null;
  kontak_supplier: string | null;
  // Legacy (backward compat — tetap dibaca, tidak lagi diedit terpisah di UI)
  garansi: string | null;
  cara_perawatan: string | null;
  bahan: string | null;
  ukuran_tersedia: string[] | null;
};

const COLUMNS =
  "id, nama, platform, kategori, harga, modal, stok, faq, deskripsi, masa_berlaku, sertifikasi, kondisi_pengiriman, catatan_tambahan, atribut_khusus, harga_supplier, link_supplier, kontak_supplier, garansi, cara_perawatan, bahan, ukuran_tersedia";

/** Ambil semua produk milik user yang login (RLS membatasi ke user_id sendiri). */
export async function getProducts(): Promise<Product[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("products")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as Product[];
}

/** Ambil satu produk (dipakai untuk prefill lintas-tool via ?product=<id>). */
export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as Product) ?? null;
}
