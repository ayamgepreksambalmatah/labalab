"use client";

import { useActionState } from "react";
import { signup } from "@/lib/auth/actions";

const inputCls =
  "w-full rounded-[9px] border border-border bg-surface2 px-3.5 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-muted focus:border-accent";
const labelCls =
  "block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signup, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelCls} htmlFor="full_name">
          Nama
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          placeholder="Nama kamu"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="kamu@toko.com"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Minimal 6 karakter"
          className={inputCls}
        />
      </div>

      {state?.error && (
        <p className="rounded-[9px] border border-red/40 bg-red/10 px-3 py-2 text-[13px] text-red">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[10px] bg-gradient-to-br from-accent to-accent2 px-4 py-3 font-display text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Memproses…" : "Daftar gratis"}
      </button>
    </form>
  );
}
