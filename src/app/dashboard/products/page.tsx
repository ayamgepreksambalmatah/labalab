import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getProducts } from "@/lib/products/queries";
import { ProductsManager } from "@/components/products/ProductsManager";
import type { Plan } from "@/types/database";

export const metadata: Metadata = {
  title: "Produk Saya",
  robots: { index: false, follow: false },
};

export default async function ProductsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, products] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user.id).single(),
    getProducts(),
  ]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          📦 Produk Saya
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Pusat kendali toko kamu — semua tools LabaLab ambil & simpan data dari
          sini.
        </p>
      </header>
      <ProductsManager products={products} plan={(profile?.plan ?? "free") as Plan} />
    </div>
  );
}
