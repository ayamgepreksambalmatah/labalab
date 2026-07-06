/**
 * Util murni untuk menampilkan info sesi aktif (fitur 1-akun-1-sesi).
 * Dipakai di halaman /dashboard/settings.
 */

export type DeviceLabel = {
  /** mis. "Chrome di Windows" */
  full: string;
  browser: string;
  os: string;
  /** emoji kasar per jenis perangkat */
  icon: string;
};

/** Parse user-agent jadi label ramah. Best-effort, tanpa dependency. */
export function parseDeviceInfo(ua: string | null): DeviceLabel {
  if (!ua) {
    return { full: "Perangkat tidak dikenal", browser: "Tidak dikenal", os: "", icon: "💻" };
  }

  // Urutan penting: cek yang lebih spesifik dulu (Edge sebelum Chrome, dst).
  const browser =
    /Edg\//.test(ua) ? "Edge"
    : /OPR\/|Opera/.test(ua) ? "Opera"
    : /SamsungBrowser/.test(ua) ? "Samsung Internet"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari"
    : "Browser lain";

  const os =
    /Windows NT/.test(ua) ? "Windows"
    : /iPhone|iPad|iPod/.test(ua) ? "iOS"
    : /Android/.test(ua) ? "Android"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Linux/.test(ua) ? "Linux"
    : "";

  const isMobile = /Mobile|Android|iPhone|iPod/.test(ua);
  const isTablet = /iPad|Tablet/.test(ua);
  const icon = isTablet ? "📱" : isMobile ? "📱" : "💻";

  const full = os ? `${browser} di ${os}` : browser;
  return { full, browser, os, icon };
}

/** Waktu relatif dalam Bahasa Indonesia, mis. "5 menit lalu". */
export function formatRelativeTime(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";

  const diffSec = Math.round((now.getTime() - then) / 1000);
  if (diffSec < 45) return "baru saja";
  if (diffSec < 90) return "1 menit lalu";

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay} hari lalu`;

  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
