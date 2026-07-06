import "server-only";

/**
 * Pengiriman email transaksional via Resend (HTTP API, tanpa SDK).
 *
 * Gated di env: kalau RESEND_API_KEY / EMAIL_FROM belum di-set, fungsi
 * degrade dengan aman (log + skip) — tidak pernah memblokir login.
 *
 * Setup produksi:
 *   RESEND_API_KEY=re_xxx
 *   EMAIL_FROM="LabaLab <security@labalab.id>"   (domain harus terverifikasi di Resend)
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn(
      "[email] RESEND_API_KEY/EMAIL_FROM belum di-set — email dilewati.",
    );
    return;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html }),
    });
    if (!res.ok) {
      console.error("[email] gagal kirim:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[email] error jaringan saat kirim:", err);
  }
}

/** Notifikasi keamanan: login baru terdeteksi dari perangkat lain. */
export async function sendNewLoginEmail(params: {
  to: string;
  device: string;
  location: string | null;
  ip: string | null;
  when: Date;
}): Promise<void> {
  const waktu = params.when.toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });
  const rows = [
    ["Perangkat", params.device],
    ["Lokasi (perkiraan)", params.location ?? "Tidak diketahui"],
    ["Alamat IP", params.ip ?? "Tidak diketahui"],
    ["Waktu", `${waktu} WIB`],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px">${k}</td><td style="padding:4px 0;font-size:13px;font-weight:600">${v}</td></tr>`,
    )
    .join("");

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111827">
    <h1 style="font-size:18px;margin:0 0 4px">🔐 Login baru di akun LabaLab kamu</h1>
    <p style="font-size:14px;line-height:1.6;color:#374151;margin:8px 0 16px">
      Kami mendeteksi login baru dari perangkat lain. Karena akun LabaLab hanya
      boleh aktif di satu perangkat, sesi lama otomatis dikeluarkan.
    </p>
    <table style="border-collapse:collapse;margin-bottom:16px">${rows}</table>
    <p style="font-size:13px;line-height:1.6;color:#374151">
      <strong>Ini kamu?</strong> Abaikan email ini.<br/>
      <strong>Bukan kamu?</strong> Segera ganti password, lalu buka
      <em>Pengaturan → Keluarkan semua perangkat lain</em> untuk mengamankan akun.
    </p>
    <p style="font-size:11px;color:#9ca3af;margin-top:20px">LabaLab — Racik Profit Toko Kamu</p>
  </div>`;

  await sendEmail({
    to: params.to,
    subject: "Login baru terdeteksi di akun LabaLab kamu",
    html,
  });
}
