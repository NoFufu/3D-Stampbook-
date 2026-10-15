"use client";

import { Ring, RingCenter, RingChart } from "@/components/charts";
import { BUILTIN_SECTIONS, type UserPage } from "@/lib/pages";

export function CollectionStats({ userPages }: { userPages: UserPage[] }) {
  const data = BUILTIN_SECTIONS.map((section, i) => ({
    label: section.title,
    value: section.stamps.length,
    maxValue: 12,
    color: i === 0 ? "#cbb58d" : "#a69abd",
  }));

  return (
    <div className="collection-overview">
      <div className="collection-summary">
        <RingChart data={data} size={126} strokeWidth={4} ringGap={5} baseInnerRadius={37}>
          {data.map((section, i) => <Ring index={i} key={section.label} animate={false} showGlow={false} />)}
          <RingCenter defaultLabel="Marken" valueClassName="font-display text-3xl font-light" labelClassName="text-[10px] text-[var(--ink-soft)]" />
        </RingChart>
        <p>Ein Platz für alles,<br /><em>was bleiben darf.</em></p>
      </div>
      <ul className="collection-list">
        {data.map((section, i) => (
          <li key={section.label}><span className="collection-section-no">0{i + 1}</span><span>{section.label}</span><span className="collection-amount">{section.value} <span>Marken</span></span></li>
        ))}
        {userPages.map((page, i) => (
          <li key={page.id}><span className="collection-section-no">{String(data.length + i + 1).padStart(2, "0")}</span><span className="truncate">{page.title}</span><span className="collection-amount">Foto</span></li>
        ))}
      </ul>
      <p className="collection-note">{data.length + userPages.length} Sammlungsseiten · {userPages.length} eigene Fotos</p>
    </div>
  );
}
