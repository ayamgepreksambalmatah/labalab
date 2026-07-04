/** Sparkline sederhana (SVG murni) untuk tren profit/margin per periode. */
export function HistoryChart({
  points,
  color,
  formatValue,
}: {
  points: { label: string; value: number }[];
  color: string;
  formatValue: (v: number) => string;
}) {
  const W = 520;
  const H = 120;
  const padX = 8;
  const padY = 14;

  if (points.length === 0) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const n = points.length;

  const x = (i: number) =>
    n === 1 ? W / 2 : padX + (i * (W - padX * 2)) / (n - 1);
  const y = (v: number) => padY + (1 - (v - min) / range) * (H - padY * 2);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[420px]"
        preserveAspectRatio="none"
      >
        {/* garis nilai */}
        {n > 1 && (
          <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        )}
        {/* titik */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.value)} r="3" fill={color} />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10.5px] text-muted">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}
