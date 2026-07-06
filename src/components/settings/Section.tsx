import type { ReactNode } from "react";
import type { FormResult } from "@/lib/settings/types";

export const inputCls =
  "w-full rounded-[9px] border border-border bg-surface2 px-3.5 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-muted focus:border-accent";
export const labelCls =
  "block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5";

/** Kartu section standar di halaman Pengaturan. */
export function Section({
  title,
  desc,
  badge,
  children,
}: {
  title: string;
  desc?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold">{title}</h2>
        {badge}
      </div>
      {desc && (
        <p className="mb-4 text-[12.5px] leading-relaxed text-muted">{desc}</p>
      )}
      {children}
    </section>
  );
}

/** Baris indikator kuota dengan progress bar. limit besar (≥999999) = unlimited. */
export function QuotaBar({
  label,
  terpakai,
  limit,
}: {
  label: string;
  terpakai: number;
  limit: number;
}) {
  const unlimited = limit >= 999999;
  const pct = unlimited || limit <= 0 ? 0 : Math.min(100, (terpakai / limit) * 100);
  const nearFull = pct >= 80;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12.5px]">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted">
          {terpakai}/{unlimited ? "∞" : limit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface2">
        <div
          className={`h-full rounded-full transition-all ${
            nearFull ? "bg-red" : "bg-gradient-to-r from-accent to-accent2"
          }`}
          style={{ width: `${unlimited ? 4 : pct}%` }}
        />
      </div>
    </div>
  );
}

/** Banner hasil server action (error merah / sukses hijau). */
export function Feedback({ result }: { result: FormResult }) {
  if (!result?.error && !result?.success) return null;
  const isError = !!result.error;
  return (
    <p
      className={`rounded-[9px] border px-3 py-2 text-[13px] ${
        isError
          ? "border-red/40 bg-red/10 text-red"
          : "border-green/40 bg-green/10 text-green"
      }`}
    >
      {result.error ?? result.success}
    </p>
  );
}
