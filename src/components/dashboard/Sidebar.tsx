"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";
import type { Plan } from "@/types/database";

type NavItem = {
  href: string;
  icon: string;
  label: string;
  ready: boolean;
};

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Pusat Toko",
    items: [
      { href: "/dashboard", icon: "🏠", label: "Ringkasan", ready: true },
      { href: "/dashboard/products", icon: "📦", label: "Produk Saya", ready: false },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: "/dashboard/profit", icon: "🧮", label: "Cek Untung Asli", ready: true },
      { href: "/dashboard/analyzer", icon: "📊", label: "Sales Analyzer", ready: false },
      { href: "/dashboard/promo", icon: "🔥", label: "Promo Simulator", ready: true },
      { href: "/dashboard/doctor", icon: "🩺", label: "Product Doctor", ready: false },
    ],
  },
];

export function Sidebar({ plan }: { plan: Plan }) {
  const pathname = usePathname();
  const isPro = plan === "pro";

  return (
    <aside className="flex flex-col gap-1 border-border bg-surface md:h-screen md:w-60 md:border-r p-4 border-b md:border-b-0 md:sticky md:top-0">
      <div className="px-2 pb-4 pt-1">
        <span className="font-display text-xl font-extrabold bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
          LabaLab
        </span>
        <p className="text-[11px] text-muted">AI Profit Assistant</p>
      </div>

      <nav className="flex flex-col gap-1">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted">
              {section.title}
            </p>
            {section.items.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              if (!item.ready) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold text-muted/60 cursor-not-allowed"
                    title="Segera hadir"
                  >
                    <span className="w-5 text-center text-[17px] opacity-60">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-wide">
                      Segera
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold transition-colors ${
                    active
                      ? "bg-gradient-to-br from-accent/20 to-accent2/10 text-accent2"
                      : "text-muted hover:bg-surface2 hover:text-text"
                  }`}
                >
                  <span className="w-5 text-center text-[17px]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto hidden md:block pt-4">
        <div className="rounded-xl border border-border bg-surface2 p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-accent2">
            {isPro ? "LabaLab Pro" : "Plan Gratis"}
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
            {isPro
              ? "Akses unlimited ke semua tools."
              : "Upgrade untuk akses unlimited semua tools."}
          </p>
        </div>
        <form action={signOut} className="mt-2">
          <button
            type="submit"
            className="w-full rounded-[10px] border border-border px-3 py-2 text-[12.5px] font-semibold text-muted hover:bg-surface2 hover:text-text transition-colors"
          >
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
