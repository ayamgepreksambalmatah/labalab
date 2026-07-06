"use client";

import { useActionState, useState } from "react";
import { deleteAccount } from "@/lib/settings/actions";
import { inputCls, Feedback } from "@/components/settings/Section";

const CONFIRM_PHRASE = "HAPUS AKUN";

export function DeleteAccountForm({ sisaHariPro }: { sisaHariPro: number }) {
  const [state, formAction, pending] = useActionState(deleteAccount, null);
  const [typed, setTyped] = useState("");
  const armed = typed.trim() === CONFIRM_PHRASE;

  return (
    <div className="rounded-[12px] border border-red/40 bg-red/5 p-4">
      <h3 className="text-[14px] font-bold text-red">Hapus Akun</h3>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
        Menghapus akun akan menghapus <strong>semua data</strong> kamu secara
        permanen dan tidak bisa dikembalikan.
      </p>

      {sisaHariPro > 0 && (
        <p className="mt-3 rounded-[9px] border border-red/40 bg-red/10 px-3 py-2 text-[12.5px] text-red">
          ⚠️ Kamu masih punya sisa {sisaHariPro} hari langganan aktif. Menghapus
          akun sekarang berarti sisa masa aktif ini hangus. Tidak ada
          pengembalian dana untuk pembatalan atas keinginan sendiri.
        </p>
      )}

      <form action={formAction} className="mt-4 max-w-sm space-y-3">
        <div>
          <label className="mb-1.5 block text-[12px] text-muted" htmlFor="confirm">
            Ketik <span className="font-mono font-bold text-text">{CONFIRM_PHRASE}</span>{" "}
            untuk konfirmasi:
          </label>
          <input
            id="confirm"
            name="confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            placeholder={CONFIRM_PHRASE}
            className={inputCls}
          />
        </div>

        <Feedback result={state} />

        <button
          type="submit"
          disabled={!armed || pending}
          className="rounded-[10px] bg-red px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Menghapus…" : "Hapus Akun Saya Permanen"}
        </button>
      </form>
    </div>
  );
}
