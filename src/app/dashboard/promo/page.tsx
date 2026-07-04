import type { Metadata } from "next";
import { PromoSimulator } from "@/components/tools/PromoSimulator";

export const metadata: Metadata = {
  title: "Promo Simulator",
  robots: { index: false, follow: false },
};

export default function PromoPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          🔥 Promo Simulator
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Cek dulu sebelum ikut flash sale — jangan sampai ramai tapi rugi.
        </p>
      </header>
      <PromoSimulator />
    </div>
  );
}
