"use client";

import { useActionState } from "react";
import { changePassword, setPassword } from "@/lib/settings/actions";
import { inputCls, labelCls, Feedback } from "@/components/settings/Section";

/**
 * mode="change" → user email/password (verifikasi password lama).
 * mode="set"    → user Google yang belum punya password.
 */
export function PasswordForm({ mode }: { mode: "change" | "set" }) {
  const action = mode === "change" ? changePassword : setPassword;
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      {mode === "change" && (
        <div>
          <label className={labelCls} htmlFor="current_password">
            Password Saat Ini
          </label>
          <input
            id="current_password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={inputCls}
          />
        </div>
      )}

      <div>
        <label className={labelCls} htmlFor="new_password">
          Password Baru
        </label>
        <input
          id="new_password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Minimal 6 karakter"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="confirm_password">
          Konfirmasi Password
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Ulangi password baru"
          className={inputCls}
        />
      </div>

      <Feedback result={state} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-[10px] border border-border px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface2 disabled:opacity-50"
      >
        {pending
          ? "Memproses…"
          : mode === "change"
            ? "Ganti Password"
            : "Set Password"}
      </button>
    </form>
  );
}
