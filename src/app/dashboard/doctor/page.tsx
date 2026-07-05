import type { Metadata } from "next";
import { ProductDoctor } from "@/components/tools/ProductDoctor";
import { QuotaBar } from "@/components/tools/QuotaBar";
import { createServerClient } from "@/lib/supabase/server";
import { getUsage } from "@/lib/ai/quota";

export const metadata: Metadata = {
  title: "Product Doctor",
  robots: { index: false, follow: false },
};

export default async function DoctorPage() {
  const supabase = await createServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  const usage = userId ? await getUsage(userId, "product_doctor") : null;

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
      {usage && <QuotaBar label="Product Doctor" used={usage.used} max={usage.max} />}
      <ProductDoctor />
    </div>
  );
}
