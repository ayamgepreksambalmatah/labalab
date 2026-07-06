import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LEGAL_CONTACT } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description:
    "LabaLab bantu seller e-commerce Indonesia tahu untung ASLI-nya setelah semua potongan platform — dengan kontrol penuh tetap di tangan seller.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14">
      <Link href="/" className="text-[13px] text-accent2 hover:underline">
        ← Kembali ke {LEGAL_CONTACT.brand}
      </Link>

      <div className="mt-5">
        <Logo size={30} />
      </div>
      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
        Tentang LabaLab
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-text/90">
        LabaLab adalah AI Profit Assistant untuk seller e-commerce Indonesia.
        Kami bantu kamu tahu untung <strong>ASLI</strong> toko — bukan omzet kotor
        yang bikin salah kira — lalu ambil keputusan yang lebih tepat soal harga,
        promo, dan listing.
      </p>

      <Section title="Kenapa kami ada">
        <p>
          Banyak seller merasa tokonya ramai, padahal setelah dipotong komisi
          platform, biaya iklan, subsidi ongkir, dan voucher, untungnya jauh
          lebih tipis — kadang minus. Kebanyakan alat hitung berhenti di omzet
          kotor. LabaLab fokus ke angka yang benar-benar masuk kantong kamu.
        </p>
      </Section>

      <Section title="Untuk siapa">
        <p>
          Seller yang berjualan produk kemasan (dikirim kurir) di Shopee,
          Tokopedia, dan TikTok Shop — dari yang baru mulai sampai yang sudah
          jalan dan mau merapikan margin. LabaLab belum ditujukan untuk usaha
          kuliner yang berjualan lewat ShopeeFood/GoFood/GrabFood.
        </p>
      </Section>

      <Section title="Prinsip kami">
        <ul className="ml-4 list-disc space-y-1.5">
          <li>
            <strong>Semua data nyambung.</strong> Satu data produk dipakai lintas
            fitur — profit checker, audit listing, sampai asisten CS.
          </li>
          <li>
            <strong>Keputusan tetap di tangan kamu.</strong> LabaLab tidak pernah
            mengubah listing kamu secara otomatis. Kami cuma kasih rekomendasi —
            kamu yang putuskan mau terapkan atau tidak.
          </li>
          <li>
            <strong>Jujur soal angka.</strong> Kami tampilkan perhitungan apa
            adanya, termasuk saat produk ternyata merugi.
          </li>
        </ul>
      </Section>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link
          href="/register"
          className="rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-5 py-2.5 font-display text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Coba Gratis
        </Link>
        <a
          href={LEGAL_CONTACT.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[10px] border border-border px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface2"
        >
          Hubungi Kami
        </a>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <div className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}
