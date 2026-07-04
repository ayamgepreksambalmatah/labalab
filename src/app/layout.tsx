import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const APP_NAME = "LabaLab";
const APP_TAGLINE = "LabaLab — Racik Profit Toko Kamu";
const APP_DESC =
  "Hitung margin bersih, temukan profit hilang, simulasi promo, dan optimasi listing produk Shopee/Tokopedia/TikTok Shop dengan bantuan AI.";

export const metadata: Metadata = {
  title: {
    default: APP_TAGLINE,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESC,
  applicationName: APP_NAME,
  openGraph: {
    title: APP_TAGLINE,
    description: APP_DESC,
    siteName: APP_NAME,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
