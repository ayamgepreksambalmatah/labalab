import "server-only";
import crypto from "crypto";
import midtransClient from "midtrans-client";

export function isMidtransProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} belum di-set di environment.`);
  return v;
}

/** Snap client untuk membuat transaksi (server-only, pakai server key). */
export function getSnapClient() {
  return new midtransClient.Snap({
    isProduction: isMidtransProduction(),
    serverKey: requireEnv("MIDTRANS_SERVER_KEY"),
    clientKey: requireEnv("MIDTRANS_CLIENT_KEY"),
  });
}

/**
 * Verifikasi signature webhook Midtrans (spec §6):
 * sha512(order_id + status_code + gross_amount + serverKey).
 */
export function verifyMidtransSignature(body: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): boolean {
  const serverKey = requireEnv("MIDTRANS_SERVER_KEY");
  const expected = crypto
    .createHash("sha512")
    .update(body.order_id + body.status_code + body.gross_amount + serverKey)
    .digest("hex");
  // Bandingkan konstan-waktu untuk cegah timing attack.
  const a = Buffer.from(expected);
  const b = Buffer.from(body.signature_key ?? "");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
