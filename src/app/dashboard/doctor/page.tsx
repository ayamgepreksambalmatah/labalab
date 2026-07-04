import type { Metadata } from "next";
import { ProductDoctor } from "@/components/tools/ProductDoctor";

export const metadata: Metadata = {
  title: "Product Doctor",
  robots: { index: false, follow: false },
};

export default function DoctorPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          🩺 Product Doctor
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Audit listing produk kamu — cari tahu kenapa konversinya rendah.
        </p>
      </header>
      <ProductDoctor />
    </div>
  );
}
