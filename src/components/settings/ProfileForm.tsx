"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/settings/actions";
import { inputCls, labelCls, Feedback } from "@/components/settings/Section";
import type { TonePreference } from "@/types/database";

const TONE_OPTIONS: { value: TonePreference; label: string }[] = [
  { value: "santai", label: "Santai" },
  { value: "profesional", label: "Profesional" },
  { value: "genz", label: "Gen Z" },
];

export function ProfileForm({
  fullName,
  storeName,
  email,
  nomorWa,
  tone,
  emailReadonly,
}: {
  fullName: string;
  storeName: string;
  email: string;
  nomorWa: string;
  tone: TonePreference;
  emailReadonly: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="full_name">
            Nama Lengkap
          </label>
          <input
            id="full_name"
            name="full_name"
            defaultValue={fullName}
            placeholder="Nama kamu"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="store_name">
            Nama Toko
          </label>
          <input
            id="store_name"
            name="store_name"
            defaultValue={storeName}
            placeholder="Nama toko kamu"
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            value={email}
            readOnly
            disabled
            className={`${inputCls} cursor-not-allowed opacity-60`}
          />
          {emailReadonly && (
            <p className="mt-1 text-[11px] text-muted">
              Email dari akun Google — tidak bisa diubah di sini.
            </p>
          )}
        </div>
        <div>
          <label className={labelCls} htmlFor="nomor_wa">
            No. WhatsApp
          </label>
          <input
            id="nomor_wa"
            name="nomor_wa"
            type="tel"
            inputMode="tel"
            defaultValue={nomorWa}
            placeholder="0812xxxxxxx"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <span className={labelCls}>Tone Balasan Default</span>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-[9px] border border-border bg-surface2 px-3.5 py-2 text-[13px] font-medium transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:checked]:text-accent2"
            >
              <input
                type="radio"
                name="tone_preference"
                value={opt.value}
                defaultChecked={tone === opt.value}
                className="accent-accent"
              />
              {opt.label}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-muted">
          Dipakai untuk nada balasan default CS Assistant nanti.
        </p>
      </div>

      <Feedback result={state} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-4 py-2.5 font-display text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Menyimpan…" : "Simpan Perubahan"}
      </button>
    </form>
  );
}
