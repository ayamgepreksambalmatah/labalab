import { fmt } from "@/lib/format";
import type { SalesAnalysis } from "@/lib/calc/sales";

/* ============================ SALES ANALYZER ============================ */

export type SalesAiResult = {
  ringkasan: string;
  temuan: string[];
  rekomendasi: string[];
};

export const SALES_AI_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ringkasan: {
      type: "string",
      description:
        "1-2 kalimat tajam yang bikin seller sadar ada uang yang bisa diselamatkan. Sebutkan angka total profit hilang secara eksplisit. Nada seperti menemukan sesuatu yang tersembunyi.",
    },
    temuan: {
      type: "array",
      description:
        "3 poin temuan untuk 3 kontributor profit hilang teratas. Tiap poin jelaskan APA yang terjadi dan KENAPA dengan angka rupiah spesifik per produk.",
      items: { type: "string" },
    },
    rekomendasi: {
      type: "array",
      description:
        "3 rekomendasi konkret yang bisa dikerjakan minggu ini — sebutkan nama produk, angka spesifik, dan aksi jelas.",
      items: { type: "string" },
    },
  },
  required: ["ringkasan", "temuan", "rekomendasi"],
} as const;

export function buildSalesPrompt(a: SalesAnalysis, sourceLabel: string): string {
  const productSummary = a.enriched
    .map(
      (p) =>
        `${p.name}: omzet ${fmt(p.omzet)}, ${p.unit} unit, profit aktual ${fmt(p.profit)}, margin ${p.margin.toFixed(1)}%, profit hilang ${fmt(p.lostProfit)} (penyebab: ${p.cause})`,
    )
    .join("\n");
  const topLossSummary =
    a.topLoss
      .map((p) => `${p.name}: kehilangan ${fmt(p.lostProfit)} karena ${p.cause}`)
      .join("\n") || "Tidak ada kontributor signifikan";

  return `Kamu adalah konsultan bisnis e-commerce Indonesia yang tugasnya menemukan uang yang "hilang" dari toko seller karena inefisiensi, bukan sekadar melaporkan angka.

Data toko (${sourceLabel}):
Total omzet: ${fmt(a.totalOmzet)}, Total profit aktual: ${fmt(a.totalProfit)}, Margin: ${a.totalMargin.toFixed(1)}%
Benchmark margin terbaik yang SUDAH TERBUKTI dicapai toko ini sendiri: ${a.benchmarkMargin.toFixed(1)}%
Total estimasi profit hilang (dibanding kalau semua produk capai benchmark itu): ${fmt(a.totalLostProfit)}

3 kontributor terbesar profit hilang:
${topLossSummary}

Detail semua produk:
${productSummary}

Tulis dalam Bahasa Indonesia, nada seperti detektif yang baru menemukan bukti — percaya diri dan spesifik, bukan generik. Isi field "ringkasan", "temuan" (3 item), dan "rekomendasi" (3 item) sesuai skema.`;
}

/* ============================ PRODUCT DOCTOR ============================ */

export type DoctorAiResult = {
  skor: number;
  masalah: string[];
  judulBaru: string;
  deskripsiBaru: string;
  ideFoto: string[];
  analisisReview: string;
};

export const DOCTOR_AI_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    skor: {
      type: "integer",
      description: "Skor kualitas listing 0-100.",
    },
    masalah: {
      type: "array",
      description: "3-5 poin masalah, singkat dan spesifik.",
      items: { type: "string" },
    },
    judulBaru: {
      type: "string",
      description: "1 judul baru yang dioptimasi, maksimal 70 karakter.",
    },
    deskripsiBaru: {
      type: "string",
      description:
        "Deskripsi baru 100-180 kata, persuasif, dengan emoji relevan.",
    },
    ideFoto: {
      type: "array",
      description: "2-3 saran konkret untuk foto produk, spesifik untuk kategori ini.",
      items: { type: "string" },
    },
    analisisReview: {
      type: "string",
      description:
        "Kalau ADA review pembeli: identifikasi 2-3 pola keluhan/pujian utama, sebutkan perkiraan persentase kalau memungkinkan. Kalau TIDAK ada review: tulis persis 'Tidak ada review untuk dianalisis.'",
    },
  },
  required: [
    "skor",
    "masalah",
    "judulBaru",
    "deskripsiBaru",
    "ideFoto",
    "analisisReview",
  ],
} as const;

/* ============================ LISTING GENERATOR ============================ */

export type ListingPlatform = "shopee" | "tokopedia" | "tiktok";

export type ListingVersion = {
  platform: ListingPlatform;
  judul: string;
  deskripsi: string;
  poinKeunggulan: string[];
  keywords: string[];
};

export type ListingAiResult = {
  versions: ListingVersion[];
};

