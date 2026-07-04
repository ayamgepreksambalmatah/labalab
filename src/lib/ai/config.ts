/**
 * Konfigurasi model AI terpusat (server-only). Ganti di sini untuk tuning
 * biaya vs kualitas. Default: Opus 4.8 tanpa extended thinking agar respons
 * cepat & hemat untuk tugas terstruktur (analisis + generasi listing).
 *
 * Kalau butuh analisis lebih dalam, aktifkan adaptive thinking:
 *   THINKING = { type: "adaptive" } dan naikkan MAX_TOKENS.
 */
export const AI_MODEL = "claude-opus-4-8";
export const AI_MAX_TOKENS = 2048;
