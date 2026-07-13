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

const SUBPROCESSORS: { layanan: string; fungsi: string; data: string }[] = [
  { layanan: "Supabase", fungsi: "Database & autentikasi", data: "Semua data akun & bisnis kamu" },
  { layanan: "Anthropic (Claude)", fungsi: "Fitur AI", data: "Data produk/laporan yang kamu kirim ke fitur AI" },
  { layanan: "Midtrans", fungsi: "Pembayaran", data: "Data transaksi pembayaran (bukan data kartu)" },
  { layanan: "Resend", fungsi: "Email notifikasi", data: "Alamat email kamu" },
  { layanan: "Vercel", fungsi: "Hosting aplikasi", data: "Data teknis (IP, log akses)" },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Kebijakan Privasi"
      lastUpdated="13 Juli 2026"
      intro={
        <p>
          {LEGAL_CONTACT.brand} (&ldquo;kami&rdquo;) adalah aplikasi yang
          membantu penjual online di Indonesia mengelola profit, listing produk,
          dan operasional toko. Kebijakan ini menjelaskan data apa yang kami
          kumpulkan, bagaimana kami menggunakannya, dan hak kamu sebagai
          pengguna. Dengan menggunakan {LEGAL_CONTACT.brand}, kamu menyetujui
          praktik yang dijelaskan di sini. Kami berkomitmen mematuhi
          Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU
          PDP).
        </p>
      }
    >
      <LegalSection n={1} title="Data yang Kami Kumpulkan">
        <p>
          <strong>1.1 Data akun</strong>
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Nama, email, nomor WhatsApp (kalau diisi).</li>
          <li>Metode login (email/password atau Google).</li>
        </ul>
        <p className="pt-1">
          <strong>1.2 Data bisnis yang kamu input sendiri</strong>
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Nama produk, harga jual, harga modal/supplier, kategori, stok.</li>
          <li>
            Data laporan penjualan yang kamu upload (dari Shopee/Tokopedia/TikTok
            Shop).
          </li>
          <li>Data penjualan manual yang kamu catat (termasuk Instagram/PO).</li>
          <li>Review pelanggan yang kamu paste untuk dianalisis.</li>
        </ul>
        <p className="pt-1">
          <strong>1.3 Data teknis otomatis</strong>
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Alamat IP dan perkiraan lokasi (kota) saat login — untuk keamanan
            akun (deteksi sesi di perangkat baru).
          </li>
          <li>Jenis perangkat/browser.</li>
          <li>
            Log aktivitas dasar (waktu login, fitur yang diakses) untuk
            keperluan debugging dan peningkatan layanan.
          </li>
        </ul>
        <p className="pt-1">
          <strong>1.4 Data pembayaran</strong>
        </p>
        <p>
          Kami <strong>tidak menyimpan</strong> nomor kartu kredit/debit atau
          data rekening kamu. Proses pembayaran ditangani oleh mitra pembayaran
          resmi (Midtrans), yang punya kebijakan privasi sendiri.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Bagaimana Kami Menggunakan Data Kamu">
        <p>Data kamu digunakan untuk:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Menjalankan fitur inti LabaLab (hitung margin, analisis laporan,
            audit listing, dll).
          </li>
          <li>
            Fitur AI (Sales Analyzer, Product Doctor, CS Assistant) memproses
            data kamu untuk menghasilkan insight — data ini dikirim ke penyedia
            layanan AI (Anthropic) hanya untuk menghasilkan respons real-time,
            <strong>
              {" "}
              bukan untuk melatih model AI mereka secara permanen dengan data
              kamu
            </strong>
            .
          </li>
          <li>
            Mengirim notifikasi penting (login perangkat baru, status langganan).
          </li>
          <li>Meningkatkan dan memperbaiki layanan.</li>
        </ul>
        <p>
          <strong>
            Kami tidak menjual data kamu ke pihak ketiga untuk keperluan iklan
            atau tujuan komersial lain.
          </strong>
        </p>
      </LegalSection>

      <LegalSection n={3} title="Siapa yang Bisa Mengakses Data Kamu">
        <p>
          <strong>3.1 Sesama pengguna</strong>
        </p>
        <p>
          <strong>Tidak bisa.</strong> Data toko dan produk kamu terisolasi lewat
          kontrol akses teknis (Row Level Security) — pengguna lain tidak bisa
          melihat data kamu, dan kamu tidak bisa melihat data mereka.
        </p>
        <p className="pt-1">
          <strong>3.2 Tim LabaLab (developer)</strong>
        </p>
        <p>
          Secara teknis, sebagai pengelola sistem, tim LabaLab memiliki kemampuan
          akses ke database untuk keperluan pemeliharaan sistem dan penanganan
          masalah teknis (bug fixing, dukungan pelanggan). Ini sama seperti pola
          akses developer di hampir semua aplikasi digital. Kami{" "}
          <strong>berkomitmen</strong>:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Tidak melihat, menyalin, atau menggunakan data bisnis kamu (harga,
            margin, supplier) untuk kepentingan pribadi atau dibagikan ke pihak
            manapun.
          </li>
          <li>
            Akses ke data hanya dilakukan bila benar-benar diperlukan untuk
            memperbaiki masalah teknis yang kamu laporkan.
          </li>
          <li>Tidak melakukan monitoring rutin terhadap data individual pengguna.</li>
        </ul>
        <p className="pt-1">
          <strong>3.3 Pihak ketiga penyedia layanan (subprocessor)</strong>
        </p>
        <p>Kami menggunakan layanan pihak ketiga berikut untuk menjalankan LabaLab:</p>
        <div className="overflow-x-auto">
          <table className="mt-1 w-full min-w-[420px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 pr-3 font-semibold">Layanan</th>
                <th className="py-2 pr-3 font-semibold">Fungsi</th>
                <th className="py-2 font-semibold">Data yang diproses</th>
              </tr>
            </thead>
            <tbody>
              {SUBPROCESSORS.map((s) => (
                <tr key={s.layanan} className="border-b border-border/60 last:border-0 align-top">
                  <td className="py-2 pr-3 font-medium text-text">{s.layanan}</td>
                  <td className="py-2 pr-3">{s.fungsi}</td>
                  <td className="py-2">{s.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pt-1">
          Masing-masing penyedia ini terikat kebijakan privasi dan keamanan
          mereka sendiri, dan kami memilih penyedia yang punya standar keamanan
          yang baik.
        </p>
        <p className="pt-1">
          <strong>3.4 Kewajiban hukum</strong>
        </p>
        <p>
          Kami dapat mengungkapkan data jika diwajibkan oleh hukum yang berlaku
          di Indonesia, misalnya perintah pengadilan atau permintaan resmi dari
          otoritas yang berwenang.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Keamanan Data">
        <p>Kami menerapkan langkah-langkah berikut:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Enkripsi data saat transit (HTTPS/SSL).</li>
          <li>Row Level Security di database — isolasi data antar pengguna.</li>
          <li>
            Sistem satu sesi aktif per akun (mencegah penggunaan akun secara
            bersamaan tanpa sepengetahuan pemilik).
          </li>
          <li>Deteksi dan notifikasi login dari perangkat baru.</li>
        </ul>
        <p>
          Meski kami berupaya menjaga keamanan,{" "}
          <strong>tidak ada sistem yang 100% bebas risiko</strong>. Kami
          menyarankan kamu menjaga kerahasiaan password dan tidak membagikannya
          ke siapapun.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Hak Kamu Sebagai Pengguna">
        <p>Sesuai dengan UU Pelindungan Data Pribadi (UU PDP) Indonesia, kamu berhak untuk:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <strong>Mengakses</strong> data yang kami simpan tentang kamu (lewat
            fitur &ldquo;Ekspor Data&rdquo; di menu Pengaturan).
          </li>
          <li>
            <strong>Memperbaiki</strong> data yang tidak akurat.
          </li>
          <li>
            <strong>Menghapus</strong> akun dan seluruh data kamu kapan saja
            (lewat menu Pengaturan → Hapus Akun).
          </li>
          <li>
            <strong>Menarik persetujuan</strong> penggunaan data untuk tujuan
            tertentu (misalnya menonaktifkan notifikasi email).
          </li>
        </ul>
        <p>
          Kamu bisa menjalankan hak akses (unduh data) dan penghapusan langsung
          lewat{" "}
          <Link href="/dashboard/settings" className="text-accent2 hover:underline">
            Pengaturan → Data Saya
          </Link>
          , atau hubungi kami di{" "}
          <a href={`mailto:${LEGAL_CONTACT.email}`} className="text-accent2 hover:underline">
            {LEGAL_CONTACT.email}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection n={6} title="Retensi Data">
        <p>
          Data kamu disimpan selama akun kamu aktif. Jika kamu menghapus akun,
          data akan dihapus dari sistem kami dalam waktu 30 hari, kecuali ada
          kewajiban hukum yang mengharuskan kami menyimpan data tertentu lebih
          lama.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Data Anak">
        <p>
          LabaLab ditujukan untuk pengguna berusia 18 tahun ke atas atau yang
          sudah memiliki kapasitas hukum untuk menjalankan usaha. Kami tidak
          secara sengaja mengumpulkan data dari anak di bawah umur.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Cookie">
        <p>
          Kami menggunakan cookie untuk keperluan autentikasi (menjaga sesi login
          kamu) dan fungsi dasar aplikasi. Kami tidak menggunakan cookie untuk
          melacak kamu di situs lain untuk keperluan iklan.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Perubahan Kebijakan">
        <p>
          Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Perubahan
          signifikan akan diberitahukan lewat email atau notifikasi di aplikasi.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Kontak">
        <p>
          Kalau ada pertanyaan soal kebijakan privasi ini atau data kamu, hubungi
          kami di{" "}
          <a href={`mailto:${LEGAL_CONTACT.email}`} className="text-accent2 hover:underline">
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
          . Dokumen ini berlaku sebagai bagian dari Syarat &amp; Ketentuan
          penggunaan LabaLab.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
