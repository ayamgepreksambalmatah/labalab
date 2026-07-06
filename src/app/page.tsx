import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createServerClient } from "@/lib/supabase/server";
import { fmt } from "@/lib/format";
import { PRO_PRICE_IDR, MAX_PRICE_IDR } from "@/lib/plans";
import { LEGAL_CONTACT } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  description:
    "LabaLab hitung untung ASLI toko kamu setelah semua potongan platform — plus audit listing, simulasi promo, dan asisten CS. Semua keputusan tetap di tangan kamu.",
  alternates: { canonical: "/" },
};

const FEATURES: {
  icon: string;
  title: string;
  desc: string;
  soon?: boolean;
}[] = [
  {
    icon: "🧮",
    title: "Cek Untung Asli",
    desc: "Hitung margin bersih per produk, per platform — setelah semua komisi & biaya.",
  },
  {
    icon: "📊",
    title: "Sales Analyzer",
    desc: "Upload laporan penjualan, temukan produk yang diam-diam bikin rugi.",
  },
  {
    icon: "🔥",
    title: "Promo Simulator",
    desc: "Cek dulu sebelum ikut flash sale — jangan sampai ramai tapi rugi.",
  },
  {
    icon: "🩺",
    title: "Product Doctor",
    desc: "Audit listing + baca review pembeli, kasih skor & saran perbaikan.",
  },
  {
    icon: "📦",
    title: "Produk Saya",
    desc: "Simpan semua data produk, terhubung otomatis ke semua tools.",
  },
  {
    icon: "💬",
    title: "CS AI Assistant",
    desc: "Balas chat pembeli lebih cepat dengan AI yang paham produk kamu.",
    soon: true,
  },
];

const STEPS: { title: string; desc: string }[] = [
  {
    title: "Daftar & Tambah Produk",
    desc: "Masukkan produk kamu — harga, modal, kategori. 2 menit selesai.",
  },
  {
    title: "Upload Laporan atau Cek Manual",
    desc: "Upload laporan penjualan dari Shopee/Tokopedia, atau cek langsung per produk.",
  },
  {
    title: "Dapat Insight & Rekomendasi",
    desc: "LabaLab kasih tahu produk mana yang untung, mana yang rugi, dan apa yang perlu diperbaiki.",
  },
];

const COMPARE: { label: string; excel: string; kalk: string; laba: string }[] = [
  { label: "Hitung margin", excel: "ribet", kalk: "yes", laba: "yes" },
  { label: "Margin per platform", excel: "no", kalk: "no", laba: "yes" },
  { label: "Insight AI", excel: "no", kalk: "no", laba: "yes" },
  { label: "Audit listing", excel: "no", kalk: "no", laba: "yes" },
  { label: "Data tersimpan & terhubung", excel: "no", kalk: "no", laba: "yes" },
  { label: "Setup", excel: "Lama", kalk: "Cepat", laba: "Cepat" },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Apakah data toko saya aman?",
    a: "Ya. Data kamu terenkripsi saat dikirim dan hanya bisa diakses oleh akun kamu sendiri (kontrol akses per baris di database).",
  },
  {
    q: "Platform apa saja yang didukung?",
    a: "Shopee, Tokopedia, dan TikTok Shop.",
  },
  {
    q: "Apakah cocok untuk seller makanan?",
    a: "Ya, untuk seller yang jual produk kemasan yang dikirim kurir — bukan untuk resto/cafe yang jualan via ShopeeFood/GoFood/GrabFood.",
  },
  {
    q: "Bagaimana kalau saya mau berhenti berlangganan?",
    a: "Bisa dibatalkan kapan saja. Kamu tetap punya akses sampai periode aktif habis, tanpa pengembalian dana untuk sisa periode (lihat Syarat & Ketentuan).",
  },
  {
    q: "Apakah saya perlu install aplikasi?",
    a: "Tidak. LabaLab berbasis web — buka langsung di browser dari HP atau laptop.",
  },
];

