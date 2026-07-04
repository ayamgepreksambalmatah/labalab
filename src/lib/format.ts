/** Format angka jadi Rupiah, mis. -1234567 → "-Rp 1.234.567" (port dari prototype `fmt`). */
export function fmt(n: number): string {
  const sign = n < 0 ? "-" : "";
  return sign + "Rp " + Math.abs(Math.round(n)).toLocaleString("id-ID");
}
