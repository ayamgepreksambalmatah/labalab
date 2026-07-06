import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalLayout,
  LegalSection,
  LEGAL_CONTACT,
} from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Kebijakan Privasi"
      intro={
        <p>
          Kebijakan Privasi ini menjelaskan bagaimana {LEGAL_CONTACT.brand}{" "}
          (&ldquo;kami&rdquo;) mengumpulkan, menggunakan, menyimpan, dan
          melindungi data pribadi kamu saat memakai layanan di{" "}
          {LEGAL_CONTACT.domain}. Kami berkomitmen mematuhi Undang-Undang No. 27
          Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
        </p>
      }
    >
      <LegalSection n={1} title="Data yang Kami Kumpulkan">
        <p>Kami mengumpulkan data berikut saat kamu memakai LabaLab:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <strong>Data akun:</strong> email, nama lengkap, nama toko, nomor
            WhatsApp, dan preferensi (mis. tone balasan).
          </li>
          <li>
            <strong>Data bisnis yang kamu masukkan:</strong> data produk, harga,
            modal, stok, serta file laporan penjualan (Excel/CSV) yang kamu
            unggah untuk dianalisis.
          </li>
          <li>
            <strong>Hasil olahan:</strong> laporan margin, analisis penjualan,
            dan audit listing yang dihasilkan dari data kamu.
          </li>
          <li>
            <strong>Data pembayaran:</strong> status transaksi langganan. Detail
            kartu/rekening diproses langsung oleh Midtrans — kami{" "}
            <strong>tidak menyimpan</strong> nomor kartu kamu.
          </li>
          <li>
            <strong>Data teknis & keamanan:</strong> informasi perangkat
            (user-agent), alamat IP, dan perkiraan lokasi kasar (kota/negara)
            untuk keperluan keamanan sesi login, serta log pemakaian fitur.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={2} title="Cara Kami Menggunakan Data">
        <ul className="ml-4 list-disc space-y-1">
          <li>Menjalankan dan menyediakan fitur inti LabaLab.</li>
          <li>Memproses langganan dan pembayaran.</li>
          <li>
            Menjaga keamanan akun (mis. mendeteksi login dari perangkat lain dan
            menerapkan aturan satu sesi aktif).
          </li>
          <li>
            Mengirim notifikasi penting (mis. peringatan login baru atau kuota
            hampir habis) sesuai preferensi kamu.
          </li>
          <li>Meningkatkan kualitas dan keandalan layanan.</li>
        </ul>
      </LegalSection>

      <LegalSection n={3} title="Dasar Pemrosesan">
        <p>
          Kami memproses data berdasarkan: (a) pelaksanaan perjanjian layanan
          dengan kamu; (b) persetujuan kamu; (c) kepentingan sah kami untuk
          menjaga keamanan dan meningkatkan layanan; dan (d) kepatuhan pada
          kewajiban hukum.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Berbagi Data dengan Pihak Ketiga">
        <p>
          Kami <strong>tidak menjual</strong> data pribadi kamu. Kami memakai
          penyedia layanan tepercaya (pemroses data) semata untuk menjalankan
          LabaLab:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <strong>Supabase</strong> — database &amp; autentikasi (penyimpanan
            data akun dan bisnis kamu).
          </li>
          <li>
            <strong>Vercel</strong> — hosting aplikasi.
          </li>
          <li>
            <strong>Anthropic (Claude)</strong> — pemrosesan fitur AI. Data yang
            kamu kirim ke fitur AI (mis. isi laporan atau listing) dikirim untuk
            diproses agar menghasilkan analisis.
          </li>
          <li>
            <strong>Midtrans</strong> — pemrosesan pembayaran.
          </li>
          <li>
            <strong>Resend</strong> — pengiriman email notifikasi.
          </li>
        </ul>
        <p>
          Kami juga dapat mengungkapkan data bila diwajibkan oleh hukum yang
          berlaku.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Penyimpanan & Retensi Data">
        <p>
          Data kamu disimpan selama akun aktif. Saat kamu menghapus akun lewat
          menu Pengaturan, seluruh data terkait dihapus permanen dari sistem
          kami (kecuali catatan yang wajib kami simpan untuk kepatuhan hukum,
          mis. catatan transaksi).
        </p>
      </LegalSection>

      <LegalSection n={6} title="Keamanan Data">
        <p>
          Kami menerapkan langkah keamanan wajar seperti enkripsi transportasi
          (HTTPS), kontrol akses berbasis baris (Row Level Security), dan aturan
          satu sesi aktif per akun. Namun, tidak ada sistem yang 100% aman —
          jaga kerahasiaan password kamu.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Hak Kamu sebagai Pemilik Data">
        <p>Sesuai UU PDP, kamu berhak untuk:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Mengakses dan memperoleh salinan data kamu.</li>
          <li>Memperbaiki data yang tidak akurat.</li>
          <li>Menghapus data / akun kamu.</li>
          <li>Menarik persetujuan pemrosesan.</li>
        </ul>
        <p>
          Kamu bisa menjalankan hak akses (unduh data) dan penghapusan langsung
          lewat{" "}
          <Link
            href="/dashboard/settings"
            className="text-accent2 hover:underline"
          >
            Pengaturan → Data Saya
          </Link>
          , atau hubungi kami.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Cookie & Teknologi Serupa">
        <p>
          Kami memakai cookie yang diperlukan untuk autentikasi dan menjaga sesi
          login kamu tetap aman. Tanpa cookie ini, layanan tidak dapat berfungsi.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Data Anak">
        <p>
          LabaLab ditujukan untuk pelaku usaha dewasa. Kami tidak dengan sengaja
          mengumpulkan data dari anak di bawah umur.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Perubahan Kebijakan">
        <p>
          Kami dapat memperbarui kebijakan ini sewaktu-waktu. Perubahan penting
          akan kami beritahukan melalui aplikasi atau email.
        </p>
      </LegalSection>

      <LegalSection n={11} title="Hubungi Kami">
        <p>
          Pertanyaan soal privasi atau data pribadi? Email{" "}
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
