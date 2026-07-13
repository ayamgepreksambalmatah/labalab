"use client";

import { useState, type ReactNode } from "react";

/**
 * Tab sederhana: konten tiap tab sudah di-render server (dilempar sebagai
 * ReactNode), client cuma memilih mana yang tampil.
 */
export function HistoryTabs({
  tabs,
}: {
  tabs: { label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="mb-5 flex w-fit gap-1 rounded-[10px] border border-border bg-surface2 p-1">
        {tabs.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
              active === i ? "bg-surface text-accent2" : "text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs[active].content}
    </div>
  );
}
