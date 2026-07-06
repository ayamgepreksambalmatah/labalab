/**
 * Formatter Product Knowledge universal — dipakai untuk membangun konteks AI
 * (CS Reply) dan enrich input Listing Generator. Pure function, adaptif ke
 * `atribut_khusus` apapun isinya, tanpa hardcode field per kategori.
 */

export type AtributKhusus = Record<string, string | string[]>;

/** Sumber knowledge — subset kolom `products` (semua opsional). */
export type KnowledgeSource = {
  masa_berlaku?: string | null;
  sertifikasi?: string | null;
  kondisi_pengiriman?: string | null;
  catatan_tambahan?: string | null;
  atribut_khusus?: AtributKhusus | null;
  // Legacy (fallback untuk produk lama yang belum dimigrasi)
  garansi?: string | null;
  bahan?: string | null;
  cara_perawatan?: string | null;
  ukuran_tersedia?: string[] | null;
};

/** Ubah objek atribut_khusus jadi baris "Label: nilai" (skip yang kosong). */
export function formatAtribut(atribut: AtributKhusus | null | undefined): string[] {
  if (!atribut) return [];
  return Object.entries(atribut)
    .filter(([k, v]) =>
      k.trim() && (Array.isArray(v) ? v.length > 0 : String(v).trim()),
    )
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
}

/**
 * Baris info produk untuk prompt AI. Mengutamakan field universal, lalu
 * atribut_khusus dinamis, lalu field legacy sebagai fallback.
 */
export function productKnowledgeLines(p: KnowledgeSource): string[] {
  const lines: string[] = [];

  const masa = p.masa_berlaku || p.garansi;
  if (masa) lines.push(`Masa berlaku/garansi: ${masa}`);
  if (p.sertifikasi) lines.push(`Sertifikasi: ${p.sertifikasi}`);
  if (p.kondisi_pengiriman) lines.push(`Kondisi pengiriman: ${p.kondisi_pengiriman}`);

  lines.push(...formatAtribut(p.atribut_khusus));

  // Fallback legacy (kalau produk lama belum dimigrasi ke atribut_khusus).
  if (p.bahan) lines.push(`Bahan: ${p.bahan}`);
  if (p.ukuran_tersedia && p.ukuran_tersedia.length > 0)
    lines.push(`Ukuran: ${p.ukuran_tersedia.join(", ")}`);

  const catatan = p.catatan_tambahan || p.cara_perawatan;
  if (catatan) lines.push(`Catatan: ${catatan}`);

  return lines;
}
