import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { SESSION_TOKEN_COOKIE } from "@/lib/auth/session";
import { parseDeviceInfo, formatRelativeTime } from "@/lib/session/device";
import { getBillingInfo } from "@/lib/settings/billing";
import { fmt } from "@/lib/format";
import type { Plan, SubscriptionStatus, TonePreference } from "@/types/database";
import { Section, QuotaBar } from "@/components/settings/Section";
import { LEGAL_CONTACT } from "@/components/legal/LegalLayout";
import { SignOutOthersButton } from "@/components/settings/SignOutOthersButton";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { NotificationsForm } from "@/components/settings/NotificationsForm";
import { CancelSubscriptionButton } from "@/components/settings/CancelSubscriptionButton";
import { DeleteAccountForm } from "@/components/settings/DeleteAccountForm";

export const metadata: Metadata = {
  title: "Pengaturan",
  robots: { index: false, follow: false },
};

const PLAN_LABEL: Record<Plan, string> = {
  free: "Gratis",
  pro: "LabaLab Pro",
  max: "LabaLab Max",
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  paid: "Lunas",
  failed: "Gagal",
  pending: "Menunggu",
  expired: "Kedaluwarsa",
};

const WA_SUPPORT = LEGAL_CONTACT.whatsapp;
const APP_VERSION = "v1.0.0";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysLeft(iso: string | null): number {
  if (!iso) return 0;
  const ms = new Date(iso).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 86_400_000) : 0;
}

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const [{ data: user }, billing, { data: profile }, { data: session }, cookieStore] =
    await Promise.all([
      supabase.auth.getUser(),
      getBillingInfo(userId),
      supabase
        .from("profiles")
        .select(
          "full_name, store_name, email, nomor_wa, tone_preference, notif_kuota_habis",
        )
        .eq("id", userId)
        .single(),
      supabase
        .from("active_sessions")
        .select("session_token, device_info, ip_address, location, last_active")
        .eq("user_id", userId)
        .maybeSingle(),
      cookies(),
    ]);

  const identities = user?.user?.identities ?? [];
  const hasPassword = identities.some((i) => i.provider === "email");
  const loginMethod = identities.some((i) => i.provider === "google")
    ? "Google"
    : "Email & Password";

  const currentToken = cookieStore.get(SESSION_TOKEN_COOKIE)?.value;
  const isThisDevice = !!session && session.session_token === currentToken;
  const device = parseDeviceInfo(session?.device_info ?? null);

  const isPaid = billing.planAktif !== "free";
  const sisaHari = daysLeft(billing.planExpiresAt);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          ⚙️ Pengaturan
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Kelola langganan, profil, dan keamanan akun kamu.
        </p>
      </header>

      <div className="space-y-6">
        {/* 1. LANGGANAN & BILLING */}
        <Section
          title="Langganan Kamu"
          badge={
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                isPaid
                  ? "border border-green/40 bg-green/10 text-green"
                  : "border border-border text-muted"
              }`}
            >
              {PLAN_LABEL[billing.planAktif]}
            </span>
          }
        >
          {isPaid && (
            <p className="-mt-1 mb-4 text-[12.5px] text-muted">
              Aktif sampai <strong>{fmtDate(billing.planExpiresAt)}</strong>
              {sisaHari > 0 && ` · sisa ${sisaHari} hari`}
            </p>
          )}

          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Pemakaian Bulan Ini
          </p>
          <div className="space-y-3">
            <QuotaBar
              label="Sales Analyzer"
              terpakai={billing.kuota.salesAnalyzer.terpakai}
              limit={billing.kuota.salesAnalyzer.limit}
            />
            <QuotaBar
              label="Product Doctor"
              terpakai={billing.kuota.productDoctor.terpakai}
              limit={billing.kuota.productDoctor.limit}
            />
            <QuotaBar
              label="CS Reply"
              terpakai={billing.kuota.csReply.terpakai}
              limit={billing.kuota.csReply.limit}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {billing.planAktif !== "max" && (
              <Link
                href="/pricing"
                className="rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-4 py-2.5 font-display text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                {isPaid ? "Upgrade ke Max" : "Lihat Paket & Upgrade"}
              </Link>
            )}
            {isPaid &&
              (billing.autoRenewActive ? (
                <CancelSubscriptionButton
                  expiresLabel={fmtDate(billing.planExpiresAt)}
                />
              ) : (
                <span className="text-[12.5px] text-muted">
                  Perpanjangan otomatis sudah dimatikan.
                </span>
              ))}
          </div>

          {billing.riwayatPembayaran.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Riwayat Pembayaran
              </p>
              <div className="divide-y divide-border rounded-[10px] border border-border">
                {billing.riwayatPembayaran.map((r, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-[12.5px]"
                  >
                    <span className="text-muted">{fmtDate(r.tanggal)}</span>
                    <span className="font-medium">{PLAN_LABEL[r.plan]}</span>
                    <span className="font-semibold tabular-nums">{fmt(r.jumlah)}</span>
                    <span
                      className={
                        r.status === "paid"
                          ? "font-semibold text-green"
                          : "text-muted"
                      }
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* 2. PROFIL & INFO TOKO */}
        <Section
          title="Profil & Info Toko"
          desc="Data ini dipakai lintas fitur LabaLab."
        >
          <ProfileForm
            fullName={profile?.full_name ?? ""}
            storeName={profile?.store_name ?? ""}
            email={profile?.email ?? user?.user?.email ?? ""}
            nomorWa={profile?.nomor_wa ?? ""}
            tone={(profile?.tone_preference ?? "santai") as TonePreference}
            emailReadonly={!hasPassword}
          />
        </Section>

        {/* 3. KEAMANAN */}
        <Section
          title="Keamanan"
          badge={
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              1 sesi / akun
            </span>
          }
        >
          {hasPassword && (
            <div className="mb-5">
              <h3 className="mb-2 text-[13.5px] font-bold">Ganti Password</h3>
              <PasswordForm mode="change" />
            </div>
          )}

          <h3 className="mb-1 text-[13.5px] font-bold">Perangkat Aktif</h3>
          <p className="mb-3 text-[12.5px] leading-relaxed text-muted">
            Akun kamu hanya bisa aktif di satu perangkat. Login baru di perangkat
            lain otomatis mengeluarkan sesi ini.
          </p>

          {session ? (
            <div className="flex items-start gap-3 rounded-[12px] border border-border bg-surface2 p-4">
              <span className="text-2xl leading-none" aria-hidden>
                {device.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold">{device.full}</span>
                  {isThisDevice && (
                    <span className="rounded-full border border-green/40 bg-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green">
                      Perangkat ini
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] text-muted">
                  Terakhir aktif {formatRelativeTime(session.last_active)}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11.5px] text-muted">
                  {session.location && <span>📍 {session.location}</span>}
                  {session.ip_address && (
                    <span className="font-mono">{session.ip_address}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-[12px] border border-border bg-surface2 p-4 text-[13px] text-muted">
              Belum ada data perangkat untuk sesi ini.
            </p>
          )}

          <SignOutOthersButton />
        </Section>

        {/* 4. NOTIFIKASI */}
        <Section title="Notifikasi Email">
          <NotificationsForm kuotaHabis={profile?.notif_kuota_habis ?? true} />
        </Section>

        {/* 5. KONEKSI AKUN */}
        <Section title="Koneksi Akun">
          <p className="text-[13px]">
            Status:{" "}
            <span className="font-semibold">Login via {loginMethod}</span>
          </p>
          {!hasPassword && (
            <div className="mt-4">
              <p className="mb-2 text-[12.5px] text-muted">
                Setel password supaya kamu juga bisa login manual (jaga-jaga
                kalau akun Google bermasalah).
              </p>
              <PasswordForm mode="set" />
            </div>
          )}
        </Section>

        {/* 6. DATA SAYA */}
        <Section
          title="Data Saya"
          desc="Unduh atau hapus semua data kamu di LabaLab."
        >
          <a
            href="/api/settings/export-data"
            className="inline-block rounded-[10px] border border-border px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface2"
          >
            Unduh Data Saya (JSON)
          </a>

          <div className="mt-6">
            <DeleteAccountForm sisaHariPro={isPaid ? sisaHari : 0} />
          </div>
        </Section>

        {/* 7. BANTUAN */}
        <Section title="Bantuan">
          <ul className="space-y-2 text-[13px]">
            <li>
              <Link href="/privacy" className="text-accent2 hover:underline">
                Kebijakan Privasi
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-accent2 hover:underline">
                Syarat &amp; Ketentuan
              </Link>
            </li>
            <li>
              <a
                href={WA_SUPPORT}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent2 hover:underline"
              >
                Hubungi Support (WhatsApp)
              </a>
            </li>
            <li className="text-muted">Versi App: {APP_VERSION}</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
