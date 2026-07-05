import type { Metadata } from "next";
import { ListingGenerator } from "@/components/tools/ListingGenerator";
import { QuotaBar } from "@/components/tools/QuotaBar";
import { createServerClient } from "@/lib/supabase/server";
import { getUsage } from "@/lib/ai/quota";
import { getProducts } from "@/lib/products/queries";

export const metadata: Metadata = {
  title: "Listing Generator",
  robots: { index: false, follow: false },
};

export default async function ListingPage() {
  const supabase = await createServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  const [usage, products] = await Promise.all([
    userId ? getUsage(userId, "listing_generator") : Promise.resolve(null),
    getProducts(),
  ]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          ✍️ Listing Generator
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Buat judul, deskripsi, dan kata kunci produk yang siap tempel & konversi.
        </p>
      </header>
      {usage && <QuotaBar label="Listing Generator" used={usage.used} max={usage.max} />}
      <ListingGenerator products={products} />
    </div>
  );
}
