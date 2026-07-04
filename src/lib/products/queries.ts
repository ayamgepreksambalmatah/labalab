import { createServerClient } from "@/lib/supabase/server";
import type { Platform } from "@/types/database";
import type { Kategori } from "@/lib/calc/profit";

export type FaqItem = { question: string; answer: string };

/** Bentuk produk yang dipakai di UI (subset kolom tabel products). */
export type Product = {
  id: string;
  nama: string;
  platform: Platform;
  kategori: Kategori;
  harga: number;
  modal: number;
  // Detail lengkap (Product Knowledge)
  stok: number | null;
  ukuran_tersedia: string[] | null;
  faq: FaqItem[] | null;
  garansi: string | null;
  cara_perawatan: string | null;
  bahan: string | null;
  deskripsi: string | null;
};

const COLUMNS =
  "id, nama, platform, kategori, harga, modal, stok, ukuran_tersedia, faq, garansi, cara_perawatan, bahan, deskripsi";

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
