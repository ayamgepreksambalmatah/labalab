import Link from "next/link";

/**
 * Indikator sisa kuota fitur bulan ini (spec §5). "Unlimited" kalau limit
 * sangat besar (plan Max). Kalau habis → pesan + link upgrade.
 */
export function QuotaBar({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number;
}) {
  const unlimited = max >= 999999;
  const habis = !unlimited && used >= max;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(max, 1)) * 100));

  return (
    <div className="mb-5 rounded-card border border-border bg-surface px-4 py-3">
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="font-semibold text-text">{label}</span>
        <span className={habis ? "font-semibold text-red" : "text-muted"}>
          {unlimited ? "Unlimited" : `${used}/${max} dipakai bulan ini`}
        </span>
      </div>
      {!unlimited && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
          <div
            className={`h-full rounded-full ${habis ? "bg-red" : "bg-gradient-to-r from-accent to-accent2"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {habis && (
        <p className="mt-2 text-[12px] text-muted">
          Kuota bulan ini habis.{" "}
          <Link href="/pricing" className="font-semibold text-accent2 hover:underline">
            Upgrade untuk akses lebih →
          </Link>
        </p>
      )}
    </div>
  );
}