export const LISTING_AI_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    versions: {
      type: "array",
      description:
        "Satu objek per platform yang diminta. Judul & deskripsi WAJIB berbeda sesuai gaya tiap platform, bukan hasil copy-paste.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          platform: {
            type: "string",
            enum: ["shopee", "tokopedia", "tiktok"],
            description: "Identitas platform untuk versi ini.",
          },
          judul: {
            type: "string",
            description:
              "Judul listing dioptimasi untuk platform ini, maksimal 70 karakter, sertakan kata kunci utama.",
          },
          deskripsi: {
            type: "string",
            description:
              "Deskripsi produk persuasif dengan emoji relevan, struktur rapi (pembuka menarik, keunggulan, call-to-action), disesuaikan gaya platform.",
          },
          poinKeunggulan: {
            type: "array",
            description: "3-5 bullet point keunggulan produk, singkat & spesifik.",
            items: { type: "string" },
          },
          keywords: {
            type: "array",
            description: "5-8 kata kunci pencarian relevan (tanpa tanda #).",
            items: { type: "string" },
          },
        },
        required: ["platform", "judul", "deskripsi", "poinKeunggulan", "keywords"],
      },
    },
  },
  required: ["versions"],
} as const;

const LISTING_PLATFORM_STYLE: Record<ListingPlatform, string> = {
  shopee:
    "Judul padat dengan keyword utama di depan (maks 70 karakter), keywords banyak & spesifik untuk mesin pencari Shopee.",
  tokopedia:
    "Deskripsi lengkap, informatif, dan terstruktur — spesifikasi jelas, cocok pembeli yang teliti.",
  tiktok:
    "Nada santai dan natural, hook menarik di awal, cocok dipakai untuk konten video/live TikTok Shop.",
};

const LISTING_PLATFORM_LABEL: Record<ListingPlatform, string> = {
  shopee: "Shopee",
  tokopedia: "Tokopedia",
  tiktok: "TikTok Shop",
};

export function buildListingPrompt(input: {
  nama: string;
  kategori: string;
  harga: string;
  keunggulan: string;
  bahan: string;
  platforms: ListingPlatform[];
}): string {
  const perPlatform = input.platforms
    .map(
      (p) =>
        `- ${LISTING_PLATFORM_LABEL[p]} (platform: "${p}"): ${LISTING_PLATFORM_STYLE[p]}`,
    )
    .join("\n");
  const platformValues = input.platforms.map((p) => `"${p}"`).join(", ");

  return `Kamu adalah copywriter e-commerce Indonesia yang jago bikin listing produk konversi tinggi untuk Shopee/Tokopedia/TikTok Shop.

Data produk (SAMA untuk semua platform):
- Nama/produk: ${input.nama}
- Kategori: ${input.kategori}
- Harga: ${input.harga ? "Rp " + input.harga : "(tidak diisi)"}
- Keunggulan/detail: ${input.keunggulan || "(tidak diisi — simpulkan dari nama & kategori)"}
- Bahan/material: ${input.bahan || "(tidak diisi)"}

Buat listing TERPISAH untuk setiap platform berikut, pakai data yang sama tapi gaya penulisan disesuaikan:
${perPlatform}

Bahasa Indonesia, persuasif tapi tidak lebay. Kembalikan array "versions" berisi tepat satu objek untuk tiap platform di atas (nilai "platform" persis: ${platformValues}), masing-masing dengan "judul" (maks 70 karakter), "deskripsi", "poinKeunggulan" (3-5 item), dan "keywords" (5-8 item) sesuai skema.`;
}

export function buildDoctorPrompt(input: {
  judul: string;
  deskripsi: string;
  harga: string;
  kategori: string;
  hasPhoto: boolean;
  review?: string;
}): string {
  return `Kamu adalah expert listing optimization untuk marketplace Indonesia (Shopee/Tokopedia).

Audit listing produk ini:
- Judul sekarang: ${input.judul || "(tidak diisi)"}
- Deskripsi sekarang: ${input.deskripsi || "(tidak diisi)"}
- Harga: ${input.harga ? "Rp " + input.harga : "(tidak diisi)"}
- Kategori: ${input.kategori}
${input.hasPhoto ? "- Foto produk utama terlampir, ikut nilai kualitas fotonya juga." : "- Tidak ada foto dilampirkan."}
${input.review ? `\nReview dari pembeli (analisis juga ini untuk masukan perbaikan):\n${input.review}` : ""}

Bahasa Indonesia, to the point, seperti expert yang review portofolio. Isi field "skor" (0-100), "masalah" (3-5 item), "judulBaru", "deskripsiBaru", "ideFoto" (2-3 item), dan "analisisReview" sesuai skema.`;
}
