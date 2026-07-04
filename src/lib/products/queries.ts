import { createServerClient } from "@/lib/supabase/server";
import type { Platform } from "@/types/database";
import type { Kategori } from "@/lib/calc/profit";

/** Bentuk produk yang dipakai di UI (subset kolom tabel products). */
export type Product = {
  id: string;
  nama: string;
  platform: Platform;
  kategori: Kategori;
  harga: number;
  modal: number;
};

const COLUMNS = "id, nama, platform, kategori, harga, modal";

/** Ambil semua produk milik user yang login (RLS membatasi ke user_id sendiri). */
export async function getProducts(): Promise<Product[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("products")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  return (data ?? []) as Product[];
}

/** Ambil satu produk (dipakai untuk prefill lintas-tool via ?product=<id>). */
export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as Product) ?? null;
}