export default async function Home() {
  const supabase = await createServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (claims?.claims) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-5xl px-5 pb-20">
      {/* NAV */}
      <nav className="flex items-center justify-between py-5">
        <Logo size={24} />
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-[10px] px-3.5 py-2 text-[13px] font-semibold text-muted transition-colors hover:text-text"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-3.5 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          >
            Coba Gratis
          </Link>
        </div>
      </nav>

      {/* 1. HERO */}
      <section className="py-16 text-center sm:py-24">
        <span className="inline-block rounded-full border border-border bg-surface px-3 py-1 text-[11.5px] font-semibold text-accent2">
          AI Profit Assistant untuk Seller Indonesia
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-[42px]">
          Jangan Sampai Toko Ramai Tapi Ternyata Rugi
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
          Marketplace ambil komisi, biaya iklan, dan subsidi ongkir dari tiap
          penjualan. LabaLab hitung untung <strong className="text-text">ASLI</strong>{" "}
          kamu — bukan omzet kotor yang bikin salah kira.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-6 py-3 font-display text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Coba Gratis
          </Link>
          <a
            href="#cara-kerja"
            className="rounded-[10px] border border-border px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-surface2"
          >
            Lihat Cara Kerja ↓
          </a>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[12.5px] text-muted">
          <span className="text-green">✓ Tanpa kartu kredit</span>
          <span className="text-green">✓ Setup 2 menit</span>
        </div>
      </section>

      {/* 2. PAIN POINT */}
      <section className="rounded-card border border-border bg-surface p-8 sm:p-10">
        <h2 className="text-center font-display text-2xl font-extrabold tracking-tight">
          Kenapa Banyak Seller Salah Kira?
        </h2>
        <div className="mx-auto mt-6 max-w-md">
          <p className="text-[15px] font-semibold">📊 Omzet Rp50 juta bulan ini!</p>
          <p className="text-[13px] text-muted">Kedengarannya bagus…</p>
          <p className="mt-4 text-[13px] font-semibold text-muted">
            Tapi setelah dipotong:
          </p>
          <ul className="mt-2 space-y-1.5 text-[13.5px]">
            {[
              "Komisi platform (5–10%)",
              "Biaya iklan",
              "Subsidi gratis ongkir",
              "Voucher & diskon promo",
            ].map((x) => (
              <li key={x} className="flex items-center gap-2">
                <span className="text-red">🔻</span> {x}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[14px] leading-relaxed">
            Untung <strong>ASLI</strong> kamu bisa jauh lebih kecil dari yang kamu
            kira — atau bahkan minus.{" "}
            <span className="text-accent2">
              LabaLab kasih tahu angka yang SEBENARNYA.
            </span>
          </p>
        </div>
      </section>

      {/* 3. FITUR */}
      <section id="fitur" className="scroll-mt-8 py-16">
        <h2 className="text-center font-display text-2xl font-extrabold tracking-tight">
          Semua yang Toko Kamu Butuhkan
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-[13.5px] text-muted">
          Satu tempat, semua data nyambung — dari hitung untung sampai audit
          listing.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-card border border-border bg-surface p-5"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{f.icon}</span>
                <h3 className="font-display text-[15px] font-bold">{f.title}</h3>
                {f.soon && (
                  <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
                    Segera
                  </span>
                )}
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CARA KERJA */}
      <section
        id="cara-kerja"
        className="scroll-mt-8 rounded-card border border-border bg-surface p-8 sm:p-10"
      >
        <h2 className="text-center font-display text-2xl font-extrabold tracking-tight">
          Cara Kerjanya Simpel
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="text-center sm:text-left">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 font-display text-[16px] font-extrabold text-white sm:mx-0">
                {i + 1}
              </div>
              <h3 className="mt-3 font-display text-[15px] font-bold">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/register"
            className="inline-block rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-6 py-3 font-display text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Mulai Sekarang, Gratis
          </Link>
        </div>
      </section>

      {/* 5. PERBANDINGAN */}
      <section className="py-16">
        <h2 className="text-center font-display text-2xl font-extrabold tracking-tight">
          Kenapa Bukan Excel atau Kalkulator Biasa?
        </h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-3 text-left font-semibold text-muted"></th>
                <th className="px-3 py-3 text-center font-semibold text-muted">
                  Excel Manual
                </th>
                <th className="px-3 py-3 text-center font-semibold text-muted">
                  Kalkulator Umum
                </th>
                <th className="rounded-t-[10px] bg-accent/10 px-3 py-3 text-center font-bold text-accent2">
                  LabaLab
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row.label} className="border-b border-border">
                  <td className="py-3 pr-3 font-medium">{row.label}</td>
                  <Cell v={row.excel} />
                  <Cell v={row.kalk} />
                  <Cell v={row.laba} highlight />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. PRICING */}
      <section id="harga" className="scroll-mt-8 py-4">
        <h2 className="text-center font-display text-2xl font-extrabold tracking-tight">
          Pilih Paket Kamu
        </h2>
        <p className="mt-2 text-center text-[13.5px] text-muted">
          Mulai gratis. Upgrade kapan saja saat butuh lebih.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <PriceCard
            name="Coba Gratis"
            price="Rp 0"
            period="selamanya"
            features={[
              "1× Sales Analyzer / bulan",
              "3× Product Doctor / bulan",
              "20 CS Reply / bulan",
              "Simpan 3 produk",
            ]}
            cta="Coba Sekarang"
            href="/register"
          />
          <PriceCard
            name="LabaLab Pro"
            price={fmt(PRO_PRICE_IDR)}
            period="per bulan"
            popular
            features={[
              "10× Sales Analyzer / bulan",
              "30× Product Doctor / bulan",
              "500 CS Reply / bulan",
              "Produk tak terbatas",
            ]}
            cta="Pilih Pro"
            href="/pricing"
          />
          <PriceCard
            name="LabaLab Max"
            price={fmt(MAX_PRICE_IDR)}
            period="per bulan"
            features={[
              "Sales Analyzer unlimited",
              "Product Doctor unlimited",
              "3.000 CS Reply / bulan",
              "Produk unlimited + multi-toko",
            ]}
            cta="Pilih Max"
            href="/pricing"
          />
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="scroll-mt-8 py-16">
        <h2 className="text-center font-display text-2xl font-extrabold tracking-tight">
          Pertanyaan yang Sering Ditanya
        </h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-card border border-border bg-surface p-4 open:bg-surface2"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-[14px] font-semibold">
                {f.q}
                <span className="text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 8. CTA PENUTUP */}
      <section className="rounded-card border border-accent/30 bg-gradient-to-br from-accent/15 to-accent2/5 p-10 text-center">
        <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Berhenti Tebak-Tebak Untung
        </h2>
        <p className="mt-2 text-[14px] text-muted">
          Mulai gratis, tanpa kartu kredit.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-block rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-7 py-3.5 font-display text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Coba LabaLab Sekarang
        </Link>
      </section>

      {/* 9. FOOTER */}
      <footer className="mt-16 border-t border-border pt-10">
        <div className="grid gap-8 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo size={22} />
            <p className="mt-2 max-w-xs text-[12.5px] leading-relaxed text-muted">
              AI Profit Assistant untuk Seller E-commerce Indonesia.
            </p>
          </div>
          <FooterCol
            title="Produk"
            links={[
              { label: "Cek Untung Asli", href: "#fitur" },
              { label: "Sales Analyzer", href: "#fitur" },
              { label: "Product Doctor", href: "#fitur" },
              { label: "Promo Simulator", href: "#fitur" },
            ]}
          />
          <FooterCol
            title="Perusahaan"
            links={[{ label: "Tentang Kami", href: "/about" }]}
          />
          <FooterCol
            title="Bantuan"
            links={[
              { label: "FAQ", href: "#faq" },
              { label: "Kontak (WhatsApp)", href: LEGAL_CONTACT.whatsapp, external: true },
              { label: "Kebijakan Privasi", href: "/privacy" },
              { label: "Syarat & Ketentuan", href: "/terms" },
            ]}
          />
        </div>
        <p className="mt-10 text-[11.5px] text-muted">
          © 2026 {LEGAL_CONTACT.brand}. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

function Cell({ v, highlight }: { v: string; highlight?: boolean }) {
  const base = `px-3 py-3 text-center ${highlight ? "bg-accent/10" : ""}`;
  if (v === "yes")
    return (
      <td className={base}>
        <span className="text-green">✓</span>
      </td>
    );
  if (v === "no")
    return (
      <td className={base}>
        <span className="text-muted/50">✗</span>
      </td>
    );
  if (v === "ribet")
    return (
      <td className={base}>
        <span className="text-yellow">✓ ribet</span>
      </td>
    );
  return (
    <td className={`${base} ${highlight ? "font-semibold text-accent2" : "text-muted"}`}>
      {v}
    </td>
  );
}

function PriceCard({
  name,
  price,
  period,
  features,
  cta,
  href,
  popular,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  popular?: boolean;
}) {
  return (
    <div
      className={`relative rounded-card border bg-surface p-6 ${
        popular ? "border-accent/50" : "border-border"
      }`}
    >
      {popular && (
        <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-accent to-accent2 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          ⭐ Populer
        </span>
      )}
      <p className="text-xs font-bold uppercase tracking-widest text-accent2">
        {name}
      </p>
      <p className="mt-3 font-display text-3xl font-extrabold">{price}</p>
      <p className="text-[13px] text-muted">{period}</p>
      <ul className="mt-5 space-y-2.5 text-[13px]">
        {features.map((f) => (
          <li key={f} className="flex gap-2 text-text/90">
            <span className="text-accent2">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-6 block rounded-[10px] px-4 py-3 text-center text-sm font-bold transition-opacity hover:opacity-90 ${
          popular
            ? "bg-gradient-to-br from-accent to-accent2 text-white"
            : "border border-border font-semibold text-text hover:bg-surface2"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
        {title}
      </p>
      <ul className="mt-3 space-y-2 text-[13px]">
        {links.map((l) => (
          <li key={l.label}>
            {l.external ? (
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted transition-colors hover:text-accent2"
              >
                {l.label}
              </a>
            ) : (
              <Link
                href={l.href}
                className="text-muted transition-colors hover:text-accent2"
              >
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
