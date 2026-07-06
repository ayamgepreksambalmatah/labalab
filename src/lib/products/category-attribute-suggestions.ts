import type { Kategori } from "@/lib/calc/profit";

/**
 * Saran atribut per kategori — HANYA placeholder/starting point untuk form
 * "Atribut Khusus". User bebas hapus/tambah/ubah; ini bukan validasi ketat.
 */
export const ATTRIBUTE_SUGGESTIONS: Record<
  Kategori,
  { label: string; example: string }[]
> = {
  fashion: [
    { label: "Ukuran Tersedia", example: "S, M, L, XL" },
    { label: "Bahan", example: "Cotton Combed 24s" },
    { label: "Warna", example: "Hitam, Putih, Navy" },
  ],
  makanan: [
    { label: "Varian Rasa", example: "Original, Pedas, Manis" },
    { label: "Berat/Isi", example: "250gr, 500gr" },
    { label: "Alergen", example: "Mengandung kacang, susu" },
  ],
  kecantikan: [
    { label: "Kandungan Utama", example: "Niacinamide 5%, Hyaluronic Acid" },
    { label: "Jenis Kulit Cocok", example: "Semua jenis kulit, kulit sensitif" },
    { label: "No. BPOM", example: "NA18211900123" },
  ],
  elektronik: [
    { label: "Garansi Resmi", example: "1 tahun garansi toko" },
    { label: "Voltase/Daya", example: "220V, 100W" },
    { label: "Kompatibilitas", example: "Android & iOS" },
  ],
  rumah: [
    { label: "Material", example: "Kayu jati, plastik ABS" },
    { label: "Dimensi", example: "50x30x20 cm" },
    { label: "Kapasitas", example: "2 Liter" },
  ],
  olahraga: [
    { label: "Ukuran", example: "S, M, L / Universal" },
    { label: "Material", example: "Polyester, karet" },
  ],
  lainnya: [{ label: "Spesifikasi", example: "Isi bebas sesuai produk" }],
};

/** Saran untuk satu kategori (fallback ke "lainnya"). */
export function suggestionsFor(kategori: Kategori) {
  return ATTRIBUTE_SUGGESTIONS[kategori] ?? ATTRIBUTE_SUGGESTIONS.lainnya;
}
