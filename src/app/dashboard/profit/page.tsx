import type { Metadata } from "next";
import { ProfitChecker } from "@/components/tools/ProfitChecker";
import { getProducts } from "@/lib/products/queries";

export const metadata: Metadata = {
  title: "Cek Untung Asli",
  robots: { index: false, follow: false },
};

export default async function ProfitPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: productId } = await searchParams;
  const products = await getProducts();
  const initialProduct = productId
    ? (products.find((p) => p.id === productId) ?? null)
    : null;

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
      <ProfitChecker products={products} initialProduct={initialProduct} />
    </div>
  );
}
