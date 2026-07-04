import type { Metadata } from "next";
import { ProfitChecker } from "@/components/tools/ProfitChecker";

export const metadata: Metadata = {
  title: "Cek Untung Asli",
  robots: { index: false, follow: false },
};

export default function ProfitPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          🧮 Cek Untung Asli
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Hitung margin bersih sebenarnya setelah semua potongan marketplace.
        </p>
      </header>
      <ProfitChecker />
    </div>
  );
}
