import Link from "next/link";
import { Logo } from "@/components/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <Logo size={30} />
          </Link>
          <p className="mt-1.5 text-[11px] text-muted">
            AI Profit Assistant untuk Seller
          </p>
        </div>

        <div className="rounded-card border border-border bg-surface p-6">
          <h1 className="font-display text-xl font-bold tracking-tight">
            {title}
          </h1>
          <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-5 text-center text-[13px] text-muted">{footer}</p>
      </div>
    </main>
  );
}
