/**
 * Promo Simulator — port 1:1 dari `prCalculate` di prototype.
 * Bandingkan profit kondisi normal vs saat promo, plus titik impas.
 */

export type PromoInput = {
  hargaNormal: number;
  modal: number;
  komisiPct: number;
  orderNormal: number;
  diskonPct: number;
  voucher: number;
  ongkirBiaya: number;
  lonjakanPct: number;
};

export type PromoVerdictKind = "jangan" | "layak" | "pertimbangkan";

export type PromoResult = {
  profitNormal: number;
  totalProfitNormal: number;
  hargaPromo: number;
  profitPromo: number;
  orderPromo: number;
  totalProfitPromo: number;
  profitDiff: number;
  /** Jumlah order saat promo agar total profit = kondisi normal (0 kalau rugi/unit). */
  bepOrder: number;
  isRugiPerUnit: boolean;
  isWorthIt: boolean;
  verdict: { kind: PromoVerdictKind; label: string; icon: string; sub: string };
};

export function computePromo(input: PromoInput): PromoResult {
  const {
    hargaNormal,
    modal,
    komisiPct,
    orderNormal,
    diskonPct,
    voucher,
    ongkirBiaya,
    lonjakanPct,
  } = input;

  const komisiNormal = (hargaNormal * komisiPct) / 100;
  const profitNormal = hargaNormal - modal - komisiNormal;
  const totalProfitNormal = profitNormal * orderNormal;

  const hargaPromo = hargaNormal * (1 - diskonPct / 100);
  const komisiPromo = (hargaPromo * komisiPct) / 100;
  const profitPromo = hargaPromo - modal - komisiPromo - voucher - ongkirBiaya;
  const orderPromo = orderNormal * (1 + lonjakanPct / 100);
  const totalProfitPromo = profitPromo * orderPromo;

  const bepOrder = profitPromo > 0 ? Math.ceil(totalProfitNormal / profitPromo) : 0;
  const profitDiff = totalProfitPromo - totalProfitNormal;
  const isRugiPerUnit = profitPromo < 0;
  const isWorthIt = profitDiff >= 0;

  let verdict: PromoResult["verdict"];
  if (isRugiPerUnit) {
    verdict = {
      kind: "jangan",
      label: "JANGAN IKUT",
      icon: "🚨",
      sub: `Setiap unit yang terjual saat promo ini bikin kamu rugi ${rupiah(Math.abs(profitPromo))}. Semakin laris, semakin rugi.`,
    };
  } else if (isWorthIt) {
    verdict = {
      kind: "layak",
      label: "LAYAK DIIKUTI",
      icon: "✅",
      sub: `Dengan estimasi kenaikan order ${lonjakanPct}%, total profit tetap lebih tinggi dibanding normal.`,
    };
  } else {
    verdict = {
      kind: "pertimbangkan",
      label: "PERLU DIPERTIMBANGKAN",
      icon: "⚠️",
      sub: "Profit per unit masih positif, tapi kenaikan order belum cukup menutupi selisih harga normal.",
    };
  }

  return {
    profitNormal,
    totalProfitNormal,
    hargaPromo,
    profitPromo,
    orderPromo,
    totalProfitPromo,
    profitDiff,
    bepOrder,
    isRugiPerUnit,
    isWorthIt,
    verdict,
  };
}

// dipakai internal untuk menyusun kalimat verdict
function rupiah(n: number): string {
  return "Rp " + Math.abs(Math.round(n)).toLocaleString("id-ID");
}
