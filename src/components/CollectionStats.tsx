"use client";

import { Ring, RingCenter, RingChart } from "@/components/charts";
import { BUILTIN_SECTIONS, type UserPage } from "@/lib/pages";

const SLOTS = 12; // Ausstanzungen pro Seite

export function CollectionStats({ userPages }: { userPages: UserPage[] }) {
  // Jede Seite ist ein Ring: wie viele der 12 Plätze gefüllt sind.
  // Eingeklebte Fotos zählen vorerst als volle Seite, bis die Marken erkannt werden.
  const data = [
    ...BUILTIN_SECTIONS.map((s) => ({ label: s.title, value: s.stamps.length, maxValue: SLOTS })),
    ...userPages.slice(-3).map((p) => ({ label: p.title, value: SLOTS, maxValue: SLOTS })),
  ];
  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <section className="grid items-center gap-8 rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 sm:grid-cols-[auto_1fr]">
      <div className="mx-auto">
        <RingChart data={data} size={220} strokeWidth={12} ringGap={5} baseInnerRadius={44}>
          {data.map((d, i) => (
            <Ring index={i} key={d.label + i} />
          ))}
          <RingCenter defaultLabel="Marken" />
        </RingChart>
      </div>
      <div className="min-w-0">
        <h2 className="font-display text-2xl font-medium">Sammlung</h2>
        <p className="mb-4 text-sm text-[var(--ink-soft)]">
          {total} Marken auf {data.length + Math.max(0, userPages.length - 3)} Seiten. Jeder Ring ist eine Seite mit 12 Plätzen.
        </p>
        <ul className="grid gap-2">
          {data.map((d, i) => (
            <li key={d.label + i} className="grid grid-cols-[12px_1fr_auto] items-center gap-3 border-b border-dashed border-[var(--line)] pb-2 tabular-nums">
              <i className="h-3 w-3 rounded" style={{ background: `var(--chart-${(i % 5) + 1})` }} />
              <span className="truncate">{d.label}</span>
              <span className="font-mono text-sm text-[var(--ink-soft)]">
                {d.value}/{d.maxValue}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
