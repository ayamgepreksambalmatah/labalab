"use client";

import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label} {hint && <span className="text-accent2 normal-case">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputBase =
  "w-full rounded-[9px] border border-border bg-surface2 text-sm text-text outline-none transition-colors placeholder:text-muted focus:border-accent";

/** Input angka dengan prefix "Rp". */
export function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | "";
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-muted">
        Rp
      </span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))
        }
        className={`${inputBase} py-2.5 pl-9 pr-3.5`}
      />
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} px-3.5 py-2.5`}
    />
  );
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} resize-none px-3.5 py-2.5`}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | "";
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value}
      placeholder={placeholder}
      onChange={(e) =>
        onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))
      }
      className={`${inputBase} px-3.5 py-2.5`}
    />
  );
}

export function SelectInput<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`${inputBase} px-3.5 py-2.5`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-surface2">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SliderRow({
  min,
  max,
  step,
  value,
  onChange,
  suffix = "%",
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 flex-1 cursor-pointer appearance-none rounded bg-border accent-accent"
      />
      <div className="min-w-[42px] text-right text-[13px] font-semibold text-accent2">
        {value}
        {suffix}
      </div>
    </div>
  );
}

export function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4 overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex items-center gap-2.5 border-b border-border bg-surface2 px-5 py-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface3 text-[14px]">
          {icon}
        </span>
        <h3 className="font-display text-[13px] font-bold">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
