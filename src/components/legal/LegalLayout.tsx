import type { ReactNode } from "react";
import Link from "next/link";

/** Info kontak & identitas — ganti sesuai data resmi LabaLab. */
export const LEGAL_CONTACT = {
  brand: "LabaLab",
  legalEntity: "LabaLab", // ganti ke nama badan usaha resmi (mis. PT/CV) kalau ada
  domain: "labalab.id",
  email: "support@labalab.id",
  whatsapp: "https://wa.me/6281234567890",
  lastUpdated: "6 Juli 2026",
};

export function LegalLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14">
      <Link href="/" className="text-[13px] text-accent2 hover:underline">
        ← Kembali ke {LEGAL_CONTACT.brand}
      </Link>
      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
        {title}
      </h1>
      <p className="mt-1 text-[12px] text-muted">
        Terakhir diperbarui: {LEGAL_CONTACT.lastUpdated}
      </p>

      <p className="mt-3 rounded-[10px] border border-border bg-surface2 px-3.5 py-2.5 text-[12px] leading-relaxed text-muted">
        Dokumen ini adalah kerangka umum dan bukan nasihat hukum. Sebelum{" "}
        {LEGAL_CONTACT.brand} dibuka untuk publik luas, sebaiknya ditinjau oleh
        penasihat hukum.
      </p>

      <div className="mt-6 text-[14px] leading-relaxed text-text">{intro}</div>

      <div className="mt-8 space-y-7">{children}</div>
    </main>
  );
}

export function LegalSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-base font-bold">
        {n}. {title}
      </h2>
      <div className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}
