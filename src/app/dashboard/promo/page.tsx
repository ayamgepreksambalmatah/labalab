import type { Metadata } from "next";
import { PromoSimulator } from "@/components/tools/PromoSimulator";
import { getProducts } from "@/lib/products/queries";

export const metadata: Metadata = {
  title: "Promo Simulator",
  robots: { index: false, follow: false },
};

export default async function PromoPage({
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
          🔥 Promo Simulator
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Cek dulu sebelum ikut flash sale — jangan sampai ramai tapi rugi.
        </p>
      </header>
      <PromoSimulator products={products} initialProduct={initialProduct} />
    </div>
  );
}
