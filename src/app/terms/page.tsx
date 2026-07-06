import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalLayout,
  LegalSection,
  LEGAL_CONTACT,
} from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Syarat & Ketentuan"
      intro={
        <p>
          Dengan mendaftar dan memakai {LEGAL_CONTACT.brand} di{" "}
          {LEGAL_CONTACT.domain}, kamu setuju terikat pada Syarat &amp; Ketentuan
          ini. Mohon baca dengan saksama sebelum menggunakan layanan.
        </p>
      }
    >
      <LegalSection n={1} title="Penerimaan Ketentuan">
        <p>
          Ketentuan ini merupakan perjanjian antara kamu dan{" "}
          {LEGAL_CONTACT.brand}. Jika kamu tidak setuju, mohon tidak menggunakan
          layanan.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Kelayakan & Akun">
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Kamu harus berusia minimal 18 tahun atau cakap secara hukum untuk
            membuat perjanjian.
          </li>
          <li>
            Kamu bertanggung jawab menjaga kerahasiaan kredensial dan semua
            aktivitas di akunmu.
          </li>
          <li>
            Data yang kamu berikan harus benar dan akurat.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={3} title="Satu Sesi Aktif per Akun">
        <p>
          Demi keamanan, satu akun hanya boleh aktif di satu perangkat pada satu
          waktu. Login baru dari perangkat lain otomatis mengeluarkan sesi
          sebelumnya. Berbagi akun untuk penggunaan bersama secara paralel tidak
          diperbolehkan.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Langganan, Pembayaran & Kebijakan Refund">
        <ul className="ml-4 list-disc space-y-1">
          <li>
            LabaLab menyediakan paket gratis dan paket berbayar (Pro/Max) dengan
            harga yang tertera di halaman{" "}
            <Link href="/pricing" className="text-accent2 hover:underline">
              harga
            </Link>
            .
          </li>
          <li>
            Pembayaran diproses melalui Midtrans. Langganan berbayar berlaku
            sampai tanggal berakhir yang ditampilkan di akunmu.
          </li>
          <li>
            Saat kamu membatalkan langganan, akses tetap aktif sampai masa
            berlaku habis, lalu turun otomatis ke paket gratis.
          </li>
        </ul>
        <p className="rounded-[10px] border border-border bg-surface2 px-3.5 py-3 text-[13.5px] font-medium text-text">
          Pembayaran langganan {LEGAL_CONTACT.brand} bersifat final dan tidak
          dapat dikembalikan (non-refundable), kecuali dalam kasus kesalahan
          teknis dari pihak kami yang mengakibatkan Layanan tidak dapat digunakan
          sama sekali.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Penggunaan Fitur AI">
        <p>
          Fitur berbasis AI (mis. Sales Analyzer, Product Doctor, Listing
          Generator) menghasilkan estimasi dan saran otomatis. Hasilnya{" "}
          <strong>tidak dijamin akurat</strong> dan{" "}
          <strong>bukan nasihat keuangan, hukum, atau bisnis profesional</strong>
          . Keputusan bisnis tetap menjadi tanggung jawab kamu — verifikasi
          angka penting sebelum dipakai.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Penggunaan yang Dilarang">
        <ul className="ml-4 list-disc space-y-1">
          <li>Menggunakan layanan untuk aktivitas melanggar hukum.</li>
          <li>
            Mencoba meretas, merekayasa balik, membebani, atau mengganggu sistem.
          </li>
          <li>
            Mengunggah data yang bukan milikmu atau tanpa hak/izin yang sah.
          </li>
          <li>Menjual kembali atau menyalahgunakan akses layanan.</li>
        </ul>
      </LegalSection>

      <LegalSection n={7} title="Kepemilikan Data & Konten Kamu">
        <p>
          Data bisnis yang kamu unggah tetap milik kamu. Kamu memberi kami izin
          terbatas untuk memproses data tersebut semata untuk menjalankan
          layanan. Kamu bisa mengunduh atau menghapus data kapan saja lewat menu
          Pengaturan.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Hak Kekayaan Intelektual">
        <p>
          Seluruh perangkat lunak, merek, desain, dan konten LabaLab adalah milik
          kami dan dilindungi hukum. Kamu tidak memperoleh hak atas kekayaan
          intelektual tersebut selain hak pakai sesuai ketentuan ini.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Pembatasan Tanggung Jawab">
        <p>
          Layanan disediakan &ldquo;sebagaimana adanya&rdquo;. Sepanjang
          diizinkan hukum, {LEGAL_CONTACT.brand} tidak bertanggung jawab atas
          kerugian tidak langsung, kehilangan keuntungan, atau kerugian akibat
          keputusan yang diambil berdasarkan hasil olahan layanan.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Penghentian">
        <p>
          Kami dapat menangguhkan atau menghentikan akun yang melanggar ketentuan
          ini. Kamu dapat berhenti kapan saja dengan menghapus akun melalui menu
          Pengaturan.
        </p>
      </LegalSection>

      <LegalSection n={11} title="Perubahan Ketentuan">
        <p>
          Kami dapat memperbarui ketentuan ini. Perubahan penting akan
          diberitahukan melalui aplikasi atau email, dan berlaku sejak
          dipublikasikan.
        </p>
      </LegalSection>

      <LegalSection n={12} title="Hukum yang Berlaku">
        <p>
          Ketentuan ini tunduk pada hukum Republik Indonesia. Setiap sengketa
          akan diselesaikan secara musyawarah terlebih dahulu, dan bila perlu
          melalui jalur hukum yang berlaku di Indonesia.
        </p>
      </LegalSection>

      <LegalSection n={13} title="Hubungi Kami">
        <p>
          Pertanyaan soal ketentuan ini? Email{" "}
          <a
            href={`mailto:${LEGAL_CONTACT.email}`}
            className="text-accent2 hover:underline"
          >
            {LEGAL_CONTACT.email}
          </a>{" "}
          atau{" "}
          <a
            href={LEGAL_CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent2 hover:underline"
          >
            WhatsApp support
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
