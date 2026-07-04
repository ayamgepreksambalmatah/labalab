"use client";

import { useMemo, useState } from "react";
import { fmt } from "@/lib/format";
import { computePromo, type PromoVerdictKind } from "@/lib/calc/promo";
import {
  Card,
  Field,
  MoneyInput,
  NumberInput,
  SliderRow,
} from "@/components/tools/controls";

const VERDICT_COLOR: Record<PromoVerdictKind, string> = {
  jangan: "text-red",
  layak: "text-green",
  pertimbangkan: "text-yellow",
};

export function PromoSimulator() {
  const [hargaNormal, setHargaNormal] = useState(150000);
  const [modal, setModal] = useState(70000);
  const [komisiPct, setKomisiPct] = useState(8);
  const [orderNormal, setOrderNormal] = useState(80);
  const [diskonPct, setDiskonPct] = useState(20);
  const [voucher, setVoucher] = useState(5000);
  const [ongkirBiaya, setOngkirBiaya] = useState(8000);
  const [lonjakanPct, setLonjakanPct] = useState(150);

  const r = useMemo(
    () =>
      computePromo({
        hargaNormal,
        modal,
        komisiPct,
        orderNormal,
        diskonPct,
        voucher,
        ongkirBiaya,
        lonjakanPct,
      }),
    [hargaNormal, modal, komisiPct, orderNormal, diskonPct, voucher, ongkirBiaya, lonjakanPct],
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[400px_1fr]">
      {/* FORM */}
      <Card title="Setup Skenario" icon="🎯">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">
          Harga & Modal Normal
        </p>
        <Field label="Harga Jual Normal">
          <MoneyInput value={hargaNormal} onChange={setHargaNormal} />
        </Field>
        <Field label="Modal / HPP">
          <MoneyInput value={modal} onChange={setModal} />
        </Field>
        <Field label="Komisi Platform">
          <SliderRow min={1} max={15} step={0.5} value={komisiPct} onChange={setKomisiPct} />
        </Field>
        <Field label="Order Normal (per periode)">
          <NumberInput value={orderNormal} onChange={setOrderNormal} />
        </Field>

        <hr className="my-4 border-border" />

        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">
          Detail Promo
        </p>
        <Field label="Diskon Harga Coret">
          <SliderRow min={0} max={60} step={1} value={diskonPct} onChange={setDiskonPct} />
        </Field>
        <Field label="Voucher Toko">
          <MoneyInput value={voucher} onChange={setVoucher} />
        </Field>
        <Field label="Subsidi Gratis Ongkir">
          <MoneyInput value={ongkirBiaya} onChange={setOngkirBiaya} />
        </Field>
        <Field label="Estimasi Kenaikan Order">
          <SliderRow min={0} max={500} step={10} value={lonjakanPct} onChange={setLonjakanPct} />
        </Field>
      </Card>

      {/* HASIL */}
      <div>
        <div className="mb-4 rounded-card border border-border bg-surface p-7 text-center">
          <div className="mb-2.5 text-[40px] leading-none">{r.verdict.icon}</div>
          <div className={`mb-1.5 font-display text-[22px] font-extrabold ${VERDICT_COLOR[r.verdict.kind]}`}>
            {r.verdict.label}
          </div>
          <p className="mx-auto max-w-[380px] text-[13.5px] text-muted">
            {r.verdict.sub}
          </p>
        </div>

        <Card title="Profit per Unit" icon="⚖️">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Normal</p>
              <p className="font-display text-[22px] font-extrabold">{fmt(r.profitNormal)}</p>
            </div>
            <div className="text-muted">→</div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Saat Promo</p>
              <p className={`font-display text-[22px] font-extrabold ${r.profitPromo >= 0 ? "text-green" : "text-red"}`}>
                {fmt(r.profitPromo)}
              </p>
            </div>
          </div>
        </Card>

        {!r.isRugiPerUnit && (
          <Card title="Titik Impas (Break-Even)" icon="📊">
            <div className="flex items-center gap-3.5 rounded-[10px] bg-surface2 p-4">
              <div className="font-display text-[28px] font-extrabold text-accent2">
                {r.bepOrder}
              </div>
              <div className="text-[12.5px] leading-relaxed text-muted">
                order dibutuhkan agar profit sama dengan kondisi normal.
                <br />
                Estimasi kamu:{" "}
                <strong className="text-accent2">{Math.round(r.orderPromo)} order</strong>
              </div>
            </div>
          </Card>
        )}

        <Card title="Total Estimasi Profit" icon="💰">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Tanpa Promo</p>
              <p className="font-display text-[17px] font-extrabold">{fmt(r.totalProfitNormal)}</p>
            </div>
            <div className="text-muted">vs</div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Dengan Promo</p>
              <p className={`font-display text-[17px] font-extrabold ${r.totalProfitPromo >= r.totalProfitNormal ? "text-green" : "text-red"}`}>
                {fmt(r.totalProfitPromo)}
              </p>
            </div>
          </div>
          <div className="mt-3.5 border-t border-border pt-3.5 text-center text-[13px] text-muted">
            Selisih:{" "}
            <strong className={r.profitDiff >= 0 ? "text-green" : "text-red"}>
              {r.profitDiff >= 0 ? "+" : ""}
              {fmt(r.profitDiff)}
            </strong>
          </div>
        </Card>
      </div>
    </div>
  );
}
