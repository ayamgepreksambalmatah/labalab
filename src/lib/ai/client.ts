import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Anthropic client — HANYA server-side. API key dari env, tidak pernah ke
 * client. Dipakai di API route Sales Analyzer & Product Doctor.
 */
export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY belum di-set di environment.");
  }
  return new Anthropic({ apiKey });
}

/**
 * Panggil model dengan structured output (JSON schema) dan kembalikan objek
 * hasil parse sesuai tipe T. Structured outputs menjamin output valid schema,
 * jadi tidak perlu regex/parsing rapuh seperti prototype.
 */
export async function generateJson<T>({
  system,
  content,
  schema,
  maxTokens,
}: {
  system?: string;
  content: Anthropic.ContentBlockParam[] | string;
  schema: Record<string, unknown>;
  maxTokens: number;
}): Promise<T> {
  const anthropic = getAnthropic();
  const { AI_MODEL } = await import("@/lib/ai/config");

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages: [{ role: "user", content }],
    output_config: { format: { type: "json_schema", schema } },
  });

  if (message.stop_reason === "refusal") {
    throw new Error("Permintaan ditolak oleh filter keamanan AI.");
  }

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return JSON.parse(text) as T;
}
