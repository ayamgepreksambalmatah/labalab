/**
 * Config AI terpusat (server-only). Model routing per fitur untuk efisiensi
 * biaya (spec model-routing §1): tugas ringan volume tinggi → Haiku;
 * analisis/vision/copywriting → Sonnet.
 *
 * Ubah di sini saja kalau ada model baru / perlu tuning ulang.
 */
export const AI_MODELS = {
  csReply: "claude-haiku-4-5-20251001", // draft balasan pendek, volume tinggi → termurah
  salesAnalyzer: "claude-sonnet-4-6", // reasoning pola & rekomendasi
  productDoctor: "claude-sonnet-4-6", // reasoning + vision foto
  listingGenerator: "claude-sonnet-4-6", // kualitas copywriting
} as const;

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

export const AI_MAX_TOKENS = 2048;
